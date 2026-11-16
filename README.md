# UrbanHeat — Smart-City Heat Management

A separate full-stack project for city/municipal authorities to monitor heat hotspots, compare city zones, view area-based warnings, and manage cooling centers.

## Technology
- React frontend
- Java 17 + Spring Boot 3.4.5 backend
- Spring Web + Spring Data MongoDB + Spring Security
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
API base URL: http://localhost:8081 (protected API routes require a bearer token)

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
- City Zone, Heat Hotspot and Cooling Center full CRUD for administrators
- signed bearer-token authentication and BCrypt password hashing
- Three role-specific workspaces: City Administrator, Municipal Authority and Public / Resident
- Backend-enforced role permissions (not only hidden frontend buttons)

## API endpoints
- `GET /api/dashboard`
- `GET /api/zones`
- `GET /api/hotspots`
- `GET /api/cooling-centers`
- `POST /api/cooling-centers`
- `PUT /api/cooling-centers/{id}`
- `DELETE /api/cooling-centers/{id}`
- `POST /api/auth/login` (public login; returns bearer token)
- `GET /api/auth/me` (requires bearer token)
- `GET /api/weather`
- `GET /api/health`

## Important note
This is a working educational prototype. The city map and sample weather/risk values are demo data. It does not fetch live weather, official warnings, or verified cooling-center locations. Do not use its demo risk categories for real emergency decisions.


## City Zone and Heat Hotspot management (CRUD)

The backend exposes these endpoints under `http://localhost:8081/api`:

| Resource | Method | Endpoint | Purpose |
|---|---|---|---|
| City Zones | GET | `/zones` | List all zones |
| City Zones | GET | `/zones/{id}` | Get one zone |
| City Zones | POST | `/zones` | Create a zone |
| City Zones | PUT | `/zones/{id}` | Update a zone |
| City Zones | DELETE | `/zones/{id}` | Delete a zone |
| Heat Hotspots | GET | `/hotspots` | List all hotspots |
| Heat Hotspots | GET | `/hotspots/{id}` | Get one hotspot |
| Heat Hotspots | POST | `/hotspots` | Create a hotspot |
| Heat Hotspots | PUT | `/hotspots/{id}` | Update a hotspot |
| Heat Hotspots | DELETE | `/hotspots/{id}` | Delete a hotspot |

The dashboard endpoint (`GET /dashboard`) calculates `zoneCount`, `hotspotCount`, and `highRiskZones` from the current MongoDB records. The React interface reloads the dashboard after every successful create, update, or delete operation.

### Run the project

Backend (from `backend`):
```bash
mvn spring-boot:run
```

Frontend (from `frontend`):
```bash
npm install
npm run dev
```

The application uses MongoDB at `mongodb://localhost:27017/urbanheat`.


## User roles and demo login accounts

The application creates three demo users in MongoDB the first time the backend starts after this update. Passwords are stored as BCrypt hashes in the `users` collection. Use these accounts on the UrbanHeat login screen:

| Role | Username | Password | Access |
|---|---|---|---|
| City Administrator | `admin` | `admin123` | Create, view, edit and delete city zones, hotspots and cooling centers; view dashboard and weather |
| Municipal Authority | `authority` | `authority123` | Read-only monitoring of dashboard, zones, hotspots, cooling centers and weather |
| Public / Resident | `resident` | `resident123` | View dashboard heat warnings, hotspots and cooling centers marked Open |

After login, the frontend stores the signed token in browser local storage and sends it in the `Authorization: Bearer <token>` header. Tokens expire after 8 hours. Signing out removes the saved token. The backend checks permissions for every protected API request; hiding controls in React is only a usability layer.

### Role access rules

- `ADMINISTRATOR`: all read and write operations for `/api/zones/**`, `/api/hotspots/**` and `/api/cooling-centers/**`; dashboard and weather read access.
- `AUTHORITY`: GET-only access to dashboard, zones, hotspots, cooling centers and weather.
- `RESIDENT`: GET-only access to dashboard, zones, hotspots and cooling centers. Weather-record access and all write operations are denied. The resident interface lists cooling centers with `Open` status only.

