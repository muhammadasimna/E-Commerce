const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// Create a new order
router.post('/', auth, (req, res) => {
    const { items, totalPrice } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in order' });
    }

    db.run('INSERT INTO orders (user_id, total_price) VALUES (?, ?)', [userId, totalPrice], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error creating order' });
        }

        const orderId = this.lastID;
        const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

        items.forEach(item => {
            stmt.run(orderId, item.id, item.quantity, item.price);
        });

        stmt.finalize();
        res.status(201).json({ message: 'Order placed successfully', orderId });
    });
});

// Get unread sales count for seller
router.get('/unread-count', auth, (req, res) => {
    const sellerId = req.user.id;
    const query = `
        SELECT COUNT(DISTINCT o.id) as count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.owner_id = ? AND o.is_read = 0
    `;
    db.get(query, [sellerId], (err, row) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json({ count: row.count });
    });
});

// Get orders for products owned by the current user (Seller view)
router.get('/seller-orders', auth, (req, res) => {
    const sellerId = req.user.id;
    const query = `
        SELECT oi.id as item_id, o.id as order_id, oi.status, o.created_at, u.name as buyer_name,
               oi.quantity, oi.price as item_price, p.name as product_name, p.image_url
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.owner_id = ?
        ORDER BY o.created_at DESC
    `;

    db.all(query, [sellerId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching sales' });
        }
        
        // Mark these orders as read
        if (rows.length > 0) {
            const orderIds = [...new Set(rows.map(r => r.order_id))];
            db.run(`UPDATE orders SET is_read = 1 WHERE id IN (${orderIds.join(',')})`, (err) => {
                if (err) console.error('Error marking orders as read');
            });
        }
        
        res.json(rows);
    });
});

// Update order item status (Seller action)
router.patch('/items/:id/status', auth, (req, res) => {
    const { status } = req.body;
    const itemId = req.params.id;

    if (!['pending', 'submitted', 'rejected'].includes(status.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    db.run('UPDATE order_items SET status = ? WHERE id = ?', [status.toLowerCase(), itemId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error updating item status' });
        }
        res.json({ message: `Item status updated to ${status}` });
    });
});

// Get user orders with items
router.get('/my-orders', auth, (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT o.id, o.total_price as order_total, o.created_at, oi.status, 
               oi.price as item_price, oi.quantity, p.name as product_name, p.image_url
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching orders' });
        }
        res.json(rows);
    });
});

module.exports = router;
