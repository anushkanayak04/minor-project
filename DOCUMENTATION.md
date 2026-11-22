# Technical Documentation & Engineering Specifications

**Project**: Bro Said He Knows A Spot (JHUKL)  
**Version**: 1.0.0  
**Target Environment**: Node.js v18+ | Express 5.x | Modern Standards-Compliant Browsers  

---

## 1. System Engineering & Architecture Overview

The system follows a lightweight, reactive Client-Server model with offline-first client resilience and RESTful backend synchronization.

```
+---------------------------------------------------------------------------------------------------+
|                                          FRONTEND ARCHITECTURE                                    |
|                                                                                                   |
|  +-------------------------+  +--------------------------+  +----------------------------------+  |
|  |     State Management    |  |     Hardware Sensors     |  |         UI Presentation          |  |
|  |  - localStorage Sync    |  |  - Web Speech API        |  |  - Tailwind CSS + CSS Variables  |  |
|  |  - User Session Tokens  |  |  - DeviceMotionEvent     |  |  - Obsidian Glassmorphism Panels |  |
|  |  - In-Memory Post Cache |  |  - HTML5 Geolocation     |  |  - Responsive Mobile Touch Layer |  |
|  |  - Segmented Timer Bars |  |  - MediaRecorder API     |  |  - Lenis Smooth Parallax Scroll  |  |
|  +------------+------------+  +-------------+------------+  +----------------+-----------------+  |
+---------------|-----------------------------|--------------------------------|--------------------+
                |                             |                                |
                +-----------------------------+--------------------------------+
                                              |
                                     HTTP / JSON REST API
                                              |
                                              v
+---------------------------------------------------------------------------------------------------+
|                                          BACKEND ARCHITECTURE                                     |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                                  Express 5.x REST Routing Layer                             |  |
|  |     /api/auth/*  |  /api/posts/*  |  /api/stories  |  /api/ai-planner  |  /api/businesses   |  |
|  +-----------------------------------------------+---------------------------------------------+  |
|                                                  |                                                |
|       +------------------------------------------+----------------------------------+             |
|       v                                          v                                  v             |
|  +--------------------------+  +------------------------------------+  +-----------------------+  |
|  |   AI Integrity Service   |  |      Travel Planner Engine         |  |   Hazard & Analytics  |  |
|  | - C2PA Metadata Scanner  |  | - Groq Llama 3.3 Versatile (Cloud) |  | - India Coord Mapper  |  |
|  | - Anti-Promotion Heuristics | - Fallback Heuristic Planner       |  | - Risk Flag Aggregator|  |
|  +------------+-------------+  +-----------------+------------------+  +-----------+-----------+  |
|               |                                  |                                 |              |
|               +----------------------------------+---------------------------------+              |
|                                                  v                                                |
|                            +-------------------------------------------+                          |
|                            |         MongoDB GridFS Persistence         |                          |
|                            |                 (MongoDB GridFS)                 |                          |
|                            +-------------------------------------------+                          |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Frontend Modules & State Management

### 2.1 Social Feed Engine (`feed.js`)
The social feed engine is structured as an event-driven controller with in-memory caching and real-time server replication:

- **State Store**:
  - `currentUser`: A minimal tab-scoped `{ id, username }` pointer in `sessionStorage`; account details are fetched from MongoDB.
  - `allPosts`: Array of hydrated spot objects containing comments, like counters, save states, and AI trust evaluations.
  - `stories`: Array of 24-hour visual spot updates.
  - `activeStoryIndex`: Pointer tracking current playback position in the story viewer.
  - `storyTimer`: High-resolution interval tracking progress bar completion (5000ms duration with 50ms ticks).

- **Touch & Gesture Handling**:
  - Mobile double-tap detection uses a custom `touchend` timestamp delta comparator:
    ```javascript
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 320 && tapLength > 0) {
      handleDoubleTapLike(postId, heartElement);
    }
    lastTap = currentTime;
    ```
  - Double-tap triggers a spring-animated CSS heart icon overlay while simultaneously dispatching an optimistic like increment to the UI and server.

- **Post Creation Wizard**:
  - Step 1: Client-side file reading with `FileReader.readAsDataURL` converting selected images to base64 strings. Real-time CSS filter selection (`contrast`, `brightness`, `sepia`, `saturate`) saved in `filter_css`.
  - Step 2: Spot title, location, category tagging, detailed description.
  - Step 3: Residency details (name, contact phone/booking, honest price & feedback).
  - Step 4: Route transit info (type, cost, directions) and local must-visit food recommendations.

### 2.2 Story Playback Engine
- Segments are dynamically constructed based on the active story list:
  ```html
  <div class="story-progress-segment">
    <div class="story-progress-fill" style="width: 100%;"></div>
  </div>
  ```
- Supports click-to-advance (right 70% of viewport) and click-to-reverse (left 30% of viewport).
- Long-press / mousedown pauses timer updates (`storyIsPaused = true`) and locks the active progress bar width until release.

### 2.3 Authentication & Pro Verification (`auth.js`)
- **Account Isolation**: Normal accounts are created immediately with standard email/password credentials.
- **Strict 1-Aadhaar Verification Protocol**:
  1. User initiates Pro upgrade in the UI.
  2. Submits 12-digit Indian Aadhaar number.
  3. Client validates format via `/^\d{12}$/`.
  4. Backend inspects `db.users`:
     ```javascript
     const existingAadhaarOwner = db.users.find(u => u.aadhaar_no === cleanAadhaar && u.id !== user_id);
     if (existingAadhaarOwner) {
       return res.status(400).json({ error: "Aadhaar already registered to @" + existingAadhaarOwner.username });
     }
     ```
  5. UI launches simulated biometric camera stream with a custom SVG scanline overlay and face mesh detection HUD.
  6. On completion, the user is awarded `is_verified_pro: true` and the `☑️ Verified Pro Creator` badge.

---

## 3. Emergency Safety Suite (`sosEngine.js`)

The SOS engine operates continuously across all application pages without blocking main thread interactions.

### 3.1 Hardware Sensor Integrations
1. **Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`)**:
   - Continuously listens for acoustic panic triggers: `"help"`, `"save me"`, `"emergency"`, `"sos"`, `"danger"`.
   - On keyword trigger, assigns high danger confidence (`dangerScore += 60`).
