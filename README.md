# NagarSetu

NagarSetu is a comprehensive, AI-powered civic issue reporting and management platform. It bridges the gap between citizens and city authorities by allowing seamless reporting of issues, automated AI triaging, and a robust admin dashboard for task delegation and tracking.

## Core Features

### 1. Citizen Portal
- **Interactive Issue Map:** Citizens can drop a pin on a Leaflet map to report issues. Real-time reverse geocoding translates coordinates into human-readable addresses.
- **AI-Powered Reporting:** Users upload photos/videos and provide descriptions. Gemini AI automatically analyzes the images, detects if it's a real civic issue (or fake), classifies the category (e.g., Potholes, Garbage), and assesses severity.
- **Voice Typing:** Built-in Web Speech API integration allows citizens to dictate their issue descriptions instantly instead of typing, ensuring accessibility and ease of use.
- **Leaderboard & Gamification:** Citizens earn points for reporting issues, verifying existing issues, and auditing agency fixes. A real-time leaderboard ranks top contributors.
- **Multi-Language Support:** The platform supports toggling between English and Hindi.
- **Notifications:** A real-time notification bell keeps citizens informed about their report statuses (e.g., assigned, fixed, or flagged as fake). Notifications are drafted intelligently by AI based on admin actions.

### 2. WhatsApp Bot Simulator
- **Conversational Interface:** A fully interactive, beautiful simulated WhatsApp bot that mimics a mobile device.
- **Media & Location Capture:** The bot requests name, email, location (via browser GPS or text), and media attachments.
- **Voice Typing in Bot:** Citizens can use continuous voice typing directly within the WhatsApp simulator to seamlessly compose messages.
- **Backend Integration:** Simulating a report through the bot triggers the exact same backend logic as the main app: AI processing, database logging, and admin dashboard rendering.

### 3. Admin Dashboard
- **Secure Access:** JWT-based authentication for administrators.
- **Unified Ticket Queue:** Admins see all issues reported via the web portal or the WhatsApp bot.
- **Issue Details & Triage:** 
  - Admins can view uploaded media in a horizontally scrolling gallery.
  - "Location" cards feature reverse-geocoded addresses and direct "View on Map" links to Google Maps.
  - Verification statistics show how many citizens voted the issue as real or fake.
- **Worker Assignment:** Admins can assign tasks to verified workers.
- **AI-Generated Notifications:** When an admin assigns a worker or flags a report as fake, Gemini AI drafts a custom, empathetic response message that is automatically sent to the reporting citizen's notification inbox.

## Architecture
- **Frontend:** React, Vite, Tailwind CSS, Leaflet for maps, Lucide Icons.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (Mongoose schemas for Users, Issues, Reports, Notifications, etc.).
- **AI Integration:** Google Gemini SDK (`@google/genai`) for image analysis and notification generation.
- **Routing:** React Router DOM (Separate routes for `/admin/*` and citizen views).

## Data Models
1. **User:** Tracks citizen points, ward, and contact info.
2. **Issue:** Represents a unique civic problem. Duplicate reports within 50 meters auto-merge into a single Issue.
3. **Report:** Individual submissions tied to an Issue. Contains media and raw coordinates.
4. **WhatsappMessage:** Logs interactions from the WhatsApp webhook/simulator.
5. **Notification:** AI-drafted messages sent to citizens.

---

## Local Development
1. Run `npm install`
2. Create a `.env` file based on the placeholders inside the repository. You will need a MongoDB URI and a Google Gemini API Key.
3. Run `npm run dev` to start both the Vite frontend and Express backend concurrently.

**For deployment instructions, please see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).**
