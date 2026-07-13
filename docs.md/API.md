# API Documentation - Finn Marketplace

Complete API endpoint reference for the Finn platform.

## Base URL

```
Development: http://localhost:3000
Production: https://shazan-ad-marketplace-project.onrender.com
```

## Authentication

### JWT Tokens

All authenticated endpoints require a JWT token in the `Authorization` header.

```
Authorization: Bearer <token>
```

### Endpoints

#### POST /auth/signup
Create a new user account.

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePassword123",
  "nickName": "johndoe"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "firstName": "John",
  "token": "jwt_token_here",
  "message": "Signup successful. Please verify your email."
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "firstName": "John",
  "token": "jwt_token_here",
  "role": "USER"
}
```

#### POST /auth/verify-otp
Verify email with OTP sent to email.

**Request**:
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response** (200):
```json
{
  "message": "Email verified successfully",
  "isVerified": true
}
```

#### POST /auth/forgot-password
Request password reset via email.

**Request**:
```json
{
  "email": "john@example.com"
}
```

**Response** (200):
```json
{
  "message": "Password reset link sent to email"
}
```

#### POST /auth/reset-password
Reset password with token from email.

**Request**:
```json
{
  "token": "reset_token",
  "password": "NewPassword123"
}
```

**Response** (200):
```json
{
  "message": "Password reset successful"
}
```

---

## Users

#### GET /users/:id
Get user profile information.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "profilePicture": "https://cloudinary.url/image.jpg",
  "role": "USER",
  "isVerified": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### PUT /users/:id
Update user profile.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "profilePicture": "image_file_or_url",
  "nickName": "janedoe"
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "firstName": "Jane",
  "message": "Profile updated successfully"
}
```

---

## Seller Management

#### POST /sellers/profile
Create seller profile (request verification).

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "companyName": "John's Electronics",
  "companyWebsite": "https://johnselectronics.com",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip": 10001,
  "country": "USA"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "companyName": "John's Electronics",
  "status": "PENDING",
  "message": "Seller profile created. Awaiting admin approval."
}
```

#### GET /sellers/:id
Get seller profile details.

**Response** (200):
```json
{
  "id": "uuid",
  "companyName": "John's Electronics",
  "companyWebsite": "https://johnselectronics.com",
  "status": "APPROVED",
  "isStripeVerified": true,
  "totalListings": 15,
  "totalSales": 5,
  "averageRating": 4.8
}
```

#### PUT /sellers/:id
Update seller profile.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "companyName": "John's Electronics Plus",
  "address": "456 New St"
}
```

**Response** (200):
```json
{
  "message": "Seller profile updated"
}
```

---

## Marketplace Listings (Ads)

#### GET /ads
List all marketplace advertisements with filtering.

**Query Parameters**:
```
?page=1&limit=20&category=electronics&type=FIXED&city=NewYork&search=phone
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "iPhone 14 Pro",
      "description": "Like new condition",
      "type": "FIXED",
      "price": 999,
      "seller": {
        "id": "uuid",
        "firstName": "John"
      },
      "images": [
        {
          "id": "uuid",
          "url": "https://cloudinary.url/image.jpg",
          "isPrimary": true
        }
      ],
      "category": "Electronics",
      "city": "New York",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### GET /ads/:id
Get detailed information about a specific ad.

**Response** (200):
```json
{
  "id": "uuid",
  "title": "iPhone 14 Pro",
  "description": "Like new condition, original box included",
  "type": "FIXED",
  "price": 999,
  "propertyFor": "SALE",
  "seller": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "rating": 4.8,
    "totalListings": 25
  },
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "showAddress": true
  },
  "images": [
    {
      "id": "uuid",
      "url": "https://cloudinary.url/image.jpg",
      "isPrimary": true
    }
  ],
  "specifications": {
    "RAM": "6GB",
    "Storage": "128GB",
    "Color": "Space Black"
  },
  "bids": [
    {
      "id": "uuid",
      "amount": 950,
      "bidder": "User Name",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "comments": [
    {
      "id": "uuid",
      "message": "Is this still available?",
      "user": "Buyer Name",
      "createdAt": "2024-01-15T10:30:00Z",
      "replies": []
    }
  ],
  "viewCount": 245,
  "isSold": false,
  "createdAt": "2024-01-10T10:30:00Z"
}
```

#### POST /ads
Create a new marketplace listing.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "title": "iPhone 14 Pro",
  "description": "Like new condition, original box",
  "type": "FIXED",
  "price": 999,
  "propertyFor": "SALE",
  "categoryId": "uuid",
  "subCategoryId": "uuid",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "specifications": {
    "RAM": "6GB",
    "Storage": "128GB"
  },
  "images": ["image_url_1", "image_url_2"]
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "title": "iPhone 14 Pro",
  "message": "Listing created successfully"
}
```

#### PUT /ads/:id
Update an existing listing.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "title": "iPhone 14 Pro Max",
  "price": 1099,
  "description": "Updated description"
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "message": "Listing updated successfully"
}
```

#### DELETE /ads/:id
Delete a listing (soft delete).

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "message": "Listing deleted successfully"
}
```

