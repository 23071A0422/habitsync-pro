# HabitSync – Social Habit Tracker

HabitSync is a full-stack habit tracking web application designed to help users build consistency through **social accountability**.  
Users can create personal habits, track daily or weekly progress, follow friends, view leaderboards, and receive AI-powered habit guidance.

The application was designed, implemented, and deployed **independently as an end-to-end product**.

---

##  Live Demo

- **Primary Deployment (Docker + Render):**  
  https://habitsync-pro-latest-1.onrender.com/

- **Secondary Deployment (Vercel):**  
  https://habitsync-pro.vercel.app/

---

##  Features

###  Authentication
- Secure user signup, login, and logout using **Supabase Auth**
- Session persistence across reloads

###  Habit Management
- Create, edit, and delete habits
- Track daily or weekly habits
- Real-time streak calculation
- Prevent duplicate habit names per user

###  Progress Tracking
- Daily/weekly habit check-ins
- Automatic streak updates
- Completion rate and wellness point calculation
- Prevention of multiple check-ins within the same period

###  Social Accountability
- Search and follow other users
- Friends activity feed showing recent check-ins and streaks
- Users cannot follow themselves
- Follow/unfollow functionality

###  Leaderboards
- Global leaderboard ranking users by wellness points
- Friends-only leaderboard for social motivation

###  AI Habit Coach (Bonus)
- Personalized habit improvement suggestions powered by **Google Gemini API**

###  Profile Management
- User profile customization
- Notification toggles
- Account reset and deletion options

---

##  Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Headless UI  
- **Backend & Auth:** Supabase (PostgreSQL + Authentication)  
- **Database:** PostgreSQL (Relational)  
- **AI Integration:** Google Gemini API  
- **Deployment:** Docker, Nginx, Render, Vercel  

---

##  Database Design

The application uses a relational PostgreSQL schema managed by Supabase:

- **profiles** – user information and wellness points  
- **habits** – habit configuration and frequency  
- **habit_logs** – habit completion records with timestamps  
- **follows** – follower/following relationships  

Foreign key constraints and Supabase Row Level Security (RLS) ensure data integrity and access control.

---

##  Edge Cases Handled

- Duplicate habits with the same name are prevented per user
- Users cannot check in more than once per day/week
- Users cannot follow themselves
- Required fields are validated across all forms
- Cascading deletes ensure clean data removal

---

##  Docker Deployment (Bonus)

The frontend is containerized using Docker and served via Nginx.  
The Docker image is deployed on Render using an existing-image workflow.

---bash
docker build -t habitsync-pro .
docker run -p 3000:80 habitsync-pro

---

## Local Setup


git clone https://github.com/23071A0422/habitsync-pro.git
cd habitsync-pro
npm install
npm run dev


---

## Environment Variables


VITE_GEMINI_API_KEY=AIzaSyBDlP8PDMjnr43UWOWLzU5KvsdK9RVLw1E
VITE_SUPABASE_URL=https://mgjunntceqqajttrchpa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nanVubnRjZXFxYWp0dHJjaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTQ3MzYsImV4cCI6MjA4MTU3MDczNn0.yxxAchPj7OR5ibBZvJVX85dyCHfW1viZN-zP4Qzegf8


---

## Author

Developed independently as part of a full-stack product assignment, demonstrating end-to-end ownership including design, implementation, edge case handling, containerization, and deployment.
