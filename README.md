# Finn Backend - Marketplace & Auction Platform

**Live Link**: [Production Deployment](https://shazan-ad-marketplace-project.onrender.com)  
**API Documentation (Swagger)**: [Swagger UI](https://shazan-ad-marketplace-project.onrender.com/docs)  
*(Note: Deployed under the domain `shazan-ad-marketplace-project` for hosting, serving as the core API server for the Finn application).*

A comprehensive, enterprise-ready marketplace and auction platform backend built with **NestJS**, **Prisma**, **PostgreSQL**, **Stripe**, and **Socket.io**. Finn enables dual listing models (fixed-price and time-based bidding), real-time user messaging, Stripe Connect seller integration, automatic platform fee splitting, and seller subscription memberships.

---

## ⚡ Core Features

*   **Secure Authentication**: JWT-based authentication with OTP verification using Gmail SMTP (Nodemailer).
*   **Dual Price Model**: Set fixed prices or activate time-bound auctions (with support for start, end, base, and release pricing).
*   **Real-time Messaging**: Socket.io-driven bi-directional messaging with conversation blocking, attachment handling, and unread counts.
*   **Stripe Connect Integration**: Links sellers' Stripe accounts to process purchases with automatic 10% platform fee settlements and 90% payouts.
*   **Subscribers & Boosts**: Subscription plans governing listings limits and premium packages (e.g. Gold Boost) to promote items.
*   **Structured Feedback**: Threaded user reviews and comment branches on marketplace listings.
*   **Geo-Tagging**: Geospatial coordinate tracking (latitude & longitude) for location-based listing searches.
*   **API Exploration**: Interactive API documentation generated dynamically via Swagger.

---

## 🛠️ Technology Stack

*   **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
*   **Database**: [PostgreSQL](https://www.postgresql.org/)
*   **ORM**: [Prisma ORM](https://www.prisma.io/)
*   **Payments**: [Stripe SDK](https://stripe.com/)
*   **Websockets**: [Socket.io](https://socket.io/) (Real-time gateway/polling)
*   **Image Management**: [Cloudinary API](https://cloudinary.com/) (Multer Storage Integration)
*   **Emailing**: [Nodemailer](https://nodemailer.com/)

---

## 📂 Project Structure

```
├── src/
│   ├── auth/              # JWT & Register/Login authentication module
│   ├── users/             # User profiles and access security
│   ├── sellers/           # Seller profiles, onboarding, and Stripe linking
│   ├── ads/               # Listing management (Fixed/Auction models)
│   ├── bids/              # Bids and highest-bid resolver for auctions
│   ├── payments/          # Stripe checkout, webhook handler, and fee math
│   ├── messages/          # Conversations and Message history
│   ├── comments/          # Listing reviews and nested comment threads
│   ├── categories/        # Categories & sub-categories (with custom specification schemas)
│   ├── mail/              # Mail services (Nodemailer wrappers)
│   └── common/            # Shared guards, decorators, exceptions, and utilities
├── prisma/
│   ├── schema.prisma      # Main database schema file
│   └── migrations/        # Automatic SQL migration history files
├── docs.md/               # Detailed documentation guides
└── package.json           # Modules, build scripts, and engine parameters
```

---

## ⚙️ Getting Started

### 1. Prerequisites
Verify that you have these installed:
*   [Node.js](https://nodejs.org/) (v16.0.0 or higher)
*   [PostgreSQL](https://www.postgresql.org/) database server running
*   [npm](https://www.npmjs.com/)

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Secrets Setup
Copy the example file and configure it with your credentials:
```bash
cp .env.example .env
# Edit .env with your system configurations.
```
*(Reference the [Environment Variables Guide](./docs.md/ENV.md) for details on setting up Stripe, Cloudinary, and Nodemailer secrets).*

### 4. Migrate the Database
Initialize tables in your PostgreSQL database instance:
```bash
npx prisma migrate dev --name init
```

### 5. Run the Server
Start the server in Development mode with hot-reloading:
```bash
npm run start:dev
```
The server will start, checking endpoints on `http://localhost:3000`.

---

## 📖 Sub-Documentation Guides

Additional backend development manuals are available in [docs.md](./docs.md/):
*   📄 **[Setup Guide](./docs.md/SETUP.md)**: Detailed step-by-step local preparation guide.
*   📄 **[Database Relationships](./docs.md/DATABASE.md)**: Prisma schema overview, database rules, and Entity-Relationship models.
*   📄 **[Environment Variables](./docs.md/ENV.md)**: Details of all required keys (Stripe, Cloudinary, Nodemailer, etc.).
*   📄 **[API Reference Documentation](./docs.md/API.md)**: Exhaustive JSON request/payload references for all REST routes.
*   📄 **[Contributing Guidelines](./docs.md/CONTRIBUITION.md)**: Git conventions, branch naming structure, linting rules, and tests.

---

## ⚖️ License
Proprietary - All rights reserved. Registered by Shariyer Shazan.
