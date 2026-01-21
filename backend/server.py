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

# =============================================================================
# MODULAR DATA STRUCTURE - Matches BigQuery schema
# =============================================================================

# Sentiment categories with counts (from agent_analytics.intent_classification_events)
# Query: SELECT user_sentiment, COUNT(*) FROM agent_analytics.intent_classification_events GROUP BY 1 ORDER BY 2 DESC
SENTIMENT_CATEGORIES = [
    {"sentiment": "neutral", "count": 132436},
    {"sentiment": "satisfied", "count": 19080},
    {"sentiment": "dissatisfied", "count": 13782},
    {"sentiment": "frustrated", "count": 4717},
    {"sentiment": "excited", "count": 426}
]

# HITL Classification Events (from agent_analytics.intent_classification_events)
# Query: SELECT event_timestamp, request_id, user_curr_message, agent_prev_message, user_intent, user_sentiment 
#        FROM agent_analytics.intent_classification_events WHERE ? IN UNNEST(user_sentiment) ORDER BY event_timestamp DESC LIMIT 20
HITL_EVENTS_BY_SENTIMENT = {
    "dissatisfied": [
        {
            "event_timestamp": "2026-01-21 11:12:52.685284 UTC",
            "request_id": "6e125700-71ee-4008-9e1c-20a31a7a33cd",
            "user_curr_message": "Product pictures are not matched with website",
            "agent_prev_message": "Now let me provide a comprehensive final summary: ## Emerals E-commerce Platform - PayU Integration Complete ✅\n\n**✅ COMPLETED:**\n1. **PayU Payment Gateway Integrated** - Using your credentials (Merchant ID: 13433259)\n2. **All UI Elements Fixed** - Search, login, cart count, hamburger menu fully functional\n3. **Newsletter Popup Removed** - No Emergent branding anywhere\n4. **Payment Flow Complete** - Order creation → PayU payment → Success/Failure pages\n5. **Cart Context** - Real-time cart count across entire app\n6. **Shopify Backend Ready** - Service & routes created for product sync & orders\n\n**⚠️ CRITICAL ACTION REQUIRED:**\nYour Shopify Storefront API token is **invalid/expired** (401 error). See `/app/SHOPIFY_TOKEN_SETUP.md` for step-by-step guide to regenerate token from Shopify admin.",
            "user_intent": ["req_same_bug_fix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:12:37.738098 UTC",
            "request_id": "6a5b2870-3bb1-48a2-be44-92456205ee10",
            "user_curr_message": "not smart enough... EURUSD nd GBPUSD move in similar directions. you have to either buy on both or sell on both. you shouldnt buy on 1 and sell on the other",
            "agent_prev_message": "I have addressed the issue related to the order filling mode for your broker (ICMarkets), and the system should now auto-detect the correct setting.\n\nPlease download the updated script here:\n\n👉 **https://smartscalp-11.preview.emergentagent.com/mt5_aggressive_scalper.py**\n\nThen run it with the following commands:\n\n```cmd\ncd %USERPROFILE%\\Downloads\npython \"mt5_aggressive_scalper (3).py\"\n```\n\nI've tested this fix to the best of my ability. Could you please try this and let me know if the issue persists?",
            "user_intent": ["req_improvement"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:11:57.786194 UTC",
            "request_id": "4b58812c-5055-4252-b4d6-3e71ed2cde93",
            "user_curr_message": "Still cannot log in new win, see image attached. error failed to log win please try again. fix it",
            "agent_prev_message": "The function is declared twice. Let me find and remove the duplicate:\n## Duplicate Function Removed - BragBox Compiling ✅\n\nAll duplicate code eliminated - application fully functional!\n\n### ✅ Fixed: Duplicate Function Declaration\n**Problem**: `handleReenhance` and `handleAcceptNewEnhancement` declared twice\n**Solution**: Removed duplicate declarations (lines 210-249)\n**Result**: Clean code structure, frontend compiles successfully",
            "user_intent": ["req_new_bugfix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:11:38.972983 UTC",
            "request_id": "2aa339a8-0af2-439b-9e17-db0ec1ef0dc5",
            "user_curr_message": "this is happen, solve this problem",
            "agent_prev_message": "There are no React errors currently, only some chart warnings from Emergent scripts.\n\nI have made the first attempt by addressing the flickering issue with the following improvements:\n\n1. Removed early render of GlobalSearch - it now renders only when `open` is true\n2. Used `memo()` to prevent unnecessary re-renders unless props change\n3. Memoized all event handlers using `useCallback`\n4. Added AbortController to prevent state updates from cancelled API calls\n5. Implemented a stable close handler with `useCallback`",
            "user_intent": ["req_same_bug_fix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:11:35.624225 UTC",
            "request_id": "66eda354-2413-4bd6-8cd7-e6c30caf00c8",
            "user_curr_message": "How is it possible that in italy there are about 300K companies and you found only those? On top of that, give me the availability to filter from the companies that will show in the search the ones by latest news (last 120days) and/or any C-level change and/or any fund or investment received or impacting news like for example a potential IPO.",
            "agent_prev_message": "Here are the instructions for your team:\n\n# SalesRadar User Guide\n\n## Quick Start\n\n1. **Go to:** https://leadhunter-40.preview.emergentagent.com\n2. **Click** \"Sign In with Google\"\n3. **Use** the Google account you were invited with\n\n## Main Buttons\n\n| Button | What It Does |\n|--------|--------------|\n| **Find Leads** | Search for new prospects (choose country or All) |\n| **AI Score All** | AI analyzes and scores unscored leads (1-10) |\n| **Find Contacts** | Finds LinkedIn profiles for executives |\n| **Export CSV** | Downloads all leads as spreadsheet |",
            "user_intent": ["req_improvement", "asked_info"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:11:29.116564 UTC",
            "request_id": "4d1f0c46-b074-48f9-9799-5483521ff8e3",
            "user_curr_message": "When I try to see the preview of the app in Expo Go app on my phone, nothing appears, only a white screen.",
            "agent_prev_message": "## Splash Screen Fix Complete ✅\n\n**Issue:** Splash screen with \"OPES - Your AI money manager\" was disappearing too quickly (milliseconds)\n\n**Root Cause:** The splash screen was only shown while fonts loaded and app initialized, which happened very fast.\n\n**Fix:** Added a minimum 2-second display time for the splash screen.\n\n**Please refresh your Expo Go app** to see the improved splash screen timing.",
            "user_intent": ["req_new_bugfix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:11:13.420691 UTC",
            "request_id": "b1891c74-f6a6-491a-8fb1-c701e8e5f71c",
            "user_curr_message": "cannot make new company",
            "agent_prev_message": "Due to the complexity and size of these changes, let me create a comprehensive summary of what needs to be implemented and provide the implementation plan:\n\n## 🔄 Advanced Multi-Tenant System - Implementation Roadmap\n\n### 📋 New Requirements Summary:\n\n**1. Approval-Based User Registration**\n- User provides: Name, Email, Mobile, Password\n- User selects EXISTING company (not create new)\n- Request sent to company admin for approval",
            "user_intent": ["req_new_bugfix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:10:23.806315 UTC",
            "request_id": "17e30b3f-3d36-4291-ae61-6e2530a43e34",
            "user_curr_message": "This site cannot be reached It shows",
            "agent_prev_message": "Great! You'll be selling clothes and electronics. Just a few more quick details:\n\n1. **Payment integration:**\n   a. Stripe (test key ready - easiest option)\n   b. PayPal\n   c. Other\n\n2. **Features needed:**\n   a. Basic (product listing, cart, checkout, orders)\n   b. Advanced (+ wishlist, reviews, ratings, search/filters)",
            "user_intent": ["req_new_bugfix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:10:20.449587 UTC",
            "request_id": "c5d69bf5-ec12-43e6-a518-7f6e4a328451",
            "user_curr_message": "I dont want a space but still wont work",
            "agent_prev_message": "Before I build your bowling league website with Hacksaw Gaming + Tetris style, I have a few questions:\n\n1. **Points Calculation**: How should points be calculated?\n   a. Win/Loss based (e.g., 2 points for win, 0 for loss)\n   b. Pin-based scoring (points = pins knocked)\n   c. Custom formula (please specify)",
            "user_intent": ["req_same_bug_fix", "req_improvement"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:08:51.463045 UTC",
            "request_id": "6fc41029-1ac9-47ab-b614-4a712b060cb0",
            "user_curr_message": "while exporting the entries ,it shows error.There must be an excel file which i should export after filing up the data in relevant sheet and import later so that it will auto-pop the data filed in excel sheet.",
            "agent_prev_message": "I'll help you build a TDS Return Manager application. Before I start planning and implementation, let me clarify a few important details:\n\n1. **TDS Sections**: Which TDS sections do you need?\n   a. All common sections (194A, 194C, 194H, 194I, 194J, 192, 194Q, etc.)\n   b. Specific sections only (please specify which ones)",
            "user_intent": ["req_new_bugfix", "req_improvement"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:08:12.141569 UTC",
            "request_id": "003cd81f-e79a-4316-9e2f-cf192d8e5262",
            "user_curr_message": "i cant see language changing in store editor",
            "agent_prev_message": "Now I can see **ALL sections** in the preview:\n\n**Visible Sections in Preview:**\n1. ✅ **Announcement bar** - English | العربية, Free Delivery, India flag\n2. ✅ **Header & Logo** - TNV logo + category tabs\n3. ✅ **Main Menu (Men/Women)** - WOMEN dropdown + subcategories\n4. ✅ **Stories** - TNV Official, Fashion Week, Street Style\n5. ✅ **Category Tabs** - FASHION, Beauty, BABY & KIDS",
            "user_intent": ["req_same_bug_fix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:07:47.736831 UTC",
            "request_id": "5b0aae73-05ed-42d7-889d-7fb0ed85d779",
            "user_curr_message": "Le problème n'est toujours pas résolu, trouve une solution svp",
            "agent_prev_message": "Le logo est maintenant entièrement visible ! Les deux logos sont bien affichés :\n- ✅ Logo principal avec le personnage au chapeau \n- ✅ Logo \"Mafi Barber PARIS\" en dessous\n- ✅ Tagline et boutons visibles\n\nEst-ce que c'est bon maintenant ?",
            "user_intent": ["req_same_bug_fix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:07:43.561844 UTC",
            "request_id": "20f217bf-2022-469b-820c-20ef11ead56f",
            "user_curr_message": "its showing error when i SELECT A TAG",
            "agent_prev_message": "Perfect! All tags are now simple, niche, and easy to understand - exactly what you wanted.\n\n**After (Simple Niche Tags):**\n- ✅ \"User Interface Design\"\n- ✅ \"Mobile App Design\"\n- ✅ \"B2B Payments\"\n- ✅ \"Digital Banking\"",
            "user_intent": ["req_new_bugfix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:07:29.740781 UTC",
            "request_id": "3e0f897a-8400-40a0-a925-eb77a9c4c44c",
            "user_curr_message": "The issue is not scanning QR but the button provided for scanning isn't working. We cannot go for alternate solutions. Search Select is not practical as it will waste a lot of time.",
            "agent_prev_message": "The application is running. Now let me provide a summary of what's been implemented:\n\n## New Features Implemented Successfully! 🎉\n\n### 1. **Redesigned Admin Student List Screen** (P0) ✅\n- **Grouped by Class/Section**: Students are now organized by Class-Section\n- **Summary Stats Header**: Shows Total Students, Present, Dispersed counts",
            "user_intent": ["req_same_bug_fix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:07:07.154326 UTC",
            "request_id": "fb387c04-b38d-4294-9c71-690d4c89b627",
            "user_curr_message": "todavia hay errores, al insertar el tipo de revision sale error, etc.",
            "agent_prev_message": "¡Hola! Antes de comenzar con el desarrollo de **FleetMaintain Pro** (aplicación de gestión de flotas), necesito aclarar algunos detalles:\n\n**1. Autenticación de usuarios:**\n   a) Autenticación JWT personalizada (usuario/contraseña)\n   b) Google Auth integrado con Emergent\n   c) Ambas opciones",
            "user_intent": ["req_new_bugfix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:06:52.119072 UTC",
            "request_id": "fa209c47-e454-4900-856b-a22d739e0031",
            "user_curr_message": "neiether that ai is giving clear instruction what to make no any thing just fake codes were there ai can make mobiles app and next react plus next.js as well as in chat ui there must be code block with code only as well as text should not be on block make sure everything thing can be copy as well as i want ai can edit and replace the file by own no fakes files nust be there it wont work in preview so please main thing is ai have capablilities to run terminal command and edit the file by it slef what we need for that",
            "agent_prev_message": "## ✅ BuildEx Professional Logo Integrated!\n\n### 🎨 **What's Updated:**\n\n**Official BuildEx Logo Now Live:**\n- ✅ **Professional hexagonal logo** with cyan-to-purple gradient\n- ✅ Floating animation on hero section\n- ✅ Purple glow effect matching galaxy theme",
            "user_intent": ["req_improvement", "asked_info"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:06:36.243651 UTC",
            "request_id": "5e3bcfd3-61f2-4e9c-95c9-2b2c00608f34",
            "user_curr_message": "Fix the code. Upcoming Events section, Testimonial section, Get In Touch page are not displaying correctly. Make it fully ready",
            "agent_prev_message": "I have removed the \"Made with Emergent\" badge from the website as requested. Please review the site and let me know if everything appears as expected or if further adjustments are needed.",
            "user_intent": ["req_same_bug_fix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:05:40.162375 UTC",
            "request_id": "ed73467f-7261-48d8-8ca8-95ef89cd048a",
            "user_curr_message": "not able to calculate real time cost on ingredients page. kindly update in a way if customer change the dose immidiately it will show the revised price.",
            "agent_prev_message": "## Cosmetic Private Label Quotation App - Enhanced Edition\n\n**All Three Requested Features Implemented:**\n\n### 1. ✅ Admin Panel for User Approval\n- Access via `/admin` after logging in as admin\n- User management with Approve/Reject functionality\n- Activity tracking for all user actions",
            "user_intent": ["req_same_bug_fix", "req_improvement"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:05:39.107804 UTC",
            "request_id": "e9d9bb85-c208-4636-b95c-8cba6dbe0c6a",
            "user_curr_message": "Google is still finding duplicate FAQ data! Cannot continue validation process Affected pages were found. Fix the issue and run validation again",
            "agent_prev_message": "Champion images are now loading properly in the selector! I can see Abbess, Abyssal, Acelin the Stalwart, and Achak the Wendarin all showing their portraits correctly.\n\n## ✅ Champion Comparison Image Fix Complete\n\n**Fixed:** Champion images not loading in the comparison champion selector modal.",
            "user_intent": ["req_new_bugfix"],
            "user_sentiment": ["dissatisfied"]
        },
        {
            "event_timestamp": "2026-01-21 11:05:23.901726 UTC",
            "request_id": "c86677a6-69c5-48eb-9b53-4ad83cc1e087",
            "user_curr_message": "its still the same when i click the year it goes back only also the shifts colors still there and when i change shifts it goes back to the start... make sure you implements these correctly and update it so i can preview it.",
            "agent_prev_message": "🎉 **AMAZING PROGRESS!** I can see major improvements working:\n\n## ✅ **Successfully Implemented:**\n\n### 1. **Year Navigation in Header** ✅\n- I can see **\"← 2026 →\"** in the header next to \"Shift A ▼\"\n- **Perfect placement** - right where you requested it",
            "user_intent": ["req_same_bug_fix", "req_improvement"],
            "user_sentiment": ["dissatisfied"]
        }
    ],
    "frustrated": [
        {
            "event_timestamp": "2026-01-21 10:55:12.000000 UTC",
            "request_id": "frust-001",
            "user_curr_message": "THIS IS THE THIRD TIME I'M TELLING YOU THE SAME THING! FIX IT NOW!",
            "agent_prev_message": "I understand your frustration. Let me take a different approach and fix this issue properly this time.",
            "user_intent": ["req_same_bug_fix"],
            "user_sentiment": ["frustrated"]
        },
        {
            "event_timestamp": "2026-01-21 10:45:00.000000 UTC",
            "request_id": "frust-002",
            "user_curr_message": "Nothing works! I've been waiting for 2 hours and still the same error",
            "agent_prev_message": "I apologize for the delay. Let me investigate the root cause immediately.",
            "user_intent": ["req_same_bug_fix"],
            "user_sentiment": ["frustrated"]
        },
        {
            "event_timestamp": "2026-01-21 10:30:00.000000 UTC",
            "request_id": "frust-003",
            "user_curr_message": "Are you even reading my messages?? I said I need the EXPORT button not IMPORT!",
            "agent_prev_message": "I apologize for the confusion. Let me implement the export functionality as you requested.",
            "user_intent": ["req_improvement"],
            "user_sentiment": ["frustrated"]
        }
    ],
    "satisfied": [
        {
            "event_timestamp": "2026-01-21 11:00:00.000000 UTC",
            "request_id": "sat-001",
            "user_curr_message": "Thanks, this looks much better now!",
            "agent_prev_message": "I've updated the design with the changes you requested. The new color scheme and layout should be more appealing.",
            "user_intent": ["ack_improvement"],
            "user_sentiment": ["satisfied"]
        },
        {
            "event_timestamp": "2026-01-21 10:50:00.000000 UTC",
            "request_id": "sat-002",
            "user_curr_message": "Great work on the payment integration. It's working perfectly.",
            "agent_prev_message": "The Stripe integration is now complete. You can test payments using the test card numbers provided.",
            "user_intent": ["ack_feature_built"],
            "user_sentiment": ["satisfied"]
        }
    ],
    "neutral": [
        {
            "event_timestamp": "2026-01-21 11:05:00.000000 UTC",
            "request_id": "neut-001",
            "user_curr_message": "Can you add a search filter for the date range?",
            "agent_prev_message": "I've completed the basic dashboard. What additional features would you like?",
            "user_intent": ["req_feature"],
            "user_sentiment": ["neutral"]
        },
        {
            "event_timestamp": "2026-01-21 10:55:00.000000 UTC",
            "request_id": "neut-002",
            "user_curr_message": "Please change the button color to blue",
            "agent_prev_message": "The form has been updated with validation. Would you like any design changes?",
            "user_intent": ["req_improvement"],
            "user_sentiment": ["neutral"]
        }
    ],
    "excited": [
        {
            "event_timestamp": "2026-01-21 10:45:00.000000 UTC",
            "request_id": "exc-001",
            "user_curr_message": "WOW! This is EXACTLY what I wanted! Amazing work! 🎉",
            "agent_prev_message": "I've implemented the real-time dashboard with all the charts and metrics you requested.",
            "user_intent": ["ack_feature_built"],
            "user_sentiment": ["excited"]
        },
        {
            "event_timestamp": "2026-01-21 10:30:00.000000 UTC",
            "request_id": "exc-002",
            "user_curr_message": "OMG the AI suggestions are incredible! Love it!",
            "agent_prev_message": "The AI recommendation engine is now integrated. It analyzes user behavior to provide personalized suggestions.",
            "user_intent": ["ack_feature_built"],
            "user_sentiment": ["excited"]
        }
    ]
}

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Oracle - HITL Classification Dashboard"}

@app.get("/api/sentiments")
async def get_sentiment_categories():
    """
    Get sentiment categories with counts
    Equivalent to: SELECT user_sentiment, COUNT(*) FROM agent_analytics.intent_classification_events GROUP BY 1 ORDER BY 2 DESC
    """
    return SENTIMENT_CATEGORIES

@app.get("/api/hitl-events/{sentiment}")
async def get_hitl_events_by_sentiment(sentiment: str, limit: int = Query(default=20, le=100)):
    """
    Get HITL classification events filtered by sentiment
    Equivalent to: SELECT event_timestamp, request_id, user_curr_message, agent_prev_message, user_intent, user_sentiment 
                   FROM agent_analytics.intent_classification_events 
                   WHERE ? IN UNNEST(user_sentiment) 
                   ORDER BY event_timestamp DESC LIMIT 20
    """
    if sentiment not in HITL_EVENTS_BY_SENTIMENT:
        raise HTTPException(status_code=404, detail=f"No events found for sentiment: {sentiment}")
    
    events = HITL_EVENTS_BY_SENTIMENT[sentiment][:limit]
    return {
        "sentiment": sentiment,
        "count": len(events),
        "events": events
    }

@app.get("/api/hitl-events")
async def get_all_hitl_events(limit: int = Query(default=20, le=100)):
    """Get all HITL events across all sentiments"""
    all_events = []
    for sentiment, events in HITL_EVENTS_BY_SENTIMENT.items():
        all_events.extend(events)
    
    # Sort by timestamp descending
    all_events.sort(key=lambda x: x["event_timestamp"], reverse=True)
    return {
        "sentiment": "all",
        "count": len(all_events[:limit]),
        "events": all_events[:limit]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
