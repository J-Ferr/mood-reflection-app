# 🌙 Mood Reflection App

A calm, intentional full-stack web application designed to help users check in with their mood, reflect daily, and build emotional awareness over time.

This app focuses on simplicity, consistency, and thoughtful UX rather than overwhelming features.

---

## 🔗 Live Demo

- **Frontend:** https://mood-reflection-frontend.onrender.com  
- **API:** https://mood-reflection-api.onrender.com

----

## Screenshots

### Authentication
![Login](screenshots/Login.png)

### Daily Check-In Flow
![Dashboard Empty](screenshots/dashboard-empty.png)
![Dashboard Complete](screenshots/dashboard-complete.png)
![Dashboard Expanded](screenshots/dashboard-expanded.png)

### History
![History](screenshots/history.png)

### Stats
![Stats](screenshots/stats.png)

---

##  Features

-  **Authentication**
  - Secure user registration and login using JWT
-  **Daily Reflection Prompt**
  - One prompt per day
  - Prompts rotate automatically and avoid recent repeats
-  **Mood Check-In**
  - Rate your mood on a 1–5 scale with clear visual feedback
-  **Daily Entry**
  - One reflection per day (enforced at the database level)
  - Edit your entry later if needed
-  **Stats & Insights**
  - Current streak
  - Longest streak
  - Total entries
  - Monthly activity
  - A short insight generated from recent patterns
-  **Calm, Polished UI**
  - Gradient background
  - Consistent card system
  - Subtle micro-interactions
  - Designed to feel grounding, not distracting

---

## 🚀 Deployment

- **Frontend:** Deployed as a static site on Render
- **Backend API:** Node.js + Express deployed on Render
- **Database:** PostgreSQL hosted on Render
- **Authentication:** JWT-based auth with protected routes

Environment variables are managed securely through Render.


## 📝 Notes

- The `entries` API maps to a `daily_entries` table in the database via a PostgreSQL view, allowing clean API naming while enforcing a one-entry-per-day constraint at the database level.


---

##  Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express
- PostgreSQL
- JWT Authentication

---

##  Architecture Overview

- RESTful API design
- Separation of concerns (routes, controllers, middleware)
- Database-enforced constraints (one entry per user per day)
- User-specific logic for prompt rotation and stats
- Clean, reusable UI components

---

## Project Structure

This repository is structured as a monorepo with a separate backend and frontend.

```text
mood-reflection-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── server.js
│   └── sql/
│       └── schema.sql
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── api/
│       └── utils/




## ⚙️ Environment Setup

### Backend `.env`

PORT=5000
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database_name>
JWT_SECRET=your_jwt_secret_here



### Frontend
The frontend uses a configured Axios client pointing to the backend API.

---

##  Running the Project Locally

### Backend
```bash
cd backend
npm install
npm run dev

### Frontend
cd frontend
npm install
npm run dev

## Why this project exists

This project was built to practice and demonstrate:

    - Full-stack application architecture

    - Secure authentication flows

    - Relational database design

    - Real-world state management

    - Thoughtful UX decisions

    - Clean, maintainable code

Rather than focusing on complex features, the goal was to build something usable, calm, and intentional

## Future Improvements
- Prompt previews
- Mood trends over time
- Tagging reflections
- Exporting entries
- Deployment(Render/Vercel)

## 👤 Author

Built by Armando
Full-Stack Engineer


---
