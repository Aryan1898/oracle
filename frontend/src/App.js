import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Search, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight,
  Activity, Clock, Loader2, RefreshCcw, Copy, Check, Minus
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp.replace(' UTC', 'Z'));
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// =============================================================================
// COMPONENTS
// =============================================================================

// Status Icon Component
const StatusIcon = ({ success, size = 16 }) => {
  if (success === true) return <CheckCircle size={size} className="text-green-500" />;
  if (success === false) return <XCircle size={size} className="text-red-500" />;
  return <Minus size={size} className="text-slate-400" />;
};

// Job Information Card
const JobInfoCard = ({ jobInfo, summary }) => {
  if (!jobInfo) return null;

  return (
    <div className="card p-6 mb-6" data-testid="job-info-card">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Job Information</h2>
          <code className="text-sm text-slate-500 font-mono">{jobInfo.job_id}</code>
        </div>
        <span className="status-badge status-success">
          <CheckCircle size={14} /> Completed
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
        <div>
          <div className="text-xs text-slate-500 mb-1">Model</div>
          <div className="text-sm font-medium text-slate-800">{jobInfo.model_name?.split('?')[0] || 'N/A'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Prompt Name</div>
          <div className="text-sm font-medium text-slate-800">{jobInfo.prompt_name || 'N/A'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Total Steps</div>
          <div className="text-sm font-medium text-slate-800">{summary?.total_steps || 0}</div>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="stat-value text-green-600">{summary?.successful_steps || 0}</div>
          <div className="stat-label">Successful</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-red-600">{summary?.failed_steps || 0}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-indigo-600">{summary?.success_rate || 0}%</div>
          <div className="stat-label">Success Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-slate-700">{Object.keys(summary?.function_counts || {}).length}</div>
          <div className="stat-label">Unique Functions</div>
        </div>
      </div>
    </div>
  );
};

// Trajectory Matrix Visualizer
const TrajectoryMatrix = ({ trajectories }) => {
  if (!trajectories || trajectories.length === 0) return null;

  // Get top 15 functions by count, but always include failed functions
  const functionCounts = {};
  const failedFunctions = new Set();
  
  trajectories.forEach(t => {
    const fn = t.function_name || '(empty)';
    functionCounts[fn] = (functionCounts[fn] || 0) + 1;
    if (t.env_success === false) {
      failedFunctions.add(fn);
    }
  });

  // Sort by count and take top 15
  let topFunctions = Object.entries(functionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name]) => name);

  // Ensure failed functions are included
  failedFunctions.forEach(fn => {
    if (!topFunctions.includes(fn)) {
      topFunctions.push(fn);
    }
  });

  // Build matrix data: for each function, which steps used it
  const matrixData = topFunctions.map(fn => {
    const steps = trajectories.map((t, idx) => {
      if ((t.function_name || '(empty)') === fn) {
        return { step: t.step_num, success: t.env_success, idx };
      }
      return null;
    }).filter(Boolean);
    return { function: fn, steps };
  });

  // Get all step numbers
  const stepNumbers = [...new Set(trajectories.map(t => t.step_num))].sort((a, b) => a - b);

  return (
    <div className="card p-5 mb-6" data-testid="trajectory-matrix">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Activity size={18} className="text-indigo-500" />
        Trajectory Visualizer
      </h3>
      
      <div className="trajectory-matrix">
        <div className="flex">
          {/* Y-axis labels (function names) */}
          <div className="flex flex-col pr-3 border-r border-slate-200">
            <div className="h-7 flex items-center justify-end text-xs text-slate-500 font-medium mb-1">
              Function / Step →
            </div>
            {matrixData.map((row, i) => (
              <div 
                key={i} 
                className="h-7 flex items-center justify-end text-xs text-slate-600 truncate pr-2"
                style={{ maxWidth: '150px' }}
                title={row.function}
              >
                {row.function.length > 18 ? row.function.slice(0, 18) + '...' : row.function}
              </div>
            ))}
          </div>

          {/* Matrix grid */}
          <div className="flex-1 overflow-x-auto pl-3">
            {/* X-axis labels (step numbers) */}
            <div className="flex gap-1 mb-1">
              {stepNumbers.map(step => (
                <div key={step} className="w-7 h-7 flex items-center justify-center text-xs text-slate-500 font-medium">
                  {step}
                </div>
              ))}
            </div>

            {/* Matrix cells */}
            {matrixData.map((row, rowIdx) => (
              <div key={rowIdx} className="flex gap-1">
                {stepNumbers.map(step => {
                  const cell = row.steps.find(s => s.step === step);
                  if (!cell) {
                    return (
                      <div key={step} className="matrix-cell empty">
                        <span className="text-slate-300">·</span>
                      </div>
                    );
                  }
                  return (
                    <div 
                      key={step} 
                      className={`matrix-cell tooltip ${cell.success === true ? 'success' : cell.success === false ? 'error' : 'empty'}`}
                    >
                      {cell.success === true && <CheckCircle size={14} />}
                      {cell.success === false && <XCircle size={14} />}
                      {cell.success === null && <Minus size={14} />}
                      <div className="tooltip-content">
                        Step {step}: {row.function} ({cell.success === true ? 'Success' : cell.success === false ? 'Failed' : 'N/A'})
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-500">Legend:</span>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <div className="matrix-cell success" style={{ width: 20, height: 20 }}><CheckCircle size={12} /></div>
          Success
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <div className="matrix-cell error" style={{ width: 20, height: 20 }}><XCircle size={12} /></div>
          Failed
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <div className="matrix-cell empty" style={{ width: 20, height: 20 }}><Minus size={12} /></div>
          N/A
        </div>
      </div>
    </div>
  );
};

// Expandable Section Component
const ExpandableSection = ({ title, icon, children, isOpen, onToggle, count }) => {
  return (
    <div className="mb-4">
      <button 
        className={`expand-button ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
        data-testid={`expand-${title.toLowerCase().replace(' ', '-')}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-slate-700">{title}</span>
          {count !== undefined && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{count}</span>
          )}
        </div>
        <ChevronDown 
          size={20} 
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`expand-content ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// Timeline Component
const Timeline = ({ trajectories }) => {
  if (!trajectories || trajectories.length === 0) return null;

  return (
    <div className="card p-5" data-testid="timeline">
      {trajectories.map((step, idx) => (
        <div key={step.request_id} className="timeline-item">
          <div className={`timeline-node ${step.env_success === true ? 'success' : step.env_success === false ? 'error' : 'unknown'}`}>
            {step.step_num >= 0 ? step.step_num : 'I'}
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <span className="function-tag">{step.function_name || '(empty)'}</span>
              <span className={`agent-badge ${step.agent_name === 'EmergentAssistant' ? 'agent-main' : 'agent-sub'}`}>
                {step.agent_name === 'EmergentAssistant' ? 'MAIN' : 'SUB'}
              </span>
              <StatusIcon success={step.env_success} size={18} />
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatTime(step.created_at)}
              </span>
              <span className="font-mono">{step.request_id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Analytics Component
const Analytics = ({ summary }) => {
  if (!summary) return null;

  const functionData = Object.entries(summary.function_counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const agentData = Object.entries(summary.agent_counts || {});

  return (
    <div className="card p-5" data-testid="analytics">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Function Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Top Functions</h4>
          <div className="space-y-2">
            {functionData.map(([name, count]) => {
              const pct = (count / summary.total_steps) * 100;
              return (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-600 truncate" title={name}>{name}</div>
                  <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-8 text-xs text-slate-500 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Agent Activity</h4>
          <div className="space-y-3">
            {agentData.map(([name, count]) => {
              const pct = (count / summary.total_steps) * 100;
              const isMain = name === 'EmergentAssistant';
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`agent-badge ${isMain ? 'agent-main' : 'agent-sub'}`}>
                      {isMain ? 'Main Agent' : 'Sub Agent'}
                    </span>
                    <span className="text-xs text-slate-500">{count} steps ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded overflow-hidden">
                    <div 
                      className={`h-full rounded ${isMain ? 'bg-violet-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Waterfall Component
const Waterfall = ({ trajectories }) => {
  if (!trajectories || trajectories.length === 0) return null;

  const startTime = new Date(trajectories[0].created_at.replace(' UTC', 'Z')).getTime();
  const endTime = new Date(trajectories[trajectories.length - 1].created_at.replace(' UTC', 'Z')).getTime();
  const totalDuration = endTime - startTime || 1;

  return (
    <div className="card p-5 overflow-x-auto" data-testid="waterfall">
      <div className="min-w-[600px]">
        {trajectories.slice(0, 25).map((step, idx) => {
          const stepTime = new Date(step.created_at.replace(' UTC', 'Z')).getTime();
          const leftPct = ((stepTime - startTime) / totalDuration) * 100;
          
          return (
            <div key={step.request_id} className="flex items-center gap-3 mb-2">
              <div className="w-28 text-xs text-slate-600 truncate" title={step.function_name}>
                {step.function_name || '(empty)'}
              </div>
              <div className="flex-1 h-6 bg-slate-100 rounded relative">
                <div
                  className={`absolute h-full w-3 rounded ${step.env_success === true ? 'bg-green-500' : step.env_success === false ? 'bg-red-500' : 'bg-slate-400'}`}
                  style={{ left: `${leftPct}%` }}
                />
              </div>
              <div className="w-16 text-xs text-slate-500">
                {formatTime(step.created_at)}
              </div>
            </div>
          );
        })}
        {trajectories.length > 25 && (
          <div className="text-center text-sm text-slate-500 mt-3">
            ... and {trajectories.length - 25} more steps
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

function App() {
  const [jobId, setJobId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [jobInfo, setJobInfo] = useState(null);
  const [trajectories, setTrajectories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [copied, setCopied] = useState(false);
  
  // Expandable sections state
  const [openSections, setOpenSections] = useState({
    timeline: false,
    analytics: false,
    waterfall: false
  });

  // Fetch available jobs on mount
  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/jobs`)
      .then(res => setAvailableJobs(res.data.jobs))
      .catch(err => console.error('Failed to fetch jobs:', err));
  }, []);

  // Fetch job data
  const fetchJobData = async (id) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    setJobInfo(null);
    setTrajectories([]);
    setSummary(null);
    setOpenSections({ timeline: false, analytics: false, waterfall: false });

    try {
      const [jobRes, trajRes, summaryRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/job/${id}`),
        axios.get(`${BACKEND_URL}/api/job/${id}/trajectories`),
        axios.get(`${BACKEND_URL}/api/job/${id}/summary`)
      ]);

      setJobInfo(jobRes.data);
      setTrajectories(trajRes.data);
      setSummary(summaryRes.data);
      setJobId(id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch job data');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchJobData(searchInput.trim());
    }
  };

  // Toggle section
  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Copy job ID
  const copyJobId = () => {
    navigator.clipboard.writeText(jobId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Activity className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">LLM Tracing</h1>
                <p className="text-xs text-slate-500">Emergent Observability</p>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter Job ID..."
                  className="search-input w-72 pl-10 pr-4 py-2.5 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none text-sm"
                  data-testid="job-id-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                data-testid="search-button"
              >
                {loading ? <Loader2 className="spinner" size={16} /> : <Search size={16} />}
                Search
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Demo jobs */}
        {!jobId && availableJobs.length > 0 && (
          <div className="card p-4 mb-6" data-testid="demo-jobs">
            <p className="text-slate-500 text-sm mb-3">Quick select demo jobs:</p>
            <div className="flex flex-wrap gap-2">
              {availableJobs.map(id => (
                <button
                  key={id}
                  onClick={() => {
                    setSearchInput(id);
                    fetchJobData(id);
                  }}
                  className="demo-btn"
                >
                  {id.slice(0, 12)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card p-4 mb-6 border-red-200 bg-red-50 text-red-700 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="spinner mx-auto mb-4 text-indigo-500" size={36} />
              <p className="text-slate-500">Loading trace data...</p>
            </div>
          </div>
        )}

        {/* Job Data */}
        {jobInfo && !loading && (
          <>
            {/* Job ID with copy */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-slate-500 text-sm">Job ID:</span>
              <code className="font-mono text-sm text-slate-700 bg-slate-100 px-3 py-1 rounded">{jobId}</code>
              <button
                onClick={copyJobId}
                className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-600"
                title="Copy Job ID"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
              <button
                onClick={() => fetchJobData(jobId)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
              >
                <RefreshCcw size={14} />
                Refresh
              </button>
            </div>

            {/* Job Info Card */}
            <JobInfoCard jobInfo={jobInfo} summary={summary} />

            {/* Trajectory Matrix Visualizer */}
            <TrajectoryMatrix trajectories={trajectories} />

            {/* Expandable Sections */}
            <ExpandableSection
              title="Timeline"
              icon={<Clock size={18} className="text-indigo-500" />}
              isOpen={openSections.timeline}
              onToggle={() => toggleSection('timeline')}
              count={trajectories.length}
            >
              <Timeline trajectories={trajectories} />
            </ExpandableSection>

            <ExpandableSection
              title="Analytics"
              icon={<Activity size={18} className="text-emerald-500" />}
              isOpen={openSections.analytics}
              onToggle={() => toggleSection('analytics')}
            >
              <Analytics summary={summary} />
            </ExpandableSection>

            <ExpandableSection
              title="Waterfall"
              icon={<Clock size={18} className="text-amber-500" />}
              isOpen={openSections.waterfall}
              onToggle={() => toggleSection('waterfall')}
            >
              <Waterfall trajectories={trajectories} />
            </ExpandableSection>
          </>
        )}

        {/* Empty state */}
        {!loading && !jobId && !error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-slate-100 flex items-center justify-center">
              <Activity className="text-indigo-500" size={28} />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">LLM Trace Viewer</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              Enter a Job ID to view the complete execution trace, including function calls, 
              agent interactions, and performance metrics.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 py-5 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          Emergent LLM Tracing UI - Observability Prototype
        </div>
      </footer>
    </div>
  );
}

export default App;
