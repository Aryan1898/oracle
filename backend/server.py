from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime
import uuid

app = FastAPI(title="LLM Tracing API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# MODULAR DATA STRUCTURE - Matches BigQuery schema
# =============================================================================

# Job dimension data (from analytics.jobs_full_view)
# Query: SELECT DISTINCT id as job_id, prompt_name, model_name FROM analytics.jobs_full_view WHERE id = ?
JOB_DIMENSION_DATA = {
    "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b": {
        "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b",
        "prompt_name": "tryon_v0",
        "model_name": "claude-sonnet-4-5?thinking_mode=true"
    },
    "demo-job-123": {
        "job_id": "demo-job-123",
        "prompt_name": "frontend_app_builder_cloud_v8",
        "model_name": "gpt-5.2"
    }
}

# Trajectory fact data (from analytics.trajectories_full_view)
# Query: SELECT DISTINCT created_at, agent_name, request_id, step_num, job_id, function_name, env_success 
#        FROM analytics.trajectories_full_view WHERE job_id = ? ORDER BY created_at
TRAJECTORY_FACT_DATA = {
    "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b": [
        {"created_at": "2026-01-21 09:09:07.581000 UTC", "agent_name": "EmergentAssistant", "request_id": "32e2733d-1d0e-47ba-ad18-6e2c9b0a3101", "step_num": -1, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "initial-llm", "env_success": None},
        {"created_at": "2026-01-21 09:09:18.888000 UTC", "agent_name": "EmergentAssistant", "request_id": "0d3c055e-0e02-4543-af58-785ffbdbf1e3", "step_num": 0, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "ask_human", "env_success": True},
        {"created_at": "2026-01-21 09:09:51.170000 UTC", "agent_name": "EmergentAssistant", "request_id": "a35cd065-6589-4aac-8118-27d3e1b12f5d", "step_num": 1, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "PARALLEL_TOOLS", "env_success": True},
        {"created_at": "2026-01-21 09:09:56.129000 UTC", "agent_name": "EmergentAssistant", "request_id": "361478d6-b457-4344-b1d5-015753564c5a", "step_num": 2, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "vision_expert_agent", "env_success": True},
        {"created_at": "2026-01-21 09:10:00.866000 UTC", "agent_name": "SkilledAssistant", "request_id": "fce3256c-64c1-483b-962e-dd3d6fe01e58", "step_num": 3, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "image_selector_tool", "env_success": True},
        {"created_at": "2026-01-21 09:10:06.102000 UTC", "agent_name": "SkilledAssistant", "request_id": "fc4734df-c7a8-48d1-82cd-b5d2825f777b", "step_num": 4, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "image_selector_tool", "env_success": True},
        {"created_at": "2026-01-21 09:10:12.325000 UTC", "agent_name": "SkilledAssistant", "request_id": "90dc9bf6-db8e-4780-ac81-5e4adb37d19b", "step_num": 5, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "image_selector_tool", "env_success": True},
        {"created_at": "2026-01-21 09:10:17.522000 UTC", "agent_name": "SkilledAssistant", "request_id": "fec3361c-e249-40f8-8583-cc496e61a81f", "step_num": 6, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "image_selector_tool", "env_success": True},
        {"created_at": "2026-01-21 09:10:23.753000 UTC", "agent_name": "SkilledAssistant", "request_id": "32afa446-3a58-4516-b120-99cef6a4b464", "step_num": 7, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "image_selector_tool", "env_success": True},
        {"created_at": "2026-01-21 09:10:42.446000 UTC", "agent_name": "SkilledAssistant", "request_id": "60bd4ced-110a-4318-bfe7-d3688a634723", "step_num": 8, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "finish", "env_success": True},
        {"created_at": "2026-01-21 09:10:51.933000 UTC", "agent_name": "EmergentAssistant", "request_id": "6462ef26-d86d-46d3-b02f-ac6a5203d71e", "step_num": 9, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "PARALLEL_TOOLS", "env_success": True},
        {"created_at": "2026-01-21 09:10:57.823000 UTC", "agent_name": "EmergentAssistant", "request_id": "ad6abbf6-4813-4c1f-adfd-b2afb740d4ba", "step_num": 10, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "PARALLEL_TOOLS", "env_success": True},
        {"created_at": "2026-01-21 09:11:09.897000 UTC", "agent_name": "EmergentAssistant", "request_id": "4860b39d-5afe-4561-b5e2-738ad90eef7b", "step_num": 11, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "PARALLEL_TOOLS", "env_success": True},
        {"created_at": "2026-01-21 09:12:42.048000 UTC", "agent_name": "EmergentAssistant", "request_id": "19f4ec11-18c4-4464-8d9c-897a751de5bc", "step_num": 12, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "bulk_file_writer", "env_success": True},
        {"created_at": "2026-01-21 09:13:49.662000 UTC", "agent_name": "EmergentAssistant", "request_id": "faec1ed5-40c1-47ac-87cb-8c80ad54526e", "step_num": 13, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "", "env_success": None},
        {"created_at": "2026-01-21 09:13:57.276000 UTC", "agent_name": "EmergentAssistant", "request_id": "a5931977-8d49-4bf9-b6ea-dc7234d3d95e", "step_num": 14, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "execute_bash", "env_success": True},
        {"created_at": "2026-01-21 09:14:06.916000 UTC", "agent_name": "EmergentAssistant", "request_id": "0791357f-f582-4bbf-bda8-4b802ad37d91", "step_num": 15, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "execute_bash", "env_success": True},
        {"created_at": "2026-01-21 09:14:25.406000 UTC", "agent_name": "EmergentAssistant", "request_id": "b627aded-418b-41ee-bd20-125968d4a4f6", "step_num": 16, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "screenshot_tool", "env_success": True},
        {"created_at": "2026-01-21 09:14:39.705000 UTC", "agent_name": "EmergentAssistant", "request_id": "36e1488f-89fa-4e2e-bbb5-8538f4daf94f", "step_num": 17, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "PARALLEL_TOOLS", "env_success": True},
        {"created_at": "2026-01-21 09:14:55.493000 UTC", "agent_name": "EmergentAssistant", "request_id": "fcf09ecb-7fe3-482e-a7c1-732698eb9aec", "step_num": 18, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "PARALLEL_TOOLS", "env_success": True},
        {"created_at": "2026-01-21 09:15:15.571000 UTC", "agent_name": "EmergentAssistant", "request_id": "26c6ebc0-c96e-4e1c-9a47-d9f4cc8331e8", "step_num": 19, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "search_replace", "env_success": True},
        {"created_at": "2026-01-21 09:15:28.233000 UTC", "agent_name": "EmergentAssistant", "request_id": "cec047ae-f916-4886-9a0a-e5c8be2b1316", "step_num": 20, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "execute_bash", "env_success": True},
        {"created_at": "2026-01-21 09:15:35.840000 UTC", "agent_name": "EmergentAssistant", "request_id": "84a744a2-43b3-49d2-8585-b0f93cbef311", "step_num": 21, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "execute_bash", "env_success": True},
        {"created_at": "2026-01-21 09:15:56.574000 UTC", "agent_name": "EmergentAssistant", "request_id": "a39034f9-b695-4712-bbae-4d607ff5cefd", "step_num": 22, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "PARALLEL_TOOLS", "env_success": True},
        {"created_at": "2026-01-21 09:16:05.835000 UTC", "agent_name": "EmergentAssistant", "request_id": "5e83cab9-64e7-4233-befc-2172a4a2ec6f", "step_num": 23, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "testing_agent_v3", "env_success": True},
        {"created_at": "2026-01-21 09:16:10.978000 UTC", "agent_name": "SkilledAssistant", "request_id": "e9265a50-d9ed-4ff0-bb35-1c741f026df8", "step_num": 24, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "think", "env_success": True},
        {"created_at": "2026-01-21 09:16:15.230000 UTC", "agent_name": "SkilledAssistant", "request_id": "082e5747-8b02-40bb-8b27-10d42c75d5b2", "step_num": 25, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "view_bulk", "env_success": True},
        {"created_at": "2026-01-21 09:16:19.173000 UTC", "agent_name": "SkilledAssistant", "request_id": "7eabc6aa-c89f-4e95-b97a-280d36467607", "step_num": 26, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "view_file", "env_success": True},
        {"created_at": "2026-01-21 09:16:24.826000 UTC", "agent_name": "SkilledAssistant", "request_id": "0f489a18-efd1-4d14-b7fe-1230492c742d", "step_num": 27, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "view_file", "env_success": False},
        {"created_at": "2026-01-21 09:16:29.879000 UTC", "agent_name": "SkilledAssistant", "request_id": "e9f4bb37-56c2-4f34-a80a-630173db2426", "step_num": 28, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "execute_bash", "env_success": True},
        {"created_at": "2026-01-21 09:16:52.435000 UTC", "agent_name": "SkilledAssistant", "request_id": "c5906638-88f8-45b4-90d0-b20dcc1635c2", "step_num": 29, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "create_file", "env_success": True},
        {"created_at": "2026-01-21 09:16:56.812000 UTC", "agent_name": "SkilledAssistant", "request_id": "8c74fc0f-b96f-488c-9344-041e4eb1ecb0", "step_num": 30, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "execute_bash", "env_success": False},
        {"created_at": "2026-01-21 09:17:02.370000 UTC", "agent_name": "SkilledAssistant", "request_id": "3b8d53e0-ed4c-4dba-b90a-69205bb9b151", "step_num": 31, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "think", "env_success": True},
        {"created_at": "2026-01-21 09:17:08.157000 UTC", "agent_name": "SkilledAssistant", "request_id": "8c639a5b-c86a-41c1-9a72-4b65e92e062c", "step_num": 32, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "execute_bash", "env_success": True},
        {"created_at": "2026-01-21 09:17:13.375000 UTC", "agent_name": "SkilledAssistant", "request_id": "a6257724-2b46-4139-b2b9-e03bf8912461", "step_num": 33, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "search_replace", "env_success": True},
        {"created_at": "2026-01-21 09:17:20.960000 UTC", "agent_name": "SkilledAssistant", "request_id": "f7725605-de30-4447-b009-2b67c17f0cf1", "step_num": 34, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "execute_bash", "env_success": True},
        {"created_at": "2026-01-21 09:18:21.072000 UTC", "agent_name": "SkilledAssistant", "request_id": "9306508f-8214-42bd-a082-03b2c2af8edf", "step_num": 35, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "execute_bash", "env_success": True},
        {"created_at": "2026-01-21 09:18:43.612000 UTC", "agent_name": "SkilledAssistant", "request_id": "6a981299-ed21-4436-9e4e-941a19254fea", "step_num": 36, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "browser_automation", "env_success": True},
        {"created_at": "2026-01-21 09:18:51.101000 UTC", "agent_name": "SkilledAssistant", "request_id": "1ab10b2e-e890-46f2-90d0-675a21447c4b", "step_num": 37, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "think", "env_success": True},
        {"created_at": "2026-01-21 09:19:45.324000 UTC", "agent_name": "SkilledAssistant", "request_id": "efb89e16-cfaf-4160-982c-19300c77c7fd", "step_num": 38, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "browser_automation", "env_success": True},
        {"created_at": "2026-01-21 09:20:14.071000 UTC", "agent_name": "SkilledAssistant", "request_id": "f8eb1853-9b60-4e21-a070-b3e8392eb417", "step_num": 39, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "browser_automation", "env_success": True},
        {"created_at": "2026-01-21 09:20:22.343000 UTC", "agent_name": "SkilledAssistant", "request_id": "c983eac5-0712-4311-afb2-99456ec475e0", "step_num": 40, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "think", "env_success": True},
        {"created_at": "2026-01-21 09:20:33.821000 UTC", "agent_name": "SkilledAssistant", "request_id": "afb292f2-27e9-452e-9aa3-417a5f95ecb4", "step_num": 41, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "create_file", "env_success": True},
        {"created_at": "2026-01-21 09:20:38.314000 UTC", "agent_name": "SkilledAssistant", "request_id": "248f5e13-764d-4214-bb1f-4d58fba0bc47", "step_num": 42, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "test_finish", "env_success": True},
        {"created_at": "2026-01-21 09:20:44.436000 UTC", "agent_name": "EmergentAssistant", "request_id": "20057d09-534f-4457-b264-ed8421790291", "step_num": 43, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "", "env_success": None},
        {"created_at": "2026-01-21 09:20:55.717000 UTC", "agent_name": "EmergentAssistant", "request_id": "a951e1c4-f0ab-4cbe-a35a-ad22951a4005", "step_num": 44, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "PARALLEL_TOOLS", "env_success": True},
        {"created_at": "2026-01-21 09:21:03.148000 UTC", "agent_name": "EmergentAssistant", "request_id": "687ed3d4-7318-4bb6-af8c-832fbd68c32a", "step_num": 45, "job_id": "5d88a55f-1d3f-44da-bb03-4ff6a0697d3b", "function_name": "exit_cost_credit_limit_reached", "env_success": True}
    ],
    "demo-job-123": [
        {"created_at": "2026-01-20 14:30:05.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-001", "step_num": -1, "job_id": "demo-job-123", "function_name": "initial-llm", "env_success": None},
        {"created_at": "2026-01-20 14:30:15.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-002", "step_num": 0, "job_id": "demo-job-123", "function_name": "think", "env_success": True},
        {"created_at": "2026-01-20 14:30:25.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-003", "step_num": 1, "job_id": "demo-job-123", "function_name": "view_bulk", "env_success": True},
        {"created_at": "2026-01-20 14:30:40.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-004", "step_num": 2, "job_id": "demo-job-123", "function_name": "PARALLEL_TOOLS", "env_success": True},
        {"created_at": "2026-01-20 14:31:00.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-005", "step_num": 3, "job_id": "demo-job-123", "function_name": "bulk_file_writer", "env_success": True},
        {"created_at": "2026-01-20 14:31:30.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-006", "step_num": 4, "job_id": "demo-job-123", "function_name": "execute_bash", "env_success": True},
        {"created_at": "2026-01-20 14:31:45.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-007", "step_num": 5, "job_id": "demo-job-123", "function_name": "screenshot_tool", "env_success": True},
        {"created_at": "2026-01-20 14:32:10.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-008", "step_num": 6, "job_id": "demo-job-123", "function_name": "search_replace", "env_success": False},
        {"created_at": "2026-01-20 14:32:25.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-009", "step_num": 7, "job_id": "demo-job-123", "function_name": "execute_bash", "env_success": True},
        {"created_at": "2026-01-20 14:32:45.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-010", "step_num": 8, "job_id": "demo-job-123", "function_name": "testing_agent_v3", "env_success": True},
        {"created_at": "2026-01-20 14:33:30.000000 UTC", "agent_name": "SkilledAssistant", "request_id": "demo-req-011", "step_num": 9, "job_id": "demo-job-123", "function_name": "think", "env_success": True},
        {"created_at": "2026-01-20 14:33:50.000000 UTC", "agent_name": "SkilledAssistant", "request_id": "demo-req-012", "step_num": 10, "job_id": "demo-job-123", "function_name": "browser_automation", "env_success": True},
        {"created_at": "2026-01-20 14:34:30.000000 UTC", "agent_name": "SkilledAssistant", "request_id": "demo-req-013", "step_num": 11, "job_id": "demo-job-123", "function_name": "test_finish", "env_success": True},
        {"created_at": "2026-01-20 14:34:45.000000 UTC", "agent_name": "EmergentAssistant", "request_id": "demo-req-014", "step_num": 12, "job_id": "demo-job-123", "function_name": "finish", "env_success": True}
    ]
}

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "LLM Tracing API"}

