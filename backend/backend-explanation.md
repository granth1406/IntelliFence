# IntelliFence Backend Explanation

This document provides a detailed, file-by-file explanation of how the IntelliFence backend works, including the flow of operations and key functionalities.

## Project Overview

IntelliFence is a geofencing application that allows users to report incidents, create safety zones, and receive real-time alerts based on location. It uses Node.js, Express, MongoDB, Socket.IO for real-time communication, and JWT for authentication.

## File Structure and Functionality

### Root Files

#### `package.json`
- **Purpose**: Defines the Node.js project configuration, dependencies, and scripts.
- **Key Dependencies**:
  - `express`: Web framework for building the API
  - `mongoose`: MongoDB object modeling
  - `jsonwebtoken`: For JWT authentication
  - `bcryptjs`: Password hashing
  - `socket.io`: Real-time bidirectional communication
  - `express-rate-limit`: API rate limiting
  - `express-validator`: Request validation
  - `cors`: Cross-origin resource sharing
  - `dotenv`: Environment variable management
- **Scripts**:
  - `start`: Runs `node server.js`
  - `dev`: Runs `nodemon server.js` for development
  - `test`: Placeholder for tests

#### `server.js`
- **Purpose**: Main entry point of the application. Sets up the Express server, Socket.IO, middleware, and routes.
- **Step-by-Step Flow**:
  1. Imports required modules (Express, HTTP, CORS, Socket.IO, routes, middleware, dotenv)
  2. Loads environment variables from `.env` file
  3. Creates Express app and HTTP server
  4. Initializes Socket.IO server with CORS configuration
  5. Attaches Socket.IO instance to Express app for use in controllers
  6. Applies global middleware:
     - CORS for cross-origin requests
     - JSON and URL-encoded body parsing
  7. Sets up routes:
     - `/api/auth`: Authentication routes (no auth required)
     - Global auth middleware for all subsequent routes
     - `/api/location`: Location-related routes
     - `/api/zones`: Zone/incident management routes
  8. Establishes MongoDB connection
  9. Sets up Socket.IO event listeners for user connections/disconnections
  10. Starts server on port from environment variables

#### `.env`
- **Purpose**: Stores environment variables for configuration.
- **Variables**:
  - `PORT`: Server port (5001)
  - `DATABASE_URL`: MongoDB connection string
  - `JWT_SECRET`: Secret key for JWT token signing

#### `socketTest.js`
- **Purpose**: Test file for Socket.IO functionality (likely for development/testing).

#### `user_log.txt`
- **Purpose**: Log file for user activities (content not specified in code).

### Configuration

#### `config/db_connection.js`
- **Purpose**: Handles MongoDB database connection using Mongoose.
- **Functionality**:
  - Exports `db_connection` function
  - Attempts to connect to MongoDB using `DATABASE_URL` from environment
  - Logs success or error messages

### Models

#### `models/User.js`
- **Purpose**: Defines the User schema for MongoDB.
- **Schema Fields**:
  - `name`: String, required
  - `email`: String, required, unique
  - `password`: String, required (hashed)
  - `role`: String, enum ['user', 'authority'], default 'user'
  - `refreshTokens`: Array of objects with token and createdAt (for session management)
  - `createdAt`: Date, default now
  - `trustScore`: Number, default 1 (used in zone verification)
- **Timestamps**: Enabled for automatic createdAt/updatedAt

#### `models/Location.js`
- **Purpose**: Stores user location data for geofencing.
- **Schema Fields**:
  - `user`: ObjectId reference to User, required
  - `latitude`: Number, required
  - `longitude`: Number, required
  - `timestamp`: Date, default now
- **Timestamps**: Enabled

#### `models/Zone.js`
- **Purpose**: Represents geofencing zones and incident reports.
- **Schema Fields**:
  - `createdBy`: ObjectId reference to User, required
  - `type`: String, enum ['incident', 'zone'], default 'incident'
  - `title`: String
  - `description`: String
  - `riskLevel`: String, enum ['low', 'medium', 'high'], default 'medium'
  - `latitude`: Number (for incidents)
  - `longitude`: Number (for incidents)
  - `coordinates`: Array of lat/lng objects (for polygon zones)
  - `status`: String, enum ['pending', 'verified by users', 'false', 'resolved'], default 'pending'
  - `verificationScore`: Number, default 0
  - `confirmations`: Array of objects with user ObjectId and response ('confirm'/'reject')
  - `alertLevel`: String, enum ['none', 'near', 'inside'], default 'none'
- **Timestamps**: Enabled

### Controllers

#### `controllers/authController.js`
- **Purpose**: Handles user authentication, registration, login, token refresh, and logout.
- **Functions**:
  - `registerUser`: Creates new user with hashed password, assigns default role
  - `loginUser`: Verifies credentials, generates access token (15min) and refresh token (7d), stores refresh token
  - `refreshToken`: Validates refresh token, generates new access token
  - `logoutUser`: Removes refresh token from user's stored tokens

