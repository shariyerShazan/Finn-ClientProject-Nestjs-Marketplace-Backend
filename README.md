# Shazan - Marketplace & Auction Platform

**LiveLink: https://shazan-ad-marketplace-project.onrender.com**
**Swagger: https://shazan-ad-marketplace-project.onrender.com/docs**

A full-featured marketplace and auction platform backend built with NestJS and PostgreSQL. Shazan enables users to buy, sell, and auction products with secure payments, real-time messaging, and a comprehensive seller management system.

## Features

### Core Functionality
- **User Authentication** - Email/password authentication with JWT and OTP verification
- **Marketplace Listings** - Create, update, and manage product listings (Fixed price & Auction)
- **Auction System** - Time-based auctions with bidding functionality
- **Payment Processing** - Stripe integration for secure transactions with platform fee splitting
- **Seller Management** - Seller verification, Stripe account linking, and seller profiles
- **Commenting & Reviews** - Thread-based comments on listings
- **Real-time Messaging** - User-to-user messaging with conversation management
- **Image Management** - Cloudinary integration for product image hosting
- **Categorization** - Hierarchical category system with custom specification fields

### User Roles
- **User** - Can browse, purchase, bid, and message
- **Seller** - Can list products and manage inventory
- **Admin** - Platform management and seller verification

## Tech Stack

- **Backend**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Payments**: Stripe
- **File Storage**: Cloudinary
- **Email**: Gmail SMTP
- **Environment**: Node.js

## Project Structure

```
├── src/
│   ├── auth/              # Authentication module
│   ├── users/             # User management
│   ├── sellers/           # Seller profiles
│   ├── ads/               # Marketplace listings
│   ├── bids/              # Bidding system
│   ├── payments/          # Payment processing
│   ├── messages/          # Messaging system
│   ├── comments/          # Comments & reviews
│   ├── categories/        # Category management
│   └── common/            # Shared utilities
├── prisma/
│   └── schema.prisma      # Database schema
├── .env                   # Environment variables
└── package.json           # Dependencies
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shazan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000`

## Documentation

- **[Setup Guide](./SETUP.md)** - Detailed setup and configuration instructions
- **[Database Schema](./DATABASE.md)** - Complete database documentation
- **[Environment Variables](./ENV.md)** - Environment configuration guide
- **[API Endpoints](./API.md)** - API documentation and examples

## Environment Configuration

See [ENV.md](./ENV.md) for detailed environment variable setup.

## Database

See [DATABASE.md](./DATABASE.md) for complete schema documentation and relationships.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on code standards and submission process.

## License

Proprietary - All rights reserved
