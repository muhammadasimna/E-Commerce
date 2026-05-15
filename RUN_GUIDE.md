# E-Commerce Project: Full Flow & Run Instructions

This document provides a comprehensive guide on how the project works and how to run it.

## 🚀 How to Run the Project

Follow these steps to get the application up and running.

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your system.

### 2. Backend Setup
Open a terminal and navigate to the `Backend` directory:
```powershell
cd Backend
npm install
npm run dev
```
*The backend will start on `http://localhost:5000`.*

### 3. Frontend Setup
Open a **new** terminal and navigate to the `Frontend` directory:
```powershell
cd Frontend
npm install
npm start
```
*The frontend will start on `http://localhost:3000` (or whichever port `serve` selects).*

---

## 🔄 Full Project Flow

### 1. Authentication
- **Registration**: Users can sign up at `auth.html`.
- **Login**: After signing up, users log in to receive a JWT token. This token is stored in `localStorage` and used for all protected requests (adding products, placing orders, etc.).

### 2. Product Management (Seller Flow)
- **Add Product**: Logged-in users can navigate to "Sell" (`add-product.html`) to list a new product.
- **My Listings**: Users can view and manage their own products in "My Listings" (`my-products.html`).
- **Edit/Delete**: Sellers can update or remove their listings.

### 3. Shopping Flow (Buyer Flow)
- **Browsing**: All users can see the product grid on the Home page (`index.html`).
- **Product Details**: Clicking a product shows its full details (`product.html`).
- **Cart**: Users can add items to their cart. The cart is persisted in `localStorage` per user.
- **Checkout**: From the cart page (`cart.html`), users can place an order.

### 4. Order & Sales Tracking
- **My Orders**: Buyers can track their purchase history and item status in `orders.html`.
- **Manage Sales**: Sellers get real-time notifications (badges) when someone buys their product. They can manage these in `sales.html`, updating the status to "Submitted" or "Rejected".

---

## 🛠️ Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), Javascript (Fetch API).
- **Backend**: Node.js, Express.js.
- **Database**: SQLite3 (File-based database).
- **Auth**: JSON Web Tokens (JWT) & Bcryptjs.