#### `controllers/locationController.js`
- **Purpose**: Manages user location updates and geofencing checks.
- **Functions**:
  - `updateLocation`:
    1. Creates new location record
    2. Broadcasts location update via Socket.IO
    3. Checks against all approved zones
    4. Emits 'zone-entered' if inside zone
    5. Emits 'near-zone-alert' if within 100m of zone
  - `getUserLocations`: Returns user's location history

#### `controllers/zoneController.js`
- **Purpose**: Manages zone creation, verification, and CRUD operations.
- **Functions**:
  - `createZone`: Creates incident reports, prevents duplicates, notifies nearby users
  - `getZones`: Returns verified zones
  - `getIncidents`: Returns all incidents
  - `verifyZone`: Allows users to confirm/reject incidents, updates verification score
  - `updateZone`: Authority-only zone editing
  - `deleteZone`: Authority-only zone deletion
  - `approveZone/rejectZone/pendingZone`: Authority status overrides

### Routes

#### `routes/authRoutes.js`
- **Purpose**: Defines authentication endpoints.
- **Routes**:
  - `POST /register`: User registration
  - `POST /login`: User login
  - `POST /refresh`: Token refresh
  - `POST /logout`: User logout

#### `routes/locationRoutes.js`
- **Purpose**: Location-related endpoints.
- **Routes**:
  - `POST /update`: Update user location (authenticated)
  - `GET /live`: Get user's location history (authenticated)

#### `routes/zoneRoutes.js`
- **Purpose**: Zone management endpoints.
- **Routes**:
  - `POST /`: Create zone/incident (rate limited, validated)
  - `GET /zones`: Get verified zones
  - `GET /incidents`: Get all incidents
  - `POST /verify`: Verify incident
  - `PUT /:id`: Update zone (authority only)
  - `DELETE /:id`: Delete zone (authority only)
  - `PATCH /:id/approve`: Approve zone (authority only)
  - `PATCH /:id/reject`: Reject zone (authority only)

### Middleware

#### `middleware/authMiddleware.js`
- **Purpose**: JWT authentication middleware.
- **Functionality**:
  - Extracts JWT from Authorization header
  - Verifies token with JWT_SECRET
  - Attaches decoded user info to req.user
  - Returns 401 for invalid/missing tokens

#### `middleware/authorityCheck.js`
- **Purpose**: Role-based access control.
- **Functionality**:
  - Returns middleware function that checks if req.user.role matches required role
  - Returns 403 Forbidden if role doesn't match

#### `middleware/errorValidation.js`
- **Purpose**: Handles express-validator errors.
- **Functionality**:
  - Checks for validation errors
  - Returns 400 with error array if validation fails

#### `middleware/rateLimiter.js`
- **Purpose**: API rate limiting.
- **Configuration**: 10 requests per minute window

#### `middleware/zoneDataValidation.js`
- **Purpose**: Validates zone creation data.
- **Validations**:
  - `title`: Required
  - `latitude`: Float between -90 and 90
  - `longitude`: Float between -180 and 180
  - `riskLevel`: Optional, must be 'low', 'medium', or 'high'

### Utilities

#### `utils/geofence.js`
- **Purpose**: Geospatial calculations for geofencing.
- **Functions**:
  - `isPointInsideZone`: Ray casting algorithm to check if point is inside polygon
  - `distanceBetweenPoints`: Haversine formula to calculate distance between two lat/lng points

## Application Flow

1. **Server Startup**:
   - Load environment variables
   - Connect to MongoDB
   - Set up Express app with middleware and routes
   - Initialize Socket.IO
   - Start HTTP server

2. **User Registration/Login**:
   - User registers with name, email, password
   - Password hashed with bcrypt
   - User logs in, receives access token (15min) and refresh token (7d)

3. **Location Updates**:
   - Authenticated user sends location data
   - Location stored in database
   - Real-time broadcast via Socket.IO
   - Checked against all zones for alerts

4. **Zone/Incident Management**:
   - Users create incident reports
   - System prevents duplicate nearby incidents
   - Nearby users notified for verification
   - Users vote to confirm/reject incidents
   - Sufficient confirmations promote incident to verified zone
   - Authorities can override status

5. **Real-time Communication**:
   - Socket.IO handles live updates for location changes, zone alerts, and zone status changes
   - Enables real-time geofencing alerts

6. **Session Management**:
   - JWT access tokens for API authentication (short-lived)
   - Refresh tokens for session persistence (long-lived)
   - Logout invalidates refresh tokens

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on sensitive endpoints
- Input validation with express-validator
- Role-based access control
- CORS configuration
- Environment variable configuration

## Real-time Features

- Live location broadcasting
- Zone entry/exit alerts
- Near-zone proximity alerts
- Incident verification notifications
- Zone status updates

This backend provides a comprehensive geofencing platform with user-generated content, community verification, and real-time safety alerts.