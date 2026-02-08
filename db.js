const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database file instead of external server
const dbPath = path.resolve(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'customer',
            picture TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error("Error creating users table", err);
            else {
                // Check if warehouse user exists, if not add it
                db.get("SELECT count(*) as count FROM users WHERE email = 'warehouse@glowandgloss.com'", (err, row) => {
                    if (row.count === 0) {
                        console.log("Adding warehouse user...");
                        db.run("INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)", ['Main Warehouse', 'warehouse@glowandgloss.com', 'password123', 'distributor', '2026-02-07']);
                    } else {
                        console.log("Updating warehouse user...");
                        db.run("UPDATE users SET name = ?, role = ? WHERE email = ?", ['Main Warehouse', 'distributor', 'warehouse@glowandgloss.com']);
                    }
                });
            }
        });

        // Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            image TEXT,
            distributor TEXT DEFAULT 'Main Warehouse',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error("Error creating products table", err);
            else {
                // Check if products exist, if not seed them
                db.get("SELECT count(*) as count FROM products", (err, row) => {
                    if (row.count === 0) {
                        console.log("Seeding products...");
                        const insert = db.prepare("INSERT INTO products (name, category, price, description, image, distributor) VALUES (?, ?, ?, ?, ?, ?)");
                        const products = [
                            ['Silk Shine Shampoo', 'Shampoo', 25.00, 'Lathers beautifully to leave your hair silken and shiny.', 'images/shampoo.png', 'Main Warehouse'],
                            ['Velvet Smooth Conditioner', 'Conditioner', 22.00, 'Provides deep nourishment for a velvet-smooth finish.', 'images/conditioner.png', 'Main Warehouse'],
                            ['Deep Repair Hair Spa', 'Hair Spa', 45.00, 'Intensive repair mask for damaged and dry hair.', 'images/hair-spa.png', 'Main Warehouse'],
                            ['Radiant Glow Face Cream', 'Skincare', 35.00, 'Hydrating face cream for a radiant, healthy glow.', 'images/face-cream.png', 'Main Warehouse'],
                            ['Golden Hour Serum', 'Skincare', 50.00, 'Concentrated serum to brighten and rejuvenate your skin.', 'images/serum.png', 'Main Warehouse'],
                            ['Rosewater Mist', 'Skincare', 18.00, 'Refreshing facial mist.', 'images/serum.png', 'Main Warehouse'],
                            ['Argan Hair Oil', 'Hair Spa', 28.00, 'Nourishing oil.', 'images/hair-spa.png', 'Main Warehouse'],
                            ['Clay Detox Mask', 'Skincare', 24.00, 'Deep cleaning mask.', 'images/face-cream.png', 'Main Warehouse'],
                            ['Volumizing Mousse', 'Shampoo', 15.00, 'Lightweight volume.', 'images/shampoo.png', 'Main Warehouse'],
                            ['Moisture Lock Balm', 'Skincare', 12.00, '24h hydration.', 'images/conditioner.png', 'Main Warehouse']
                        ];
                        products.forEach(p => insert.run(p));
                        insert.finalize();
                    }
                });
            }
        });

        // Orders Table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            user_email TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            shipment_status TEXT DEFAULT 'pending',
            shipping_details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Order Items Table
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL,
            product_price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            distributor TEXT,
            image TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )`);
    });
}

// Wrapper for async usage to mimic mysql2/promise interface used in server.js
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        // Simple check: if SQL starts with SELECT, use db.all(), otherwise db.run()
        // But for INSERT via db.run, we need `this.lastID`, so check if it's an INSERT separately?
        // Actually, let's just make a generic wrapper.

        // Trim and uppercase first word
        const command = sql.trim().split(' ')[0].toUpperCase();

        if (command === 'SELECT') {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        } else {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else {
                    // Start mimicking mysql2 result object
                    resolve({
                        insertId: this.lastID,
                        affectedRows: this.changes
                    });
                }
            });
        }

    });

}

module.exports = {
    query
};
