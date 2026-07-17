# AI Email Outreach

An AI-powered full-stack application that discovers businesses, analyzes their websites, generates personalized outreach emails using AI, and helps manage leads from a modern dashboard.

---

## Features

* 🔍 Discover businesses by business type and location
* 🌐 Analyze business websites
* 🤖 AI-powered website evaluation
* ✉️ Generate personalized outreach emails
* 📊 Lead management dashboard
* 📅 Filter leads by date
* 📈 Lead scoring and priority assignment
* 📌 Lead status tracking
* 🗑️ Delete and manage leads
* ⚡ Full-stack TypeScript application

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express
* TypeScript
* Ollama AI (Local LLM)

### Database

* Supabase (Current)
* MongoDB (Previously used during development)

---

## Project Structure

```text
Email-Outreach/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   ├── package.json
│   └── ...
│
└── README.md
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Faheemzai4/Email-Outreach.git
cd Email-Outreach
```

---

## Install Dependencies

### Client

```bash
cd client
npm install
```

### Server

```bash
cd ../server
npm install
```

---

## Environment Variables

### Client

Create:

```text
client/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000
```

---

### Server

Create:

```text
server/.env
```

Example:

```env
PORT=5000

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

FOURSQUARE_API_KEY=your_foursquare_api_key

OLLAMA_MODEL=llama3
```

---

## Running the Project

### Start the Backend

```bash
cd server
npm run dev
```

Backend runs on:

```
http://localhost:5000
```

---

### Start the Frontend

```bash
cd client
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## Available Scripts

### Client

```bash
npm run dev
npm run build
npm run preview
```

### Server

```bash
npm run dev
npm run build
npm start
```

---

## Current Functionality

* Business discovery
* Website scraping
* AI website analysis
* Contact information extraction
* AI-generated outreach emails
* Lead scoring
* Lead prioritization
* Lead dashboard
* Date filtering
* Status management
* Delete leads

---

## Planned Features

* User Authentication
* Subscription Plans
* Stripe Payments
* Chrome Extension Integration
* CRM Integrations
* Team Workspaces
* Email Sending Automation
* Analytics Dashboard

---

## License

This project is licensed under the MIT License.

---

## Author

**Faheem Khan**

GitHub: https://github.com/Faheemzai4
