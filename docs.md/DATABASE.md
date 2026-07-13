# Database Schema - Finn Platform

Complete documentation of the Finn database schema and relationships.

## Overview

The database is designed for a marketplace/auction platform with user authentication, seller management, product listings, bidding, payments, and messaging capabilities.

## Core Tables

### Auth (Users & Authentication)

Stores user account information and authentication data.

```
Auth
├── id (UUID, Primary Key)
├── firstName (String)
├── lastName (String)
├── nickName (String)
├── email (String, Unique)
├── phone (String, Unique)
├── password (String, Hashed)
├── otp (String, Optional) - One-time password
├── otpExpires (DateTime, Optional)
├── profilePicture (String, Optional)
├── otpAttempt (Int, Default: 0)
├── lastLogin (DateTime)
├── isVerified (Boolean, Default: false)
├── isSuspended (Boolean, Default: false)
├── role (Enum: USER, ADMIN, SELLER)
├── isSeller (Boolean, Default: false)
├── createdAt (DateTime)
└── updatedAt (DateTime)

Relations:
├── sellerProfile (1:1) → SellerProfile
├── comments (1:N) → Comment
├── bids (1:N) → Bid
├── postedAds (1:N) → Ad (as Seller)
├── boughtAds (1:N) → Ad (as Buyer)
├── payments (1:N) → Payment
├── sentMessages (1:N) → Message
└── conversations (1:N) → Participant
```

**Key Fields**:
- `email` & `phone` must be unique globally
- `role` determines access levels: USER (buyer), SELLER (verified seller), ADMIN (platform admin)
- OTP fields are used for email verification during signup
- `isVerified` indicates email verification status
- `isSuspended` allows account deactivation

### SellerProfile (Seller Information)

Extended profile for users with seller access.

```
SellerProfile
├── id (UUID, Primary Key)
├── companyName (String)
├── companyWebsite (String, Unique)
├── address (String)
├── city (String)
├── state (String)
├── zip (Int)
├── country (String)
├── status (Enum: PENDING, APPROVED, REJECTED)
├── adminNote (String, Optional)
├── stripeAccountId (String, Unique, Optional)
├── isStripeVerified (Boolean, Default: false)
├── isDeleted (Boolean, Default: false)
├── authId (UUID, Foreign Key) → Auth
└── auth (1:1) → Auth

Constraints:
├── authId is UNIQUE (one seller profile per user)
└── CASCADE delete on Auth deletion
```

**Statuses**:
- `PENDING` - Awaiting admin approval
- `APPROVED` - Seller verified and active
- `REJECTED` - Application rejected

---

## Marketplace Tables

### Category (Product Categories)

Top-level categories for product organization.

```
Category
├── id (UUID, Primary Key)
├── name (String, Unique)
├── slug (String, Unique)
├── image (String, Optional)
├── subCategories (1:N) → SubCategory
└── ads (1:N) → Ad

Examples:
├── Electronics (slug: "electronics")
├── Real Estate (slug: "real-estate")
├── Vehicles (slug: "vehicles")
└── Services (slug: "services")
```

### SubCategory (Category Subdivisions)

Subcategories with custom specification fields.

```
SubCategory
├── id (UUID, Primary Key)
├── name (String)
├── slug (String, Unique)
├── specFields (JSON, Optional) - Custom fields for specs
├── categoryId (UUID, Foreign Key) → Category
├── category (1:1) → Category
└── ads (1:N) → Ad

CASCADE delete on Category deletion

Example specFields:
{
  "fields": [
    {"name": "RAM", "type": "string"},
    {"name": "Storage", "type": "string"},
    {"name": "Processor", "type": "string"}
  ]
}
```

### Ad (Marketplace Listings)

Product listings with comprehensive details.

```
Ad
├── id (UUID, Primary Key)
├── title (String)
├── description (String, Text)
├── type (Enum: FIXED, AUCTION)
├── price (Float, Optional) - Fixed price
├── basePrice (Float, Optional) - Auction starting price
├── releasePrice (Float, Optional) - Auction reserve price
├── propertyFor (Enum: SALE, RENT)
├── rentalPeriod (String, Optional) - e.g., "per month"
├── startTime (DateTime, Optional) - Auction start
├── endTime (DateTime, Optional) - Auction end
│
├── latitude (Float, Optional)
├── longitude (Float, Optional)
├── specifications (JSON, Optional)
│
├── country (String, Default: "USA")
├── state (String)
├── city (String)
├── zipCode (String, Optional)
│
├── showAddress (Boolean, Default: true)
├── allowPhone (Boolean, Default: true)
├── allowEmail (Boolean, Default: true)
├── isSold (Boolean, Default: false)
│
├── buyerId (UUID, Optional) → Auth (buyer)
├── buyer (1:1) → Ad (buyer relationship)
├── sellerId (UUID) → Auth (seller)
├── seller (1:1) → Auth
│
├── viewerIds (String[], Default: []) - User IDs who viewed
├── images (1:N) → AdImage
├── category (1:1) → Category
├── categoryId (UUID)
├── subCategory (1:1) → SubCategory
├── subCategoryId (UUID)
├── bids (1:N) → Bid
├── comments (1:N) → Comment
├── payment (1:1) → Payment
├── createdAt (DateTime)
└── updatedAt (DateTime)
```

**Ad Types**:
- `FIXED` - Fixed price (immediate purchase)
- `AUCTION` - Auction with bidding

