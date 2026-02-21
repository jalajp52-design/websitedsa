const db = require('./db');

async function populateSampleOrders() {
    try {
        // First, insert sample users if they don't exist
        const users = [
            {
                name: 'John Doe',
                email: 'customer@example.com',
                password: 'password123',
                role: 'customer'
            },
            {
                name: 'Jane Smith',
                email: 'customer2@example.com',
                password: 'password123',
                role: 'customer'
            }
        ];

        const userIds = {};
        for (const user of users) {
            // Check if user exists
            const existing = await db.query('SELECT id FROM users WHERE email = ?', [user.email]);
            if (existing.length === 0) {
                const result = await db.query(
                    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                    [user.name, user.email, user.password, user.role]
                );
                userIds[user.email] = result.insertId;
                console.log(`Inserted user ${user.email} with ID ${result.insertId}`);
            } else {
                userIds[user.email] = existing[0].id;
                console.log(`User ${user.email} already exists with ID ${existing[0].id}`);
            }
        }

        // Insert sample orders
        const orders = [
            {
                order_id: 'ORD-001',
                user_id: userIds['customer@example.com'],
                user_email: 'customer@example.com',
                created_at: new Date().toISOString(),
                status: 'pending',
                shipment_status: 'pending',
                shipping_details: JSON.stringify({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'customer@example.com',
                    phone: '123-456-7890',
                    address: '123 Main St',
                    city: 'Anytown',
                    state: 'CA',
                    zip: '12345',
                    country: 'USA',
                    paymentMethod: 'Credit Card',
                    cardName: 'John Doe',
                    cardNumber: '1234567890123456'
                }),
                total: 75.00
            },
            {
                order_id: 'ORD-002',
                user_id: userIds['customer2@example.com'],
                user_email: 'customer2@example.com',
                created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                status: 'pending',
                shipment_status: 'shipped',
                shipping_details: JSON.stringify({
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'customer2@example.com',
                    phone: '987-654-3210',
                    address: '456 Oak Ave',
                    city: 'Somewhere',
                    state: 'NY',
                    zip: '67890',
                    country: 'USA',
                    paymentMethod: 'Credit Card',
                    cardName: 'Jane Smith',
                    cardNumber: '9876543210987654'
                }),
                total: 120.00
            }
        ];

        const orderIds = {};
        for (const order of orders) {
            // Check if order exists
            const existing = await db.query('SELECT id FROM orders WHERE order_id = ?', [order.order_id]);
            if (existing.length === 0) {
                const result = await db.query(
                    'INSERT INTO orders (order_id, user_id, user_email, created_at, status, shipment_status, shipping_details, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [order.order_id, order.user_id, order.user_email, order.created_at, order.status, order.shipment_status, order.shipping_details, order.total]
                );
                orderIds[order.order_id] = result.insertId;
                console.log(`Inserted order ${order.order_id} with ID ${result.insertId}`);
            } else {
                orderIds[order.order_id] = existing[0].id;
                console.log(`Order ${order.order_id} already exists with ID ${existing[0].id}`);
            }
        }

        // Insert sample order items
        const orderItems = [
            {
                order_id: 'ORD-001',
                product_name: 'Luxury Shampoo',
                product_price: 25.00,
                quantity: 2,
                distributor: 'Main Warehouse',
                image: 'images/shampoo.png'
            },
            {
                order_id: 'ORD-001',
                product_name: 'Face Cream',
                product_price: 50.00,
                quantity: 1,
                distributor: 'Main Warehouse',
                image: 'images/face-cream.png'
            },
            {
                order_id: 'ORD-002',
                product_name: 'Hair Spa Treatment',
                product_price: 60.00,
                quantity: 1,
                distributor: 'Main Warehouse',
                image: 'images/hair-spa.png'
            },
            {
                order_id: 'ORD-002',
                product_name: 'Serum',
                product_price: 60.00,
                quantity: 1,
                distributor: 'Main Warehouse',
                image: 'images/serum.png'
            }
        ];

        for (const item of orderItems) {
            await db.query(
                'INSERT INTO order_items (order_id, product_name, product_price, quantity, distributor, image) VALUES (?, ?, ?, ?, ?, ?)',
                [item.order_id, item.product_name, item.product_price, item.quantity, item.distributor, item.image]
            );
        }

        console.log('Sample orders and items inserted successfully!');
    } catch (error) {
        console.error('Error populating sample orders:', error);
    } finally {
        process.exit();
    }
}

populateSampleOrders();
