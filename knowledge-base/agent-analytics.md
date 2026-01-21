# Agent Analytics Knowledge Base

## Table: `agent_analytics.intent_classification_events`

This table captures classified snapshots of user-agent conversation states, enabling analysis of user behavior, agent performance, and product usage patterns.

---

## Schema Reference

| Column | Type | Description |
|--------|------|-------------|
| `event_id` | STRING | Unique identifier for the classification event |
| `event_timestamp` | TIMESTAMP | When the classification occurred (partition key) |
| `request_id` | STRING | Current request identifier |
| `job_id` | STRING | Job/session identifier linking related requests |
| `user_id` | STRING | User identifier |
| `state_number` | INT64 | State sequence number within a session |
| `step_num` | INT64 | Step number within the agent execution |
| `user_curr_message` | STRING | User's current message text |
| `user_prev_message` | STRING | User's previous message text |
| `agent_curr_message` | STRING | Agent's current response text |
| `agent_prev_message` | STRING | Agent's previous response text |
| `user_intent` | ARRAY<STRING> | Classified user intent categories |
| `user_intent_reasoning` | STRING | Explanation for intent classification |
| `intent_confidence` | INT64 | Confidence score (0-100) for intent |
| `user_sentiment` | ARRAY<STRING> | User emotional tone classification |
| `user_sentiment_reasoning` | STRING | Explanation for sentiment classification |
| `sentiment_confidence` | INT64 | Confidence score (0-100) for sentiment |
| `work_category` | ARRAY<STRING> | Type of work being performed |
| `work_subcategory` | ARRAY<STRING> | Detailed work breakdown |
| `progress_outcome` | ARRAY<STRING> | What the agent accomplished |
| `progress_outcome_reasoning` | STRING | Explanation for progress classification |
| `trajectory_ecu_consumed` | FLOAT64 | ECU consumed up to this point |
| `execution_time` | FLOAT64 | Time taken for this execution |
| `payload_created_at` | TIMESTAMP | Original event creation time |
| `snapshot_captured_at` | TIMESTAMP | When data was captured into this table |

---

## Classification Taxonomies

### User Intent Categories

| Intent | Description | Use Case |
|--------|-------------|----------|
| `req_new_bugfix` | User reports a new bug not mentioned before | Bug tracking, issue discovery |
| `req_same_bug_fix` | User re-reports the same bug | Bug recurrence, agent effectiveness |
| `req_feature` | User requests a new feature | Feature demand analysis |
| `req_improvement` | User requests enhancement to existing feature | Product iteration signals |
| `ack_bug_fixed` | User confirms bug is resolved | Resolution rate tracking |
| `ack_feature_built` | User confirms feature works | Feature delivery success |
| `ack_improvement` | User confirms improvement works | Improvement delivery success |
| `requested_integration` | User asks for 3rd party integration | Integration demand |
| `provided_credentials` | User provides API keys/passwords | Credential flow tracking |
| `requested_credentials` | User asks agent for credentials | Credential requests |
| `req_deployment` | User requests deployment action | Deployment demand |
| `req_testing` | User requests testing | Testing demand |
| `credit_concern` | User complains about ECU consumption | Cost sensitivity signals |
| `security_concern` | User asks about data privacy | Trust/security concerns |
| `asked_platform_info` | User asks about platform features | Onboarding/education needs |
| `asked_info` | User asks for clarification | Information gaps |
| `provided_info` | User provides clarification | Conversation flow |
| `align_with_agent` | User confirms agent's suggestions | Agreement patterns |

### User Sentiment Categories

| Sentiment | Description | Indicators |
|-----------|-------------|------------|
| `excited` | Highly positive, enthusiastic | "AMAZING!", "love this!", multiple exclamation marks |
| `satisfied` | Positive, appreciative | "thanks", "great", calm acknowledgment |
| `neutral` | Matter-of-fact, no emotion | Plain statements, professional tone |
| `dissatisfied` | Mildly negative | "unfortunately", hedging, disappointment |
| `frustrated` | Strongly negative, hostile | ALL CAPS, insults, threats to leave |

### Progress Outcome Categories

