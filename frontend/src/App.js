import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  Search, Activity, Clock, Zap, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronRight, Bot, Cpu, FileCode, Terminal, Eye,
  TestTube, Play, Loader2, RefreshCcw, Copy, ExternalLink, TrendingUp
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Category colors for charts
const CATEGORY_COLORS = {
  execution: '#3b82f6',
  file_ops: '#22c55e',
  reasoning: '#a855f7',
  testing: '#fbbf24',
  agents: '#f472b6',
  exit: '#ef4444',
  other: '#94a3b8'
};

const AGENT_COLORS = {
  EmergentAssistant: '#8b5cf6',
  SkilledAssistant: '#22c55e'
};

// Category icons
const getCategoryIcon = (category) => {
  switch (category) {
    case 'execution': return <Terminal size={14} />;
    case 'file_ops': return <FileCode size={14} />;
    case 'reasoning': return <Cpu size={14} />;
    case 'testing': return <TestTube size={14} />;
    case 'agents': return <Bot size={14} />;
    case 'exit': return <AlertCircle size={14} />;
    default: return <Play size={14} />;
  }
};

// Format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp.replace(' UTC', 'Z'));
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Format duration
const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
};

// Status badge component
const StatusBadge = ({ success }) => {
  if (success === true) {
    return (
      <span className="flex items-center gap-1 text-trace-success text-xs">
        <CheckCircle size={12} /> Success
      </span>
    );
  } else if (success === false) {
    return (
      <span className="flex items-center gap-1 text-trace-error text-xs">
        <XCircle size={12} /> Failed
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-gray-500 text-xs">
      <AlertCircle size={12} /> N/A
    </span>
  );
};

// Trace step component
const TraceStep = ({ step, index, isExpanded, onToggle }) => {
  const categoryClass = `category-${step.category || 'other'}`;
  const agentClass = step.agent_name === 'EmergentAssistant' ? 'agent-emergent' : 'agent-skilled';

  return (
    <div 
      className="trace-step relative pl-10 pb-6 cursor-pointer"
      onClick={onToggle}
      data-testid={`trace-step-${index}`}
    >
      {/* Timeline connector */}
      {index < 45 && <div className="timeline-line" />}
      
      {/* Timeline node */}
      <div 
        className={`timeline-node absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
          step.env_success === true ? 'border-trace-success bg-trace-success/10' :
          step.env_success === false ? 'border-trace-error bg-trace-error/10' :
          'border-gray-600 bg-gray-800'
        }`}
      >
        <span className="text-xs font-mono font-bold text-gray-300">
          {step.step_num >= 0 ? step.step_num : 'I'}
        </span>
      </div>

      {/* Step content */}
      <div className={`ml-4 p-4 rounded-lg border transition-all duration-200 ${
        isExpanded ? 'bg-trace-card border-trace-primary' : 'bg-trace-card/50 border-trace-border hover:border-gray-500'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`function-tag ${categoryClass}`}>
                {getCategoryIcon(step.category)}
                {step.function_name || '(empty)'}
              </span>
              <span className={`agent-badge ${agentClass}`}>
                {step.agent_name === 'EmergentAssistant' ? 'Main' : 'Sub'}
              </span>
              <StatusBadge success={step.env_success} />
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatTime(step.created_at)}
              </span>
              <span className="duration-badge">
                {formatDuration(step.duration_ms || 0)}
              </span>
              {step.tokens_input && (
                <span className="token-badge token-input">
                  ↓ {step.tokens_input.toLocaleString()}
                </span>
              )}
              {step.tokens_output && (
                <span className="token-badge token-output">
                  ↑ {step.tokens_output.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-gray-500">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-trace-border space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Request ID:</span>
                <code className="ml-2 text-xs bg-gray-800 px-2 py-1 rounded font-mono text-gray-300">
                  {step.request_id}
                </code>
              </div>
              <div>
                <span className="text-gray-500">Agent:</span>
                <span className="ml-2 text-gray-300">{step.agent_name}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Job info card component
const JobInfoCard = ({ jobInfo }) => {
  if (!jobInfo) return null;

  return (
    <div className="gradient-border p-6 mb-6" data-testid="job-info-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Job Information</h2>
          <p className="text-sm text-gray-400 font-mono">{jobInfo.job_id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          jobInfo.status === 'COMPLETED' ? 'bg-trace-success/20 text-trace-success' :
          jobInfo.status === 'FAILED' ? 'bg-trace-error/20 text-trace-error' :
          'bg-trace-warning/20 text-trace-warning'
        }`}>
          {jobInfo.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="stats-card">
          <div className="text-gray-400 text-xs mb-1">Model</div>
          <div className="text-white font-semibold text-sm truncate" title={jobInfo.model_name}>
            {jobInfo.model_name?.split('?')[0] || 'N/A'}
          </div>
        </div>
        <div className="stats-card">
          <div className="text-gray-400 text-xs mb-1">Prompt</div>
          <div className="text-white font-semibold text-sm">{jobInfo.prompt_name || 'N/A'}</div>
        </div>
        <div className="stats-card">
          <div className="text-gray-400 text-xs mb-1">Version</div>
          <div className="text-white font-semibold text-sm">{jobInfo.prompt_version || 'N/A'}</div>
        </div>
        <div className="stats-card">
          <div className="text-gray-400 text-xs mb-1">Mode</div>
          <div className="text-white font-semibold text-sm capitalize">{jobInfo.chat_mode || 'N/A'}</div>
        </div>
      </div>

      {jobInfo.task && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-2">Task Description</div>
          <p className="text-gray-200 text-sm">{jobInfo.task}</p>
        </div>
      )}
    </div>
  );
};

// Summary stats component
const SummaryStats = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6" data-testid="summary-stats">
      <div className="stats-card">
        <div className="flex items-center gap-2 text-trace-info mb-2">
          <Activity size={18} />
          <span className="text-xs text-gray-400">Total Steps</span>
        </div>
        <div className="text-2xl font-bold text-white">{summary.total_steps}</div>
      </div>
      
      <div className="stats-card">
        <div className="flex items-center gap-2 text-trace-success mb-2">
          <CheckCircle size={18} />
          <span className="text-xs text-gray-400">Success Rate</span>
        </div>
        <div className="text-2xl font-bold text-white">{summary.success_rate}%</div>
      </div>
      
      <div className="stats-card">
        <div className="flex items-center gap-2 text-trace-error mb-2">
          <XCircle size={18} />
          <span className="text-xs text-gray-400">Failed</span>
        </div>
        <div className="text-2xl font-bold text-white">{summary.failed_steps}</div>
      </div>
      
      <div className="stats-card">
        <div className="flex items-center gap-2 text-trace-warning mb-2">
          <Clock size={18} />
          <span className="text-xs text-gray-400">Duration</span>
        </div>
        <div className="text-2xl font-bold text-white">{summary.total_duration_formatted}</div>
      </div>
      
      <div className="stats-card">
        <div className="flex items-center gap-2 text-trace-primary mb-2">
          <Zap size={18} />
          <span className="text-xs text-gray-400">Total Tokens</span>
        </div>
        <div className="text-2xl font-bold text-white">
          {(summary.total_input_tokens + summary.total_output_tokens).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Function breakdown chart
const FunctionBreakdownChart = ({ functionCounts }) => {
  if (!functionCounts) return null;

  const data = Object.entries(functionCounts)
    .map(([name, count]) => ({ name: name || '(empty)', count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="stats-card" data-testid="function-breakdown-chart">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-trace-primary" />
        Function Usage (Top 10)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis type="number" stroke="#8b949e" />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#8b949e"
            tick={{ fontSize: 11 }}
            width={110}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#161b22', 
              border: '1px solid #30363d',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Category distribution chart
const CategoryDistributionChart = ({ categoryData }) => {
  if (!categoryData) return null;

  const data = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || CATEGORY_COLORS.other
  }));

  return (
    <div className="stats-card" data-testid="category-distribution-chart">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Cpu size={18} className="text-trace-secondary" />
        Category Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#161b22', 
              border: '1px solid #30363d',
              borderRadius: '8px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Agent distribution chart
const AgentDistributionChart = ({ agentCounts }) => {
  if (!agentCounts) return null;

  const data = Object.entries(agentCounts).map(([name, value]) => ({
    name: name === 'EmergentAssistant' ? 'Main Agent' : 'Sub Agent',
    fullName: name,
    value,
    color: AGENT_COLORS[name]
  }));

  return (
    <div className="stats-card" data-testid="agent-distribution-chart">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Bot size={18} className="text-trace-success" />
        Agent Activity
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#161b22', 
              border: '1px solid #30363d',
              borderRadius: '8px'
            }}
          />
          <Legend 
            formatter={(value, entry) => (
              <span style={{ color: '#e6edf3' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Timeline waterfall component
const TimelineWaterfall = ({ trajectories }) => {
  if (!trajectories || trajectories.length === 0) return null;

  // Calculate relative positions for waterfall
  const startTime = new Date(trajectories[0].created_at.replace(' UTC', 'Z')).getTime();
  const endTime = new Date(trajectories[trajectories.length - 1].created_at.replace(' UTC', 'Z')).getTime();
  const totalDuration = endTime - startTime;

  return (
    <div className="stats-card overflow-x-auto" data-testid="timeline-waterfall">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock size={18} className="text-trace-warning" />
        Execution Waterfall
      </h3>
      <div className="min-w-[800px]">
        {trajectories.slice(0, 20).map((step, index) => {
          const stepStart = new Date(step.created_at.replace(' UTC', 'Z')).getTime();
          const leftPercent = ((stepStart - startTime) / totalDuration) * 100;
          const widthPercent = Math.max(((step.duration_ms || 100) / totalDuration) * 100, 1);
          const color = CATEGORY_COLORS[step.category] || CATEGORY_COLORS.other;

          return (
            <div key={index} className="flex items-center gap-2 mb-2">
              <div className="w-32 text-xs text-gray-400 truncate" title={step.function_name}>
                {step.function_name || '(empty)'}
              </div>
              <div className="flex-1 h-6 bg-gray-800 rounded relative">
                <div
                  className="waterfall-bar absolute"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: color
                  }}
                  title={`${step.function_name}: ${formatDuration(step.duration_ms || 0)}`}
                />
              </div>
              <div className="w-16 text-xs text-gray-500 text-right">
                {formatDuration(step.duration_ms || 0)}
              </div>
            </div>
          );
        })}
        {trajectories.length > 20 && (
          <div className="text-center text-gray-500 text-sm mt-4">
            ... and {trajectories.length - 20} more steps
          </div>
        )}
      </div>
    </div>
  );
};

// Success rate by function chart
const SuccessRateChart = ({ successRates }) => {
  if (!successRates) return null;

  const data = Object.entries(successRates)
    .map(([name, stats]) => ({
      name: name || '(empty)',
      successRate: stats.success + stats.fail > 0 
        ? Math.round((stats.success / (stats.success + stats.fail)) * 100) 
        : 100,
      total: stats.success + stats.fail + stats.unknown
    }))
    .filter(d => d.total > 1)
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, 10);

  return (
    <div className="stats-card" data-testid="success-rate-chart">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <CheckCircle size={18} className="text-trace-success" />
        Success Rate by Function
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis type="number" domain={[0, 100]} stroke="#8b949e" unit="%" />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#8b949e"
            tick={{ fontSize: 11 }}
            width={110}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#161b22', 
              border: '1px solid #30363d',
              borderRadius: '8px'
            }}
            formatter={(value) => [`${value}%`, 'Success Rate']}
          />
          <Bar 
            dataKey="successRate" 
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.successRate >= 80 ? '#22c55e' : entry.successRate >= 50 ? '#fbbf24' : '#ef4444'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Main App component
function App() {
  const [jobId, setJobId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [jobInfo, setJobInfo] = useState(null);
  const [trajectories, setTrajectories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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

  // Toggle step expansion
  const toggleStep = (index) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  // Filter trajectories
  const filteredTrajectories = useMemo(() => {
    return trajectories.filter(t => {
      const categoryMatch = filterCategory === 'all' || t.category === filterCategory;
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'success' && t.env_success === true) ||
        (filterStatus === 'failed' && t.env_success === false) ||
        (filterStatus === 'unknown' && t.env_success === null);
      return categoryMatch && statusMatch;
    });
  }, [trajectories, filterCategory, filterStatus]);

  // Copy job ID
  const copyJobId = () => {
    navigator.clipboard.writeText(jobId);
  };

  return (
    <div className="min-h-screen bg-trace-bg">
      {/* Header */}
      <header className="border-b border-trace-border bg-trace-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-trace-primary to-trace-secondary flex items-center justify-center">
                <Eye className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LLM Tracing</h1>
                <p className="text-xs text-gray-400">Emergent Observability</p>
              </div>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter Job ID..."
                  className="search-input w-80 pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none"
                  data-testid="job-id-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-trace-primary hover:bg-trace-primary/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                data-testid="search-button"
              >
                {loading ? <Loader2 className="spinner" size={18} /> : <Search size={18} />}
                Search
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick select for demo jobs */}
        {!jobId && availableJobs.length > 0 && (
          <div className="mb-6 p-4 bg-trace-card rounded-lg border border-trace-border" data-testid="demo-jobs">
            <p className="text-gray-400 text-sm mb-3">Quick select demo jobs:</p>
            <div className="flex flex-wrap gap-2">
              {availableJobs.map(id => (
                <button
                  key={id}
                  onClick={() => {
                    setSearchInput(id);
                    fetchJobData(id);
                  }}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-mono transition-colors"
                >
                  {id.slice(0, 8)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-trace-error/10 border border-trace-error/30 rounded-lg text-trace-error flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="spinner mx-auto mb-4 text-trace-primary" size={40} />
              <p className="text-gray-400">Loading trace data...</p>
            </div>
          </div>
        )}

        {/* Job data display */}
        {jobInfo && !loading && (
          <>
            {/* Job ID banner */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Job ID:</span>
                <code className="font-mono text-sm text-white bg-gray-800 px-3 py-1 rounded">
                  {jobId}
                </code>
                <button
                  onClick={copyJobId}
                  className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                  title="Copy Job ID"
                >
                  <Copy size={14} />
                </button>
              </div>
              <button
                onClick={() => fetchJobData(jobId)}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCcw size={14} />
                Refresh
              </button>
            </div>

            <JobInfoCard jobInfo={jobInfo} />
            <SummaryStats summary={summary} />

            {/* Tabs */}
            <div className="border-b border-trace-border mb-6">
              <nav className="flex gap-4">
                {['timeline', 'analytics', 'waterfall'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                    data-testid={`tab-${tab}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div>
                {/* Filters */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Category:</span>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-gray-800 border border-trace-border rounded px-3 py-1 text-sm text-white"
                      data-testid="filter-category"
                    >
                      <option value="all">All</option>
                      <option value="execution">Execution</option>
                      <option value="file_ops">File Ops</option>
                      <option value="reasoning">Reasoning</option>
                      <option value="testing">Testing</option>
                      <option value="agents">Agents</option>
                      <option value="exit">Exit</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Status:</span>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-gray-800 border border-trace-border rounded px-3 py-1 text-sm text-white"
                      data-testid="filter-status"
                    >
                      <option value="all">All</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <span className="text-gray-500 text-sm ml-auto">
                    Showing {filteredTrajectories.length} of {trajectories.length} steps
                  </span>
                </div>

                {/* Timeline */}
                <div className="relative" data-testid="trace-timeline">
                  {filteredTrajectories.map((step, index) => (
                    <TraceStep
                      key={step.request_id}
                      step={step}
                      index={index}
                      isExpanded={expandedSteps.has(index)}
                      onToggle={() => toggleStep(index)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FunctionBreakdownChart functionCounts={summary?.function_counts} />
                <CategoryDistributionChart categoryData={summary?.category_counts} />
                <AgentDistributionChart agentCounts={summary?.agent_counts} />
                <SuccessRateChart successRates={summary?.function_success_rates} />
              </div>
            )}

            {/* Waterfall Tab */}
            {activeTab === 'waterfall' && (
              <TimelineWaterfall trajectories={trajectories} />
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !jobId && !error && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-trace-card border border-trace-border flex items-center justify-center">
              <Eye className="text-trace-primary" size={36} />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">LLM Trace Viewer</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Enter a Job ID to view the complete execution trace, including function calls, 
              agent interactions, and performance metrics.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-trace-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Emergent LLM Tracing UI - Observability Prototype</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
