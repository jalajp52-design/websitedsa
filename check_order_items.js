const db = require('./db');

async function checkOrderItems() {
    try {
        const items = await db.query('SELECT * FROM order_items');
        console.log('Order items in database:', items.length);
        items.forEach(item => {
            console.log(item);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

checkOrderItems();
