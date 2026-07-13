# Setup Guide - Finn Platform

Complete step-by-step guide to set up the Finn marketplace platform.

## Prerequisites

- **Node.js**: v16.0.0 or higher
- **npm** or **yarn**: Package manager
- **PostgreSQL**: v12 or higher
- **Git**: Version control

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd Finn-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration. See [ENV.md](./ENV.md) for details.

### 4. Database Setup

#### PostgreSQL Connection

Ensure PostgreSQL is running and accessible:

```bash
# Test connection
psql -h localhost -U bornali -d finn
```

#### Initialize Prisma

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# View database in Prisma Studio (optional)
npx prisma studio
```

### 5. Start Development Server

```bash
npm run start:dev
```

Expected output:
```
Finn API running on http://localhost:3000
```

## External Services Setup

### Stripe

1. **Create Account**: https://stripe.com
2. **Get API Keys**:
   - Go to Developers → API Keys
   - Copy `Secret Key` (starts with `sk_test_`)
   - Copy `Webhook Secret` (starts with `whsec_`)
3. **Update .env**:
   ```
   STRIPE_SECRET_KEY=sk_test_51234567890...
   STRIPE_WEBHOOK_SECRET=whsec_1234567890...
   ```

### Cloudinary

1. **Create Account**: https://cloudinary.com
2. **Get Credentials**:
   - Dashboard → Settings
   - Copy `Cloud Name`, `API Key`, `API Secret`
3. **Update .env**:
   ```
   CLOUDINARY_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Gmail (Email Service)

1. **Enable 2-Factor Authentication** on Gmail account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select Mail and Windows Computer
   - Copy the generated password
3. **Update .env**:
   ```
   MAIL_USER=your_email@gmail.com
   MAIL_PASS=xxxx xxxx xxxx xxxx
   ```

## Database Schema Initialization

All tables are created automatically via Prisma migrations. Key tables include:

- `Auth` - User accounts and authentication
- `SellerProfile` - Seller business information
- `Ad` - Marketplace listings
- `Bid` - Auction bids
- `Payment` - Transaction records
- `Message` - User conversations
- `Comment` - Product reviews and comments
- `Category` - Product categories
- `SubCategory` - Category subdivisions

See [DATABASE.md](./DATABASE.md) for complete schema details.

## Development Commands

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Run production server
npm run start:prod

# Run tests
npm run test

# Format code
npm run lint

# Generate Prisma client
npx prisma generate

# View database UI
npx prisma studio
```

## Common Issues

### PostgreSQL Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5434
```

**Solution**: Ensure PostgreSQL is running on the correct port (5434 in your config).

```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start
```

### Prisma Migration Error

```
Error: database "finn" does not exist
```

**Solution**: Create the database first.

```bash
createdb -U bornali finn
npx prisma migrate dev
```

### Environment Variables Not Found

Ensure `.env` file is in the project root and contains all required variables. See [ENV.md](./ENV.md).

## Next Steps

1. Review [API.md](./API.md) for endpoint documentation
2. Configure external services (Stripe, Cloudinary, Gmail)
3. Run development server and test endpoints
4. Check [DATABASE.md](./DATABASE.md) for schema reference
5. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before making changes

## Production Deployment

Before deploying to production:

1. Set `NODE_ENV=production` in `.env`
2. Update `FRONTEND_URL` to production domain
3. Use production API keys for Stripe, Cloudinary
4. Enable HTTPS
5. Set up automated backups for PostgreSQL
6. Configure monitoring and logging
7. Review security best practices

For detailed deployment instructions, see your hosting provider's documentation.
