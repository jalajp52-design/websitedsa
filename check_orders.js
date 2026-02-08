const db = require('./db');

async function checkOrders() {
    try {
        const orders = await db.query('SELECT * FROM orders');
        console.log('Orders in database:', orders.length);
        orders.forEach(order => {
            console.log(order);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

checkOrders();