---

## Bidding (Auctions)

#### POST /bids
Place a bid on an auction listing.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "adId": "uuid",
  "amount": 950
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "amount": 950,
  "message": "Bid placed successfully"
}
```

#### GET /bids/:adId
Get all bids on a specific auction.

**Response** (200):
```json
{
  "adId": "uuid",
  "currentHighBid": 1000,
  "totalBids": 15,
  "bids": [
    {
      "id": "uuid",
      "amount": 1000,
      "bidder": "User Name",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Payments

#### POST /payments/create-intent
Create a Stripe payment intent.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "adId": "uuid",
  "amount": 999,
  "paymentMethodId": "pm_1234567890"
}
```

**Response** (201):
```json
{
  "clientSecret": "pi_1234567890_secret_abcdef",
  "amount": 999,
  "message": "Payment intent created"
}
```

#### GET /payments/:id
Get payment details.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "id": "uuid",
  "stripeId": "pi_1234567890",
  "totalAmount": 999,
  "adminFee": 99.90,
  "sellerAmount": 899.10,
  "status": "COMPLETED",
  "ad": {
    "id": "uuid",
    "title": "iPhone 14 Pro"
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### GET /payments
Get user's payment history.

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
```
?page=1&limit=20&status=COMPLETED
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "amount": 999,
      "status": "COMPLETED",
      "ad": { "title": "iPhone 14 Pro" },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

## Comments & Reviews

#### POST /comments
Add a comment to a listing.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "adId": "uuid",
  "message": "Is this item still available?",
  "parentId": "uuid" // optional for replies
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "message": "Comment added successfully"
}
```

#### GET /comments/:adId
Get all comments on a listing.

**Query Parameters**:
```
?page=1&limit=10
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "message": "Is this item still available?",
      "user": {
        "id": "uuid",
        "firstName": "John"
      },
      "replies": [
        {
          "id": "uuid",
          "message": "Yes, it is available!",
          "user": { "firstName": "Seller" }
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### DELETE /comments/:id
Delete a comment.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "message": "Comment deleted successfully"
}
```

---

## Messaging

#### POST /conversations
Create or get conversation with another user.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "participantId": "uuid"
}
```

**Response** (200 or 201):
```json
{
  "id": "uuid",
  "participants": [
    { "id": "uuid", "firstName": "John" },
    { "id": "uuid", "firstName": "Jane" }
  ],
  "lastMessage": "Thanks for your interest!",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### GET /conversations
Get all conversations for authenticated user.

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
```
?page=1&limit=20
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "participant": {
        "id": "uuid",
        "firstName": "Jane",
        "profilePicture": "url"
      },
      "lastMessage": "Thanks for your interest!",
      "unreadCount": 2,
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8
  }
}
```

#### POST /messages
Send a message in a conversation.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "conversationId": "uuid",
  "text": "Is this item still available?",
  "fileUrl": "optional_file_url",
  "fileType": "optional_mime_type"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "text": "Is this item still available?",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### GET /messages/:conversationId
Get messages in a conversation.

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
```
?page=1&limit=50
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "text": "Is this item still available?",
      "sender": {
        "id": "uuid",
        "firstName": "John"
      },
      "isRead": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Categories

#### GET /categories
Get all product categories.

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "image": "category_image_url",
      "subCategories": [
        {
          "id": "uuid",
          "name": "Mobile Phones",
          "slug": "mobile-phones"
        }
      ]
    }
  ]
}
```

#### GET /categories/:id/subcategories
Get subcategories for a category.

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Mobile Phones",
      "slug": "mobile-phones",
      "specFields": {
        "fields": [
          { "name": "RAM", "type": "string" },
          { "name": "Storage", "type": "string" }
        ]
      }
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

### Common Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

### Example Error Response

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

---

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 500 requests per minute
- **Webhook endpoints**: 1000 requests per minute

Rate limit information is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642255200
```

---

## Webhooks

### Stripe Webhook Events

**Endpoint**: `POST /webhooks/stripe`

**Events Handled**:
- `payment_intent.succeeded` - Payment completed
- `payment_intent.failed` - Payment failed
- `charge.refunded` - Refund processed

**Example Payload**:
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "status": "succeeded",
      "amount": 99900,
      "metadata": {
        "adId": "uuid",
        "userId": "uuid"
      }
    }
  }
}
```

---

## Testing with cURL

```bash
# Signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"Pass123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Pass123"}'

# Get user profile (with token)
curl -X GET http://localhost:3000/users/uuid \
  -H "Authorization: Bearer <jwt_token>"

# List advertisements
curl -X GET "http://localhost:3000/ads?page=1&limit=20"

# Create listing (with token)
curl -X POST http://localhost:3000/ads \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"iPhone 14","price":999,"categoryId":"uuid"}'
```

For more details, see [Setup Guide](./SETUP.md)
