# Attendly 🚀

A modern Attendance Management System built using the MERN Stack.

[🌐 Live Demo](https://attendlyapp-henna.vercel.app)



---

## Features

### Employee
- Secure Registration & Login
- JWT Authentication
- Attendance Check-In
- Attendance Check-Out
- Attendance History
- Attendance Percentage Tracking
- Attendance Shortage Detection (<75%)
- Dark / Light Mode
- Responsive Dashboard

### Admin
- Admin Dashboard
- View Employee Attendance
- User Management
- Delete Users
- Attendance Monitoring
- Role-Based Access Control

---

## Tech Stack

Frontend:
- React.js
- Tailwind CSS
- React Router
- Axios
- Context API

Backend:
- Node.js
- Express.js
- JWT Authentication

Database:
- MongoDB Atlas
- Mongoose

Deployment:
- Vercel (Frontend)
- Render (Backend)

---

## Installation

### Clone Repository

```bash
git clone https://github.com/dev-himanshu-sharma/attendly.git
```

### Backend Environment

Create a `.env` file inside `backend/` with at least the following values:

```env
MONGO_URI="your-mongodb-connection-string"
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
EMAIL_FROM="Attendance App <no-reply@example.com>"
```

If email is configured, the backend will:
- send a registration receipt to new users
- notify admins when a new user signs up or requests biometric login
- send approval emails after admin verifies email or biometric access

### Admin Setup

To use the admin approval flow, ensure there is at least one admin user in the database with `role: "admin"`. Admins can then:
- verify new user email addresses
- approve biometric login requests
- set location restrictions for employees

### Notes

- New users must wait for admin email approval before logging in.
- After email verification, users can request biometric login from the dashboard.
- Admin approval of biometric login enables biometric-backed attendance.
