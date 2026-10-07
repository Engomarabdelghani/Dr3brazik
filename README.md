# 💎 Dr. Karam AbdelRazek – Luxury Cosmetics E-Commerce Platform

A modern, luxury-inspired e-commerce platform for cosmetics and skincare, built with **React, TypeScript, Vite, Tailwind CSS and Framer Motion**, backed by a **Node.js + Express + MySQL** API (`server/`).

The project includes a complete customer storefront and a secure admin dashboard for managing products, categories, offers, media, and website settings without requiring a traditional backend server.

---

# ✨ Features

## 🛍️ Customer Storefront

- Responsive luxury UI/UX
- Product catalog with categories & subcategories
- Advanced search, filtering & sorting
- Product details with image gallery
- Related products
- Recently Viewed products
- Wishlist
- Shopping Cart
- Checkout with WhatsApp order confirmation
- Offers & Discounts
- Contact & About pages
- SEO-ready pages
- Mobile optimized

---

## 🔐 Admin Dashboard

A secure admin panel; every admin request is authenticated and authorised by the API.

### Dashboard
- Business statistics
- Products overview
- Categories overview
- Active offers
- Recent products

### Products
- Create products
- Edit products
- Delete products
- Duplicate products
- Drag & Drop image uploads
- Image compression
- Product status management
- Pagination
- Search & filtering

### Categories
- Create categories
- Create subcategories
- Edit
- Delete

### Offers
- Percentage discounts
- Fixed amount discounts
- Category offers
- Product-specific offers
- Automatic activation & expiration
- Live price calculation

### Settings
- Site name
- Logo
- Contact information
- Social media links
- Homepage banners
- Default SEO
- Hero images

---

# 🔒 Authentication & Security

- Admin login with email + password (bcrypt), short-lived access token kept in memory and a rotating refresh token in an httpOnly cookie
- Every `/api/admin/*` route checks the admin on each request; removing someone takes effect immediately
- Owner-only team management (add, remove, reset password)
- Prices, coupons, shipping and stock are calculated and enforced by the server, never trusted from the browser
- Rate limits on login, coupon checks and checkout

---

# 🛠️ Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- TanStack Query

### Backend (`server/`)

- Node.js + Express + TypeScript
- MySQL 8 (mysql2)
- Zod validation
- Cloudinary for images

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Set Up the API and Database

Follow [server/README.md](server/README.md): create the MySQL user, fill in `server/.env`, then

```bash
cd server
npm install
npm run db:migrate
npm run db:seed
npm run admin:create -- --email you@example.com --name "Your Name" --role owner
npm run dev
```

---

## 4. Configure the Frontend

```bash
cp .env.example .env
```

Locally the defaults work: Vite proxies `/api` to the API on port 4000.
In production set `VITE_API_BASE_URL` to the API's absolute URL (e.g. `https://api.dr3brazik.com/api`).

---

## 5. Run Development Server

```bash
npm run dev
```

Application:

```
http://localhost:5173
```

Admin Dashboard:

```
http://localhost:5173/admin/login
```

---

# 📦 Production Build

```bash
npm run build
```

Preview:

```bash
npm run preview
```

---

# 📁 Project Structure

```
src
├── admin            admin dashboard pages and components
├── api              HTTP client, in-memory token store, API types
├── components
├── context          cart, wishlist, recently viewed, admin auth
├── hooks
├── lib/api          one module per feature (products, offers, coupons, orders, ...)
├── pages
└── data

server               Node.js + MySQL API (see server/README.md)
├── migrations       versioned SQL migrations + dev seed
├── scripts          migrate, seed, create-admin
└── src/modules      auth, team, products, pricing, cart, orders, ...

supabase             the previous Supabase schema, kept for the data migration
```

---

# 🌐 Storefront Pages

- Home
- Shop
- Product Details
- Offers
- Wishlist
- Cart
- Checkout
- About
- Contact
- 404

---

# ⚙️ Admin Pages

- Login
- Dashboard
- Orders
- Products
- Categories
- Offers
- Coupons
- Promo Banners
- Shipping Zones
- Social Posts
- Testimonials
- Team

---

# 📌 Notes

- Update your business WhatsApp number in:

```
src/data/constants.ts
```

- Cart, Wishlist, and Recently Viewed are stored locally using Context API + Local Storage.

- Offers created from the Admin Dashboard automatically update product pricing without manual edits.

- Replace placeholder category images with your own Cloudinary assets.

---

# 🔮 Future Improvements

- Online Payment Integration (Paymob / Stripe)
- Customer Accounts
- Product Reviews & Ratings
- Email Notifications
- Analytics Dashboard
- Inventory Management
- Multi-language Support
- Dark Mode
- Shipping Integration

---

# 📄 License

This project was developed for **Dr. Karam AbdelRazek**.

© 2026 All Rights Reserved.
