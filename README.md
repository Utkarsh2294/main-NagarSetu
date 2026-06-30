# 🌉 NagarSetu

NagarSetu is a next-generation, AI-powered civic issue resolution platform designed to bridge the gap between citizens and municipal authorities. It provides a decentralized, highly automated pipeline for reporting, verifying, tracking, and resolving civic issues like potholes, garbage dumps, broken street lights, and water leaks.

By integrating Google Gemini AI, WhatsApp, and community-driven verification, NagarSetu eliminates fake reports, reduces bureaucratic delays, and guarantees transparency through the entire issue lifecycle.

---

## ✨ Core Features & Functions

### 1. 🤖 AI-Powered Civic Reporting
Citizens can report issues via the web app by snapping a photo or video (up to 5 media files per report). 
- **Automated Triage:** Google Gemini AI instantly analyzes the uploaded media to automatically classify the issue (e.g., "Roads & Potholes", "Street Lights").
- **Severity & Agency Assignment:** The AI assesses the severity of the issue and automatically routes it to the correct local municipal agency (e.g., PWD, Waste Management).
- **Fake Detection:** The AI aggressively filters out non-civic, irrelevant, or staged photos (like selfies, documents, or indoor objects), marking them for community review rather than wasting agency time.

### 2. 📱 WhatsApp Bot Integration
Not everyone has a smartphone with a web browser. Citizens can simply send a photo, a short description, and their GPS location to the NagarSetu WhatsApp Bot. The bot uses the same AI infrastructure to parse the report, log it into the centralized database, and reply with a tracking ID entirely through WhatsApp.

### 3. 📍 Geofenced Community Verification (Double-Verification)
To prevent duplicate and fake reports, NagarSetu relies on localized community consensus.
- **500m Radius Lock:** Only citizens who are physically within a 500-meter radius of the reported issue can upvote or verify it.
- **Auto-Clustering:** If a citizen tries to report an issue within 50 meters of an already existing active report, the system automatically clusters them together to prevent duplicate ticket spam.

### 4. 🏢 Comprehensive Admin & Agency Dashboard
Municipal authorities have access to a powerful control center.
- **Live Heatmap:** Visualizes all active issues on a map, allowing authorities to spot infrastructural failures in real-time.
- **SLA Tracking:** Every issue has a Service Level Agreement (SLA) deadline. Badges clearly indicate if an issue is "SLA Breached", "SLA Warning", or "On Time."
- **Worker Assignment & Reassignment:** Admins can dispatch field workers to specific issues with a single click.
- **AI Triage Notes:** When admins change the status of an issue (e.g., from "In Progress" to "Resolved"), Gemini AI automatically drafts a contextual, polite response which the admin can edit and push directly to the citizen's notification center.

### 5. 👷 Decentralized Worker "Proof-of-Fix"
When field workers complete a job, they don't just close the ticket. They must upload a photo or video proving the issue was fixed. 
- The AI analyzes the worker's upload to ensure it matches the original issue location and actually depicts a resolution.
- Once the worker submits the proof, the citizens who originally reported and verified the issue are notified to re-verify the fix. If citizens vote "Still Broken," the ticket instantly reopens.

### 6. 🏆 Gamification & Leaderboard
To incentivize civic participation, NagarSetu rewards citizens with "Impact Points" for submitting genuine reports and verifying existing ones. The integrated Leaderboard highlights the top contributors in the city, turning civic duty into a rewarding, community-building experience.

### 7. 🌍 Multi-Lingual Support
Recognizing the diversity of the populace, NagarSetu natively supports multiple languages (English, Hindi, Marathi, Gujarati, etc.), making civic engagement accessible to everyone.

### 8. 📊 Public Transparency Dashboard
A dedicated dashboard is available to the public showing real-time statistics: total issues reported, total resolved, agency response times, and the top active reporting zones. This enforces municipal accountability.

---

## 🛠️ Technology Stack
- **Frontend:** React 19, Tailwind CSS, Vite, Framer Motion, Lucide Icons, React-Leaflet (Maps)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **AI & ML:** `@google/genai` (Google Gemini 2.5 Flash for multimodal image/video analysis)
- **Authentication:** Google OAuth 2.0 & JWT for Admin sessions

---

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   GEMINI_API_KEY=your_gemini_api_key
   MONGODB_URI=your_mongodb_connection_string
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
   ADMIN_JWT_SECRET=your_secure_jwt_secret
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The backend API and the Vite frontend will start concurrently.

4. **Access the App:**
   - Citizen Portal: `http://localhost:3000`
   - Admin Portal: `http://localhost:3000/admin` (Default Super Admin login: `superadmin` / `admin@1234`)
