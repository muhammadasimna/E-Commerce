const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// Get all products
router.get('/', (req, res) => {
    db.all('SELECT * FROM products ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching products' });
        }
        res.json(rows);
    });
});

// Create a new product (Protected)
router.post('/', auth, (req, res) => {
    const { name, description, price, image_url, category, stock } = req.body;
    const owner_id = req.user.id;

    if (!name || !price || !image_url) {
        return res.status(400).json({ message: 'Name, Price, and Image URL are required' });
    }

    db.run('INSERT INTO products (name, description, price, image_url, category, stock, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, price, image_url, category, stock || 10, owner_id],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Error creating product' });
            }
            res.status(201).json({ id: this.lastID, message: 'Product created successfully' });
        }
    );
});

// Get products listed by current user
router.get('/my-products', auth, (req, res) => {
    const owner_id = req.user.id;
    db.all('SELECT * FROM products WHERE owner_id = ? ORDER BY id DESC', [owner_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching your products' });
        }
        res.json(rows);
    });
});

// Get product by ID
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(row);
    });
});

// Update a product (Protected, Owner only)
router.put('/:id', auth, (req, res) => {
    console.log(`PUT /api/products/${req.params.id} request received`);
    const { name, description, price, image_url, category, stock } = req.body;
    const owner_id = req.user.id;
    const productId = req.params.id;

    if (!name || !price || !image_url) {
        return res.status(400).json({ message: 'Name, Price, and Image URL are required' });
    }

    // Check ownership
    db.get('SELECT owner_id FROM products WHERE id = ?', [productId], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (row.owner_id !== owner_id) {
            return res.status(403).json({ message: 'You are not authorized to edit this product' });
        }

        // Update
        db.run(`UPDATE products SET 
            name = ?, 
            description = ?, 
            price = ?, 
            image_url = ?, 
            category = ?, 
            stock = ? 
            WHERE id = ?`,
            [name, description, price, image_url, category, stock || 10, productId],
            function(err) {
                if (err) {
                    console.error('Database error during update:', err);
                    return res.status(500).json({ message: 'Error updating product' });
                }
                console.log('Product updated successfully');
                res.json({ message: 'Product updated successfully' });
            }
        );
    });
});

module.exports = router;
