const db = require('./db');

async function testCheckout() {
    try {
        console.log('\n=== CHECKOUT DEBUG TEST ===\n');

        // 1. Check if user exists
        const testEmail = 'jj@gmail.com';
        console.log(`1. Checking for user: ${testEmail}`);
        const users = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [testEmail]);
        console.log(`   Found ${users.length} user(s)`);
        if (users.length > 0) {
            console.log(`   User: ${JSON.stringify(users[0])}`);
        }

        // 2. Test order insertion
        console.log('\n2. Testing order insertion...');
        const testOrderData = {
            orderId: 'ORD-' + Date.now(),
            user: testEmail,
            items: [
                {
                    id: 1,
                    name: 'Test Product',
                    price: 12321.00,
                    quantity: 1,
                    distributor: 'jj',
                    image: 'test.png'
                }
            ],
            total: 12321.00,
            date: new Date().toISOString(),
            status: 'pending',
            shipmentStatus: 'pending'
        };

        // Find or create user
        let userId;
        const existingUsers = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [testEmail.trim()]);
        if (existingUsers.length === 0) {
            console.log(`   User not found, creating guest user...`);
            const guestResult = await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Guest User', testEmail, 'guest123', 'customer']);
            userId = guestResult.insertId;
            console.log(`   Guest user created with ID: ${userId}`);
        } else {
            userId = existingUsers[0].id;
            console.log(`   User found with ID: ${userId}`);
        }

        // Insert order
        try {
            const orderResult = await db.query(
                'INSERT INTO orders (order_id, user_id, user_email, total, status, shipment_status, shipping_details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [testOrderData.orderId, userId, testEmail, testOrderData.total, testOrderData.status, testOrderData.shipmentStatus, JSON.stringify(testOrderData), testOrderData.date]
            );
            const dbOrderId = orderResult.insertId;
            console.log(`   ✓ Order inserted successfully with ID: ${dbOrderId}`);

            // Insert order items
            for (const item of testOrderData.items) {
                const productId = isNaN(item.id) ? null : item.id;
                await db.query(
                    'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, distributor, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [dbOrderId, productId, item.name, item.price, item.quantity, item.distributor, item.image]
                );
            }
            console.log(`   ✓ Order items inserted successfully`);

            // Verify the order
            console.log('\n3. Verifying order in database...');
            const orders = await db.query('SELECT * FROM orders WHERE order_id = ?', [testOrderData.orderId]);
            if (orders.length > 0) {
                console.log(`   ✓ Order found: ${JSON.stringify(orders[0])}`);
            }

            console.log('\n=== TEST PASSED ===');
            console.log('If you still see checkout failures, check the browser console for errors.');
        } catch (insertError) {
            console.log(`   ✗ Order insertion failed:`);
            console.log(`   Error: ${insertError.message}`);
            console.log(`   This is likely the issue!`);
        }

    } catch (error) {
        console.error('Debug test error:', error);
    }
}

testCheckout();
