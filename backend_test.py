#!/usr/bin/env python3
"""
Backend API Testing for LLM Tracing UI
Tests all backend endpoints with mock data
"""

import requests
import sys
import json
from datetime import datetime

class LLMTracingAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def test_health_endpoint(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and data.get("status") == "healthy":
                self.log_test("Health Check", True, f"Service: {data.get('service', 'N/A')}")
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}, Data: {data}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")

    def test_list_jobs(self):
        """Test listing available jobs"""
        try:
            response = requests.get(f"{self.base_url}/api/jobs", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                jobs = data.get("jobs", [])
                count = data.get("count", 0)
                
                if len(jobs) > 0:
                    self.log_test("List Jobs", True, f"Found {count} jobs: {jobs}")
                    return jobs
                else:
                    self.log_test("List Jobs", False, "No jobs found in response")
                    return []
            else:
                self.log_test("List Jobs", False, f"Status: {response.status_code}")
                return []
                
        except Exception as e:
            self.log_test("List Jobs", False, f"Exception: {str(e)}")
            return []

    def test_get_job_info(self, job_id):
        """Test getting job information"""
        try:
            response = requests.get(f"{self.base_url}/api/job/{job_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ["job_id", "prompt_name", "model_name", "status"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test(f"Get Job Info ({job_id[:8]}...)", True, 
                                f"Model: {data.get('model_name')}, Status: {data.get('status')}")
                    return data
                else:
                    self.log_test(f"Get Job Info ({job_id[:8]}...)", False, 
                                f"Missing fields: {missing_fields}")
                    return None
            else:
                self.log_test(f"Get Job Info ({job_id[:8]}...)", False, f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test(f"Get Job Info ({job_id[:8]}...)", False, f"Exception: {str(e)}")
            return None

    def test_get_trajectories(self, job_id):
        """Test getting job trajectories"""
        try:
            response = requests.get(f"{self.base_url}/api/job/{job_id}/trajectories", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if trajectories have required fields
                    first_traj = data[0]
                    required_fields = ["created_at", "agent_name", "step_num", "function_name"]
                    missing_fields = [field for field in required_fields if field not in first_traj]
                    
                    if not missing_fields:
                        self.log_test(f"Get Trajectories ({job_id[:8]}...)", True, 
                                    f"Found {len(data)} trajectory steps")
                        return data
                    else:
                        self.log_test(f"Get Trajectories ({job_id[:8]}...)", False, 
                                    f"Missing fields in trajectory: {missing_fields}")
                        return None
                else:
                    self.log_test(f"Get Trajectories ({job_id[:8]}...)", False, "No trajectories found")
                    return None
            else:
                self.log_test(f"Get Trajectories ({job_id[:8]}...)", False, f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test(f"Get Trajectories ({job_id[:8]}...)", False, f"Exception: {str(e)}")
            return None

    def test_get_summary(self, job_id):
        """Test getting job summary"""
        try:
            response = requests.get(f"{self.base_url}/api/job/{job_id}/summary", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ["total_steps", "successful_steps", "failed_steps", "success_rate"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test(f"Get Summary ({job_id[:8]}...)", True, 
                                f"Steps: {data.get('total_steps')}, Success Rate: {data.get('success_rate')}%")
                    return data
                else:
                    self.log_test(f"Get Summary ({job_id[:8]}...)", False, 
                                f"Missing fields: {missing_fields}")
                    return None
            else:
                self.log_test(f"Get Summary ({job_id[:8]}...)", False, f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test(f"Get Summary ({job_id[:8]}...)", False, f"Exception: {str(e)}")
            return None

    def test_tool_categories(self):
        """Test getting tool categories"""
        try:
            response = requests.get(f"{self.base_url}/api/tool-categories", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if isinstance(data, dict) and len(data) > 0:
                    categories = list(data.keys())
                    self.log_test("Get Tool Categories", True, f"Categories: {categories}")
                    return data
                else:
                    self.log_test("Get Tool Categories", False, "No categories found")
                    return None
            else:
                self.log_test("Get Tool Categories", False, f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Get Tool Categories", False, f"Exception: {str(e)}")
            return None

    def test_invalid_job_id(self):
        """Test handling of invalid job ID"""
        invalid_id = "invalid-job-id-12345"
        try:
            response = requests.get(f"{self.base_url}/api/job/{invalid_id}", timeout=10)
            success = response.status_code == 404
            
            if success:
                self.log_test("Invalid Job ID Handling", True, "Correctly returned 404")
            else:
                self.log_test("Invalid Job ID Handling", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Job ID Handling", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting LLM Tracing API Backend Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic endpoints
        self.test_health_endpoint()
        jobs = self.test_list_jobs()
        self.test_tool_categories()
        self.test_invalid_job_id()
        
        # Test job-specific endpoints with available jobs
        if jobs:
            for job_id in jobs[:2]:  # Test first 2 jobs to avoid too many requests
                print(f"\n📋 Testing Job: {job_id}")
                job_info = self.test_get_job_info(job_id)
                trajectories = self.test_get_trajectories(job_id)
                summary = self.test_get_summary(job_id)
                
                # Validate data consistency
                if job_info and trajectories and summary:
                    self.validate_data_consistency(job_info, trajectories, summary)
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed!")
            return 1

    def validate_data_consistency(self, job_info, trajectories, summary):
        """Validate consistency between job info, trajectories, and summary"""
        try:
            # Check if summary matches trajectory count
            expected_steps = len(trajectories)
            actual_steps = summary.get("total_steps", 0)
            
            if expected_steps == actual_steps:
                self.log_test("Data Consistency Check", True, 
                            f"Trajectory count matches summary ({expected_steps} steps)")
            else:
                self.log_test("Data Consistency Check", False, 
                            f"Trajectory count mismatch: {expected_steps} vs {actual_steps}")
                
        except Exception as e:
            self.log_test("Data Consistency Check", False, f"Exception: {str(e)}")

def main():
    """Main test execution"""
    # Test with localhost first
    print("Testing Backend API Endpoints")
    print("=" * 50)
    
    tester = LLMTracingAPITester("http://localhost:8001")
    result = tester.run_all_tests()
    
    # Save test results
    with open("/app/test_reports/backend_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "base_url": tester.base_url,
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "results": tester.test_results
        }, f, indent=2)
    
    return result

if __name__ == "__main__":
    sys.exit(main())