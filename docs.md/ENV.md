# Environment Variables Guide

Complete reference for all environment variables required by the Finn platform.

## Overview

Environment variables are stored in the `.env` file in the project root. Never commit this file to version control. Copy `.env.example` and fill in your actual values.

## Core Configuration

### Database

```env
DATABASE_URL="postgresql://username:password@localhost:5434/finn?schema=public"
```

**Format**: `postgresql://[user]:[password]@[host]:[port]/[database]?schema=[schema]`

**Components**:
- `user`: PostgreSQL username
- `password`: PostgreSQL password
- `host`: Database server hostname (localhost for local development)
- `port`: PostgreSQL port (default 5432, example uses 5434)
- `database`: Database name (e.g., "finn")
- `schema`: Database schema (default: "public")

**Example**:
```env
DATABASE_URL="postgresql://bornali:quadir@localhost:5434/finn?schema=public"
```

### Node Environment

```env
NODE_ENV="production"
```

**Values**:
- `development` - Local development with debug logging
- `production` - Production deployment with optimizations
- `test` - Test environment

### Server Port

```env
PORT=3000
```

The port the API server will listen on.

### JWT Secret

```env
JWT_SECRET="BY-BENCH-MARKTER-PLACE-NEST-BACKEND"
```

Secret key for JWT token signing and verification. Use a strong, random string in production.

**Requirements**:
- Minimum 32 characters for production
- Use cryptographically secure random string
- Never share or commit to version control

**Generate a secure key**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Email Configuration (Gmail SMTP)

### Mail User

```env
MAIL_USER="shazan.softvence@gmail.com"
```

Gmail account for sending emails (password reset, notifications, etc.).

### Mail Password

```env
MAIL_PASS="qs-f zonx xhry tpj-"
```

Gmail App Password (NOT your regular Gmail password).

**How to generate**:
1. Enable 2-Factor Authentication on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Copy the generated 16-character password
5. Format with spaces: `xxxx xxxx xxxx xxxx`

**Important**: This is NOT your Gmail password. Use the generated App Password only.

---

## Stripe Configuration

### Stripe Secret Key

```env
STRIPE_SECRET_KEY="sk_test_51234567890abcdefghijklmnop"
```

Secret API key for server-side Stripe operations. Starts with `sk_test_` (testing) or `sk_live_` (production).

**Where to find**:
1. Log in to Stripe Dashboard
2. Navigate to Developers → API Keys
3. Copy the "Secret Key"

**Keys**:
- **Test Mode**: Use `sk_test_*` for development (no real charges)
- **Live Mode**: Use `sk_live_*` for production (processes real payments)

### Stripe Webhook Secret

```env
STRIPE_WEBHOOK_SECRET="whsec_1234567890abcdefghijklmnop"
```

Webhook signing secret for verifying Stripe webhook events. Starts with `whsec_`.

**Where to find**:
1. Developers → Webhooks
2. Click your endpoint
3. Copy "Signing secret"

**Setup Webhook Endpoint**:
1. Go to Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://yourdomain.com/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Cloudinary Configuration

### Cloudinary Cloud Name

```env
CLOUDINARY_NAME="your_cloud_name"
```

Your Cloudinary account identifier.

### Cloudinary API Key

```env
CLOUDINARY_API_KEY="123456789012345"
```

API key for authenticating Cloudinary requests.

### Cloudinary API Secret

```env
CLOUDINARY_API_SECRET="abcdefghijklmnop1234567890"
```

Secret key for signing Cloudinary requests. Keep this secure (server-side only).

**Where to find**:
1. Log in to Cloudinary Dashboard
2. Go to Settings → API Keys
3. Copy: `Cloud Name`, `API Key`, `API Secret`

**Important**: Never expose `API_SECRET` in client-side code. Use server-side only.

---

## Platform Configuration

### Platform Fee Percent

```env
PLATFORM_FEE_PERCENT=10
```

Platform commission as a percentage (0-100). Applied to all transactions.

**Example**:
- Transaction: $100
- Platform fee (10%): $10
- Seller receives: $90

---

## Frontend Configuration

### Frontend URL

```env
FRONTEND_URL="https://finn.example.com"
```

Frontend application URL. Used for:
- Email verification links
- Password reset links
- CORS configuration
- Redirects

**Format**: Complete URL with protocol

**Examples**:
```env
# Development
FRONTEND_URL="http://localhost:3000"

# Production
FRONTEND_URL="https://finn.example.com"
```

---

## Complete .env Example

