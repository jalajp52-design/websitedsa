// API Configuration
// Change BASE_API_URL based on your environment:
// - Local development: 'http://localhost:3001'
// - Deployed: 'https://your-backend-url.onrender.com' (update with your actual URL)

const BASE_API_URL = 'http://localhost:3001';

// API Endpoints
const API_ENDPOINTS = {
    register: `${BASE_API_URL}/api/register`,
    login: `${BASE_API_URL}/api/login`,
    products: `${BASE_API_URL}/api/products`,
    orders: `${BASE_API_URL}/api/orders`,
    updateOrder: (orderId) => `${BASE_API_URL}/api/orders/${orderId}`,
    deleteOrder: (orderId) => `${BASE_API_URL}/api/orders/${orderId}`,
    checkUsers: `${BASE_API_URL}/api/check-users`,
    checkOrders: `${BASE_API_URL}/api/check-orders`,
    checkOrderItems: `${BASE_API_URL}/api/check-order-items`,
    updateOrders: `${BASE_API_URL}/api/update-orders`
};

// Export for use in other files
window.API = API_ENDPOINTS;