| Outcome | Description | What It Means |
|---------|-------------|---------------|
| `not_bug` | Agent explains reported issue isn't a bug | Expected behavior clarification |
| `bug_fixed` | Agent claims to have fixed a bug | Bug resolution |
| `built_feature` | Agent implemented a new feature | Feature delivery |
| `improvement` | Agent enhanced existing functionality | Incremental progress |
| `deployment_fixed` | Agent resolved deployment issue | Deployment success |
| `requested_deployment_fix` | Agent asks user to fix deployment | User action required |
| `integration_suggested` | Agent suggests integration options | Integration discovery |
| `testing_done` | Agent completed requested testing | Testing completion |
| `provided_credentials` | Agent provided credentials | Credential delivery |
| `requested_credentials` | Agent requested credentials from user | Credential needed |
| `asked_clarification` | Agent asked clarifying questions | Information gathering |
| `provided_info` | Agent provided information | Knowledge sharing |
| `reverted_changes` | Agent undid previous changes | Rollback action |

### Work Category & Subcategory

| Category | Description |
|----------|-------------|
| `design` | Visual/UI changes—styling, layout, appearance |
| `functionality` | Backend logic, API, database, validation, business rules |
| `integration` | 3rd party external services (see integration list below) |
| `deployment` | Build, hosting, environment, CI/CD, server config |
| `feature` | New distinct feature implementation |

**Integration Names (standardized):**

- **LLM/AI:** GPT-5.2, GPT-4o, GPT-4o-mini, Gemini-3-flash, Gemini-3-pro, Claude Sonnet 4.5, Claude Opus 4.5, Claude Haiku 4.5, DeepSeek-V3, DeepSeek-R1, OpenAI TTS, OpenAI STT, OpenAI Whisper, Gemini Image, GPT Image 1, Sora 2
- **Payment:** Stripe, Razorpay, PayPal
- **Communication:** Twilio SMS, Telegram, Slack, Discord, Gmail, Resend, SendGrid, WhatsApp, Baileys WhatsApp
- **Media:** YouTube, Twitter, Spotify, ElevenLabs, fal.ai, Cloudinary, TMDB
- **Data APIs:** Web Scraper, CoinGecko, Alpha Vantage, Football API, Open Weather
- **Google:** Google Calendar, Google Drive, Google Sheets, Google OAuth, Google Login
- **Infrastructure:** Firebase, Supabase Auth, Supabase Blob, Pinecone, WebSockets, MongoDB
- **Auth:** JWT, OAuth, SSO, Facebook Login, Emergent Auth

---

## Common Query Patterns

### Working with Array Columns

Since `user_intent`, `user_sentiment`, `work_category`, `work_subcategory`, and `progress_outcome` are arrays, use these patterns:

```sql
-- Check if array contains a specific value
WHERE 'req_feature' IN UNNEST(user_intent)

-- Check for multiple values (OR logic)
WHERE 'req_feature' IN UNNEST(user_intent) 
   OR 'req_improvement' IN UNNEST(user_intent)

-- Flatten array for aggregation
SELECT intent, COUNT(*) as cnt
FROM `agent_analytics.intent_classification_events`,
UNNEST(user_intent) as intent
GROUP BY intent

-- Count array length
SELECT ARRAY_LENGTH(user_intent) as intent_count
```

### Filtering by Date

```sql
-- Last 7 days
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)

-- Specific date range
WHERE event_timestamp BETWEEN '2025-01-01' AND '2025-01-15'

-- Today only
WHERE DATE(event_timestamp) = CURRENT_DATE()
```

---

## Analytics Use Cases

### 1. User Intent Distribution

```sql
-- What are users asking the agent to do?
SELECT 
  intent,
  COUNT(*) as occurrences,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as pct
FROM `agent_analytics.intent_classification_events`,
UNNEST(user_intent) as intent
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY intent
ORDER BY occurrences DESC
```

### 2. Sentiment Trends Over Time

```sql
-- Daily sentiment breakdown
SELECT 
  DATE(event_timestamp) as date,
  sentiment,
  COUNT(*) as count
FROM `agent_analytics.intent_classification_events`,
UNNEST(user_sentiment) as sentiment
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date, sentiment
ORDER BY date, count DESC
```

### 3. Bug Resolution Rate