```env
# Database
DATABASE_URL="postgresql://bornali:quadir@localhost:5434/finn?schema=public"

# Server
PORT=3000
NODE_ENV="production"

# Authentication
JWT_SECRET="BY-BENCH-MARKTER-PLACE-NEST-BACKEND"

# Email (Gmail SMTP)
MAIL_USER="shazan.softvence@gmail.com"
MAIL_PASS="qs-f zonx xhry tpj-"

# Stripe
STRIPE_SECRET_KEY="sk_test_51234567890abcdefghijklmnop"
STRIPE_WEBHOOK_SECRET="whsec_1234567890abcdefghijklmnop"

# Cloudinary
CLOUDINARY_NAME="your_cloud_name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnop1234567890"

# Platform
PLATFORM_FEE_PERCENT=10
FRONTEND_URL="https://finn.example.com"
```

---

## Development vs Production

### Development Environment

```env
NODE_ENV="development"
DATABASE_URL="postgresql://user:pass@localhost:5434/finn_dev?schema=public"
PORT=3000
STRIPE_SECRET_KEY="sk_test_..." # Test key (no real charges)
FRONTEND_URL="http://localhost:3000"
```

**Characteristics**:
- Test keys for external services (Stripe, Cloudinary)
- Local database
- Debug logging enabled
- Relaxed security settings

### Production Environment

```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:pass@prod-server:5432/finn?schema=public"
PORT=3000
STRIPE_SECRET_KEY="sk_live_..." # Live key (real charges)
FRONTEND_URL="https://finn.example.com"
```

**Characteristics**:
- Live API keys
- Remote database with backups
- Optimized performance
- Enhanced security
- Monitoring enabled

---

## Security Best Practices

1. **Never commit .env to version control**
   - Add `.env` to `.gitignore`
   - Use `.env.example` with placeholder values

2. **Use strong secrets**
   - JWT_SECRET: minimum 32 characters, random
   - Generate with: `openssl rand -hex 32`

3. **Rotate secrets regularly**
   - Especially API keys and secrets
   - Update in .env and service provider

4. **Restrict permissions**
   - .env file should be readable by application only
   - Chmod 600 on Unix systems

5. **Use environment-specific keys**
   - Separate test and production API keys
   - Never use production keys in development

6. **Monitor secret access**
   - Audit logs for API key usage
   - Alert on suspicious activity
   - Revoke compromised keys immediately

---

## Troubleshooting

### "DATABASE_URL is not set"
- Ensure `.env` exists in project root
- Check DATABASE_URL variable is present
- Verify PostgreSQL connection string format

### "Invalid Stripe key"
- Verify `STRIPE_SECRET_KEY` starts with `sk_test_` or `sk_live_`
- Check key hasn't been rotated/regenerated
- Confirm environment matches (test vs live)

### "Cloudinary authentication failed"
- Verify `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Check keys haven't expired or been revoked
- Ensure no extra whitespace in values

### "Email not sending"
- Verify Gmail app-specific password is used (not regular password)
- Enable 2-Factor Authentication on Gmail account
- Check Gmail account hasn't been locked
- Verify MAIL_USER matches account email

### "JWT token invalid"
- Ensure JWT_SECRET hasn't changed between requests
- Check token hasn't expired
- Verify secret matches between signing and verification

---

## Variable Reference

| Variable | Type | Required | Example |
|----------|------|----------|---------|
| DATABASE_URL | String | Yes | postgresql://user:pass@localhost:5434/finn |
| NODE_ENV | String | Yes | production |
| PORT | Number | No (Default: 3000) | 3000 |
| JWT_SECRET | String | Yes | BY-BENCH-MARKTER-PLACE-NEST-BACKEND |
| MAIL_USER | String | Yes | shazan.softvence@gmail.com |
| MAIL_PASS | String | Yes | qs-f zonx xhry tpj- |
| STRIPE_SECRET_KEY | String | Yes | sk_test_... |
| STRIPE_WEBHOOK_SECRET | String | Yes | whsec_... |
| CLOUDINARY_NAME | String | Yes | your_cloud_name |
| CLOUDINARY_API_KEY | String | Yes | 123456789012345 |
| CLOUDINARY_API_SECRET | String | Yes | abcdefghijklmnop1234567890 |
| PLATFORM_FEE_PERCENT | Number | Yes | 10 |
| FRONTEND_URL | String | Yes | https://finn.example.com |

For setup instructions, see [SETUP.md](./SETUP.md)
