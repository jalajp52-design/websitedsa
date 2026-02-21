const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'glow_gloss.db');
const db = new sqlite3.Database(dbPath);

// Configuration based on your request
const DISTRIBUTOR_EMAIL = 'jj@gmail.com'; // The distributor who needs to see this order
const CUSTOMER_EMAIL = 'jalajp52@gmail.com';
const ORDER_ID = 'ORD-1770494806565';

const productData = {
    name: 'sdadad',
    category: 'Hair Spa',
    price: 212.00,
    description: 'Premium hair spa treatment',
    image: 'images/shampoo.png'
};

const orderData = {
    total: 212.00,
    status: 'pending',
    shipmentStatus: 'pending',
    shippingDetails: JSON.stringify({
        firstName: 'Jalaj',
        lastName: 'Patel',
        email: CUSTOMER_EMAIL,
        phone: '1221312331',
        address: 'jalajpatel',
        address2: '12313',
        city: 'surat',
        state: 'California',
        zip: '395009',
        country: 'Canada',
        paymentMethod: 'on',
        cardName: '123123',
        cardNumber: '**** **** **** 3132'
    })
};

db.serialize(() => {
    console.log('--- Fixing Data for Dashboard ---');

    // 1. Get Distributor Name
    db.get("SELECT name FROM users WHERE email = ?", [DISTRIBUTOR_EMAIL], (err, row) => {
        let distributorName = row ? row.name : 'Jalaj Distributor';
        
        if (!row) {
            console.log(`Creating distributor account for ${DISTRIBUTOR_EMAIL}...`);
            db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", 
                [distributorName, DISTRIBUTOR_EMAIL, 'password123', 'distributor']);
        } else {
            console.log(`Using existing distributor: ${distributorName}`);
        }

        // 2. Insert Product (Fixes "Total Registered Products: 0")
        db.run(`INSERT INTO products (name, category, price, description, image, distributor) 
                SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = ? AND distributor = ?)`,
                [productData.name, productData.category, productData.price, productData.description, productData.image, distributorName, productData.name, distributorName],
                function(err) {
                    if (err) console.error("Product error:", err);
                    else console.log(`Product '${productData.name}' ensured for distributor.`);
                }
        );

        // 3. Ensure Customer
        db.run(`INSERT INTO users (name, email, password, role) 
                SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ?)`,
                ['Jalaj Patel', CUSTOMER_EMAIL, 'guest123', 'customer', CUSTOMER_EMAIL],
                (err) => { if (err) console.error("Customer error:", err); }
        );

        // 4. Get Customer ID
        db.get("SELECT id FROM users WHERE email = ?", [CUSTOMER_EMAIL], (err, user) => {
            if (!user) return;

            // 5. Insert/Update Order
            db.get("SELECT id FROM orders WHERE order_id = ?", [ORDER_ID], (err, order) => {
                if (order) {
                    console.log("Order exists. Updating details...");
                    // Update user_id in case it was wrong, and ensure it's visible
                    db.run("UPDATE orders SET user_id = ?, total = ? WHERE id = ?", [user.id, orderData.total, order.id]);
                    
                    // Fix Order Items (Fixes "Total Orders: 0" in dashboard)
                    // We delete existing items for this order to avoid duplicates and ensure correct distributor
                    db.run("DELETE FROM order_items WHERE order_id = ?", [order.id], () => {
                        insertItem(order.id, distributorName);
                    });
                } else {
                    console.log("Creating new order...");
                    db.run(`INSERT INTO orders (order_id, user_id, user_email, total, status, shipment_status, shipping_details, created_at) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [ORDER_ID, user.id, CUSTOMER_EMAIL, orderData.total, orderData.status, orderData.shipmentStatus, orderData.shippingDetails, new Date().toISOString()],
                        function(err) {
                            if (err) console.error("Order insert error:", err);
                            else insertItem(this.lastID, distributorName);
                        }
                    );
                }
            });
        });
    });
});

function insertItem(orderId, distributorName) {
    db.run(`INSERT INTO order_items (order_id, product_name, product_price, quantity, distributor, image) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, productData.name, productData.price, 1, distributorName, productData.image],
        (err) => {
            if (err) console.error("Item insert error:", err);
            else console.log("SUCCESS: Order and Product data fixed. Check dashboard.");
        }
    );
}