@app.get("/api/jobs")
async def list_available_jobs():
    """List all available job IDs"""
    return {
        "jobs": list(JOB_DIMENSION_DATA.keys()),
        "count": len(JOB_DIMENSION_DATA)
    }

@app.get("/api/job/{job_id}")
async def get_job_info(job_id: str):
    """
    Get job dimension data
    Equivalent to: SELECT DISTINCT id as job_id, prompt_name, model_name FROM analytics.jobs_full_view WHERE id = ?
    """
    if job_id not in JOB_DIMENSION_DATA:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return JOB_DIMENSION_DATA[job_id]

@app.get("/api/job/{job_id}/trajectories")
async def get_job_trajectories(job_id: str):
    """
    Get trajectory fact data
    Equivalent to: SELECT DISTINCT created_at, agent_name, request_id, step_num, job_id, function_name, env_success 
                   FROM analytics.trajectories_full_view WHERE job_id = ? ORDER BY created_at
    """
    if job_id not in TRAJECTORY_FACT_DATA:
        raise HTTPException(status_code=404, detail=f"Trajectories for job {job_id} not found")
    return TRAJECTORY_FACT_DATA[job_id]

@app.get("/api/job/{job_id}/summary")
async def get_job_summary(job_id: str):
    """Get computed summary statistics for a job"""
    if job_id not in TRAJECTORY_FACT_DATA:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    trajectories = TRAJECTORY_FACT_DATA[job_id]
    job_info = JOB_DIMENSION_DATA.get(job_id, {})
    
    # Calculate summary stats
    total_steps = len(trajectories)
    successful_steps = sum(1 for t in trajectories if t.get("env_success") is True)
    failed_steps = sum(1 for t in trajectories if t.get("env_success") is False)
    
    # Function distribution
    function_counts = {}
    for t in trajectories:
        fn = t["function_name"] or "(empty)"
        function_counts[fn] = function_counts.get(fn, 0) + 1
    
    # Agent distribution
    agent_counts = {}
    for t in trajectories:
        agent = t["agent_name"]
        agent_counts[agent] = agent_counts.get(agent, 0) + 1
    
    return {
        "job_id": job_id,
        "job_info": job_info,
        "total_steps": total_steps,
        "successful_steps": successful_steps,
        "failed_steps": failed_steps,
        "success_rate": round(successful_steps / total_steps * 100, 2) if total_steps > 0 else 0,
        "function_counts": function_counts,
        "agent_counts": agent_counts
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
