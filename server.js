const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database Setup
const dbPath = path.join(dbDir, 'inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize Database Tables
function initializeDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sku TEXT,
      category TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      reorder_level INTEGER DEFAULT 10,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Password reset tokens table
  db.run(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database tables initialized');
}

// Middleware: Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.userId = decoded.id;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashedPassword],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ success: true, token, userId: this.lastID, message: 'Account created successfully' });
    }
  );
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, userId: user.id, name: user.name });
  });
});

// Forgot Password
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    db.run(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error creating reset token' });
        }
        res.json({
          success: true,
          message: 'Password reset token created',
          resetToken: resetToken,
          expiresIn: '1 hour'
        });
      }
    );
  });
});

// Reset Password
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, decoded.id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error resetting password' });
        }
        db.run('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);
        res.json({ success: true, message: 'Password reset successfully' });
      }
    );
  });
});

// ==================== PROFILE ROUTES ====================

// Get Profile
app.get('/api/profile', verifyToken, (req, res) => {
  db.get('SELECT id, name, email, phone, address, created_at FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Update Profile
app.put('/api/profile', verifyToken, (req, res) => {
  const { name, phone, address } = req.body;

  db.run(
    'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
    [name, phone, address, req.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating profile' });
      }
      res.json({ success: true, message: 'Profile updated successfully' });
    }
  );
});

// Change Password
app.post('/api/profile/change-password', verifyToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  db.get('SELECT password FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.userId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error changing password' });
        }
        res.json({ success: true, message: 'Password changed successfully' });
      }
    );
  });
});

// ==================== PRODUCT ROUTES ====================

// Add Product
app.post('/api/products', verifyToken, (req, res) => {
  const { name, sku, category, quantity, price, reorder_level, description } = req.body;

  if (!name || quantity === undefined || price === undefined) {
    return res.status(400).json({ error: 'Product name, quantity, and price are required' });
  }

  db.run(
    `INSERT INTO products (user_id, name, sku, category, quantity, price, reorder_level, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.userId, name, sku, category, quantity, price, reorder_level || 10, description],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error adding product' });
      }

      // Check if low stock and create notification
      if (quantity < (reorder_level || 10)) {
        db.run(
          `INSERT INTO notifications (user_id, product_id, message, type)
           VALUES (?, ?, ?, ?)`,
          [req.userId, this.lastID, `Low stock alert: ${name} (${quantity} remaining)`, 'warning']
        );
      }

      res.json({ success: true, productId: this.lastID, message: 'Product added successfully' });
    }
  );
});

// Get All Products
app.get('/api/products', verifyToken, (req, res) => {
  db.all(
    'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching products' });
      }
      res.json(products || []);
    }
  );
});

// Get Single Product
app.get('/api/products/:id', verifyToken, (req, res) => {
  db.get(
    'SELECT * FROM products WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    (err, product) => {
      if (err || !product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    }
  );
});

// Update Product
app.put('/api/products/:id', verifyToken, (req, res) => {
  const { name, sku, category, quantity, price, reorder_level, description } = req.body;

  db.get('SELECT quantity FROM products WHERE id = ? AND user_id = ?', [req.params.id, req.userId], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.run(
      `UPDATE products SET name=?, sku=?, category=?, quantity=?, price=?, reorder_level=?, description=?, updated_at=CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [name, sku, category, quantity, price, reorder_level, description, req.params.id, req.userId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error updating product' });
        }

        // Check for low stock notification
        if (quantity < reorder_level && product.quantity >= reorder_level) {
          db.run(
            `INSERT INTO notifications (user_id, product_id, message, type)
             VALUES (?, ?, ?, ?)`,
            [req.userId, req.params.id, `Low stock alert: ${name} (${quantity} remaining)`, 'warning']
          );
        }

        res.json({ success: true, message: 'Product updated successfully' });
      }
    );
  });
});

// Delete Product
app.delete('/api/products/:id', verifyToken, (req, res) => {
  db.run(
    'DELETE FROM products WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error deleting product' });
      }
      res.json({ success: true, message: 'Product deleted successfully' });
    }
  );
});

// Search Products
app.get('/api/products/search/:query', verifyToken, (req, res) => {
  const searchTerm = `%${req.params.query}%`;
  db.all(
    'SELECT * FROM products WHERE user_id = ? AND (name LIKE ? OR sku LIKE ? OR category LIKE ?) ORDER BY created_at DESC',
    [req.userId, searchTerm, searchTerm, searchTerm],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Error searching products' });
      }
      res.json(products || []);
    }
  );
});

// ==================== NOTIFICATION ROUTES ====================

// Get Notifications
app.get('/api/notifications', verifyToken, (req, res) => {
  db.all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.userId],
    (err, notifications) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching notifications' });
      }
      res.json(notifications || []);
    }
  );
});

// Mark Notification as Read
app.put('/api/notifications/:id/read', verifyToken, (req, res) => {
  db.run(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating notification' });
      }
      res.json({ success: true });
    }
  );
});

// Get Unread Notifications Count
app.get('/api/notifications/unread/count', verifyToken, (req, res) => {
  db.get(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching notifications' });
      }
      res.json({ unreadCount: result.count });
    }
  );
});

// ==================== DASHBOARD ROUTES ====================

// Get Dashboard Stats
app.get('/api/dashboard/stats', verifyToken, (req, res) => {
  db.get(
    `SELECT 
      COUNT(*) as total_products,
      SUM(quantity) as total_quantity,
      SUM(quantity * price) as total_value,
      COUNT(CASE WHEN quantity < reorder_level THEN 1 END) as low_stock_count
    FROM products WHERE user_id = ?`,
    [req.userId],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching stats' });
      }
      res.json(stats || {});
    }
  );
});

// Get Low Stock Products
app.get('/api/dashboard/low-stock', verifyToken, (req, res) => {
  db.all(
    'SELECT * FROM products WHERE user_id = ? AND quantity < reorder_level ORDER BY quantity ASC',
    [req.userId],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching low stock products' });
      }
      res.json(products || []);
    }
  );
});

// Serve static pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Inventory System running on http://localhost:${PORT}`);
  console.log(`📱 Open your browser and go to: http://localhost:${PORT}`);
  console.log(`👤 Developer: Lerato Rasetsoke (IsaacJace116)\n`);
});

module.exports = app;
