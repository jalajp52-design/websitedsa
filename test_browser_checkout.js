// Simulate exact browser checkout request
const db = require('./db');

async function testBrowserCheckout() {
    console.log('\n=== BROWSER CHECKOUT SIMULATION ===\n');
    
    // This is exactly what the browser sends
    const purchase = {
        orderId: 'ORD-' + Date.now(),
        user: 'jj@gmail.com',
        shippingDetails: {
            firstName: 'jj',
            lastName: 'test',
            email: 'jj@gmail.com',
            phone: '1234567890',
            address: '123 Main St',
            address2: '',
            city: 'Test City',
            country: 'india',
            state: 'goa',
            zip: '12345',
            paymentMethod: 'credit',
            cardName: 'JJ Test',
            cardNumber: '1234567890123456'
        },
        items: [
            {
                id: 1,
                name: '2sdadad',
                price: 12321,
                quantity: 2,
                distributor: 'jj',
                image: 'test.png'
            }
        ],
        total: 24642,
        date: new Date().toISOString(),
        status: 'Pending',
        shipmentStatus: 'pending'
    };

    console.log('Purchase Data Structure:');
    console.log(JSON.stringify(purchase, null, 2));
    console.log('\n---\n');

    // Now test if the server would accept this
    try {
        // Validate required fields (mimic server validation)
        if (!purchase.orderId) throw new Error('Order ID is required');
        if (!purchase.user) throw new Error('User email is required');
        if (!purchase.items || !Array.isArray(purchase.items) || purchase.items.length === 0) {
            throw new Error('Order must contain at least one item');
        }
        if (!purchase.total || purchase.total <= 0) {
            throw new Error('Total must be greater than 0');
        }

        console.log('✓ All validations passed');
        
        // Try to find or create user
        const users = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [purchase.user.trim()]);
        if (users.length === 0) {
            console.log('User not found, would create guest user');
        } else {
            console.log(`User found with ID: ${users[0].id}`);
        }

        // Insert order
        const orderResult = await db.query(
            'INSERT INTO orders (order_id, user_id, user_email, total, status, shipment_status, shipping_details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [purchase.orderId, users[0]?.id || -1, purchase.user, purchase.total, purchase.status, purchase.shipmentStatus, JSON.stringify(purchase.shippingDetails), purchase.date]
        );
        
        console.log(`✓ Order inserted with ID: ${orderResult.insertId}`);
        console.log(`✓ Test passed! Browser checkout would succeed.\n`);

    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

testBrowserCheckout();