```sql
-- Track bug reports vs confirmations of fixes
WITH bug_events AS (
  SELECT 
    DATE(event_timestamp) as date,
    CASE 
      WHEN 'req_new_bugfix' IN UNNEST(user_intent) OR 'req_same_bug_fix' IN UNNEST(user_intent) THEN 'bug_reported'
      WHEN 'ack_bug_fixed' IN UNNEST(user_intent) THEN 'bug_acknowledged_fixed'
    END as bug_status
  FROM `agent_analytics.intent_classification_events`
  WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    AND ('req_new_bugfix' IN UNNEST(user_intent) 
      OR 'req_same_bug_fix' IN UNNEST(user_intent)
      OR 'ack_bug_fixed' IN UNNEST(user_intent))
)
SELECT 
  date,
  COUNTIF(bug_status = 'bug_reported') as bugs_reported,
  COUNTIF(bug_status = 'bug_acknowledged_fixed') as bugs_ack_fixed
FROM bug_events
GROUP BY date
ORDER BY date
```

### 4. Feature Delivery Success

```sql
-- Features requested vs acknowledged as built
SELECT 
  DATE(event_timestamp) as date,
  COUNTIF('req_feature' IN UNNEST(user_intent)) as features_requested,
  COUNTIF('ack_feature_built' IN UNNEST(user_intent)) as features_acknowledged
FROM `agent_analytics.intent_classification_events`
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date
```

### 5. Integration Demand Analysis

```sql
-- Which integrations are users requesting/using?
SELECT 
  subcategory,
  COUNT(*) as mentions,
  COUNT(DISTINCT user_id) as unique_users
FROM `agent_analytics.intent_classification_events`,
UNNEST(work_subcategory) as subcategory
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND 'integration' IN UNNEST(work_category)
GROUP BY subcategory
ORDER BY mentions DESC
```

### 6. Frustrated User Detection

```sql
-- Users showing frustration signals
SELECT 
  user_id,
  COUNT(*) as frustrated_events,
  MAX(event_timestamp) as last_frustrated_at,
  ARRAY_AGG(DISTINCT intent IGNORE NULLS) as related_intents
FROM `agent_analytics.intent_classification_events`,
UNNEST(user_sentiment) as sentiment,
UNNEST(user_intent) as intent
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND sentiment = 'frustrated'
GROUP BY user_id
HAVING frustrated_events >= 2
ORDER BY frustrated_events DESC
```

### 7. Credit Concern Correlation

```sql
-- Are credit concerns correlated with high ECU consumption?
SELECT 
  CASE WHEN 'credit_concern' IN UNNEST(user_intent) THEN 'concern_raised' ELSE 'no_concern' END as credit_flag,
  AVG(trajectory_ecu_consumed) as avg_ecu,
  APPROX_QUANTILES(trajectory_ecu_consumed, 100)[OFFSET(50)] as median_ecu,
  COUNT(*) as events
FROM `agent_analytics.intent_classification_events`
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY credit_flag
```

### 8. Work Category Distribution

```sql
-- What types of work is the agent doing?
SELECT 
  category,
  COUNT(*) as events,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(AVG(trajectory_ecu_consumed), 2) as avg_ecu_consumed
FROM `agent_analytics.intent_classification_events`,
UNNEST(work_category) as category
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY category
ORDER BY events DESC
```

### 9. Agent Progress Outcomes

```sql
-- What outcomes is the agent delivering?
SELECT 
  outcome,
  COUNT(*) as occurrences,
  COUNT(DISTINCT job_id) as unique_sessions,
  ROUND(AVG(execution_time), 2) as avg_execution_time_sec
FROM `agent_analytics.intent_classification_events`,
UNNEST(progress_outcome) as outcome
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY outcome
ORDER BY occurrences DESC
```

### 10. Same Bug Recurrence Rate

```sql
-- How often do users re-report the same bug?
SELECT 
  DATE(event_timestamp) as date,
  COUNTIF('req_new_bugfix' IN UNNEST(user_intent)) as new_bugs,
  COUNTIF('req_same_bug_fix' IN UNNEST(user_intent)) as same_bug_rerequests,
  SAFE_DIVIDE(
    COUNTIF('req_same_bug_fix' IN UNNEST(user_intent)),
    COUNTIF('req_new_bugfix' IN UNNEST(user_intent)) + COUNTIF('req_same_bug_fix' IN UNNEST(user_intent))
  ) as recurrence_rate
FROM `agent_analytics.intent_classification_events`
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date
```

### 11. Session-Level Analysis