2. **DeviceMotionEvent (Accelerometer)**:
   - Evaluates instantaneous acceleration: `Math.sqrt(ax*ax + ay*ay + az*az)`.
   - Deltas exceeding `28 m/s²` trigger a shake counter. Three rapid shakes within a 1.2-second window increase the danger score (`dangerScore += 40`).
3. **Multi-Signal Danger Evaluator**:
   - When cumulative `dangerScore >= 50`, the engine initiates the **10-Second Auto-Emergency Countdown**.

### 3.2 Automated Dispatch Pipeline
```
[Voice Keyword / Violent Shake]
               │
               ▼
[Multi-Signal Danger Score >= 50]
               │
               ▼
[Full-Screen 10s Countdown Overlay] ──(User clicks "I Am Safe")──> [Cancelled]
               │
          (Timer Expires)
               ▼
[HTML5 Geolocation High-Accuracy Query]
               │
               ▼
[MediaRecorder 3s Ambient Audio Capture]
               │
               ▼
[POST /api/sos/trigger] ──> [Broadcast to MongoDB GridFS & Nearby Alert Mesh]
```

---

## 4. AI & Data Analytics Services

### 4.1 Content Integrity Engine (`aiIntegrityService.js`)
- **Synthetic Media Manifest Inspection**:
  - Inspects base64/EXIF payload chunks for generative signature markers:
    - C2PA Content Credentials manifests
    - Stable Diffusion parameter strings
    - Midjourney upscale signatures
    - DALL-E / GenerativeAI headers
  - Assigns binary flags and confidence scores.
- **Anti-Astroturfing & Promotional Bias Engine**:
  - Computes sentiment extremes: checks for clusters of spam superlatives (*"100% recommended"*, *"10/10 perfect"*).
  - Cross-references author history: checks if the author has previously recommended the same hotel or restaurant across multiple distinct trips.
  - Calculates net Trust Score ($0 - 100\%$) and generates user-facing audit badges.

### 4.2 Travel Itinerary Planner (`travelPlannerService.js`)
- **Groq Cloud Integration**:
  - Communicates with Groq via HTTPS using `llama-3.3-70b-versatile`.
  - Prompts require strict JSON output adherence containing daily itineraries, time-blocks, budget allotments, and pack lists.
- **Offline Fallback Engine**:
  - Employs deterministic travel heuristic matrices for major destinations.
  - Automatically queries `db.posts` to inject real verified spots and phone numbers from actual platform users into the generated plan.

### 4.3 Hazard & Tourism Heatmap (`dashboardService.js`)
- **India Geographic Projection**:
  - Transforms real GPS latitude and longitude into normalized Cartesian percentages for canvas rendering:
    $$x = \frac{\text{lon} - 68}{97 - 68} \times 100\%$$
    $$y = \frac{37 - \text{lat}}{37 - 8} \times 100\%$$
  - Bounds: Longitude $68^\circ\text{E}$ to $97^\circ\text{E}$, Latitude $8^\circ\text{N}$ to $37^\circ\text{N}$.

---

## 5. UI/UX Design System & Tokens

The application employs an Obsidian Dark Glassmorphic design language engineered for outdoor readability and low battery consumption.

### CSS Tokens (`feed.css`, `styles.css`)
```css
:root {
  --bg-obsidian: #070c0a;
  --bg-surface: rgba(11, 18, 16, 0.75);
  --border-glass: rgba(255, 255, 255, 0.08);
  --accent-cyan: #38bdf8;
  --accent-cyan-hover: #7dd3fc;
  --accent-emerald: #10b981;
  --accent-rose: #f43f5e;
  --text-primary: #fdf1e1;
  --text-secondary: rgba(253, 241, 225, 0.65);
}
```

---

## 6. Security & Privacy Guarantees

1. **Anti-Sybil 1-Aadhaar Creator Standard**:
   - Ensures individual accountability for travel advice and commercial recommendations.
   - Prohibits automated account farms from posting fraudulent reviews.
2. **C2PA Authenticity Verification**:
   - Protects users from deceptive, AI-generated landscape images and fake hotel depictions.
3. **Client-Side Media Processing**:
   - Image scaling and filter calculations occur locally in the client browser, reducing server compute loads.
4. **Emergency Privacy Boundaries**:
   - SOS sensors and microphone recording are only triggered when the user explicitly enables **Safety Mode Active** or triggers the emergency button.
