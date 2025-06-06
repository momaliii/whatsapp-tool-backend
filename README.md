# WhatsApp Tool Backend

This is the backend server for the WhatsApp Tool with Admin Dashboard.

## Features
- User authentication (signup/login)
- Points system for SaaS functionality
- License key redemption
- Admin dashboard API
- Usage tracking

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key_min_32_chars
   ADMIN_SECRET=your_admin_password
   PORT=5000
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Run production server:**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Points System
- `POST /api/points/check` - Check if user has enough points
- `POST /api/points/deduct` - Deduct points for operation
- `POST /api/points/redeem` - Redeem license key

### Admin
- `GET /api/admin/users` - Get all users (requires admin secret)
- `POST /api/admin/keys/generate` - Generate license keys
- `GET /api/admin/keys` - Get all license keys
- `PUT /api/admin/users/:id` - Update user

### Health Check
- `GET /api/health` - Check if server is running

## Deployment

See `BACKEND_DEPLOYMENT_GUIDE.md` in the root directory for detailed deployment instructions.

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (required)
- `JWT_SECRET` - Secret key for JWT tokens (required)
- `ADMIN_SECRET` - Password for admin access (required)
- `PORT` - Server port (default: 5000)

## License

ISC "# whatsapp-backend" 
"# whatsapp-backend" 
