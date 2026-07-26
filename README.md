# 📦 Inventory Management System

**Built by:** Lerato Rasetsoke  
**Developer:** IsaacJace116

A complete inventory management system with user authentication, product tracking, notifications, and cloud storage.

## ✨ Features

✅ **User Authentication**
- Create new account
- Login securely
- Forgot password (reset link)
- User profile management
- Change password

✅ **Inventory Management**
- Add new products
- Edit existing products
- Delete products
- View all saved products
- Search & filter products
- Persistent storage (data saved permanently)
- Low stock alerts

✅ **Notifications**
- Low stock alerts
- Real-time notifications
- Notification history

✅ **Profile Management**
- View user profile
- Edit profile information
- Change password
- Account settings

## 🚀 Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite
- **Frontend:** HTML5 + CSS3 + JavaScript
- **Authentication:** JWT (JSON Web Tokens)
- **Mobile Friendly:** Yes (responsive design)

## 📋 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Git

### Steps to Install

1. **Clone the repository**
```bash
git clone https://github.com/IsaacJace116/inventory-system.git
cd inventory-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
echo "PORT=3000" > .env
echo "JWT_SECRET=your_secret_key_here" >> .env
```

4. **Start the server**
```bash
node server.js
```

5. **Open in browser**
```
http://localhost:3000
```

## 📱 How to Use

### First Time Users
1. Click "Create Account"
2. Fill in your details (name, email, password)
3. Login with your credentials
4. Go to dashboard

### Adding Products
1. Click "Add Product" button
2. Fill in product details:
   - Product name
   - SKU/Barcode (optional)
   - Quantity
   - Price per unit
   - Category
   - Reorder level (for low stock alerts)
3. Click "Save Product"
4. Your product is saved automatically!

### Viewing Products
1. Go to "My Products" or "Dashboard"
2. See all your saved products
3. Products persist even after closing the app

### Search & Filter
1. Use search bar to find products by name
2. Filter by category
3. Sort by quantity, price, or date added

### Notifications
1. Check notification bell icon
2. View low stock alerts
3. Automatic alerts when stock is below reorder level

### Manage Profile
1. Click on profile icon (top right)
2. View/edit profile information
3. Change password
4. Logout

## 🔐 Forgot Password

1. Click "Forgot Password" on login page
2. Enter your email
3. Receive reset link
4. Create new password
5. Login with new password

## 📁 Project Structure

```
inventory-system/
├── server.js              # Main server file
├── package.json          # Dependencies
├── .env                  # Environment variables
├── database/
│   └── inventory.db      # SQLite database
├── public/
│   ├── index.html       # Login/Register page
│   ├── dashboard.html   # Main dashboard
│   ├── css/
│   │   └── style.css    # All styles
│   └── js/
│       ├── auth.js      # Authentication logic
│       └── dashboard.js # Dashboard logic
└── README.md            # This file
```

## 📱 Commands for Termux/Android

```bash
# Clone repo
git clone https://github.com/IsaacJace116/inventory-system.git
cd inventory-system

# Install
npm install

# Run
node server.js

# Access on phone browser
# Visit: http://localhost:3000

# Edit files with Acode
# Open public/index.html, server.js, etc. in Acode
```

## 🐛 Troubleshooting

**Port 3000 already in use?**
```bash
PORT=3001 node server.js
```

**Database errors?**
```bash
rm database/inventory.db
node server.js
```

**Module not found?**
```bash
npm install
```

## 📄 License

MIT License - Free to use and modify

## 👨‍💻 Developer

**Lerato Rasetsoke** (IsaacJace116)

---

**Happy coding! 🚀**
