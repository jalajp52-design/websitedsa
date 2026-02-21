#!/usr/bin/env node

// Test the checkout API with proper error handling
const http = require('http');

const testData = {
    orderId: 'TEST-' + Date.now(),
    user: 'jj@gmail.com',
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
    shipmentStatus: 'pending',
    shippingDetails: {}
};

const jsonData = JSON.stringify(testData);

console.log('Testing /api/orders endpoint...\n');
console.log('URL: http://localhost:3001/api/orders');
console.log('Method: POST');
console.log('Data:', JSON.stringify(testData, null, 2));
console.log('\n---\n');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/orders',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonData)
    }
};

const req = http.request(options, (res) => {
    let responseData = '';

    console.log(`Status: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    console.log('---\n');

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Response:');
        try {
            const parsed = JSON.parse(responseData);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('Raw Response:', responseData);
            console.log('Parse Error:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(jsonData);
req.end();
