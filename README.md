# 🍔 TastyBites 90 — Restaurant Management & Dine-In System

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green.svg)
![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-brightgreen.svg)
![Database](https://img.shields.io/badge/Database-MongoDB%20%2B%20Mongoose-emerald.svg)
![Deployment](https://img.shields.io/badge/Deploy-Vercel-black.svg)

> A modern, full-stack restaurant web application inspired by classic 90's American diners. Features online ordering with live GPS delivery coordinates, a complete Dine-In table reservation system, and a comprehensive Owner/Admin operations dashboard.

---

## 🌟 Key Features

### 🛒 Customer Experience
- **Interactive Menu Catalog**: Filter by category (Burgers, Pizza, Sides, Drinks, Desserts), search dishes, and view real-time availability.
- **Cart & Order Tray**: Real-time quantity adjustments, subtotal calculation, and conditional free delivery tier (free delivery on orders ₹500+).
- **Express Checkout with Live GPS**: Integrated browser Geolocation API detects delivery coordinates with accuracy checks and Google Maps route verification.
- **Cash on Delivery (COD)**: Seamless checkout experience without third-party payment gateway friction.
- **Order Tracking**: Real-time order progress timeline (`Pending` → `Confirmed` → `Preparing` → `Out for Delivery` → `Delivered`).
- **Dine-In Table Booking**: 
  - Date and time slot picker calculated from live restaurant capacity.
  - Party size selection (1 to 10 guests) with instant slot availability check.
  - Customer reservation dashboard with cancellation support.

### 👑 Admin & Owner Command Portal
- **Role-Based Access Control (RBAC)**:
  - **Owner**: Complete system control — revenue metrics, dish catalog CRUD, admin verification, and customer management.
  - **Admin**: Operations control — kitchen order fulfillment and reservation handling.
- **Direct Image Upload**: Drag-and-drop file picker with instant preview for menu dishes (supports Cloudinary storage with automatic local fallback).
- **Kitchen & Order Dispatch Desk**: Filter orders by status, update delivery progress, and view diner live GPS dropoff pins.
- **Dine-In Operations & Settings**:
  - Live table booking manager (confirm, complete, or cancel bookings).
  - Configurable restaurant opening hours, closing hours, slot intervals (15/30/45/60 mins), and max floor seating capacity.
- **Admin Verification**: Pending admin accounts require Owner review and approval before gaining operational access.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7 |
| **Backend** | Node.js, Express.js (v5), RESTful Architecture |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs, HTTP Bearer Auth |
| **Security** | Helmet.js, Express Rate Limit, CORS with whitelist |
| **Media & Storage** | Multer (Memory Storage), Cloudinary API, Local Filesystem Fallback |
| **Deployment** | Vercel Serverless (Backend & Frontend) |

---

## 📁 Project Structure

```text
web-project/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Footer, ImageUpload, etc.)
│   │   ├── context/            # Global state (CartContext, AuthContext)
│   │   ├── pages/              # Routed views (Home, Menu, Checkout, DineIn, AdminDashboard, etc.)
│   │   ├── services/           # Axios / Fetch API client layer (api.js)
│   │   ├── App.jsx             # Route definitions & layout wrappers
│   │   └── main.jsx            # React root entry point
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
├── server/                     # Backend API (Node.js + Express)
│   ├── config/                 # Database connection (db.js)
│   ├── controllers/            # Route business logic (menu, order, auth, dineIn, admin)
│   ├── middleware/             # Auth JWT, role checks (admin/owner), error handling
│   ├── models/                 # Mongoose schemas (User, MenuItem, Order, DineIn, etc.)
│   ├── routes/                 # Express API endpoints
│   ├── services/               # Image upload & storage service (Cloudinary / disk)
│   ├── utils/                  # Seed scripts (createAdmin.js, createOwner.js)
│   ├── package.json
│   ├── server.js               # Express application entry
│   └── vercel.json             # Vercel serverless configuration
│
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas cluster)
- [Git](https://git-scm.com/)

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/tastybites.git
cd tastybites
```

---

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/tastybites?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_ORIGIN=http://localhost:5173

# Optional: Cloudinary configuration for image uploads
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

*(Optional)* Create the initial Owner account:
```bash
npm run create-owner
```

Start the backend server:
```bash
npm run dev
# Server running at http://localhost:5000
```

---

### 3. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
# App running at http://localhost:5173
```

---

## 📡 API Reference Overview

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/register` | Register a new customer account | Public |
| `POST` | `/login` | Login with email and password | Public |
| `GET` | `/me` | Get current authenticated user profile | Authenticated |

### 🍔 Menu Items (`/api/menu-items`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | Get all available menu dishes | Public |
| `POST` | `/` | Add a new menu item | Owner only |
| `PUT` | `/:id` | Update an existing menu item | Owner only |
| `DELETE` | `/:id` | Delete a menu item and associated image | Owner only |

### 🧾 Orders (`/api/orders`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/` | Place a new order with items and GPS location | Authenticated |
| `GET` | `/my-orders` | Get order history for current customer | Authenticated |
| `GET` | `/:id` | Get details of a specific order | Authenticated |
| `GET` | `/` | List all orders with filters | Admin / Owner |
| `PATCH` | `/:id/status` | Update fulfillment status | Admin / Owner |

### 🍽️ Dine-In Reservations (`/api/dine-in`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/settings` | Get public restaurant booking hours & capacity | Public |
| `GET` | `/availability` | Check time slot availability for a given date | Public |
| `POST` | `/reservations` | Create a new table booking | Authenticated |
| `GET` | `/my-reservations` | Get customer reservations | Authenticated |
| `PATCH` | `/reservations/:id/cancel` | Cancel a reservation | Authenticated |

### 🛠️ Admin Dine-In Operations (`/api/admin/dine-in`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/reservations` | List all reservations with date/status filters | Admin / Owner |
| `PATCH` | `/reservations/:id/status` | Update reservation status (`confirmed`, `completed`, `cancelled`) | Admin / Owner |
| `GET` | `/settings` | View current restaurant configuration | Admin / Owner |
| `PUT` | `/settings` | Update restaurant opening/closing times & capacities | Owner only |

### 🖼️ File Upload (`/api/upload`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/image` | Upload image file (JPG, PNG, WEBP max 5MB) | Admin / Owner |

---

## 🔒 Security Best Practices
- **Password Hashing**: Salted hashing with `bcryptjs` before persistence.
- **JWT Authentication**: Stateless, signed tokens passed via `Authorization: Bearer <token>`.
- **CORS Whitelisting**: Restricted origins via `CLIENT_ORIGIN` environment variable.
- **Rate Limiting**: `express-rate-limit` protects auth routes from brute-force attempts.
- **Input Sanitization & Validation**: Server-side validation on all orders, inputs, and coordinates.

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