### Authentication API example

Send `POST http://localhost:8081/api/auth/login` with JSON:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

The response contains `token`, `username`, `displayName` and `role`. For protected endpoints, add an `Authorization` header with value `Bearer <token>`.

**Demo security note:** The default signing secret and demo passwords are for local coursework only. Before any real deployment, set a long random `URBANHEAT_JWT_SECRET`, change the demo passwords, use HTTPS, and apply appropriate production account-management practices. There is no public self-registration endpoint in this coursework build; the three demo accounts are seeded automatically.

## Intelligent feature: Heat Risk Classification and Safety Recommendations

The **Heat Risk Analysis** workspace provides an educational, transparent Java rule-based assessment. It is not a trained machine-learning model and does not use live weather data. The output must not be treated as an official heat index, medical assessment, or emergency warning.

### Inputs and outputs

Request fields:
- `zone`: city-zone name (required)
- `temperature`: degrees Celsius (-20 to 70)
- `humidity`: percentage (0 to 100)
- `windSpeed`: kilometres per hour (0 to 200)

The response contains the supplied inputs, `riskLevel` (Low, Moderate, High, Critical), an explanation, safety recommendations, classification timestamp, and the username that ran the classification. Each successful result is stored in MongoDB collection `heat_risk_history`.

### Classification rules

1. Temperature sets the base score: below 32°C = 0; 32°C to below 36°C = 1; 36°C to below 40°C = 2; 40°C or above = 3.
2. Humidity of 70% or above adds one score.
3. Wind speed of 5 km/h or below adds one score.
4. The score is capped at 3 and mapped to Low (0), Moderate (1), High (2), or Critical (3).
5. The service returns recommendations for the resulting level.

These simple thresholds are project rules chosen for demonstration. They are not a validated public-health model.

### Intelligent feature API

Classify and save a result:
- `POST http://localhost:8081/api/heat-risk/classify`
- Requires a valid bearer token for any of the three demo roles.
- Example JSON body:

```json
{
  "zone": "Central District",
  "temperature": 41.5,
  "humidity": 75,
  "windSpeed": 4
}
```

Read the latest 50 saved results:
- `GET http://localhost:8081/api/heat-risk/history`
- Requires a valid bearer token for any of the three demo roles.

Invalid values return HTTP 400 with a `message`; missing/invalid tokens return HTTP 401. A role that is not permitted receives HTTP 403. If MongoDB or the backend is unavailable, the frontend displays an error and does not present a successful classification.

### Role permissions

- City Administrator: manage zones, hotspots and cooling centers; view weather; run classifications and view classification history.
- Municipal Authority: read-only monitoring; view weather; run classifications and view classification history.
- Public / Resident: view dashboard, hotspots and open cooling centers; run classifications and view classification history. Weather records and all management writes are denied. The backend filters closed cooling centers from resident dashboard and directory responses.

### Relevant source files

- `backend/src/main/java/com/urbanheat/controller/HeatRiskController.java`
- `backend/src/main/java/com/urbanheat/service/HeatRiskService.java`
- `backend/src/main/java/com/urbanheat/model/HeatRiskHistory.java`
- `backend/src/main/java/com/urbanheat/repository/HeatRiskHistoryRepository.java`
- `frontend/src/App.jsx` (Heat Risk Analysis workspace)
- `frontend/src/style.css` (feature presentation)

### Suggested feature test cases

| Case | Inputs | Expected result |
|---|---|---|
| Successful critical result | Central District, 41.5°C, 75% humidity, 4 km/h wind | Critical classification, recommendations, HTTP 201, MongoDB history record |
| Invalid humidity | Central District, 38°C, 110% humidity, 8 km/h wind | HTTP 400 with validation message; no history record |
| Unauthorized request | No bearer token | HTTP 401 |
| Resident management write | Resident token + POST `/api/zones` | HTTP 403 |
