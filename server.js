const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('./db'); // Import database module
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/'))); // Serve static files

// API Endpoints

// 1. User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const trimmedEmail = (email || '').trim();
        // Hash password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Check if user exists
        const existingUsers = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [trimmedEmail]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Insert new user
        const result = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, trimmedEmail, hashedPassword, role || 'customer']
        );

        res.status(201).json({
            message: 'Registration successful',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// 2. User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const trimmedEmail = (email || '').trim();

        // Find user
        const users = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [trimmedEmail]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        // Compare hashed password using bcrypt.compare
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Return user info (excluding password)
        const userData = { ...user };
        delete userData.password;

        res.json({ message: 'Login successful', user: userData });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// 3. Get Products (Initial Load + Extra Products)
app.get('/api/products', async (req, res) => {
    try {
        // Fetch all products from DB
        const products = await db.query('SELECT * FROM products');
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Error fetching products' });
    }
});

// 4. Create Order
app.post('/api/orders', async (req, res) => {
    try {
        const { orderId, user, items, total, date, status, shipmentStatus, shippingDetails } = req.body;
        const trimmedUser = (user || '').trim();

        // Find user ID from email or create guest user
        let userId;
        const users = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [trimmedUser]);
        if (users.length === 0) {
            // Create guest user
            const guestResult = await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Guest User', trimmedUser, 'guest123', 'customer']);
            userId = guestResult.insertId;
        } else {
            userId = users[0].id;
        }

        // Validate date
        if (!date || isNaN(new Date(date).getTime())) {
            return res.status(400).json({ error: 'Invalid date provided' });
        }

        // Insert Order
        const orderResult = await db.query(
            'INSERT INTO orders (order_id, user_id, user_email, total, status, shipment_status, shipping_details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [orderId, userId, trimmedUser, total, status || 'pending', shipmentStatus || 'pending', JSON.stringify(shippingDetails), date]
        );
        const dbOrderId = orderResult.insertId;
        console.log('Order inserted with ID:', dbOrderId, 'orderId:', orderId);

        // Insert Order Items
        for (const item of items) {
            // Assuming item structure matches what client sends
            const productId = isNaN(item.id) ? null : item.id;
            await db.query(
                'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, distributor, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [dbOrderId, productId, item.name, item.price, item.quantity, item.distributor, item.image]
            );
        }

        // Note: Shipping details are complex to store without a dedicated table or JSON column.
        // For simplicity in this demo, we might store them in a text column if we modify the schema, 
        // or just rely on user address in Users table. 
        // But the schema implies a basic structure. 
        // Let's assume we proceed without storing explicit shipping details in a separate table for now unless schema is updated.

        res.status(201).json({ message: 'Order placed successfully', orderId: orderId });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Error creating order' });
    }
});

// 5. Get Orders (for specific user or all for admin)
app.get('/api/orders', async (req, res) => {
    try {
        let sql, params = [];

        if (req.query.orderId) {
            sql = `SELECT o.id, o.order_id, o.user_email, o.total, o.status, o.created_at, o.shipping_details, o.shipment_status, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.order_id = ?`;
            params = [req.query.orderId];
        } else {
            const userEmail = req.query.email;
            const role = req.query.role;

            console.log(`Fetching orders for email: ${userEmail}, role: ${role}`);

            // Debug: Check all orders in database
            const allOrders = await db.query('SELECT * FROM orders');
            console.log('All orders in database:', allOrders);

            // If no email and no role specified, return all orders (for admin/dashboard view)
            if (!userEmail && !role) {
                // Return all orders
            } else if (role === 'customer' && !userEmail) {
                return res.json([]);
            }

            sql = `SELECT o.id, o.order_id, o.user_email, o.total, o.status, o.created_at, o.shipping_details, o.shipment_status, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id`;

            if (role === 'customer' && userEmail) {
                sql += ' WHERE LOWER(o.user_email) = LOWER(?)';
                params.push(userEmail.trim());
            } else if (role === 'retailer' || role === 'distributor') {
                // Retailers/Distributors might want to see all orders initially, then filter via frontend logic.
                // For now, let's fetch all orders and let frontend filter for simplicity as per existing logic,
            }

            sql += ' ORDER BY o.created_at DESC';
        }

        let orders = await db.query(sql, params);
        if (!Array.isArray(orders)) orders = [];

        console.log(`Found ${orders.length} orders in database`);

        // Fetch items for each order
        for (const order of orders) {
            const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
            order.items = items;

            console.log(`Order ${order.id} (${order.order_id}): shipment_status = ${order.shipment_status}`);

            // Map keys to match frontend expectations
            order.orderId = order.order_id;
            order.user = order.user_email;
            order.date = order.created_at;
            order.shipmentStatus = order.shipment_status;
            order.shippingDetails = order.shipping_details ? JSON.parse(order.shipping_details) : null;
            order.items = items.map(i => ({
                name: i.product_name,
                price: i.product_price,
                quantity: i.quantity,
                distributor: i.distributor,
                image: i.image
            }));
        }

        console.log(`Returning ${orders.length} orders to frontend`);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Error fetching orders' });
    }
});

// 6. Update Order Shipment Status
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { shipmentStatus } = req.body;

        console.log(`Updating order ${id} shipment status to: ${shipmentStatus}`);

        // Update the order shipment status
        const result = await db.query('UPDATE orders SET shipment_status = ? WHERE id = ?', [shipmentStatus, id]);

        console.log(`Update result: ${result.affectedRows} rows affected`);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found or no changes made' });
        }

        // Verify the update
        const verifyOrder = await db.query('SELECT shipment_status FROM orders WHERE id = ?', [id]);
        console.log(`Verified shipment status: ${verifyOrder[0]?.shipment_status}`);

        res.json({ message: 'Order shipment status updated successfully' });
    } catch (error) {
        console.error('Error updating order shipment status:', error);
        res.status(500).json({ error: 'Error updating order shipment status' });
    }
});

// 7. Get Users (for retailers/distributors to view customer database)
app.get('/api/users', async (req, res) => {
    try {
        const currentUser = req.query.currentUser;
        const role = req.query.role;

        // Only allow retailers/distributors to access user data
        if (role !== 'retailer' && role !== 'distributor') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch all users from DB
        const users = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
