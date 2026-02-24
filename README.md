# IntelliFence  
## Public Safety and Monitoring System

---

## Overview

**IntelliFence** is a real-time Public Safety and Monitoring System developed for **Smart India Hackathon**.
The platform enables authorities to monitor public safety situations, manage emergencies, and respond quickly using live location tracking, geo-fencing, and centralized incident management.
Unlike tourist-only solutions, IntelliFence is designed for **general public safety**, making it suitable for cities, campuses, public events, disaster zones, and high-risk environments where real-time awareness and rapid response are essential.
The system focuses on practical deployment using scalable web technologies and rule-based safety mechanisms to ensure reliability and real-world usability.

---

## Objective

Improve public safety and emergency response coordination by providing:

- Real-time monitoring of active users
- Fast emergency reporting and handling
- Location-based safety alerts
- Restricted and high-risk zone monitoring
- Centralized authority supervision
- Data-driven safety insights

---

## System Architecture

Public User Web Portal

↓

Backend API Server

├── Database Layer

├── Geo-Fence Engine

├── Incident Management Service

└── WebSocket Server (Real-Time Updates)

↓

Authority Monitoring Dashboard

---

## Core Features

### Public User Portal
- Secure user registration and authentication
- Start and stop safety sessions
- Live browser-based location sharing
- One-click SOS emergency alert
- Safety notifications when entering restricted zones
- Authority broadcast alerts
- Active session monitoring


### Authority Monitoring Dashboard
- Live map displaying active users
- Real-time movement tracking
- Emergency incident monitoring panel
- Incident status management
- Danger zone creation and management
- Public safety announcements
- Analytics and operational insights


### Real-Time Tracking System
- Continuous GPS updates using browser geolocation
- WebSocket-based live synchronization
- Instant dashboard updates
- Active session lifecycle management

### Geo-Fencing Engine
- Creation of restricted or high-risk zones
- Polygon-based geographic detection
- Entry and exit alerts
- Zone risk categorization
- Automatic safety notifications

### Emergency Incident Management
- Instant SOS alert generation
- Automatic incident creation with live location
- Real-time authority notification
- Incident lifecycle tracking:
  - Pending
  - Responding
  - Resolved
- Response time monitoring

### Notification System
- Geo-fence warning alerts
- Emergency notifications
- Authority broadcast announcements
- Browser push notifications

---

## Tech Stack

### Frontend
- React.js
- Leaflet or Google Maps API
- Chart.js / Recharts
- WebSocket Client

### Backend
- Node.js + Express (or Django equivalent)
- REST APIs
- Socket.io for real-time communication
- JWT Authentication

### Database
- PostgreSQL or MongoDB
- Geo-coordinate data storage

### Integrations
- Browser Geolocation API
- Push Notifications
- Weather API (optional)
- SMS Gateway (optional)

---

## Project Structure

intellifence/

│

├── backend/

│ 
├── routes/

│ 
├── controllers/

│ 
├── models/

│ 
├── middleware/

│ └── websocket/

│
├── dashboard-frontend/

│
├── public-portal/

│
└── README.md

---

## Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd intellifence
cd backend
npm install
npm run dev
```

---

### 2. Create a .env file:
PORT=5000
JWT_SECRET=your_secret_key
DATABASE_URL=your_database_url

### 3. Authority Dashboard Setup
```bash
cd dashboard-frontend
npm install
npm start
```

### 4. Public User Portal Setup
```bash
cd public-portal
npm install
npm start
```

---

## Core API Endpoints

### 1. Authentication
POST /auth/register
POST /auth/login
GET /me

### 2. Session Management
POST /session/start
POST /session/end

### 3. Location Tracking
POST /location/update

### 4. Location Tracking
POST /location/update

### 5. Emergency System
POST  /incident/sos
GET   /incident/all
PATCH /incident/status

### 6. Danger Zones
POST   /zones/create
GET    /zones
DELETE /zones/:id

---

##Database Entities
Users
Roles
Safety Sessions
Locations
Incidents
Danger Zones
Alerts

---

###Security Features
JWT-based authentication
Role-based authorization
Secure API middleware
Consent-controlled location tracking
Automatic session expiration
Protected administrative access

---

###Team Responsibilities
Backend Lead — API development, database design, incident system
Real-Time Engineer — WebSockets, geo-fencing logic, event handling
Frontend Developer 1 — Authority monitoring dashboard
Frontend Developer 2 — Public user portal

---

###Analytics & Reporting
Active users overview
Incident frequency analysis
Response time tracking
Zone-based safety insights

---

###Future Enhancements
Dedicated mobile application
Offline emergency fallback
Multi-language accessibility
Integration with emergency response services
Predictive safety analytics

---

###License
Developed for academic and hackathon purposes under Smart India Hackathon (SIH25002) guidelines.

---

###Acknowledgment
IntelliFence is developed as part of Smart India Hackathon to demonstrate scalable digital infrastructure for improving public safety monitoring and emergency response systems.

---