```sql
-- Analyze full sessions by job_id
SELECT 
  job_id,
  user_id,
  MIN(event_timestamp) as session_start,
  MAX(event_timestamp) as session_end,
  MAX(state_number) as total_states,
  MAX(trajectory_ecu_consumed) as total_ecu_consumed,
  ARRAY_AGG(DISTINCT intent IGNORE NULLS) as all_intents,
  ARRAY_AGG(DISTINCT sentiment IGNORE NULLS) as all_sentiments
FROM `agent_analytics.intent_classification_events`,
UNNEST(user_intent) as intent,
UNNEST(user_sentiment) as sentiment
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY job_id, user_id
ORDER BY total_ecu_consumed DESC
LIMIT 100
```

### 12. Confidence Score Analysis

```sql
-- How confident are classifications?
SELECT 
  DATE(event_timestamp) as date,
  ROUND(AVG(intent_confidence), 1) as avg_intent_confidence,
  ROUND(AVG(sentiment_confidence), 1) as avg_sentiment_confidence,
  COUNTIF(intent_confidence < 50) as low_intent_confidence_events,
  COUNTIF(sentiment_confidence < 50) as low_sentiment_confidence_events
FROM `agent_analytics.intent_classification_events`
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date
```

---

## Key Metrics Definitions

| Metric | Formula | Description |
|--------|---------|-------------|
| Bug Resolution Rate | `ack_bug_fixed / (req_new_bugfix + req_same_bug_fix)` | % of bugs that users confirm fixed |
| Bug Recurrence Rate | `req_same_bug_fix / (req_new_bugfix + req_same_bug_fix)` | % of bug requests that are re-reports |
| Feature Delivery Rate | `ack_feature_built / req_feature` | % of feature requests acknowledged as built |
| Sentiment Health Score | `(excited + satisfied) / total` | % of positive sentiment events |
| Frustration Rate | `frustrated / total` | % of frustrated events |
| Integration Demand | Count of `requested_integration` intents | Volume of integration requests |
| ECU Efficiency | `trajectory_ecu_consumed / state_number` | Average ECU per state transition |

---

## Tips & Best Practices

1. **Always filter by date** — Table is partitioned by `event_timestamp`
2. **Use UNNEST for arrays** — Required for filtering/aggregating array columns
3. **Job-level vs Event-level** — Use `job_id` for session analysis, `event_id` for event counts
4. **Confidence thresholds** — Consider filtering `intent_confidence >= 70` for high-quality analysis
5. **User-level deduplication** — Use `COUNT(DISTINCT user_id)` for user counts, not event counts
6. **Subcategory parsing** — Format is `"category: item1, item2 | category2: item3"` — may need string parsing

---

## Related Tables

| Table | Relationship | Use |
|-------|--------------|-----|
| `events.backend` | Source of raw events | Debugging, raw event inspection |
| User tables | Join on `user_id` | User attributes, subscription tier |
| Job/Session tables | Join on `job_id` | Full session context |

---

# Tool/Function Usage Analysis (Model/Prompt Eval)

## Overview

Redash Query #2375 ("Model/Prompt Eval") analyzes tool/function usage patterns across agent jobs. It measures **how often**, **how successfully**, and **when** each tool is invoked during agent execution.

**Source Tables:**
- `analytics.trajectories_full_view` — Individual agent steps/actions
- `analytics.jobs_full_view` — Job metadata

---

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | datetime | Start of analysis period |
| `end_date` | datetime | End of analysis period |
| `model_name` | multi-select | Filter by AI model (e.g., `claude-sonnet-4-5`) |
| `agent_name` | enum | Filter by agent type: `EmergentAssistant`, `SkilledAssistant`, `All` |
| `prompt_name` | multi-select | Filter by prompt template (e.g., `frontend_app_builder_cloud_v8`) |
| `min_calls` | number | Minimum tool calls threshold to include in results |
| `user_id_last_char` | multi-select | User sampling by last character of user_id (0-9, a-f) |

---

## Output Metrics

