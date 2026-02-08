const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ecommerce.db');

const defaultShipping = JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    country: 'USA'
});

db.run('UPDATE orders SET shipping_details = ? WHERE shipping_details IS NULL OR shipping_details = ""', [defaultShipping], function(err) {
    if (err) {
        console.error('Error updating orders:', err);
    } else {
        console.log('Updated', this.changes, 'rows');
    }
    db.close();
});
