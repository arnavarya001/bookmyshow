# 🍿 BookMyShow Clone – Full Stack Movie Ticket Booking Application

🚀 A modern, responsive, and feature-complete **BookMyShow** clone built using the **MVC (Model-View-Controller)** architecture with **Node.js, Express, MongoDB (Mongoose), EJS, Passport.js, and Razorpay**.

---

## ✨ Key Features

* 🎬 **Movies Catalog & Hero Spotlight**: Explore now showing and upcoming blockbuster movies with genre & language filters.
* 📍 **Cinema & Theatre Locator**: Browse multi-screen cinema chains (PVR, INOX, Cinepolis) with an interactive **Leaflet Map**.
* 🗓️ **Showtime Schedules & Multi-Date Picker**: Dynamic showtime selector with 5-day date tabs and format pills (IMAX 3D, 2D, 4DX).
* 💺 **Interactive 2D Seat Matrix**: Visual auditorium seat selector with **Recliner**, **Prime**, and **Classic** rows, live seat counter, and instant price calculation.
* 🍿 **Concessions & F&B Add-ons**: Add gourmet snacks (Caramel Popcorn, Nachos, Pepsi Combo) to your ticket.
* 💳 **Seamless Payments**: Integrated with Razorpay and includes a 1-click **Instant Demo Checkout** for fast local testing.
* 🎟️ **Digital M-Ticket**: High-fidelity digital ticket stub complete with perforated tear line, booking reference ID, screen, audi number, and live **QR code**.
* 📜 **Booking History & Cancellation**: View past bookings, download/print tickets, or cancel reservations with automatic seat release.
* ⭐ **Movie Ratings & Reviews**: 1-10 rating system with reviews and recalculation of movie averages.
* ❤️ **Personalized Watchlist**: Add/remove movies from your personal watchlist via dynamic AJAX requests.
* 🔐 **Secure Authentication**: Built with Passport.js local strategy with role-based permissions (`user`, `admin`).
* 🎨 **Signature BookMyShow Aesthetics**: Custom dark mode with crimson accents (`#F84464`, `#151821`), glassmorphism, Plus Jakarta Sans typography, and micro-animations.

---

## 🛠️ Tech Stack

### Frontend
* **EJS** (Embedded JavaScript Templates) with **ejs-mate** layouts
* **Vanilla CSS** with modern design tokens & dark mode surfaces
* **Bootstrap 5.3** & **FontAwesome 6**
* **Leaflet.js** (Interactive OpenStreetMap / Cinema locator)

### Backend
* **Node.js & Express.js** (MVC architecture)
* **MongoDB & Mongoose** (Relational-style object modeling)
* **Passport.js & passport-local-mongoose** (Authentication & session management)
* **connect-mongo** (Persistent MongoDB session store)
* **Multer & Cloudinary** (Image handling with local disk fallback)
* **Razorpay SDK** (Payments with HMAC-SHA256 signature verification)

---

## 📂 Project Structure

```
bookmyshow-clone/
├── controllers/          # Business logic (movie, theatre, show, booking, review, user)
├── models/               # Mongoose schemas (Movie, Theatre, Show, Booking, Review, User)
├── routes/               # Express routers (movie, theatre, show, booking, review, user)
├── views/                # EJS templates
│   ├── layouts/          # boilerplate.ejs layout
│   ├── includes/         # navbar, footer, flash partials
│   ├── movies/           # index, show, new, edit, search
│   ├── shows/            # select-show, seat-layout
│   ├── bookings/         # payment, ticket, history
│   ├── theatres/         # index, show
│   ├── users/            # login, signup
│   └── watchlist/        # index
├── public/               # Static assets
│   ├── css/              # style.css design system
│   └── js/               # script.js, seat-selection.js
├── init/                 # Database seed data (data.js, index.js)
├── middleware.js         # Authentication, authorization, and validation middleware
├── cloudConfig.js        # Cloudinary and local disk storage handler
├── app.js                # Server entry point
└── package.json
```

---

## ⚙️ Installation & Quickstart

### 1️⃣ Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `ATLASDB_URL` points to your MongoDB instance (defaults to `mongodb://127.0.0.1:27017/bookmyshow`).

### 2️⃣ Seed the Database
Populate the database with blockbuster movies, cinema halls, showtimes, and reviews:
```bash
npm run seed
```

### 3️⃣ Start the Server
```bash
npm start
```
Open **http://localhost:8080** in your browser.

---

## 🔑 Default Accounts (Created by Seed)
* **Admin**: `username: admin` | `password: admin123` (Access to add/edit/delete movies)
* **User**: `username: cinephile` | `password: user123`
