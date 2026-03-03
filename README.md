# Simple App Launcher

A clean app launcher dashboard with an admin panel, built with **Express** + **Turso (libSQL)**.

## Features
- Browse and launch apps from a stylish dashboard
- Admin panel to add, edit, and delete apps
- Password-protected admin actions
- Persistent storage via Turso (serverless SQLite)

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/your-username/simple.git
cd simple
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the example file and fill in your own values:
```bash
cp .env.example .env
```

Edit `.env`:
```
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here
ADMIN_PASSWORD=your_secure_password_here
```

> Get your Turso credentials at [turso.tech](https://turso.tech)

### 4. Start the server
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
```
simple/
├── public/
│   ├── index.html      # Main dashboard
│   ├── admin.html      # Admin panel
│   ├── script.js       # Frontend logic
│   └── style.css       # Styles
├── server.js           # Express server + API
├── .env.example        # Environment variable template
└── package.json
```

## Admin Panel
Visit `/admin` to manage your apps. You'll need the `ADMIN_PASSWORD` you set in `.env`.
