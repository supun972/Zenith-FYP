# ZENITH - AI-Guided Learning Platform

## Project Overview
**ZENITH** is a high-end, AI-guided educational platform designed for Grade 9-11 students. It features a modern "dark-space" aesthetic with glassmorphism UI. The core innovation is its real-time AI tracking system that monitors student engagement and focus during study sessions.

This repository serves as the Final Year Project scaffolding for the ZENITH frontend architecture.

## Key Features
- **Immersive UI/UX:** Premium dark mode, animated glass panels, and fully responsive layouts.
- **Role-Based Portals:** Dedicated environments for Students and Teachers.
- **Live Focus Tracker (AI Integration):** Utilizes `react-webcam` and `face-api.js` to detect faces and calculate engagement levels in real-time.
- **AI Tutor Chatbot:** An embedded smart assistant within the study session to answer educational queries.
- **Interactive Dashboards:** Mockup analytics, task management, and live class tracking.
- **Global Authentication State:** Context API used to manage active sessions.

## Tech Stack
- **Framework:** React.js (Vite)
- **Routing:** `react-router-dom`
- **Styling:** Vanilla CSS, CSS Variables (Design Tokens), Flexbox/Grid
- **AI/ML:** `@vladmandic/face-api` (Browser-based Face Detection)
- **Icons:** FontAwesome

## Setup Instructions

### 1. Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 2. Installation
Run the following commands in your terminal:
```bash
# Install all dependencies
npm install

# Start the development server
npm run dev
```

### 3. Usage
- Open `http://localhost:5173` in your browser.
- **Student Flow:** Click "Get Started", register as a Student. Go to "Assigned Study Sessions" and click "Start Session". **Allow Camera Access** to test the real-time AI face tracking.
- **Teacher Flow:** Click "Get Started", register as a Teacher. View the Live Dashboard to see simulated student analytics.

## Project Structure
- `/src/pages` - Contains the main views (Landing, Login, Register, StudentPortal, TeacherDashboard, Profile, NotFound).
- `/src/components` - Reusable UI elements (Navbar, Footer).
- `/src/context` - Global state management (AuthContext).
- `/public/models` - Pre-trained weights for the `face-api.js` models.
- `/src/App.css` - Global design system, glassmorphism utilities, and responsive grids.
