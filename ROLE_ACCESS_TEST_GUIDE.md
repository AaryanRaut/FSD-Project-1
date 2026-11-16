# UrbanHeat Role-Based Access Test Guide

## 1. Start services

1. Start MongoDB Server.
2. In a terminal opened in `backend`, run `mvn spring-boot:run`.
3. In a second terminal opened in `frontend`, run `npm.cmd install` and then `npm.cmd run dev`.
4. Open the Vite URL (normally `http://localhost:5173`).

On first backend startup after this update, the `users` collection is seeded with the three demo accounts if those usernames do not already exist.

## 2. Browser login tests

| Test role | Username | Password | Expected visible workspace |
|---|---|---|---|
| City Administrator | `admin` | `admin123` | Overview, Heat Hotspots, City Zones, Cooling Centers, Heat Risk Analysis and Weather Records; add/edit/delete controls are visible for zones, hotspots and cooling centers |
| Municipal Authority | `authority` | `authority123` | Monitoring pages are visible; management controls are hidden; data is read-only |
| Public / Resident | `resident` | `resident123` | Overview, Heat Hotspots, Cooling Centers and Heat Risk Analysis; only centers with `Open` status are returned; no write controls |

Use **Sign out** in the lower-left sidebar before switching accounts. If an older token remains in the browser, sign out and sign in again.

## 3. Postman login and API permission tests

### Login

- Method: `POST`
- URL: `http://localhost:8081/api/auth/login`
- Body → raw → JSON:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Copy the `token` value from the response. For protected requests, add a header:

- Key: `Authorization`
- Value: `Bearer PASTE_TOKEN_HERE`

Repeat login using the `authority` and `resident` accounts to obtain their own tokens.

### Expected permission checks

| Request | Administrator | Authority | Resident |
|---|---:|---:|---:|
| `GET /api/dashboard` | 200 | 200 | 200 |
| `GET /api/zones` | 200 | 200 | 200 |
| `GET /api/hotspots` | 200 | 200 | 200 |
| `GET /api/cooling-centers` | 200 | 200 | 200 |
| `GET /api/weather` | 200 | 200 | 403 |
| `POST /api/heat-risk/classify` | 201 | 201 | 201 |
| `GET /api/heat-risk/history` | 200 | 200 | 200 |
| `POST /api/zones` | 201 | 403 | 403 |
| `POST /api/hotspots` | 201 | 403 | 403 |
| `POST /api/cooling-centers` | 201 | 403 | 403 |

A request to a protected endpoint without a token should return `401 Unauthorized`. A valid token without the required role should return `403 Forbidden`. Resident requests to the cooling-center collection, including a single-center lookup, return only records with `Open` status. For POST tests, use valid JSON and clean up any test records with an administrator token.

## 4. Cooling Center CRUD

Administrator-only endpoints:

- `GET /api/cooling-centers`
- `GET /api/cooling-centers/{id}`
- `POST /api/cooling-centers`
- `PUT /api/cooling-centers/{id}`
- `DELETE /api/cooling-centers/{id}`

The backend derives status as `Full` when `peoplePresent` reaches capacity; otherwise it sets status to `Open`.

## 5. Security notes

- Passwords are stored using BCrypt hashing.
- The signed bearer token expires after eight hours.
- The frontend stores the token in local storage and removes it on sign out.
- The backend enforces permissions on API requests; frontend visibility rules are not the only protection.
- Demo credentials and the default token-signing secret are for local coursework only. Change them and configure `URBANHEAT_JWT_SECRET` before any deployment. Use HTTPS for deployment.


## 6. Intelligent heat-risk feature tests

Open **Heat Risk Analysis** after signing in with any role. Enter a zone, temperature, humidity and wind speed, then select **Classify heat risk**. A successful result displays the risk level and safety recommendations and appears in the recent history table.

### Successful Postman request

- Method: `POST`
- URL: `http://localhost:8081/api/heat-risk/classify`
- Header: `Authorization: Bearer PASTE_TOKEN_HERE`
- Header: `Content-Type: application/json`
- Body → raw → JSON:

```json
{
  "zone": "Central District",
  "temperature": 41.5,
  "humidity": 75,
  "windSpeed": 4
}
```

Expected: HTTP `201 Created`, a `Critical` result, explanation, recommendations and timestamp. Check MongoDB Compass → `urbanheat` → `heat_risk_history` to verify persistence.

### Invalid input test

Repeat the request with `"humidity": 110`. Expected: HTTP `400 Bad Request` and a validation message. The invalid request must not create a history record.

### History request

- Method: `GET`
- URL: `http://localhost:8081/api/heat-risk/history`
- Header: `Authorization: Bearer PASTE_TOKEN_HERE`

Expected: HTTP `200 OK` and up to the latest 50 classifications.

The classification uses transparent demonstration rules, not a trained ML model or official heat-index calculation.