| Metric | Formula | Meaning |
|--------|---------|--------|
| `Tool` | function_name | Name of the tool/function |
| `Total_Jobs` | COUNT(DISTINCT job_id) | Total jobs in the filtered dataset |
| `Tool_Jobs` | COUNT(DISTINCT job_id) per tool | Jobs that invoked this tool |
| `Invoke_Pct` | Tool_Jobs / Total_Jobs × 100 | % of jobs that use this tool |
| `Total_Tool_Calls` | COUNT(*) per tool | Total invocations of this tool |
| `Tool_Freq_Per_Job` | Total_Tool_Calls / Tool_Jobs | Avg calls per job (when tool is used) |
| `Pct_Tool_Call` | tool_calls / total_calls × 100 | % of all tool calls that are this tool |
| `Success_Calls` | COUNT where env_success = 'true' | Successful tool executions |
| `Success_Pct` | Success_Calls / Total_Tool_Calls × 100 | Tool reliability/success rate |
| `P90_First_Invocation_Step` | AVG(first_step) P90 filtered | When in job lifecycle tool is first called |
| `P90_Invocation_Latency` | AVG(seconds to first use) P90 filtered | Time to first invocation |

---

## Query Architecture

### CTE Structure

```
base_trajectories          → Filter & join trajectories + jobs
       ↓
trajectories_with_steps    → Add step sequencing & job_start_time
       ↓
first_function_steps       → Find first occurrence per (job, function)
       ↓
time_to_first_occurrence   → Calculate latency to first invocation
       ↓
percentile_thresholds      → Compute P90 latency per tool
       ↓
avg_first_metrics          → P90-filtered averages for timing metrics
       ↓
model_totals + tool_stats  → Aggregate counts
       ↓
Final SELECT               → Join all metrics
```

### Key Design Decisions

1. **P90 filtering on latency** — Removes outlier jobs (long-running, stalled) from timing metrics
2. **env_success as string** — Compared to `'true'` not boolean
3. **7-day buffer on trajectory filter** — `TIMESTAMP_ADD(..., INTERVAL 7 DAY)` allows trajectories that extend beyond job end date
4. **Flexible multi-value filters** — Uses `STRPOS` pattern for comma-separated parameter lists

---

## Tool Interpretation Guide

### Core Editing Tools

| Tool | Purpose | Good Sign | Bad Sign |
|------|---------|-----------|----------|
| `search_replace` | Edit existing files | High success rate (>80%) | Low success rate, high frequency per job |
| `create_file` | Create new files | Increasing usage | Low success rate |
| `bulk_file_writer` | Write multiple files at once | Present and working | Missing/removed |
| `insert_text` | Insert text at position | High success rate | - |
| `view_file` | Read file contents | Increasing usage (better context) | - |
| `view_bulk` | Read multiple files | Increasing usage | - |

### Execution Tools

| Tool | Purpose | Good Sign | Bad Sign |
|------|---------|-----------|----------|
| `execute_bash` | Run shell commands | High success rate (>90%) | Decreasing success rate |
| `screenshot_tool` | Visual verification | High invoke % (>60%) | Decreasing usage |
| `PARALLEL_TOOLS` | Concurrent execution | Increasing usage (efficiency) | - |

### Agent/Reasoning Tools

| Tool | Purpose | Good Sign | Bad Sign |
|------|---------|-----------|----------|
| `think` | Agent reasoning/planning | High invoke % (>50%) | **Very low usage (<20%)** — agent not reasoning |
| `ask_human` | Request user clarification | Moderate usage | - |
| `finish` | Mark task complete | Increasing usage | - |

### Testing Tools

| Tool | Purpose | Good Sign | Bad Sign |
|------|---------|-----------|----------|
| `auto_frontend_testing_agent` | Automated frontend tests | Increasing usage | - |
| `vision_expert_agent` | Visual analysis | Increasing usage | - |
| `deep_testing_backend_v2` | Backend testing | Present | Missing |
| `lint_javascript` | JS linting | High success rate | Low success rate (<50%) |

### Exit/Failure Tools

| Tool | Purpose | Good Sign | Bad Sign |
|------|---------|-----------|----------|
| `exit_cost_credit_limit_reached` | Job hit credit limit | **Low invoke % (<30%)** | **High invoke % (>40%)** — users running out of credits |
| `exit_cost` | Cost-related exit | Low usage | Increasing usage |
| `ENV_CREATION_FAILED` | Environment failed to start | Near 0% | Any increase |
| `rollback` | Revert changes | Low usage | High usage |

---

## Period-over-Period Comparison Framework

### Comparison Methodology