**Property Types**:
- `SALE` - Item for sale
- `RENT` - Item for rent

### AdImage (Product Images)

Images associated with listings.

```
AdImage
├── id (UUID, Primary Key)
├── url (String) - Cloudinary URL
├── isPrimary (Boolean, Default: false)
├── adId (UUID) → Ad
├── ad (1:1) → Ad
└── CASCADE delete on Ad deletion
```

---

## Transaction Tables

### Bid (Auction Bids)

Records of bids placed on auction items.

```
Bid
├── id (UUID, Primary Key)
├── amount (Float)
├── bidderId (UUID) → Auth
├── bidder (1:1) → Auth
├── adId (UUID) → Ad
├── ad (1:1) → Ad
├── createdAt (DateTime)
└── CASCADE delete on Ad deletion

Constraints:
└── High bid wins when auction ends
```

### Payment (Transaction Records)

Tracks all transactions and fee distribution.

```
Payment
├── id (UUID, Primary Key)
├── stripeId (String, Unique) - Stripe charge ID
├── totalAmount (Float) - Total paid by buyer
├── adminFee (Float) - Platform fee (10% by default)
├── sellerAmount (Float) - Amount to seller
│
├── adId (UUID, Unique) → Ad
├── ad (1:1) → Ad
│
├── buyerId (UUID) → Auth
├── buyer (1:1) → Auth
│
├── status (Enum: PENDING, COMPLETED, FAILED)
├── createdAt (DateTime)
└── CASCADE delete on Ad deletion

Fee Calculation:
totalAmount = advertiser amount + admin fee
adminFee = totalAmount × PLATFORM_FEE_PERCENT / 100 (default: 10%)
sellerAmount = totalAmount - adminFee
```

---

## Engagement Tables

### Comment (Reviews & Discussions)

Threaded comments on listings.

```
Comment
├── id (UUID, Primary Key)
├── message (String)
├── parentId (UUID, Optional) - For nested replies
├── createdAt (DateTime)
│
├── userId (UUID) → Auth
├── user (1:1) → Auth
├── adId (UUID) → Ad
├── ad (1:1) → Ad
│
├── parent (1:1) → Comment (self-reference)
├── replies (1:N) → Comment
└── CASCADE delete on Auth deletion

Structure:
Comment (parent=null, adId=123)
├── Comment (parentId=first_comment_id, adId=123)
└── Comment (parentId=first_comment_id, adId=123)
```

---

## Messaging Tables

### Conversation (Message Threads)

Represents a conversation between users.

```
Conversation
├── id (UUID, Primary Key)
├── isBlocked (Boolean, Default: false)
├── blockedById (String, Optional) - User who blocked
├── createdAt (DateTime)
├── updatedAt (DateTime)
├── messages (1:N) → Message
└── participants (1:N) → Participant

Constraints:
└── CASCADE delete on participant removal
```

### Participant (Conversation Members)

Links users to conversations.

```
Participant
├── id (UUID, Primary Key)
├── conversationId (UUID) → Conversation
├── conversation (1:1) → Conversation
├── userId (UUID) → Auth
├── user (1:1) → Auth
└── UNIQUE constraint: (conversationId, userId)

CASCADE delete on Conversation deletion
```

### Message (Chat Messages)

Individual messages in a conversation.

```
Message
├── id (UUID, Primary Key)
├── text (String, Optional, Text) - Message content
├── fileUrl (String, Optional) - File attachment URL
├── fileType (String, Optional) - MIME type (e.g., "image/jpeg")
│
├── senderId (UUID) → Auth
├── sender (1:1) → Auth
│
├── conversationId (UUID) → Conversation
├── conversation (1:1) → Conversation
│
├── isRead (Boolean, Default: false)
├── createdAt (DateTime)
└── CASCADE delete on Conversation deletion
```

---

## Enums

### Role
```
enum Role {
  USER      // Regular user/buyer
  ADMIN     // Platform administrator
  SELLER    // Verified seller
}
```

### SellerStatus
```
enum SellerStatus {
  PENDING   // Awaiting verification
  APPROVED  // Seller verified
  REJECTED  // Application rejected
}
```

### AdType
```
enum AdType {
  FIXED     // Fixed price listing
  AUCTION   // Auction listing
}
```

### PropertyFor
```
enum PropertyFor {
  SALE      // Selling
  RENT      // Renting
}
```

### PaymentStatus
```
enum PaymentStatus {
  PENDING   // Transaction initiated
  COMPLETED // Payment successful
  FAILED    // Payment failed
}
```

---

## Key Relationships & Rules

### User Purchase Flow
1. Buyer views Ad
2. Buyer places Bid (for AUCTION) or completes payment (for FIXED)
3. Payment record created with fee distribution
4. Ad marked as isSold when sold
5. buyerId linked to Ad

### Messaging Flow
1. Conversation created between users
2. Participant records created for each user
3. Messages sent within conversation
4. Users can block each other (isBlocked flag)

### Seller Setup Flow
1. User signs up (role=USER)
2. User requests seller verification
3. SellerProfile created with status=PENDING
4. Admin approves/rejects
5. Stripe account linked on approval
6. User can post listings

### Fee Distribution
- Platform keeps 10% admin fee
- Seller receives 90% of transaction amount
- All calculated in Payment record

---

## Migration Commands

```bash
# Create new migration
npx prisma migrate dev --name description

# Reset database (dev only)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy

# View database UI
npx prisma studio
```

For more information, see [Prisma Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema)
