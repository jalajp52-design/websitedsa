const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
        return;
    }
    console.log('Connected to SQLite database for migration');
});

// Function to add column if not exists
function addColumnIfNotExists(table, column, type) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${table})`, (err, columns) => {
            if (err) {
                reject(err);
                return;
            }
            const columnExists = columns.some(col => col.name === column);
            if (!columnExists) {
                db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`Added column ${column} to ${table}`);
                        resolve();
                    }
                });
            } else {
                console.log(`Column ${column} already exists in ${table}`);
                resolve();
            }
        });
    });
}

async function migrate() {
    try {
        await addColumnIfNotExists('orders', 'shipment_status', 'TEXT DEFAULT \'pending\'');
        await addColumnIfNotExists('orders', 'shipping_details', 'TEXT');
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        db.close();
    }
}

migrate();
