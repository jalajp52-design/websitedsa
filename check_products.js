const db = require('./db');

async function checkProducts() {
    try {
        const products = await db.query('SELECT * FROM products');
        console.log('Products in database:');
        console.log(products);
    } catch (error) {
        console.error('Error:', error);
    }
}

checkProducts();
