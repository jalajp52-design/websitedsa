const db = require('./db');

async function checkUsers() {
    try {
        const users = await db.query('SELECT * FROM users');
        console.log('Users in database:', users.length);
        users.forEach(user => {
            console.log(user);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUsers();
