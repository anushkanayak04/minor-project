# Bro Said He Knows A Spot. 

> **"Every real trip has a friend who already went. Post the spot, the stay, the ride, and the route — so the next traveler doesn't have to guess."**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-blue.svg)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-cyan.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](#)

---

## 📖 Table of Contents
1. [Overview & Vision](#-overview--vision)
2. [Key Modules & Capabilities](#-key-modules--capabilities)
   - [1. Cinematic Discovery Landing Page](#1-cinematic-discovery-landing-page)
   - [2. Instagram-Grade Social Feed Module](#2-instagram-grade-social-feed-module)
   - [3. Authentication & 1-Aadhaar Pro Verification](#3-authentication--1-aadhaar-pro-verification)
   - [4. AI Travel Itinerary Planner (Groq Llama 3.3)](#4-ai-travel-itinerary-planner-groq-llama-33)
   - [5. Tourism & Hazard Analytics Dashboard](#5-tourism--hazard-analytics-dashboard)
   - [6. Verified Business & Services Portal](#6-verified-business--services-portal)
   - [7. Real-Time SOS & Emergency Safety Suite](#7-real-time-sos--emergency-safety-suite)
3. [System Architecture](#-system-architecture)
4. [File & Directory Structure](#-file--directory-structure)
5. [Complete REST API Reference](#-complete-rest-api-reference)
6. [MongoDB Persistence](#mongodb-persistence)
7. [AI & Content Integrity System](#-ai--content-integrity-system)
8. [Installation & Getting Started](#-installation--getting-started)
9. [Configuration (`.env`)](#-configuration-env)
10. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🌟 Overview & Vision

**Bro Said He Knows A Spot** is a next-generation community travel discovery and safety ecosystem. Built to eliminate tourist traps, gatekeeping, and vacation guesswork, it provides travel explorers with:

- **Verified Spot Intelligence**: Real community uploads containing exact coordinates, honest stay pricing, verified transport phone numbers, and route breakdowns.
- **AI Content Integrity**: Real-time metadata inspection scanning for synthetic/generative artifacts (C2PA, Stable Diffusion, Midjourney) and promotional spam detection.
- **1-Aadhaar Creator Accountability**: Strict one-account-per-identity enforcement for Professional Creators, eliminating fake reviews and bot networks.
- **Autonomous Emergency Safety**: An always-on client-side emergency sensor engine capable of detecting voice panic phrases (*"help"*, *"emergency"*) and physical phone shakes, initiating automatic location dispatch and evidence recording.

---

## 🚀 Key Modules & Capabilities

### 1. Cinematic Discovery Landing Page
*Files: `index.html`, `styles.css`, `script.js`, `smooth-scroll.js`*
- **Parallax Storytelling**: Powered by Lenis Smooth Scroll v1.3.26, providing a multi-depth cinematic journey through mountain passes, suspension bridges, and bustling ancient bazaars.
- **Interactive Feature Carousel**: Horizontal interactive slider showcasing the 5 foundational pillars: *Post & Pin*, *Hotel & Residency*, *Transport*, *Route*, and *Food & Restaurant*.
- **Direct Navigation Hub**: Seamlessly links to the Social Feed, AI Planner, Tourism Dashboard, Business Directory, and Authentication portal.

### 2. Instagram-Grade Social Feed Module
*Files: `feed.html`, `feed.js`, `feed.css`*
- **24-Hour Stories Bar**:
  - Circular avatar rings with Instagram-style unread gradient borders.
  - Interactive story viewer with segmented progress bars, pause-on-hold, tap to advance/reverse, and full-screen immersive playback.
  - User story upload modal supporting local photo drag-and-drop or image URLs with custom spot tags and captions.
- **Multi-Step Spot Creation Wizard (4 Steps)**:
  - **Step 1: Visual Media & Live Filters** — Drag & drop image upload with instant client-side preview and live Instagram CSS filters (*Normal, Aden, Clarendon, Lark, Moon, Valencia, Sepia, Lo-Fi*).
  - **Step 2: Spot & Geolocation** — Spot title, region, tags, and detailed explorer experience description.
  - **Step 3: Residency & Homestay Intelligence** — Name, direct contact number, price per night, and transparent review.
  - **Step 4: Transit, Route & Food** — Transport type (scooter, train, 4x4, ferry), fare, exact route description, and local food recommendations.
- **Engagement & Social Features**:
  - **Double-Tap to Like**: Instant floating heart animation and counter synchronization.
  - **Bookmark & Collection**: Save posts to user's private collection with instant filter tab switching (*Saved Spots*).
  - **Instagram-Style Comments Modal**: 2-column modal previewing post media on the left and full scrollable comment threads with avatar timestamps, likes, and reply triggers on the right.
  - **Instagram Share Sheet**: Quick share to top contacts, 1-click URL copying, direct WhatsApp sharing, and native `navigator.share` integration.
  - **Notifications Flyout**: Slide-out panel detailing likes, comments, follows, and spot saves.
  - **Creator Profile Modal**: 3-column photo grid, follower/following counts, verification badge, and profile editing modal (bio, name, avatar).
  - **Direct Messages (DMs)**: Slide-out chat tray with active threads and real-time messaging.
  - **Explore 3x3 Grid**: Visual discovery wall for trending photography.

### 3. Authentication & 1-Aadhaar Pro Verification
*Files: `auth.html`, `auth.js`, `auth.css`*
- **Cinematic Split-Screen UI**: Side-by-side interactive smartphone mockup slider demonstrating actual platform capabilities.
- **Account Modes**:
  - **Normal Explorer**: Casual community member for browsing, saving, commenting, and planning.
  - **Professional Creator**: Verified local guide or travel photographer with public trust badges.
- **Strict 1-Aadhaar Anti-Sybil Verification**:
  - Requires 12-digit valid Indian Aadhaar number with regex validation.
  - Real-time backend uniqueness check (`db.users`): guarantees that one Aadhaar number can never be linked to more than one professional account.
  - Biometric face scan simulation with animated camera HUD before granting verified badge ☑️.
- **User Customization**: Notionist dynamic SVG avatars and travel vibe preference tags (*Hidden Gems, Backpacking, Photography, Roadtrips, Foodie*).

### 4. AI Travel Itinerary Planner (Groq Llama 3.3)
*Files: `planner.html`, `travelPlannerService.js`*
- **Personalized Itinerary Engine**: Configurable parameters for destination, starting city, trip duration (1-14 days), budget tier (*Budget, Moderate, Luxury*), vibe profile, pacing, and group dynamics.
- **Groq Cloud Integration**: Powered by Llama 3.3 70B Versatile for high-speed, day-by-day itinerary synthesis with morning, afternoon, and evening breakdowns.
- **Platform Cross-Referencing**: Automatically matches itineraries against real community posts stored in `MongoDB`, injecting verified hotel numbers and secret spots into the AI output.
- **Travel Toolkit**:
  - Comprehensive estimated budget breakdown (stay, transit, food, activities).
  - Dynamic interactive packing checklist with categorized toggles.
  - Printable / Export-to-PDF itinerary layout.

### 5. Tourism & Hazard Analytics Dashboard
*Files: `dashboard.html`, `dashboardService.js`*
- **Crowdsourced Hazard Intelligence**: Aggregates community flags, road warnings, and scam alerts directly from traveler uploads.
- **Canvas Heatmap Projection**: Projects GPS coordinates from traveler posts onto an interactive map calibrated to India's geographic bounds (`lat: 8-37°N, lon: 68-97°E`).
- **Real-Time Hazard Feed**: Filters hazards into *Traffic*, *Safety*, *Weather*, and *Scams* with urgency badges (*Critical, Warning, Low*).

### 6. Verified Business & Services Portal
*Files: `businesses.html`*
- **Local Commerce Hub**: Connects independent homestays, local taxi/bike operators, hiking guides, and regional restaurants directly with travelers.
- **Search & Filter Matrix**: Search across business titles, cities, specific dishes (e.g. *"Indori Poha"*, *"Thali"*), or price tiers.
- **Business Registration**: Self-serve portal for local merchants to upload rate cards, contact numbers, websites, and location tags.

### 7. Real-Time SOS & Emergency Safety Suite
*Files: `sosEngine.js`*
- **Safety Mode Sensor Toggle**: Activates persistent background sensor listeners.
- **Voice Panic Detection**: Web Speech API recognizes distress keywords (*"help"*, *"emergency"*, *"save me"*, *"sos"*, *"danger"*).
- **Violent Shake Detection**: DeviceMotionEvent calculates rapid acceleration deltas (>28 m/s²).
- **10-Second Auto-Countdown**: Displays a full-screen red warning modal allowing accidental alarms to be dismissed before emergency dispatch.
- **Autonomous Dispatch**: Captures high-accuracy GPS coordinates, records a 3-second ambient audio clip via MediaRecorder, and broadcasts to `/api/sos/trigger`.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSERS                                   |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  |    index.html      |  |     feed.html      |  |  planner.html / dashboard   |  |
|  |  (Cinematic Hero)  |  | (Instagram Social) |  |   (AI Planning & Safety)    |  |
|  +---------+----------+  +---------+----------+  +--------------+--------------+  |
+------------|-----------------------|----------------------------|-----------------+
             |                       | REST API                   |
             v                       v                            v
+-----------------------------------------------------------------------------------+
|                               NODE.JS EXPRESS SERVER                              |
|                                    (server.js)                                    |
|                                                                                   |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  |   Auth & Security  |  |  Social & Posts    |  |    AI Travel Planner        |  |
|  |  - Signup & Login  |  |  - Post Wizard     |  |    (travelPlannerService)   |  |
|  |  - 1-Aadhaar Check |  |  - Stories & DMs   |  |    - Groq Llama 3.3 Engine  |  |
|  +--------------------+  +---------+----------+  +--------------+--------------+  |
|                                    |                            |                 |
|  +--------------------+            v                            v                 |
|  | AI Content Audit   |  +--------------------+  +-----------------------------+  |
|  | (aiIntegrityService|  |  Business Portal   |  | Hazard & Dashboard Service  |  |
|  | - C2PA Metadata    |  |  - Verified Stays  |  |    (dashboardService)       |  |
|  | - Anti-Promote Bias|  |  - Service Vendors |  |    - Geographic Heatmaps    |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
+------------------------------------+----------------------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                               PERSISTENCE LAYER                                   |
|                                    (MongoDB)                                      |
|       [ users | posts | comments | likes | follows | stories | business data ]      |
+-----------------------------------------------------------------------------------+
```

---

## 📂 File & Directory Structure

```text
jhukl/
├── .env.example             # Template for API keys (e.g. GROQ_API_KEY)
├── .gitignore               # Ignored dependencies & environment configs
├── package.json             # Node dependencies and project metadata
├── server.js                # Express REST API server & database handlers
├── MongoDB                  # Authoritative MongoDB app-state snapshots in GridFS
│
├── aiIntegrityService.js    # AI content alteration & promotion bias engine
├── dashboardService.js      # Hazard aggregator & India coordinate heatmap mapper
├── travelPlannerService.js  # Groq Llama 3.3 itinerary synthesis & local fallback
├── sosEngine.js             # Client-side emergency speech, motion & GPS engine
│
├── index.html               # Cinematic landing page with Lenis smooth scroll
├── styles.css               # Landing page parallax & typography styling
├── script.js                # Sights slider animation & interaction controller
├── smooth-scroll.js         # Lenis smooth-scroll initialization
│
├── auth.html                # Split-screen login, signup & Aadhaar verification
├── auth.css                 # Auth styles, phone slider & verification HUD
├── auth.js                  # Authentication logic, form validation & session
│
├── feed.html                # Instagram-grade social feed & spot discovery UI
├── feed.css                 # Feed layouts, story rings, modals & dark theme
├── feed.js                  # Feed controller, stories, comments, DMs, wizard
│
├── planner.html             # AI Travel Itinerary generator UI
├── dashboard.html           # Tourism & Hazard Analytics Dashboard UI
├── businesses.html          # Verified Business & Services directory UI
│
├── fonts/                   # Bundled custom typography assets
└── node_modules/            # Installed npm packages
```

---

## 📡 Complete REST API Reference

The backend operates on `http://localhost:3000` (or configured port). All endpoints communicate via JSON.

### Authentication & Profiles
| Method | Endpoint | Description | Request Body Payload |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Create explorer or pro account | `{ name, username, email, password, role, avatar, bio, vibes }` |
| `POST` | `/api/auth/login` | Authenticate existing user | `{ username, password }` |
| `POST` | `/api/auth/verify-professional` | Verify Pro status via Aadhaar | `{ user_id, username, aadhaar_no, face_scan_verified }` |
| `GET` | `/api/users/suggestions` | Fetch suggested creators to follow | Query: `?user_id=<id>` |
| `POST` | `/api/users/follow` | Toggle follow status | `{ follower_id, following_username }` |

### Social Posts & Content
| Method | Endpoint | Description | Request Body Payload |
|---|---|---|---|
| `GET` | `/api/posts` | Fetch feed posts (chronological) | Query: `?user_id=<id>` |
| `POST` | `/api/posts` | Create new spot post (with AI audit) | `{ user_id, username, location, media, description, hotel_*, transport_*, food_* }` |
| `POST` | `/api/posts/:id/like` | Like or unlike a spot post | `{ user_id }` |
| `POST` | `/api/posts/:id/save` | Bookmark post to collection | `{ user_id }` |
| `GET` | `/api/posts/saved` | Fetch bookmarked spots for user | Query: `?user_id=<id>` |
| `POST` | `/api/posts/:id/comment` | Add comment to post | `{ username, text }` |

### Stories & Direct Messages
| Method | Endpoint | Description | Request Body Payload |
|---|---|---|---|
| `GET` | `/api/stories` | Retrieve active 24h stories | — |
| `POST` | `/api/stories` | Publish a new photo story | `{ user_id, username, name, avatar, spot, media, caption }` |

### AI Travel Planner & Groq
| Method | Endpoint | Description | Request Body Payload |
|---|---|---|---|
| `POST` | `/api/ai-planner` | Generate structured AI itinerary | `{ destination, startingCity, days, budget, vibe, pace, travelers }` |
| `GET` | `/api/destinations` | List destinations with active posts | — |
| `GET` | `/api/config/groq-key` | Check if Groq API key is set | — |
| `POST` | `/api/config/groq-key` | Save Groq API key securely to `.env` | `{ apiKey }` |

### Hazard Dashboard, Businesses & SOS
| Method | Endpoint | Description | Request Body Payload |
|---|---|---|---|
| `POST` | `/api/dashboard/analyze-place` | Compute hazard flags & heatmap | `{ location }` |
| `GET` | `/api/businesses` | List verified businesses | Query: `?category=&location=&search=` |
| `POST` | `/api/businesses` | Register a new business | `{ name, category, location, phone, website, price_range, image, description, menu_items }` |
| `DELETE` | `/api/businesses/:id` | Remove a business listing | — |
| `POST` | `/api/sos/trigger` | Broadcast emergency distress alert | `{ username, location, coordinates, dangerScore, timestamp }` |

---

## MongoDB Persistence

MongoDB is the sole persistent store. The server writes the full application state to a compressed GridFS snapshot so uploaded media can exceed MongoDB's 16 MB BSON-document limit. GridFS handles chunking and reassembly for large files ([MongoDB GridFS documentation](https://www.mongodb.com/docs/drivers/node/current/crud/gridfs/)). The latest snapshot pointer is stored in the `app_state` collection. No server-side JSON fallback is used.

Set `MONGODB_URI` and `MONGODB_DB_NAME` in the local `.env` before starting the server. If the URI is missing or MongoDB cannot connect, the server does not start and does not save data locally.

---

## 🛡️ AI & Content Integrity System

To guarantee reliable, authentic travel recommendations, every submission passes through the **AI Integrity Engine** (`aiIntegrityService.js`):

1. **Synthetic Media Detection**:
   - Analyzes embedded metadata, EXIF streams, and C2PA manifests for signatures of known generative engines (*DALL-E, Midjourney, Stable Diffusion, GenerativeAI*).
   - If generative markers are identified, the post receives an explicit **"AI Alteration Detected"** flag with confidence rating.
2. **Anti-Promotion & Astroturfing Scanner**:
   - Inspects review sentiment for aggressive promotional phrasing (*"best ever 100% guaranteed"*, *"must visit 10/10 perfect"*).
   - Audits the author's historical posts in `MongoDB` to detect repetitive shilling of the same commercial business.
   - Automatically tags commercial partnerships (*"sponsored"*, *"collaboration"*).
3. **Trust Score Calculation**:
   - Starts at 100% baseline.
   - Deducts points for synthetic generation (-35%), repetitive entity promotion (-25%), or undeclared sponsorship (-5%).
   - Awards verified badge credentials to high-scoring authentic posts.

---

## 💻 Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- Modern web browser (Chrome, Edge, Firefox, or Safari) with Web Speech & Geolocation permissions enabled

### Quick Start
```bash
# 1. Clone or navigate to the project directory
cd jhukl

# 2. Install dependencies
npm install

# 3. Start the application server
npm start
```

The Express server will start on port `3000`:
- **Landing Page**: `http://localhost:3000/index.html`
- **Social Feed**: `http://localhost:3000/feed.html`
- **Sign Up / Login**: `http://localhost:3000/auth.html`
- **AI Travel Planner**: `http://localhost:3000/planner.html`
- **Safety Dashboard**: `http://localhost:3000/dashboard.html`
- **Business Portal**: `http://localhost:3000/businesses.html`

---

## ⚙️ Configuration (`.env`)

Create a `.env` file in the project root from `.env.example`. MongoDB settings are required for the server to start; add the connection URI locally and keep it out of source control:

```env
# Port for the Node.js Express server (default: 3000)
PORT=3000

# Groq Cloud API Key (Get free key at https://console.groq.com)
GROQ_API_KEY="gsk_your_actual_groq_api_key_here"

# Signup email verification through Gmail SMTP (no custom domain required)
GMAIL_USER="youraccount@gmail.com"
GMAIL_APP_PASSWORD="your-16-character-app-password"

# MongoDB connection (required; no local JSON fallback)
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-host>/?retryWrites=true&w=majority"
MONGODB_DB_NAME="know_a_spot"
```

> **Note**: If `GROQ_API_KEY` is not provided, the AI Planner automatically switches to the built-in offline intelligence engine, generating high-fidelity itineraries from cached travel patterns and platform community spots without crashing.

Signup verification sends a six-digit code to the address entered in the signup form. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD`, then restart the server. Create a Google App Password after enabling 2-Step Verification; Google explains the requirements in [Gmail Help](https://support.google.com/mail/answer/185833). Use an App Password, never your regular Gmail password. Signup remains blocked until email delivery and code verification both succeed.

Resend can also be used by setting `RESEND_API_KEY` and a `RESEND_FROM_EMAIL` address on a verified domain. Its test sender cannot deliver to arbitrary recipients.

---

## ❓ Troubleshooting & FAQ

#### Q: How do I test the SOS emergency engine?
> Click the floating **🟢 SAFETY MODE ACTIVE** pill in the lower right corner of the screen. Speak *"emergency"* or *"help"* into your microphone, or trigger the red **SOS** button. A 10-second warning countdown modal will appear before triggering broadcast dispatch.

#### Q: How do I switch accounts?
> Click the **Switch** link in the right sidebar of `feed.html`, or navigate directly to `auth.html` to log in with different credentials.

#### Q: What happens if an image is uploaded without internet connectivity?
> The post creation wizard encodes images directly into base64 Data URLs and sends them to MongoDB. Publishing requires an active server and database connection; failed uploads are not stored as local offline posts.

---

## 📜 License & Credits

- **Repository**: [bro-said-he-knows-a-spot-](https://github.com/om-tiwari02/bro-said-he-knows-a-spot-)
- **Author**: Om Tiwari & Community Contributors
- **License**: MIT
