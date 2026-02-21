# Doctor Consultation App - Setup Guide

This is a full-stack doctor consultation application built with Next.js (frontend) and Node.js/Express (backend).

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** or **pnpm** - Comes with Node.js
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud)
- **Git** - [Download](https://git-scm.com/)

## Project Structure

```
doctor-consultation-app/
├── backend/          # Node.js/Express backend API
├── frontend/         # Next.js frontend application
└── SETUP.md         # This file
```

## Environment Variables Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/doctor-consultation
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/doctor-consultation

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Google OAuth Configuration (for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Razorpay Configuration (for payments)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret-key
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Zego Cloud Configuration (for video calls)
NEXT_PUBLIC_ZEGO_APP_ID=your-zego-app-id
NEXT_PUBLIC_ZEGO_SERVER_SECRET=your-zego-server-secret
```

## Setup Instructions

### Step 1: Clone the Repository

If you haven't already, clone or navigate to the project directory:

```bash
cd doctor-consultation-app
```

### Step 2: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` directory and add the environment variables as shown above.

4. Make sure MongoDB is running:
   - **Local MongoDB**: Start MongoDB service on your system
   - **MongoDB Atlas**: Use the connection string from your Atlas cluster

5. Start the backend server:
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

   The backend server will start on `http://localhost:8000` (or the PORT specified in your `.env` file).

### Step 3: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the `frontend/` directory and add the environment variables as shown above.

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend application will start on `http://localhost:3000`.

### Step 4: Verify Installation

1. **Backend Health Check**: Open `http://localhost:8000/health` in your browser. You should see a JSON response with a timestamp.

2. **Frontend**: Open `http://localhost:3000` in your browser. You should see the landing page.

## Getting OAuth Credentials

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the consent screen if prompted
6. Add authorized redirect URI: `http://localhost:8000/api/auth/google/callback`
7. Copy the Client ID and Client Secret to your backend `.env` file

### Razorpay Setup

1. Sign up at [Razorpay](https://razorpay.com/)
2. Go to Settings → API Keys
3. Generate API keys (use Test keys for development)
4. Copy the Key ID and Key Secret to your backend `.env` file

### Zego Cloud Setup (for Video Calls)

1. Sign up at [Zego Cloud](https://www.zegocloud.com/)
2. Create a new project
3. Get your App ID and Server Secret from the dashboard
4. Add them to your frontend `.env.local` file

## Available Scripts

### Backend Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon (auto-reload)

### Frontend Scripts

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server (after building)

## API Endpoints

The backend provides the following API routes:

- `/api/auth` - Authentication routes (login, signup, Google OAuth)
- `/api/doctor` - Doctor-related routes
- `/api/patient` - Patient-related routes
- `/api/appointment` - Appointment management routes
- `/api/payment` - Payment processing routes
- `/health` - Health check endpoint

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `mongod` (for local) or check your Atlas connection string
- Verify the `MONGO_URI` in your `.env` file is correct
- Check MongoDB logs for connection errors

### Port Already in Use

- If port 8000 is in use, change the `PORT` in backend `.env`
- If port 3000 is in use, Next.js will automatically use the next available port (3001, 3002, etc.)

### CORS Issues

- Ensure `ALLOWED_ORIGINS` in backend `.env` includes your frontend URL
- Check that credentials are properly configured

### Module Not Found Errors

- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload in development mode
2. **API Testing**: Use tools like Postman or Thunder Client to test API endpoints
3. **Database**: Use MongoDB Compass or Studio 3T to view and manage your database
4. **Logs**: Check console logs for debugging information

## Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in your `.env` file
2. Use a process manager like PM2: `pm2 start server.js`
3. Configure your hosting provider's environment variables
4. Ensure MongoDB is accessible (use MongoDB Atlas for cloud hosting)

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred hosting platform
3. Update `NEXT_PUBLIC_API_URL` to point to your production backend URL
4. Configure environment variables in your hosting platform

## Support

For issues or questions:
- Check the console logs for error messages
- Verify all environment variables are set correctly
- Ensure all dependencies are installed
- Check that MongoDB is running and accessible

---

**Note**: Remember to never commit `.env` files to version control. Add them to `.gitignore` if not already present.