1. Run query for Period 1 (e.g., Jan 1-7)
2. Run query for Period 2 (e.g., Jan 8-15)
3. Join results by `Tool` (function_name)
4. Calculate deltas for key metrics

### Key Metrics to Compare

| Metric | What Change Means |
|--------|------------------|
| `Δ Invoke_Pct` | Tool being used more/less frequently across jobs |
| `Δ Tool_Freq_Per_Job` | Tool being called more/less times when used |
| `Δ Success_Pct` | Reliability improved or degraded |
| `Δ P90_First_Invocation_Step` | Tool being invoked earlier/later in job lifecycle |

### Quality Assessment Rules

**Positive Changes (✅ Good):**
- `exit_cost_credit_limit_reached` invoke % **decreases**
- `screenshot_tool` invoke % **increases**
- `think` invoke % **increases**
- `auto_frontend_testing_agent` invoke % **increases**
- Any tool's `Success_Pct` **increases**
- `PARALLEL_TOOLS` invoke % **increases** (efficiency)
- `view_file` / `view_bulk` invoke % **increases** (better context)

**Negative Changes (❌ Bad):**
- `exit_cost_credit_limit_reached` invoke % **increases** (users hitting limits)
- `search_replace` success % **decreases** (editing reliability degraded)
- `execute_bash` success % **decreases** (command failures)
- `think` invoke % **decreases significantly** (less reasoning)
- `screenshot_tool` invoke % **decreases** (less visual verification)
- Core tool removed (e.g., `bulk_file_writer` disappears)

---

## Example Analysis: Jan 1-7 vs Jan 8-15 (frontend_app_builder_cloud_v8)

### Critical Findings

| Issue | Period 1 | Period 2 | Change | Verdict |
|-------|----------|----------|--------|--------|
| `exit_cost_credit_limit_reached` | 27.06% | 50.02% | +22.96% | 🔴 BAD — Users hitting limits 2x more |
| `search_replace` Success % | 82.77% | 61.75% | -21.02% | 🔴 BAD — Editing failing much more |
| `execute_bash` Success % | 93.69% | 83.24% | -10.45% | 🔴 BAD — Commands failing more |
| `think` Invoke % | 72.37% | 10.03% | -62.34% | 🔴 CRITICAL — Agent barely reasoning |
| `bulk_file_writer` | 73.08% | 0% | Removed | 🔴 CRITICAL — Major capability lost |
| `screenshot_tool` | 72.35% | 56.08% | -16.27% | 🔴 BAD — Less visual verification |

### Positive Changes

| Improvement | Period 1 | Period 2 | Change | Verdict |
|-------------|----------|----------|--------|--------|
| `PARALLEL_TOOLS` | 8.24% | 79.39% | +71.15% | ✅ More parallel execution |
| `view_bulk` | 3.03% | 52.16% | +49.13% | ✅ Better multi-file reading |
| `auto_frontend_testing_agent` | 12.85% | 59.51% | +46.66% | ✅ More automated testing |
| `view_file` | 23.03% | 54.15% | +31.12% | ✅ More file reading |
| `vision_expert_agent` | 10.31% | 28.35% | +18.04% | ✅ More visual analysis |

### Root Cause Hypothesis

The shift from `bulk_file_writer` + `search_replace` to `PARALLEL_TOOLS` + `view_bulk` suggests a major architectural change. However:
- `think` usage collapsed (72% → 10%) — agent reasoning far less
- `search_replace` success crashed (83% → 62%) — editing unreliable
- Credit exhaustion doubled — users can't complete tasks

**Recommendation:** Investigate why `search_replace` success rate dropped and why `think` usage collapsed.

---

## Joining with Intent Classification

To correlate tool failures with user experience:

```sql
-- Join tool metrics with user sentiment
SELECT 
  t.function_name,
  t.env_success,
  i.user_sentiment,
  COUNT(*) as events
FROM analytics.trajectories_full_view t
JOIN agent_analytics.intent_classification_events i
  ON t.job_id = i.job_id
  AND t.request_id = i.request_id
WHERE DATE(t.created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND DATE(i.event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY 1, 2, 3
```

**Use Cases:**
- Do `search_replace` failures correlate with `frustrated` sentiment?
- Does `exit_cost_credit_limit_reached` correlate with `credit_concern` intent?
- Do users acknowledge fixes (`ack_bug_fixed`) after `bug_fixed` progress outcomes?