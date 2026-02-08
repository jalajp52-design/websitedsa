# MySQL Queries for Glow & Gloss

Use these queries in your MySQL client (like Workbench or phpMyAdmin) to view the data.

## 1. User Login Query (Used by the app)
This is the query executed when a user logs in:
```sql
SELECT * FROM users WHERE LOWER(email) = LOWER(?);
```
Note: The password is verified using bcrypt.compare() in the Node.js app since passwords are hashed.

## 2. View All Users and Their Roles
```sql
SELECT id, name, email, role, created_at FROM users;
```

## 3. View All Orders with User Details
```sql
SELECT
    o.order_id,
    u.name AS user_name,
    u.email AS user_email,
    o.total,
    o.status,
    o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;
```

## 4. View Purchase Items and Details (Detailed View)
This query shows exactly what products were purchased in each order.
```sql
SELECT
    o.order_id,
    u.name AS customer,
    oi.product_name,
    oi.quantity,
    oi.product_price,
    (oi.quantity * oi.product_price) AS subtotal,
    oi.distributor,
    o.status
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;
```

## 5. Get Orders for a Specific User (Customer View)
```sql
SELECT
    o.id, o.order_id, o.user_email, o.total, o.status, o.created_at, o.shipping_details, o.shipment_status,
    u.name as user_name
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE LOWER(o.user_email) = LOWER('user@example.com')
ORDER BY o.created_at DESC;
```

## 6. Update Order Shipment Status
```sql
UPDATE orders SET shipment_status = 'shipped' WHERE id = 1;
```

## 7. Insert a Test User Manually (To verify it shows in the app)
Run this, then try to login with `test@example.com` / `password123`:
```sql
INSERT INTO users (name, email, password, role)
VALUES ('Test SQL User', 'test@example.com', 'password123', 'customer');
```

## 8. Insert a Test Product Manually (To verify it shows in the products page)
```sql
INSERT INTO products (name, category, price, description, image, distributor)
VALUES ('SQL Added Serum', 'Skincare', 99.99, 'Added via SQL directly', 'images/serum.png', 'Main Warehouse');
```
