# 🚀 By-Bench Marketplace & Auction Engine

A high-performance, industry-standard marketplace backend built with **NestJS**, **Prisma**, and **PostgreSQL**. This system is designed to handle complex multi-vendor workflows, real-time auctions, and dynamic category-based specifications.

---

## 🔗 Live Links
- **API Server:** [https://shazan-ad-marketplace-project.onrender.com](https://shazan-ad-marketplace-project.onrender.com)
- **Interactive API Documentation:** [Swagger UI Docs](https://shazan-ad-marketplace-project.onrender.com/docs)

---

## 🛠 Tech Stack
- **Backend:** NestJS (Node.js framework)
- **ORM:** Prisma
- **Database:** PostgreSQL (Hosted on Render)
- **Real-time:** Socket.io (Chat & Bidding)
- **Payments:** Stripe API (Stripe Connect for Sellers)
- **File Storage:** Cloudinary (Dynamic Image Handling)
- **Validation:** Class-validator & Class-transformer
- **Documentation:** Swagger (OpenAPI)

---

## ✨ Key Features

### 🛒 1. Advanced Marketplace Logic
- **Dual Ad Types:** Support for both `FIXED` price listings and `AUCTION` based real-time bidding.
- **Dynamic Specifications:** Sub-category-based dynamic fields (e.g., Mobiles have RAM/Storage, Cars have Year/Fuel Type).
- **Pro Location Filtering:** Geolocation support with Latitude, Longitude, and City/State filtering.

### 👥 2. Vendor Management (Sellers)
- **Approval Workflow:** Admin can review and approve/reject seller requests.
- **Stripe Onboarding:** Integrated Stripe account creation for sellers to receive payouts.
- **Suspension System:** Admin can toggle user suspension status instantly.

### 💬 3. Real-time Communication
- **Messenger:** One-to-one real-time chat between buyer and seller.
- **File Transfer:** Send images/files directly through the chat interface.
- **Read Receipts:** Track message status (Read/Unread).

### 💰 4. Financial & Bidding Engine
- **Fee Management:** Automated calculation of `adminFee` and `sellerAmount` for every transaction.
- **Bidding System:** Real-time auction bids with high-water mark tracking.
- **Stripe Webhooks:** Securely handle successful payments and update ad status.

---

## 📊 Database Architecture (ERD)
The system uses a highly relational schema to maintain data integrity across conversations, bids, payments, and advertisements.



---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Cloudinary & Stripe API Keys

### Step-by-Step
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/by-bench-marketplace.git](https://github.com/your-username/by-bench-marketplace.git)
   cd by-bench-marketplace