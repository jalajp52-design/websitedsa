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
app.use(bodyParser.json({ limit: '10gb' }));
app.use(bodyParser.urlencoded({ limit: '10gb', extended: true }));

// Debug middleware - log all requests (remove in production)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
        console.log('  Content-Type:', req.get('content-type'));
        console.log('  Host:', req.get('host'));
        console.log('  Origin:', req.get('origin'));

        if (req.body && Object.keys(req.body).length > 0) {
            console.log('  Body keys:', Object.keys(req.body));
            console.log('  Body (first 300 chars):', JSON.stringify(req.body).substring(0, 300));
        }

        // Log response status
        const originalSend = res.send;
        res.send = function(data) {
            const statusCode = res.statusCode;
            console.log(`  Response: ${statusCode}${typeof data === 'string' && data.length < 200 ? ' - ' + data.substring(0, 100) : ''}`);
            return originalSend.call(this, data);
        };

        next();
    });
}

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
        res.status(500).json({ error: `Error fetching products: ${error.message}` });
    }
});

// 3.5. Add Product (for distributors/retailers)
app.post('/api/products', async (req, res) => {
    try {
        const { name, category, price, description, image, distributor } = req.body;

        // Validate required fields
        if (!name || !category || !price || !distributor) {
            return res.status(400).json({ error: 'Name, category, price, and distributor are required' });
        }

        // Insert new product
        const result = await db.query(
            'INSERT INTO products (name, category, price, description, image, distributor, rating) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, category, parseFloat(price), description || '', image || 'images/shampoo.png', distributor, 0]
        );

        res.status(201).json({
            message: 'Product added successfully',
            productId: result.insertId
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Error adding product' });
    }
});

// 4. Create Order
app.post('/api/orders', async (req, res) => {
    try {
        const { orderId, user, items, total, date, status, shipmentStatus, shippingDetails } = req.body;
        
        // Validate required fields
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }
        if (!user) {
            return res.status(400).json({ error: 'User email is required' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item' });
        }
        if (!total || total <= 0) {
            return res.status(400).json({ error: 'Total must be greater than 0' });
        }

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

        // Insert Order Items
        for (const item of items) {
            // Validate item fields
            if (!item.name || !item.price || !item.quantity) {
                throw new Error(`Invalid item format: ${JSON.stringify(item)}`);
            }

            // Always fetch image from DB for existing products, or use default for new items
            const productId = isNaN(item.id) ? null : item.id;
            let image = 'images/shampoo.png'; // Default image

            if (productId) {
                // Fetch image from products table
                const product = await db.query('SELECT image FROM products WHERE id = ?', [productId]);
                if (product[0]?.image) {
                    image = product[0].image;
                }
            } else if (item.image) {
                // For user-added products, use the provided image
                image = item.image;
            }

            await db.query(
                'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, distributor, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [dbOrderId, productId, item.name, item.price, item.quantity, item.distributor, image]
            );
        }

        res.status(201).json({ message: 'Order placed successfully', orderId: orderId });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: `Error creating order: ${error.message}` });
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

            // Debug: Check all orders in database (remove in production)
            if (process.env.NODE_ENV !== 'production') {
                const allOrders = await db.query('SELECT * FROM orders');
                console.log('All orders in database:', allOrders);
            }

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

        // Fetch items for each order
        for (const order of orders) {
            const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
            order.items = items;



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

        // Update the order shipment status
        const result = await db.query('UPDATE orders SET shipment_status = ? WHERE id = ?', [shipmentStatus, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found or no changes made' });
        }

        res.json({ message: 'Order shipment status updated successfully' });
    } catch (error) {
        console.error('Error updating order shipment status:', error);
        res.status(500).json({ error: `Error updating order shipment status: ${error.message}` });
    }
});

// 7. Delete Order (for customers and distributors)
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.query.currentUser; // Pass user info from frontend
        const role = req.query.role;

        if (!currentUser || !role) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Get order details to verify ownership
        const orders = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        // Check authorization: customers can delete their own orders, distributors can delete orders containing their products
        let authorized = false;
        if (role === 'customer' && order.user_email.toLowerCase() === currentUser.toLowerCase()) {
            authorized = true;
        } else if (role === 'distributor' || role === 'retailer') {
            // Check if distributor has products in this order
            const orderItems = await db.query('SELECT distributor FROM order_items WHERE order_id = ?', [id]);
            authorized = orderItems.some(item => item.distributor === currentUser);
        }

        if (!authorized) {
            return res.status(403).json({ error: 'Not authorized to delete this order' });
        }

        // First, delete order items
        await db.query('DELETE FROM order_items WHERE order_id = ?', [id]);

        // Then delete the order
        const result = await db.query('DELETE FROM orders WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: `Error deleting order: ${error.message}` });
    }
});

// 8. Get Users (for retailers/distributors to view customer database)
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
        res.status(500).json({ error: `Error fetching users: ${error.message}` });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
