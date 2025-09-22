# Classroom Booking - Frontend

⚠️ **Side Note:** This project is designed to work together with its [backend repository](https://github.com/F3rren/backend). It cannot function independently, as it requires a running backend server and database connection. 

University classroom booking system developed in React with Vite.

## Features

- ✅ **Database Integration**: Fully integrated with the backend database  
- ✅ **API /api/rooms/detailed**: Retrieve complete room data with bookings  
- ✅ **Error Handling**: Clear messages when the database is unreachable  
- ✅ **User Management**: Authentication and authorization system  
- ✅ **Admin Dashboard**: Administrative panel for managing rooms and users  
- ✅ **Filtering System**: Advanced search by capacity, floor, and availability  
- ✅ **Responsive Design**: Optimized interface for desktop and mobile  

## Project Structure

```
src/
├── components/     # React components
│ ├── Admin/        # Admin components
│ ├── Auth/         # Authentication
│ ├── Common/       # Shared components
│ ├── Layout/       # Layout and navigation
│ └── Room/         # Room management
├── hooks/          # Custom hooks
├── services/       # API services
├── utils/          # Utilities
└── pages/          # Main pages
```


## Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## API Integration

The system is fully integrated with the backend at http://localhost:8080:

- `GET /api/rooms/detailed` - **Main endpoint: Retrieves all rooms with full details and bookings
- `GET /api/rooms` - **Fallback endpoint**: Retrieves basic room data if the main one is unavailable
- `GET /api/rooms/:id/details` - Retrieves details of a single room

**⚠️ Database Requirements:**
- The backend must be running and accessible on localhost:8080
- The database must contain at least one room to display data
- The `/api/rooms/detailed` endpoint must be implemented and function

**🚨 Error Handling:**
- If the backend is unreachable, a clear error message is displayed
- If the database is empty, the system suggests adding rooms via the admin panel
- No mock data is used – the system works exclusively with real data

## Technologies

- React 18
- Vite
- Tailwind CSS
- React Router DOM

## Project Status

The project has been optimized to use **only real database data**:

✅ **Removed:**
- All mock and fallback data
- Demo mode
- Duplicate and obsolete files
- Test components
- Redundant documentation files

✅ **Implemented:**
- Direct connection to the database
- Improved error handling for connection issues
- Clear informative messages when the database is empty
- Robust system that works only with real data

The system now strictly requires a working backend connection with the `/api/rooms/detailed` endpoint implemented.
