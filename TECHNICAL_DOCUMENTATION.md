# Oracle - Technical Implementation Documentation

> **Location**: `/app/TECHNICAL_DOCUMENTATION.md`
> **Last Updated**: January 21, 2026
> **Application Name**: Oracle - HITL Classification & LLM Tracing Dashboard

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Data Structures](#data-structures)
6. [API Reference](#api-reference)
7. [File Structure](#file-structure)
8. [BigQuery Integration Guide](#bigquery-integration-guide)
9. [UI Components](#ui-components)
10. [Styling & Theme](#styling--theme)

---

## Overview

### What Was Built

Two main features were implemented:

1. **Oracle Dashboard (Main)** - HITL Classification Events viewer
   - Sidebar with sentiment categories (neutral, satisfied, dissatisfied, frustrated, excited)
   - Event cards showing user messages, agent responses, intents, and sentiments
   - Data sourced from `agent_analytics.intent_classification_events`

2. **LLM Tracing UI (Secondary)** - Job trajectory visualization
   - Job information display (model, prompt, version)
   - Trajectory matrix visualizer (function calls vs steps)
   - Expandable sections for Timeline, Analytics, Waterfall views
   - Data sourced from `analytics.jobs_full_view` and `analytics.trajectories_full_view`

### Tech Stack

- **Backend**: FastAPI (Python 3.x)
- **Frontend**: React 18 + Tailwind CSS
- **Charts**: Recharts (for analytics)
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                         Port: 3000                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Sidebar   │  │   Content   │  │      HITL Event Cards   │  │
│  │  Component  │  │   Header    │  │        Component        │  │
│  │             │  │             │  │                         │  │
│  │ - Sentiments│  │ - Title     │  │ - User Message          │  │
│  │ - Counts    │  │ - Count     │  │ - Agent Response        │  │
│  │ - Selection │  │ - Sort      │  │ - Intent Tags           │  │
│  └─────────────┘  └─────────────┘  │ - Sentiment Tags        │  │
│                                     └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (Axios)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                        │
│                         Port: 8001                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Endpoints                         │    │
│  │                                                          │    │
│  │  GET /api/health              - Health check             │    │
│  │  GET /api/sentiments          - Sentiment categories     │    │
│  │  GET /api/hitl-events/{sent}  - Events by sentiment      │    │
│  │  GET /api/hitl-events         - All events               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MOCK DATA (Ready for BigQuery)              │    │
│  │                                                          │    │
│  │  SENTIMENT_CATEGORIES    - Aggregated sentiment counts   │    │
│  │  HITL_EVENTS_BY_SENTIMENT - Raw HITL events by category │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend Implementation

### File: `/app/backend/server.py`

```python
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import os

app = FastAPI(title="Oracle - HITL Classification Dashboard")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Key Backend Features

1. **CORS Enabled** - Allows frontend to communicate with backend
2. **Modular Data Structure** - Data organized to match BigQuery schema exactly
3. **RESTful API Design** - Clean endpoint structure

### Data Organization

The backend uses two main data structures:

```python
# Sentiment aggregation (matches BigQuery GROUP BY query)
SENTIMENT_CATEGORIES = [
    {"sentiment": "neutral", "count": 132436},
    {"sentiment": "satisfied", "count": 19080},
    {"sentiment": "dissatisfied", "count": 13782},
    {"sentiment": "frustrated", "count": 4717},
    {"sentiment": "excited", "count": 426}
]

# HITL events organized by sentiment
HITL_EVENTS_BY_SENTIMENT = {
    "dissatisfied": [...],  # 20 real events from CSV
    "frustrated": [...],
    "satisfied": [...],
    "neutral": [...],
    "excited": [...]
}
```

---

## Frontend Implementation

### File: `/app/frontend/src/App.js`

### Main Components

#### 1. Sidebar Component
```jsx
const Sidebar = ({ sentiments, selectedSentiment, onSelectSentiment }) => {
  // Displays sentiment categories with counts
  // Handles selection state
  // Shows total count at top
}
```

#### 2. HITLEventCard Component
```jsx
const HITLEventCard = ({ event }) => {
  // Displays:
  // - Timestamp & Request ID (header)
  // - User Message (blue bubble)
  // - Agent Previous Response (gray bubble, scrollable)
  // - Intent tags (yellow)
  // - Sentiment tags (color-coded)
}
```

#### 3. ContentHeader Component
```jsx
const ContentHeader = ({ sentiment, eventCount, totalCount }) => {
  // Shows current filter
  // Displays "Showing X of Y events"
  // Sort indicator
}
```

### State Management

```jsx
function App() {
  const [sentiments, setSentiments] = useState([]);           // All sentiment categories
  const [selectedSentiment, setSelectedSentiment] = useState('dissatisfied'); // Current filter
  const [events, setEvents] = useState([]);                   // Current events list
  const [loading, setLoading] = useState(true);               // Initial load
  const [eventsLoading, setEventsLoading] = useState(false);  // Events loading
  const [error, setError] = useState(null);                   // Error state
  
  // ... effects and handlers
}
```

### API Integration

```jsx
// Fetch sentiments on mount
useEffect(() => {
  axios.get(`${BACKEND_URL}/api/sentiments`)
    .then(res => setSentiments(res.data))
}, []);

// Fetch events when sentiment changes
useEffect(() => {
  const endpoint = selectedSentiment === 'all' 
    ? `${BACKEND_URL}/api/hitl-events`
    : `${BACKEND_URL}/api/hitl-events/${selectedSentiment}`;
  
  axios.get(endpoint).then(res => setEvents(res.data.events));
}, [selectedSentiment]);
```

---

## Data Structures

### Sentiment Category Object

```typescript
interface SentimentCategory {
  sentiment: string;  // "neutral" | "satisfied" | "dissatisfied" | "frustrated" | "excited"
  count: number;      // Total count of events
}
```

### HITL Event Object

```typescript
interface HITLEvent {
  event_timestamp: string;      // "2026-01-21 11:12:52.685284 UTC"
  request_id: string;           // UUID
  user_curr_message: string;    // User's message text
  agent_prev_message: string;   // Agent's previous response
  user_intent: string[];        // ["req_same_bug_fix", "req_improvement"]
  user_sentiment: string[];     // ["dissatisfied"]
}
```

### BigQuery Schema Mapping

| Frontend Field | BigQuery Column | Table |
|---------------|-----------------|-------|
| event_timestamp | event_timestamp | agent_analytics.intent_classification_events |
| request_id | request_id | agent_analytics.intent_classification_events |
| user_curr_message | user_curr_message | agent_analytics.intent_classification_events |
| agent_prev_message | agent_prev_message | agent_analytics.intent_classification_events |
| user_intent | user_intent | agent_analytics.intent_classification_events |
| user_sentiment | user_sentiment | agent_analytics.intent_classification_events |

---

## API Reference

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "Oracle - HITL Classification Dashboard"
}
```

### GET /api/sentiments

Get all sentiment categories with counts.

**Equivalent BigQuery:**
```sql
SELECT user_sentiment, COUNT(*) as count
FROM `agent_analytics.intent_classification_events`
GROUP BY 1
ORDER BY 2 DESC
```

**Response:**
```json
[
  {"sentiment": "neutral", "count": 132436},
  {"sentiment": "satisfied", "count": 19080},
  {"sentiment": "dissatisfied", "count": 13782},
  {"sentiment": "frustrated", "count": 4717},
  {"sentiment": "excited", "count": 426}
]
```

### GET /api/hitl-events/{sentiment}

Get HITL events filtered by sentiment.

**Parameters:**
- `sentiment` (path): One of "neutral", "satisfied", "dissatisfied", "frustrated", "excited"
- `limit` (query, optional): Max events to return (default: 20, max: 100)

**Equivalent BigQuery:**
```sql
SELECT event_timestamp, request_id, user_curr_message, 
       agent_prev_message, user_intent, user_sentiment
FROM `agent_analytics.intent_classification_events`
WHERE '{sentiment}' IN UNNEST(user_sentiment)
ORDER BY event_timestamp DESC
LIMIT 20
```

**Response:**
```json
{
  "sentiment": "dissatisfied",
  "count": 20,
  "events": [
    {
      "event_timestamp": "2026-01-21 11:12:52.685284 UTC",
      "request_id": "6e125700-71ee-4008-9e1c-20a31a7a33cd",
      "user_curr_message": "Product pictures are not matched with website",
      "agent_prev_message": "Now let me provide a comprehensive final summary...",
      "user_intent": ["req_same_bug_fix"],
      "user_sentiment": ["dissatisfied"]
    }
  ]
}
```

### GET /api/hitl-events

Get all HITL events (all sentiments).

**Response:** Same structure as above with `"sentiment": "all"`

---

## File Structure

```
/app/
├── backend/
│   ├── server.py              # FastAPI application with all endpoints
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables (MONGO_URL)
│
├── frontend/
│   ├── package.json           # Node dependencies (react, axios, recharts, lucide-react)
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── postcss.config.js      # PostCSS configuration
│   ├── .env                   # Frontend environment (REACT_APP_BACKEND_URL)
│   ├── public/
│   │   └── index.html         # HTML template
│   └── src/
│       ├── index.js           # React entry point
│       ├── index.css          # Global styles (Tailwind imports)
│       ├── App.js             # Main React application
│       └── App.css            # Component-specific styles
│
├── TECHNICAL_DOCUMENTATION.md # This file
└── README.md                  # Project overview
```

---

## BigQuery Integration Guide

### To Replace Mock Data with Real BigQuery

1. **Install BigQuery Client:**
```bash
pip install google-cloud-bigquery
```

2. **Update server.py:**
```python
from google.cloud import bigquery

client = bigquery.Client()

@app.get("/api/sentiments")
async def get_sentiment_categories():
    query = """
        SELECT user_sentiment as sentiment, COUNT(*) as count
        FROM `agent_analytics.intent_classification_events`
        GROUP BY 1
        ORDER BY 2 DESC
    """
    results = client.query(query).result()
    return [{"sentiment": row.sentiment, "count": row.count} for row in results]

@app.get("/api/hitl-events/{sentiment}")
async def get_hitl_events_by_sentiment(sentiment: str, limit: int = 20):
    query = f"""
        SELECT event_timestamp, request_id, user_curr_message, 
               agent_prev_message, user_intent, user_sentiment
        FROM `agent_analytics.intent_classification_events`
        WHERE '{sentiment}' IN UNNEST(user_sentiment)
        ORDER BY event_timestamp DESC
        LIMIT {limit}
    """
    results = client.query(query).result()
    events = [dict(row) for row in results]
    return {"sentiment": sentiment, "count": len(events), "events": events}
```

3. **Set Environment Variable:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

---

## UI Components

### Color Scheme

| Sentiment | Dot Color | Badge Background | Badge Text |
|-----------|-----------|------------------|------------|
| neutral | `#94a3b8` | `#f1f5f9` | `#475569` |
| satisfied | `#22c55e` | `#dcfce7` | `#166534` |
| dissatisfied | `#f97316` | `#ffedd5` | `#9a3412` |
| frustrated | `#ef4444` | `#fee2e2` | `#991b1b` |
| excited | `#8b5cf6` | `#f3e8ff` | `#6b21a8` |

### Layout Dimensions

- **Sidebar Width**: 260px (fixed)
- **Content Area**: `margin-left: 260px`
- **Card Border Radius**: 12px
- **Message Bubble Padding**: 14px 18px

### Icons Used (Lucide React)

- `MessageSquare` - All Events
- `Meh` - Neutral
- `Smile` - Satisfied
- `Frown` - Dissatisfied
- `AlertTriangle` - Frustrated
- `Sparkles` - Excited
- `User` - User Message
- `Bot` - Agent Response
- `Clock` - Timestamp
- `Hash` - Request ID

---

## Styling & Theme

### Tailwind Configuration (`tailwind.config.js`)

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Key CSS Classes (App.css)

```css
/* Sidebar */
.sidebar { width: 260px; position: fixed; left: 0; }

/* Sentiment Button */
.sentiment-btn { width: 100%; padding: 12px 16px; border-radius: 8px; }
.sentiment-btn.active { background: #f0f4ff; border-color: #6366f1; }

/* HITL Card */
.hitl-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; }

/* Message Bubbles */
.message-bubble.user { background: #f0f4ff; border: 1px solid #e0e7ff; }
.message-bubble.agent { background: #f8fafc; border: 1px solid #e2e8f0; }

/* Tags */
.tag.intent { background: #fef3c7; color: #92400e; }
.tag.sentiment { /* color-coded by sentiment */ }
```

---

## Running the Application

### Start Services
```bash
sudo supervisorctl restart all
```

### Check Status
```bash
sudo supervisorctl status
```

### View Logs
```bash
# Backend logs
tail -f /var/log/supervisor/backend.err.log

# Frontend logs
tail -f /var/log/supervisor/frontend.out.log
```

### Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Health Check**: http://localhost:8001/api/health

---

## Testing Endpoints

```bash
# Get sentiments
curl http://localhost:8001/api/sentiments

# Get dissatisfied events
curl http://localhost:8001/api/hitl-events/dissatisfied

# Get all events
curl http://localhost:8001/api/hitl-events

# Health check
curl http://localhost:8001/api/health
```

---

## Next Steps / Future Enhancements

1. **BigQuery Integration** - Replace mock data with real BigQuery queries
2. **Pagination** - Add pagination for large result sets
3. **Search** - Add full-text search within messages
4. **Date Filters** - Filter events by date range
5. **Export** - Export filtered results to CSV
6. **Job Linking** - Link HITL events to job IDs for trajectory viewing
7. **Real-time Updates** - WebSocket for live event streaming

---

## Dependencies

### Backend (requirements.txt)
```
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.0.0
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "axios": "^1.6.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.300.0"
  }
}
```

---

## Author Notes

This implementation uses **mock data** that mirrors the exact structure returned by BigQuery queries. The data structures are designed for easy 1:1 replacement with real database connections.

Key design decisions:
1. **Modular data** - Easy to swap mock → BigQuery
2. **Light theme** - Professional, readable UI
3. **Sidebar navigation** - Quick sentiment filtering
4. **Card-based events** - Clear visual hierarchy
5. **Color-coded sentiments** - Instant visual recognition

---

*Documentation generated for Oracle HITL Classification Dashboard*
