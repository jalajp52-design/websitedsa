const db = require('./db');

async function checkOrders() {
    try {
        const orders = await db.query('SELECT * FROM orders');
        console.log('Orders in database:');
        console.log(orders);

        for (const order of orders) {
            const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
            console.log(`Items for order ${order.id}:`, items);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkOrders();
