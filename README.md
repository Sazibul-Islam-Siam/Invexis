# Invexis — A Smart Inventory Management System

A web-based inventory management system built with the MERN stack (MongoDB, Express.js, React, Node.js) that integrates real-time stock monitoring with demand forecasting.

## Features

- **Multi-role Access**: Admin, Supplier, and Staff roles with distinct permissions
- **Real-time Stock Monitoring**: Track inventory levels with low-stock alerts
- **Sales Management**: Record transactions and generate invoices
- **Restock Workflow**: Admin-to-Supplier restock request pipeline
- **Demand Forecasting**: ML-based predictions using historical sales data
- **Reports & Dashboards**: Visual KPIs, charts, and exportable reports (PDF/CSV)

## Tech Stack

| Layer       | Technology             |
|-------------|------------------------|
| Frontend    | React, Vite, Tailwind CSS |
| Backend     | Node.js, Express.js    |
| Database    | MongoDB, Mongoose      |
| Auth        | JWT, bcrypt            |

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local instance)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd invexis
   ```

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install client dependencies:
   ```bash
   cd client
   npm install
   ```

4. Create environment files:
   ```bash
   # In the server/ directory, copy .env.example to .env
   cp ../.env.example server/.env
   ```

5. Start the development servers:
   ```bash
   # Terminal 1 — Backend
   cd server
   npm run dev

   # Terminal 2 — Frontend
   cd client
   npm run dev
   ```

## Project Structure

```
invexis/
├── client/              # React frontend
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Page-level components
│       ├── context/     # React Context (auth, etc.)
│       ├── services/    # API call functions
│       └── utils/       # Helper functions
├── server/              # Express backend
│   ├── config/          # DB connection & config
│   ├── controllers/     # Route handler logic
│   ├── middleware/       # Auth, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   └── utils/           # Helper functions
└── README.md
```

## Author

**Sazibul Islam Siam** — ID: 22203045  
Department of CSE, IUBAT

## Course

CSC 490 — Submitted to Naeem Mia, Lecturer, Department of CSE
