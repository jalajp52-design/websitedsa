-- Database schema for Glow & Gloss e-commerce website
-- This file contains the SQL structure for storing users, products, and orders

-- Create database
CREATE DATABASE IF NOT EXISTS glow_gloss_db;
USE glow_gloss_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'retailer', 'distributor') DEFAULT 'customer',
    picture VARCHAR(500),
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    distributor VARCHAR(255) DEFAULT 'Main Warehouse',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipment_status VARCHAR(50) DEFAULT 'pending',
    shipping_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table (for individual products in orders)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    distributor VARCHAR(255),
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Cart table (for persistent cart storage)
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    distributor VARCHAR(255),
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Insert sample data
INSERT INTO products (name, category, price, description, image, distributor) VALUES
('Silk Shine Shampoo', 'Shampoo', 25.00, 'Lathers beautifully to leave your hair silken and shiny.', 'images/shampoo.png', 'Main Warehouse'),
('Velvet Smooth Conditioner', 'Conditioner', 22.00, 'Provides deep nourishment for a velvet-smooth finish.', 'images/conditioner.png', 'Main Warehouse'),
('Deep Repair Hair Spa', 'Hair Spa', 45.00, 'Intensive repair mask for damaged and dry hair.', 'images/hair-spa.png', 'Main Warehouse'),
('Radiant Glow Face Cream', 'Skincare', 35.00, 'Hydrating face cream for a radiant, healthy glow.', 'images/face-cream.png', 'Main Warehouse'),
('Golden Hour Serum', 'Skincare', 50.00, 'Concentrated serum to brighten and rejuvenate your skin.', 'images/serum.png', 'Main Warehouse'),
('Rosewater Mist', 'Skincare', 18.00, 'Refreshing facial mist.', 'images/serum.png', 'Main Warehouse'),
('Argan Hair Oil', 'Hair Spa', 28.00, 'Nourishing oil.', 'images/hair-spa.png', 'Main Warehouse'),
('Clay Detox Mask', 'Skincare', 24.00, 'Deep cleaning mask.', 'images/face-cream.png', 'Main Warehouse'),
('Volumizing Mousse', 'Shampoo', 15.00, 'Lightweight volume.', 'images/shampoo.png', 'Main Warehouse'),
('Moisture Lock Balm', 'Skincare', 12.00, '24h hydration.', 'images/conditioner.png', 'Main Warehouse');

-- Sample user (password would be hashed in real implementation)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@glowandgloss.com', 'password123', 'retailer'),
('John Doe', 'john@example.com', 'password123', 'customer');

-- Useful queries for analytics

-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- Count users by role
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- Count total orders
SELECT COUNT(*) as total_orders FROM orders;

-- Total revenue
SELECT SUM(total) as total_revenue FROM orders WHERE status = 'delivered';

-- Most popular products
SELECT
    p.name,
    p.category,
    SUM(oi.quantity) as total_sold,
    SUM(oi.product_price * oi.quantity) as total_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY p.id, p.name, p.category
ORDER BY total_sold DESC;

-- Recent orders
SELECT
    o.order_id,
    u.name as customer_name,
    u.email,
    o.total,
    o.status,
    o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 10;

-- User purchase history
SELECT
    u.name,
    u.email,
    COUNT(o.id) as total_orders,
    SUM(o.total) as total_spent,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name, u.email
ORDER BY total_spent DESC;

-- Monthly sales report
SELECT
    DATE_FORMAT(created_at, '%Y-%m') as month,
    COUNT(*) as orders_count,
    SUM(total) as monthly_revenue
FROM orders
WHERE status = 'delivered'
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;

-- Top distributors by sales
SELECT
    distributor,
    COUNT(*) as products_sold,
    SUM(product_price * quantity) as total_revenue
FROM order_items
GROUP BY distributor
ORDER BY total_revenue DESC;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_session_id ON cart(session_id);
