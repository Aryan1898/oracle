import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MessageSquare, User, Bot, Clock, Hash, Loader2, 
  Meh, Smile, Frown, AlertTriangle, Sparkles, ChevronRight
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp.replace(' UTC', 'Z'));
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatCount = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Sentiment icons
const getSentimentIcon = (sentiment, size = 16) => {
  switch (sentiment) {
    case 'neutral': return <Meh size={size} />;
    case 'satisfied': return <Smile size={size} />;
    case 'dissatisfied': return <Frown size={size} />;
    case 'frustrated': return <AlertTriangle size={size} />;
    case 'excited': return <Sparkles size={size} />;
    default: return <Meh size={size} />;
  }
};

// =============================================================================
// COMPONENTS
// =============================================================================

// Sidebar Component
const Sidebar = ({ sentiments, selectedSentiment, onSelectSentiment }) => {
  const totalCount = sentiments.reduce((sum, s) => sum + s.count, 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="oracle-logo">Oracle</div>
        <div className="oracle-subtitle">HITL Classification</div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider px-4 mb-3">
          User Sentiment
        </div>
        
        {/* All events button */}
        <button
          className={`sentiment-btn ${selectedSentiment === 'all' ? 'active' : ''}`}
          onClick={() => onSelectSentiment('all')}
          data-testid="sentiment-all"
        >
          <span className="label">
            <MessageSquare size={16} className="text-slate-400" />
            All Events
          </span>
          <span className="count">{formatCount(totalCount)}</span>
        </button>

        {/* Sentiment categories */}
        {sentiments.map((item) => (
          <button
            key={item.sentiment}
            className={`sentiment-btn ${selectedSentiment === item.sentiment ? 'active' : ''}`}
            onClick={() => onSelectSentiment(item.sentiment)}
            data-testid={`sentiment-${item.sentiment}`}
          >
            <span className="label">
              <span className={`sentiment-dot ${item.sentiment}`} />
              {item.sentiment}
            </span>
            <span className="count">{formatCount(item.count)}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="text-xs text-slate-400">
          Data from <code className="text-slate-500">agent_analytics.intent_classification_events</code>
        </div>
      </div>
    </aside>
  );
};

// HITL Event Card Component
const HITLEventCard = ({ event }) => {
  const sentimentClass = Array.isArray(event.user_sentiment) 
    ? event.user_sentiment[0]?.replace(/[\[\]]/g, '') 
    : event.user_sentiment;

  const intents = Array.isArray(event.user_intent) 
    ? event.user_intent 
    : [event.user_intent];

  const sentiments = Array.isArray(event.user_sentiment) 
    ? event.user_sentiment 
    : [event.user_sentiment];

  return (
    <div className="hitl-card" data-testid="hitl-event-card">
      {/* Header */}
      <div className="hitl-card-header">
        <div className="flex items-center gap-3">
          <Clock size={14} className="text-slate-400" />
          <span className="timestamp">{formatTimestamp(event.event_timestamp)}</span>
        </div>
        <span className="request-id">{event.request_id.slice(0, 8)}...</span>
      </div>

      {/* Body */}
      <div className="hitl-card-body">
        {/* User Message */}
        <div className="message-section">
          <div className="message-label user">
            <User size={12} />
            User Message
          </div>
          <div className="message-bubble user">
            {event.user_curr_message}
          </div>
        </div>

        {/* Agent Previous Message */}
        <div className="message-section">
          <div className="message-label agent">
            <Bot size={12} />
            Agent Previous Response
          </div>
          <div className="message-bubble agent agent-message-scroll">
            {event.agent_prev_message}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          {/* Intent tags */}
          {intents.map((intent, idx) => (
            <span key={idx} className="tag intent">
              {intent.replace(/[\[\]]/g, '')}
            </span>
          ))}
          
          {/* Sentiment tags */}
          {sentiments.map((sentiment, idx) => {
            const cleanSentiment = sentiment.replace(/[\[\]]/g, '');
            return (
              <span key={idx} className={`tag sentiment ${cleanSentiment}`}>
                {getSentimentIcon(cleanSentiment, 12)}
                <span className="ml-1">{cleanSentiment}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Content Header Component
const ContentHeader = ({ sentiment, eventCount, totalCount }) => {
  const sentimentLabel = sentiment === 'all' ? 'All Events' : sentiment;
  
  return (
    <div className="content-header">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {sentiment !== 'all' && (
              <span className={`sentiment-dot ${sentiment}`} style={{ width: 12, height: 12 }} />
            )}
            <h1 className="text-xl font-semibold text-slate-800 capitalize">
              {sentimentLabel}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Showing {eventCount} of {formatCount(totalCount)} HITL classification events
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Sorted by</span>
          <span className="font-medium text-slate-600">Most Recent</span>
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};

// Loading State
const LoadingState = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
      <p className="text-slate-500">Loading events...</p>
    </div>
  </div>
);

// Empty State
const EmptyState = ({ sentiment }) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      <MessageSquare size={28} />
    </div>
    <h3 className="text-lg font-medium text-slate-700 mb-2">No events found</h3>
    <p className="text-slate-500">
      No HITL classification events for "{sentiment}" sentiment.
    </p>
  </div>
);

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

function App() {
  const [sentiments, setSentiments] = useState([]);
  const [selectedSentiment, setSelectedSentiment] = useState('dissatisfied');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch sentiment categories on mount
  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/sentiments`)
      .then(res => {
        setSentiments(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch sentiments:', err);
        setError('Failed to load sentiment categories');
        setLoading(false);
      });
  }, []);

  // Fetch events when sentiment changes
  useEffect(() => {
    if (!selectedSentiment) return;

    setEventsLoading(true);
    const endpoint = selectedSentiment === 'all' 
      ? `${BACKEND_URL}/api/hitl-events`
      : `${BACKEND_URL}/api/hitl-events/${selectedSentiment}`;

    axios.get(endpoint)
      .then(res => {
        setEvents(res.data.events || []);
        setEventsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch events:', err);
        setEvents([]);
        setEventsLoading(false);
      });
  }, [selectedSentiment]);

  // Get total count for selected sentiment
  const getSelectedCount = () => {
    if (selectedSentiment === 'all') {
      return sentiments.reduce((sum, s) => sum + s.count, 0);
    }
    const found = sentiments.find(s => s.sentiment === selectedSentiment);
    return found ? found.count : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="oracle-logo text-4xl mb-2">Oracle</div>
          <Loader2 size={24} className="animate-spin text-indigo-500 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center text-red-600">
          <AlertTriangle size={48} className="mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar 
        sentiments={sentiments}
        selectedSentiment={selectedSentiment}
        onSelectSentiment={setSelectedSentiment}
      />

      {/* Main Content */}
      <main className="main-content">
        <ContentHeader 
          sentiment={selectedSentiment}
          eventCount={events.length}
          totalCount={getSelectedCount()}
        />

        <div className="content-body">
          {eventsLoading ? (
            <LoadingState />
          ) : events.length === 0 ? (
            <EmptyState sentiment={selectedSentiment} />
          ) : (
            <div>
              {events.map((event, idx) => (
                <HITLEventCard key={event.request_id || idx} event={event} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
