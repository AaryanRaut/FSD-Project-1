# UrbanHeat — Smart-City Heat Management

A separate full-stack project for city/municipal authorities to monitor heat hotspots, compare city zones, view area-based warnings, and manage cooling centers.

## Technology
- React frontend
- Java 17 + Spring Boot 3.4.5 backend
- Spring Web + Spring Data MongoDB
- MongoDB database: `urbanheat`
- REST API

## Requirements
- Java 17+
- Maven 3.9+ (or compatible)
- Node.js and npm
- MongoDB Server running locally on port 27017

## Start the backend
Open a terminal in `backend` and run:
```powershell
mvn spring-boot:run
```
Backend URL: http://localhost:8081  
API dashboard: http://localhost:8081/api/dashboard

The backend uses `mongodb://localhost:27017/urbanheat`. It seeds sample city data the first time each collection is empty. The sample data is illustrative, not official real-time data.

## Start the frontend
Open a second terminal in `frontend` and run:
```powershell
npm.cmd install
npm.cmd run dev
```
Open the URL Vite prints, usually http://localhost:5173.

## Implemented features
- City administration dashboard with summary metrics
- Schematic interactive heat-hotspot map (select a zone to inspect it)
- Zone-based risk status and temperature/humidity display
- Area-based warning list
- Cooling center directory and status
- Weather records
- Backend REST endpoints backed by MongoDB
- Add a cooling center from the interface

## API endpoints
- `GET /api/dashboard`
- `GET /api/zones`
- `GET /api/hotspots`
- `GET /api/cooling-centers`
- `POST /api/cooling-centers`
- `GET /api/weather`
- `GET /api/health`

## Important note
This is a working educational prototype. The city map and sample weather/risk values are demo data. It does not fetch live weather, official warnings, or verified cooling-center locations. Do not use its demo risk categories for real emergency decisions.
