// Scroll products function - Global scope
window.scrollProducts = function (containerId, amount) {
    const container = document.getElementById(containerId);
    if (container) {
        container.scrollBy({
            left: amount,
            behavior: 'smooth'
        });
    }
};

$(document).ready(function () {
    // Load common footer
    $('#footer-placeholder').load('footer.html');

    // Force Video Autoplay
    const video = document.getElementById('heroVideo');
    if (video) {
        video.muted = true; // Ensure muted for autoplay
        video.play().catch(e => console.log("Video autoplay blocked:", e));
    }

    // Sidebar Toggle
    $('.sidebar-toggle').on('click', function () {
        $('.sidebar').toggleClass('show');
    });

    // Antigravity Scene Interaction
    let isHoveringScene = false;

    $('.antigravity-scene').on('mouseenter', function () {
        isHoveringScene = true;
    }).on('mouseleave', function () {
        isHoveringScene = false;
        // Reset bubbles to original position
        $('.floating-bubble').css('transform', '');
        $('.glass-orb').css('transform', '');
    });

    $(document).on('mousemove', function (e) {
        if (!isHoveringScene) return;

        const x = (window.innerWidth / 2 - e.pageX) / 40;
        const y = (window.innerHeight / 2 - e.pageY) / 40;

        // Multi-layered Parallax
        $('.glass-orb').css('transform', `translate(${x * 0.5}px, ${y * 0.5}px) rotateY(${x}deg) rotateX(${-y}deg)`);

        $('.floating-bubble').each(function (index) {
            const multiplier = (index % 5) + 1; // Vary multiplier from 1 to 5
            const scale = 0.8 + (index % 3) * 0.1; // Vary scale from 0.8 to 1.0
            $(this).css('transform', `translate(${x * multiplier}px, ${y * multiplier}px) scale(${scale})`);
        });
    });

    // Role-based navigation visibility and Avatar logic
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    // Allow both 'retailer' and 'distributor' to access retailer features
    const isRetailer = currentUser && (currentUser.role === 'retailer' || currentUser.role === 'distributor');

    if (currentUser) {
        // Show user avatar on the right side of navbar
        const avatarUrl = currentUser.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.email) + '&background=c4a484&color=fff';

        const fallbackAvatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.email) + '&background=667eea&color=fff';

        // Replace login/register buttons with user dropdown
        const userDropdown = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <img src="${avatarUrl}" class="rounded-circle me-2 user-avatar" width="30" height="30" style="object-fit: cover; border: 2px solid #667eea;" data-fallback="${fallbackAvatarUrl}">
                    <span class="d-none d-md-inline">${currentUser.name}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="orders.html"><i class="fas fa-shopping-bag me-2"></i>My Orders</a></li>
                    ${currentUser.role === 'distributor' ? '<li><a class="dropdown-item" href="distributor-dashboard.html"><i class="fas fa-chart-line me-2"></i>Distributor Dashboard</a></li><li><a class="dropdown-item" href="products.html"><i class="fas fa-plus me-2"></i>Add Products</a></li>' : ''}
                    ${currentUser.role === 'retailer' ? '<li><a class="dropdown-item" href="retailer-dashboard.html"><i class="fas fa-chart-line me-2"></i>Retailer Dashboard</a></li><li><a class="dropdown-item" href="products.html"><i class="fas fa-plus me-2"></i>Add Products</a></li>' : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item global-logout-btn" href="#"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </li>
        `;

        // Remove existing login/register buttons and add user dropdown
        $('.navbar-nav.ms-auto .nav-item').last().after(userDropdown);
        $('.login-btn').remove();
        $('.register-btn').remove();

        // Handle avatar image loading errors
        $('.user-avatar').on('error', function () {
            const fallbackUrl = $(this).data('fallback');
            $(this).attr('src', fallbackUrl);
        });

        // Show retailer-specific elements
        if (isRetailer) {
            $('.btn[data-bs-target="#addModal"]').show();
            $('.navbar-nav .nav-link[href="retailer-dashboard.html"]').closest('li').show();
            $('.sidebar .nav-link[href="retailer-dashboard.html"]').show();
        } else {
            // Hide retailer elements for customers
            $('.btn[data-bs-target="#addModal"]').hide();
            $('.navbar-nav .nav-link[href="retailer-dashboard.html"]').closest('li').hide();
            $('.sidebar .nav-link[href="retailer-dashboard.html"]').hide();
        }
    } else {
        // Hide retailer-specific elements when not logged in
        // Use specific selectors to avoid hiding entire sidebar sections
        $('.navbar-nav .nav-link[href="orders.html"]').closest('li').hide();
        $('.sidebar .nav-link[href="orders.html"]').hide();
        
        $('.navbar-nav .nav-link[href="retailer-dashboard.html"]').closest('li').hide();
        $('.sidebar .nav-link[href="retailer-dashboard.html"]').hide();

        $('.btn[data-bs-target="#addModal"]').hide();
    }

    $(document).on('click', '.global-logout-btn', function (e) {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        window.location.reload();
    });

    // Global Search Redirect logic
    $('#nav-search-form').on('submit', function (e) {
        e.preventDefault();
        const query = $('#nav-search-input').val();
        if (query) {
            window.location.href = 'products.html?search=' + encodeURIComponent(query);
        }
    });

    // Handle search query on products page load
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery && $('#search-input').length > 0) {
        $('#search-input').val(searchQuery).trigger('keyup');
    }

    // Show page loading overlay
    $('body').append('<div class="page-loading"><div class="spinner"></div></div>');

    // Load Category Products on Home Page
    if ($('#shampoo-products').length > 0) {
        loadProductsByCategory('Shampoo', '#shampoo-products');
    }
    if ($('#conditioner-products').length > 0) {
        loadProductsByCategory('Conditioner', '#conditioner-products');
    }
    if ($('#hairspa-products').length > 0) {
        loadProductsByCategory('Hair Spa', '#hairspa-products');
    }
    if ($('#skincare-products').length > 0) {
        loadProductsByCategory('Skincare', '#skincare-products');
    }
    if ($('#top-sales-products').length > 0) {
        loadTopSales('#top-sales-products');
    }

    // Load All Products on Products Page
    if ($('#all-products').length > 0) {
        loadProducts(null, '#all-products');
    }

    // Remove page loading overlay after initial load
    setTimeout(() => {
        $('.page-loading').fadeOut(300, function() {
            $(this).remove();
        });
    }, 1000);

    // Search Functionality
    $('#search-input').on('keyup', function () {
        const value = $(this).val().toLowerCase();
        $('.product-item').filter(function () {
            $(this).toggle($(this).find('.product-name').text().toLowerCase().indexOf(value) > -1 ||
                $(this).find('.product-category').text().toLowerCase().indexOf(value) > -1);
        });
    });

    // Category Filter
    $('.filter-btn').on('click', function () {
        const cat = $(this).data('filter');
        $('.filter-btn').removeClass('active btn-dark').addClass('btn-outline-dark');
        $(this).addClass('active btn-dark').removeClass('btn-outline-dark');

        if (cat === 'all') {
            $('.product-item').fadeIn();
        } else {
            $('.product-item').hide();
            $(`.product-item[data-category="${cat}"]`).fadeIn();
        }
    });

    // Form Validations
    $('#registration-form').on('submit', async function (e) {
        e.preventDefault();
        if (validateForm(this)) {
            const formData = {
                name: $('#reg-name').val(),
                email: $('#reg-email').val(),
                role: $('#reg-role').val(),
                password: $('#reg-password').val()
            };

            try {
                const response = await fetch(window.API.register, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('Registration Successful! You can now login.');
                    window.location.href = 'login.html';
                } else {
                    const error = await response.json();
                    alert('Registration failed: ' + error.error);
                }
            } catch (err) {
                console.error('Error registering:', err);
                alert('An error occurred. Please try again later.');
            }
        }
    });

    $('#login-form').on('submit', async function (e) {
        e.preventDefault();
        if (validateForm(this)) {
            const email = $('#login-email').val();
            const password = $('#login-password').val();

            try {
                const response = await fetch(window.API.login, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    alert('Login Successful! Welcome, ' + data.user.name);
                    sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                    window.location.href = 'index.html';
                } else {
                    alert('Invalid email or password.');
                }
            } catch (err) {
                console.error('Login error:', err);
                alert('An error occurred. Please check your connection.');
            }
        }
    });

    // Initialize extraProducts for all users to ensure added products are visible
    const defaultJSON = [
        { "id": 101, "name": "Rosewater Mist", "category": "Skincare", "price": 18.00, "description": "Refreshing facial mist.", "image": "images/serum.png", "distributor": "Main Warehouse", "rating": 4.2 },
        { "id": 102, "name": "Argan Hair Oil", "category": "Hair Spa", "price": 28.00, "description": "Nourishing oil.", "image": "images/hair-spa.png", "distributor": "Main Warehouse", "rating": 4.8 },
        { "id": 103, "name": "Clay Detox Mask", "category": "Skincare", "price": 24.00, "description": "Deep cleaning mask.", "image": "images/face-cream.png", "distributor": "Main Warehouse", "rating": 4.5 },
        { "id": 104, "name": "Volumizing Mousse", "category": "Shampoo", "price": 15.00, "description": "Lightweight volume.", "image": "images/shampoo.png", "distributor": "Main Warehouse", "rating": 4.0 },
        { "id": 105, "name": "Moisture Lock Balm", "category": "Skincare", "price": 12.00, "description": "24h hydration.", "image": "images/conditioner.png", "distributor": "Main Warehouse", "rating": 4.7 }
    ];
    let extra = JSON.parse(localStorage.getItem('extraProducts') || '[]');
    if (extra.length === 0) {
        localStorage.setItem('extraProducts', JSON.stringify(defaultJSON));
    }

    // Insertion Form
    $('#insertion-form').on('submit', function (e) {
        e.preventDefault();


        if (!validateForm(this)) {
            alert('Please fill out all required fields correctly.');
            return;
        }

        const fileInput = $('#item-image')[0];
        const file = fileInput.files[0];
        const defaultImage = 'images/shampoo.png'; // Default image if no file selected

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const imageData = e.target.result;
                    saveProduct(imageData);
                } catch (err) {
                    console.error(err);
                    alert('Storage full or error saving product. Try a smaller image.');
                }
            };
            reader.onerror = function () {
                alert('Error reading file. Please try again.');
            };
            reader.readAsDataURL(file);
        } else {
            // No image selected, use default
            saveProduct(defaultImage);
        }

        function saveProduct(imageData) {
            const newItem = {
                name: $('#item-name').val(),
                category: $('#item-category').val(),
                price: parseFloat($('#item-price').val()),
                description: $('#item-description').val(),
                image: imageData,
                distributor: currentUser.name // Track which distributor added the product
            };

            // Save to server database
            fetch(window.API.products, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    // Also save locally for immediate display
                    let extraProducts = JSON.parse(localStorage.getItem('extraProducts') || '[]');
                    const localItem = { ...newItem, id: data.productId };
                    extraProducts.push(localItem);
                    localStorage.setItem('extraProducts', JSON.stringify(extraProducts));

                    alert('Success! Product added to inventory.');
                    $('#addModal').modal('hide');
                    $('#insertion-form')[0].reset();

                    // Immediately refresh the product list without page reload
                    if ($('#all-products').length > 0) {
                        loadProducts(null, '#all-products');
                    }
                    if ($('#featured-products').length > 0) {
                        loadProducts(6, '#featured-products');
                    }
                } else {
                    alert('Error adding product: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(err => {
                console.error('Error saving product:', err);
                alert('Error saving product. Please try again.');
            });
        }
    });

    // Cart Functionality
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    updateCartCount();

    // Add to Cart Click Handler (Event Delegation)
    $(document).on('click', '.add-to-cart', function () {
        const id = $(this).data('id');
        const name = $(this).data('name');
        const price = parseFloat($(this).attr('data-price')); // Force float
        const image = $(this).data('image');
        const distributor = $(this).data('distributor'); // Get distributor from product card

        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, image, distributor, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        alert(`Added ${name} to cart!`);
    });

    // Render Cart in Modal/Page
    $('#cartModal').on('show.bs.modal', function () {
        renderCart();
    });

    // Checkout / Purchase Functionality
    $(document).on('click', '#checkout-btn', function () {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('Please login to complete your purchase.');
            window.location.href = 'login.html';
            return;
        }

        // Redirect to checkout page
        window.location.href = 'checkout.html';
    });

    function updateCartCount() {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        $('.cart-count').text(count);
    }

    function calculateTotal() {
        const total = cart.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || 0;
            return sum + (price * qty);
        }, 0);
        return total;
    }

    function renderCart() {
        const $cartList = $('#cart-items-list');
        $cartList.empty();

        if (cart.length === 0) {
            $cartList.html('<p class="text-center py-4">Your cart is empty.</p>');
            $('#cart-total').text('$0.00');
            return;
        }

        cart.forEach((item, index) => {
            $cartList.append(`
                <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                    <img src="${item.image}" width="50" class="me-3">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">$${item.price} x ${item.quantity}</small>
                    </div>
                    <div class="text-end">
                        <button class="btn btn-sm text-danger remove-item" data-index="${index}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `);
        });

        $('#cart-total').text('$' + calculateTotal().toFixed(2));
    }

    $(document).on('click', '.remove-item', function () {
        const index = $(this).data('index');
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
    });

    // Handle shipment status changes for distributors
    $(document).on('change', '.shipment-status', function () {
        const dbId = $(this).data('order-id');
        const newStatus = $(this).val();

        // Update via API
        fetch(window.API.updateOrder(dbId), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipmentStatus: newStatus })
        })
        .then(response => {
            if (response.ok) {
                // Update the badge color
                const $badge = $(this).closest('.card-body').find('.badge');
                $badge.removeClass('bg-warning bg-primary bg-success');
                if (newStatus === 'shipped') {
                    $badge.addClass('bg-primary');
                } else if (newStatus === 'delivered') {
                    $badge.addClass('bg-success');
                } else {
                    $badge.addClass('bg-warning');
                }
                $badge.text(newStatus);

                alert(`Order status updated to ${newStatus}.`);
            } else {
                alert('Failed to update order status.');
            }
        })
        .catch(err => {
            console.error('Error updating order status:', err);
            alert('Error updating order status.');
        });
    });

    // Scroll products function
    window.scrollProducts = function (containerId, amount) {
        const container = document.getElementById(containerId);
        if (container) {
            container.scrollBy({
                left: amount,
                behavior: 'smooth'
            });
        }
    };



    // Render Orders on About Page
    if ($('#orders-list').length > 0) {
        renderOrders();
    }

    function cleanupInvalidLocalOrders() {
        // Remove local orders that don't have valid database IDs
        const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
        const validLocalOrders = localOrders.filter(order => order.id && !isNaN(order.id));

        if (validLocalOrders.length !== localOrders.length) {
            localStorage.setItem('localOrders', JSON.stringify(validLocalOrders));
            console.log(`Cleaned up ${localOrders.length - validLocalOrders.length} invalid local orders`);
        }
    }

    async function renderOrders() {
        // Clean up invalid local orders (those without database IDs)
        cleanupInvalidLocalOrders();

        // Fetch orders from API instead of localStorage
        const urlParams = new URLSearchParams(window.location.search);
        let emailFromUrl = urlParams.get('email');
        const roleFromUrl = urlParams.get('role') || 'customer';

        // If user is logged in as customer and no email in URL, use their email
        if (currentUser && currentUser.role === 'customer' && !emailFromUrl) {
            emailFromUrl = currentUser.email;
        } else if (!currentUser && !emailFromUrl) {
            // If not logged in and no email in URL, try to get from localStorage (set during checkout)
            emailFromUrl = localStorage.getItem('userEmail');
        }

        let orders = [];
        try {
            const url = emailFromUrl
                ? `${window.API.orders}?email=${encodeURIComponent(emailFromUrl)}&role=${roleFromUrl}`
                : window.API.orders;
            const response = await fetch(url);
            if (response.ok) {
                orders = await response.json();
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        }

        // Fallback: Check for locally stored orders to ensure immediate feedback and history
        const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
        const lastOrder = JSON.parse(localStorage.getItem('lastOrder'));

        // Ensure lastOrder is in localOrders (migration/fallback)
        if (lastOrder && !localOrders.some(o => o.orderId === lastOrder.orderId)) {
            localOrders.push(lastOrder);
        }

        if (localOrders.length > 0) {
            // Ensure we are viewing the correct user's orders
            const userLocalOrders = localOrders.filter(o => !emailFromUrl || (o.user && o.user.toLowerCase() === emailFromUrl.toLowerCase()));

            // Only include local orders that have valid database IDs (exclude invalid local orders)
            const validLocalOrders = userLocalOrders.filter(localOrder => localOrder.id && !isNaN(localOrder.id));

            validLocalOrders.forEach(localOrder => {
                const exists = orders.some(o => o.orderId === localOrder.orderId);
                if (!exists) {
                    orders.push(localOrder);
                }
            });

            // Re-sort all orders by date descending
            orders.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
        }



        const $ordersList = $('#orders-list');

        if (orders.length === 0) {
            $ordersList.html('<p class="text-center py-5">No orders found.</p>');
            return;
        }

        // Determine if we are viewing specific purchases (Receipt mode) or Sales (Dashboard mode)
        const isReceiptMode = !!emailFromUrl;

        // If it's a retailer, filter the orders to only show THEIR products
        // Only apply this filter if we are NOT viewing a specific email (i.e. Dashboard mode)
        if (currentUser && currentUser.role === 'retailer' && !isReceiptMode) {
            orders = orders.map(order => {
                const myItems = order.items.filter(item => item.distributor === currentUser.name);
                if (myItems.length > 0) {
                    return {
                        ...order,
                        items: myItems,
                        totalPrice: myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    };
                }
                return null;
            }).filter(order => order !== null);
        } else if (currentUser && currentUser.role === 'distributor' && !isReceiptMode) {
            // For distributors, show full orders that contain their products
            orders = orders.filter(order =>
                order.items.some(item => item.distributor === currentUser.name)
            ).map(order => ({
                ...order,
                totalPrice: order.total
            }));
        } else {
            // For customers (or retailers viewing their own purchases), just use the original total
            orders = orders.map(order => ({ ...order, totalPrice: order.total }));
        }

        if (orders.length === 0) {
            $ordersList.html('<p class="text-center py-5">No orders found for your inventory.</p>');
            return;
        }



        // Render as detailed receipt cards for all users - one per item
        const isDistributor = currentUser && currentUser.role === 'distributor';
        const receipts = [];
        orders.reverse().forEach(order => {
            order.items.forEach(item => {
                // For distributors, only show items they distribute IF in Dashboard mode
                if (!isReceiptMode && isDistributor && item.distributor !== currentUser.name) return;
                receipts.push({ order, item });
            });
        });
        const cardsHtml = receipts.map(({ order, item }) => {
            const itemTotal = item.price * item.quantity;
            const shipmentStatus = order.shipmentStatus || 'pending';
            const shipping = order.shippingDetails || {};
            const shippingAddress = `${shipping.firstName || ''} ${shipping.lastName || ''}<br>${shipping.address || ''}${shipping.address2 ? '<br>' + shipping.address2 : ''}<br>${shipping.city || ''}, ${shipping.state || ''} ${shipping.zip || ''}<br>${shipping.country || ''}`;
            const statusBadge = `<span class="badge ${shipmentStatus === 'shipped' ? 'bg-primary' : shipmentStatus === 'delivered' ? 'bg-success' : 'bg-warning'}">${shipmentStatus}</span>`;
            
            // Only allow status update if user is distributor AND owns the item
            const canUpdate = isDistributor && item.distributor === currentUser.name;

            const updateSelect = canUpdate ? `
                <div class="mt-3">
                    <label class="form-label">Update Status:</label>
                    <select class="form-select shipment-status" data-order-id="${order.id}">
                        <option value="pending" ${shipmentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="shipped" ${shipmentStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${shipmentStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                </div>
            ` : '';

            const canDelete = currentUser && order.id && !isNaN(order.id) && (
                (currentUser.role === 'customer' && order.user.toLowerCase() === currentUser.email.toLowerCase()) ||
                ((currentUser.role === 'distributor' || currentUser.role === 'retailer') && item.distributor === currentUser.name)
            );

            const deleteButton = canDelete ? `<button class="btn btn-sm btn-outline-danger delete-order-btn" data-order-id="${order.id}" title="Delete Order"><i class="fas fa-trash"></i></button>` : '';

            return `
                <div class="card mb-4 shadow-sm">
                    <div class="card-header bg-primary text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Order ${order.orderId} - ${item.name}</h5>
                            <div class="d-flex align-items-center gap-2">
                                ${statusBadge}
                                ${deleteButton}
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h6>Item Ordered:</h6>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div class="d-flex align-items-center">
                                        <img src="${item.image}" alt="${item.name}" class="rounded me-3" style="width: 50px; height: 50px; object-fit: cover;">
                                        <div>
                                            <h6 class="mb-0">${item.name}</h6>
                                            <small class="text-muted">Quantity: ${item.quantity}</small>
                                        </div>
                                    </div>
                                    <span class="fw-bold">$${itemTotal.toFixed(2)}</span>
                                </div>
                                <hr>
                                <div class="d-flex justify-content-between">
                                    <strong>Total:</strong>
                                    <strong>$${itemTotal.toFixed(2)}</strong>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6>Shipping Details:</h6>
                                <address class="mb-0">
                                    ${shippingAddress}
                                </address>
                                <p class="mt-2"><strong>Email:</strong> ${shipping.email || order.user}</p>
                                <p><strong>Phone:</strong> ${shipping.phone || 'N/A'}</p>
                                <p><strong>Payment:</strong> ${shipping.paymentMethod || 'N/A'}</p>
                                <p><strong>Card Name:</strong> ${shipping.cardName || ''}</p>
                                <p><strong>Card Number:</strong> **** **** **** ${shipping.cardNumber ? shipping.cardNumber.slice(-4) : ''}</p>
                                ${updateSelect}
                            </div>
                        </div>
                        <div class="mt-3 text-muted">
                            <small>Order Date: ${new Date(order.date).toLocaleString()}</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        $ordersList.html(cardsHtml);
    }

    function getRatingHtml(rating) {
        const r = parseFloat(rating) || 0;
        const full = Math.floor(r);
        const half = r % 1 !== 0;
        const empty = 5 - full - (half ? 1 : 0);
        let html = '';
        for (let i = 0; i < full; i++) html += '<i class="fas fa-star text-warning"></i>';
        if (half) html += '<i class="fas fa-star-half-alt text-warning"></i>';
        for (let i = 0; i < empty; i++) html += '<i class="far fa-star text-warning"></i>';
        return r > 0 ? `<div class="product-rating mb-2">${html} <small class="text-muted">(${r})</small></div>` : '';
    }

    function loadProducts(limit, containerId) {
        const $container = $(containerId);
        $container.empty();
        
        // Ensure container has row class for grid layout
        if (!$container.hasClass('row')) $container.addClass('row');

        // Add progress bar
        $container.before('<div class="progress-container"><div class="progress-bar"></div></div>');

        // Show skeleton loading
        const skeletonCount = limit || 8;
        for (let i = 0; i < skeletonCount; i++) {
            $container.append(`
                <div class="product-item col-6 col-sm-6 col-md-4 col-lg-3 mb-4">
                    <div class="skeleton-card">
                        <div class="skeleton skeleton-image"></div>
                        <div class="p-3 text-center">
                            <div class="skeleton skeleton-text short"></div>
                            <div class="skeleton skeleton-text"></div>
                            <div class="skeleton skeleton-text long"></div>
                        </div>
                    </div>
                </div>
            `);
        }

        $.ajax({
            url: window.API.products, // Use API instead of static JSON
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (data) {
                // extraProducts from local storage handling remains for "user added" items simulation
                // or we could merge them. For now, let's keep the logic but source core data from DB.
                const extraProducts = JSON.parse(localStorage.getItem('extraProducts') || '[]');
                const allData = [...data, ...extraProducts];
                const displayData = limit ? allData.slice(0, limit) : allData;

                const $container = $(containerId);
                $container.empty();

                displayData.forEach(product => {
                    const ratingHtml = getRatingHtml(product.rating);

                    // Use the global isRetailer defined at the top
                    const $col = $(`
                    <div class="product-item col-6 col-sm-6 col-md-4 col-lg-3 mb-4" data-category="${product.category}">
                        <div class="product-card h-100">
                            <div class="product-image-wrapper">
                                <img src="${product.image}" alt="${product.name}" class="img-fluid">
                            </div>
                            <div class="p-3 text-center">
                                <span class="product-category">${product.category}</span>
                                <h3 class="product-name">${product.name}</h3>
                                <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
                                ${ratingHtml}
                                ${isRetailer && product.distributor === currentUser.name ? `<small class="text-muted d-block">Your Product</small>` : ''}
                            </div>
                        </div>
                    </div>
                `);

                    const $btnContainer = $col.find('.p-3');

                    if (!isRetailer) {
                        const $addToCartBtn = $('<button class="btn btn-primary btn-sm rounded-0 px-3 add-to-cart">Add to Cart</button>')
                            .attr('data-id', product.id)
                            .attr('data-name', product.name)
                            .attr('data-price', product.price)
                            .attr('data-image', product.image)
                            .attr('data-distributor', product.distributor || 'Main Warehouse');
                        $btnContainer.append($addToCartBtn);
                    } else if (isRetailer && product.distributor === currentUser.name) {
                        // Show edit/delete buttons for distributor's own products
                        const $manageBtn = $('<div class="mt-2"><small class="text-success">✓ Your Product</small></div>');
                        const $removeBtn = $('<button class="btn btn-outline-danger btn-sm mt-1 remove-product-btn">Remove</button>')
                            .attr('data-product-id', product.id);
                        $btnContainer.append($manageBtn);
                        $btnContainer.append($removeBtn);
                    }

                    const $viewDetailsBtn = $('<a class="btn btn-link btn-sm text-dark text-decoration-none mt-2 d-block mx-auto view-details" href="product-detail.html?id=' + product.id + '" target="_blank">View Details</a>');

                    $btnContainer.append($viewDetailsBtn);
                    $container.append($col);
                });

                // Remove progress bar and show products
                $container.prev('.progress-container').remove();

                // Reapply current filter after loading products
                const activeFilter = $('.filter-btn.active').data('filter');
                if (activeFilter && activeFilter !== 'all') {
                    $('.product-item').hide();
                    $(`.product-item[data-category="${activeFilter}"]`).fadeIn();
                }
            },
            error: function (err) {
                console.error('Error loading products from API:', err);
                // Fallback to local JSON file
                $.ajax({
                    url: 'data/products.json',
                    type: 'GET',
                    dataType: 'json',
                    cache: false,
                    success: function (data) {
                const extraProducts = JSON.parse(localStorage.getItem('extraProducts') || '[]');
                const allData = [...data, ...extraProducts];
                        const displayData = limit ? allData.slice(0, limit) : allData;

                        const $container = $(containerId);
                        $container.empty();

                        displayData.forEach(product => {
                            const $col = $(`
                            <div class="product-item col-6 col-sm-6 col-md-4 col-lg-3 mb-4" data-category="${product.category}">
                                <div class="product-card h-100">
                                    <div class="product-image-wrapper">
                                        <img src="${product.image}" alt="${product.name}" class="img-fluid">
                                    </div>
                            <div class="p-3 text-center">
                                <span class="product-category">${product.category}</span>
                                <h3 class="product-name">${product.name}</h3>
                                <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
                                ${getRatingHtml(product.rating)}
                                ${isRetailer && product.distributor === currentUser.name ? `<small class="text-muted d-block">Your Product</small>` : ''}
                            </div>
                                </div>
                            </div>
                        `);

                            const $btnContainer = $col.find('.p-3');

                            if (!isRetailer) {
                                const $addToCartBtn = $('<button class="btn btn-primary btn-sm rounded-0 px-3 add-to-cart">Add to Cart</button>')
                                    .attr('data-id', product.id)
                                    .attr('data-name', product.name)
                                    .attr('data-price', product.price)
                                    .attr('data-image', product.image)
                                    .attr('data-distributor', product.distributor || 'Main Warehouse');
                                $btnContainer.append($addToCartBtn);
                            } else if (isRetailer && product.distributor === currentUser.name) {
                                const $manageBtn = $('<div class="mt-2"><small class="text-success">✓ Your Product</small></div>');
                                const $removeBtn = $('<button class="btn btn-outline-danger btn-sm mt-1 remove-product-btn">Remove</button>')
                                    .attr('data-product-id', product.id);
                                $btnContainer.append($manageBtn);
                                $btnContainer.append($removeBtn);
                            }

                            const $viewDetailsBtn = $('<a class="btn btn-link btn-sm text-dark text-decoration-none mt-2 d-block mx-auto view-details" href="product-detail.html?id=' + product.id + '" target="_blank">View Details</a>');

                            $btnContainer.append($viewDetailsBtn);
                            $container.append($col);
                        });

                        // Reapply current filter after loading products
                        const activeFilter = $('.filter-btn.active').data('filter');
                        if (activeFilter && activeFilter !== 'all') {
                            $('.product-item').hide();
                            $(`.product-item[data-category="${activeFilter}"]`).fadeIn();
                        }
                    },
                    error: function (fallbackErr) {
                        console.error('Error loading products from local JSON:', fallbackErr);
                        // Optionally, show a message to the user
                        $(containerId).html('<p class="text-center py-4">Unable to load products. Please try again later.</p>');
                    }
                });
            }
        });
    }

    function loadProductsByCategory(category, containerId) {
        $.ajax({
            url: window.API.products, // Use API
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (data) {
                const extraProducts = JSON.parse(localStorage.getItem('extraProducts') || '[]');
                const allData = [...data, ...extraProducts];
                const categoryData = allData.filter(product => product.category === category);

                const $container = $(containerId);
                
                // Force Grid Layout
                // $container.removeClass('d-flex overflow-x-auto gap-3').addClass('row');
                
                $container.empty();

                categoryData.forEach(product => {
                    const isGrid = $container.hasClass('product-grid');
                    const $card = $(`
                        <div class="product-card scroll-animate h-100">
                            <div class="product-image-wrapper">
                                <img src="${product.image}" alt="${product.name}" class="img-fluid">
                            </div>
                            <div class="p-3 text-center">
                                <span class="product-category">${product.category}</span>
                                <h3 class="product-name">${product.name}</h3>
                                <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
                                ${getRatingHtml(product.rating)}
                                ${isRetailer && product.distributor === currentUser.name ? `<small class="text-muted d-block">Your Product</small>` : ''}
                            </div>
                        </div>
                    `);

                    const $btnContainer = $card.find('.p-3');

                    if (!isRetailer) {
                        const $addToCartBtn = $('<button class="btn btn-primary btn-sm rounded-0 px-3 add-to-cart">Add to Cart</button>')
                            .attr('data-id', product.id)
                            .attr('data-name', product.name)
                            .attr('data-price', product.price)
                            .attr('data-image', product.image)
                            .attr('data-distributor', product.distributor || 'Main Warehouse');
                        $btnContainer.append($addToCartBtn);
                    } else if (isRetailer && product.distributor === currentUser.name) {
                        const $manageBtn = $('<div class="mt-2"><small class="text-success">✓ Your Product</small></div>');
                        $btnContainer.append($manageBtn);
                    }

                    const $viewDetailsBtn = $('<a class="btn btn-link btn-sm text-dark text-decoration-none mt-2 d-block mx-auto view-details" href="product-detail.html?id=' + product.id + '" target="_blank">View Details</a>');

                    $btnContainer.append($viewDetailsBtn);

                    const $col = $(`<div class="product-item" data-category="${product.category}"></div>`);
                    $col.append($card.addClass('h-100'));
                    $container.append($col);
                });
            },
            error: function (err) {
                console.error('Error loading products by category from API:', err);
                // Fallback to local JSON file
                $.ajax({
                    url: 'data/products.json',
                    type: 'GET',
                    dataType: 'json',
                    cache: false,
                    success: function (data) {
                        const extraProducts = JSON.parse(localStorage.getItem('extraProducts') || '[]');
                        const allData = [...data, ...extraProducts];
                        const categoryData = allData.filter(product => product.category === category);
                        console.log('Fallback: Loaded products by category from local JSON:', categoryData.length);

                        const $container = $(containerId);
                        
                        // Force Grid Layout
                        // $container.removeClass('d-flex overflow-x-auto gap-3').addClass('row');
                        
                        $container.empty();

                        categoryData.forEach(product => {
                            const isGrid = $container.hasClass('product-grid');
                            const $card = $(`
                                <div class="product-card h-100">
                                    <div class="product-image-wrapper">
                                        <img src="${product.image}" alt="${product.name}" class="img-fluid">
                                    </div>
                                    <div class="p-3 text-center">
                                        <span class="product-category">${product.category}</span>
                                        <h3 class="product-name">${product.name}</h3>
                                        <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
                                        ${getRatingHtml(product.rating)}
                                        ${isRetailer && product.distributor === currentUser.name ? `<small class="text-muted d-block">Your Product</small>` : ''}
                                    </div>
                                </div>
                            `);

                            const $btnContainer = $card.find('.p-3');

                            if (!isRetailer) {
                                const $addToCartBtn = $('<button class="btn btn-primary btn-sm rounded-0 px-3 add-to-cart">Add to Cart</button>')
                                    .attr('data-id', product.id)
                                    .attr('data-name', product.name)
                                    .attr('data-price', product.price)
                                    .attr('data-image', product.image)
                                    .attr('data-distributor', product.distributor || 'Main Warehouse');
                                $btnContainer.append($addToCartBtn);
                            } else if (isRetailer && product.distributor === currentUser.name) {
                                const $manageBtn = $('<div class="mt-2"><small class="text-success">✓ Your Product</small></div>');
                                $btnContainer.append($manageBtn);
                            }

                            const $viewDetailsBtn = $('<a class="btn btn-link btn-sm text-dark text-decoration-none mt-2 d-block mx-auto view-details" href="product-detail.html?id=' + product.id + '" target="_blank">View Details</a>');

                            $btnContainer.append($viewDetailsBtn);

                            const $col = $(`<div class="product-item" data-category="${product.category}"></div>`);
                            $col.append($card.addClass('h-100'));
                            $container.append($col);
                        });
                    },
                    error: function (fallbackErr) {
                        console.error('Error loading products by category from local JSON:', fallbackErr);
                        // Optionally, show a message to the user
                        $(containerId).html('<p class="text-center py-4">Unable to load products. Please try again later.</p>');
                    }
                });
            }
        });
    }

    function loadTopSales(containerId) {
        const $container = $(containerId);
        $container.empty();
        
        // Ensure container has row class for grid layout
        // if (!$container.hasClass('row')) $container.addClass('row');

        // Show skeleton loading
        for (let i = 0; i < 4; i++) {
            $container.append(`
                <div>
                <div class="skeleton-card h-100">
                    <div class="skeleton skeleton-image"></div>
                    <div class="p-3 text-center">
                        <div class="skeleton skeleton-text short"></div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text long"></div>
                    </div>
                </div>
                </div>
            `);
        }

        $.ajax({
            url: window.API.products, // Use API
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (data) {
                const extraProducts = JSON.parse(localStorage.getItem('extraProducts') || '[]');
                const allData = [...data, ...extraProducts];
                // Sort by price descending for "top sales" (assuming higher price = top)
                const topSalesData = allData.sort((a, b) => b.price - a.price).slice(0, 4);

                const $container = $(containerId);
                $container.empty();

                topSalesData.forEach(product => {
                    const $wrapper = $(`<div></div>`);
                    const $card = $(`
                        <div class="product-card scroll-animate h-100">
                            <div class="product-image-wrapper">
                                <img src="${product.image}" alt="${product.name}" class="img-fluid">
                            </div>
                            <div class="p-3 text-center">
                                <span class="product-category">${product.category}</span>
                                <h3 class="product-name">${product.name}</h3>
                                <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
                                ${getRatingHtml(product.rating)}
                                ${isRetailer && product.distributor === currentUser.name ? `<small class="text-muted d-block">Your Product</small>` : ''}
                            </div>
                        </div>
                    `);

                    const $btnContainer = $card.find('.p-3');

                    if (!isRetailer) {
                        const $addToCartBtn = $('<button class="btn btn-primary btn-sm rounded-0 px-3 add-to-cart">Add to Cart</button>')
                            .attr('data-id', product.id)
                            .attr('data-name', product.name)
                            .attr('data-price', product.price)
                            .attr('data-image', product.image)
                            .attr('data-distributor', product.distributor || 'Main Warehouse');
                        $btnContainer.append($addToCartBtn);
                    } else if (isRetailer && product.distributor === currentUser.name) {
                        const $manageBtn = $('<div class="mt-2"><small class="text-success">✓ Your Product</small></div>');
                        $btnContainer.append($manageBtn);
                    }

                    const $viewDetailsBtn = $('<a class="btn btn-link btn-sm text-dark text-decoration-none mt-2 d-block mx-auto view-details" href="product-detail.html?id=' + product.id + '" target="_blank">View Details</a>');

                    $btnContainer.append($viewDetailsBtn);
                    $wrapper.append($card);
                    $container.append($wrapper);
                });

                // Trigger custom event for animations
                $(document).trigger('productsLoaded');

                // Remove progress bar and show products
                $container.prev('.progress-container').remove();
            },
            error: function (err) {
                console.error('Error loading top sales products from API:', err);
                // Fallback to local JSON file
                $.ajax({
                    url: 'data/products.json',
                    type: 'GET',
                    dataType: 'json',
                    cache: false,
                    success: function (data) {
                        const extraProducts = JSON.parse(localStorage.getItem('extraProducts') || '[]');
                        const allData = [...data, ...extraProducts];
                        // Sort by price descending for "top sales" (assuming higher price = top)
                        const topSalesData = allData.sort((a, b) => b.price - a.price).slice(0, 4);
                        console.log('Fallback: Loaded top sales products from local JSON:', topSalesData.length);

                        const $container = $(containerId);
                        $container.empty();

                        topSalesData.forEach(product => {
                            const $wrapper = $(`<div></div>`);
                            const $card = $(`
                                <div class="product-card h-100">
                                    <div class="product-image-wrapper">
                                        <img src="${product.image}" alt="${product.name}" class="img-fluid">
                                    </div>
                                    <div class="p-3 text-center">
                                        <span class="product-category">${product.category}</span>
                                        <h3 class="product-name">${product.name}</h3>
                                        <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
                                        ${getRatingHtml(product.rating)}
                                        ${isRetailer && product.distributor === currentUser.name ? `<small class="text-muted d-block">Your Product</small>` : ''}
                                    </div>
                                </div>
                            `);

                            const $btnContainer = $card.find('.p-3');

                            if (!isRetailer) {
                                const $addToCartBtn = $('<button class="btn btn-primary btn-sm rounded-0 px-3 add-to-cart">Add to Cart</button>')
                                    .attr('data-id', product.id)
                                    .attr('data-name', product.name)
                                    .attr('data-price', product.price)
                                    .attr('data-image', product.image)
                                    .attr('data-distributor', product.distributor || 'Main Warehouse');
                                $btnContainer.append($addToCartBtn);
                            } else if (isRetailer && product.distributor === currentUser.name) {
                                const $manageBtn = $('<div class="mt-2"><small class="text-success">✓ Your Product</small></div>');
                                $btnContainer.append($manageBtn);
                            }

                            const $viewDetailsBtn = $('<a class="btn btn-link btn-sm text-dark text-decoration-none mt-2 d-block mx-auto view-details" href="product-detail.html?id=' + product.id + '" target="_blank">View Details</a>');

                            $btnContainer.append($viewDetailsBtn);
                            $wrapper.append($card);
                            $container.append($wrapper);
                        });
                    },
                    error: function (fallbackErr) {
                        console.error('Error loading top sales products from local JSON:', fallbackErr);
                        // Optionally, show a message to the user
                        $(containerId).html('<p class="text-center py-4">Unable to load products. Please try again later.</p>');
                    }
                });
            }
        });
    }



    function validateForm(form) {
        let isValid = true;
        $(form).find('input, textarea, select').each(function () {
            if ($(this).prop('required') && !$(this).val()) {
                $(this).addClass('is-invalid');
                isValid = false;
            } else {
                $(this).removeClass('is-invalid');

                // Email validation
                if ($(this).attr('type') === 'email') {
                    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailReg.test($(this).val())) {
                        $(this).addClass('is-invalid');
                        isValid = false;
                    }
                }

                // Password length
                if ($(this).attr('type') === 'password' && $(this).val().length < 6) {
                    $(this).addClass('is-invalid');
                    isValid = false;
                }
            }
        });
        return isValid;
    }

    // Checkout Page Logic
    if ($('#checkout-cart-list').length > 0) {
        renderCheckoutSummary();
    }

    function renderCheckoutSummary() {
        const $list = $('#checkout-cart-list');
        $list.empty();

        let subtotal = 0;
        cart.forEach(item => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQty = parseInt(item.quantity) || 1;
            const itemTotal = itemPrice * itemQty;
            subtotal += itemTotal;
            $list.append(`
            <li class="list-group-item d-flex justify-content-between lh-sm">
                <div class="d-flex align-items-center">
                    <div class="me-3 position-relative">
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary" style="font-size: 0.6em;">${itemQty}</span>
                        <img src="${item.image}" alt="${item.name}" width="50" class="rounded">
                    </div>
                    <div>
                        <h6 class="my-0">${item.name}</h6>
                        <small class="text-muted">${item.distributor || 'Unknown'}</small>
                    </div>
                </div>
                <span class="text-muted">$${itemTotal.toFixed(2)}</span>
            </li>
        `);
        });

        $('#checkout-total').text('$' + subtotal.toFixed(2));
        $('.cart-count-badge').text(cart.reduce((a, b) => a + (parseInt(b.quantity) || 1), 0));

        // Pre-fill email if logged in
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (user) {
            $('#email').val(user.email);
            if (user.name) {
                const names = user.name.split(' ');
                $('#firstName').val(names[0]);
                if (names.length > 1) $('#lastName').val(names.slice(1).join(' '));
            }
        }
    }

    $('#checkout-form').on('submit', function (e) {
        e.preventDefault();

        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        const userEmail = $('#email').val().trim();
        const orderOwnerEmail = currentUser ? currentUser.email : userEmail;

        if (!orderOwnerEmail) {
            alert('Please enter a valid email address');
            return;
        }

        // Validate and sanitize cart items
        const validItems = [];
        const invalidItems = [];
        
        cart.forEach((item, idx) => {
            // Strict validation
            let startLength = invalidItems.length;
            if (!item.id) invalidItems.push(`Item ${idx}: Missing ID`);
            if (!item.name || typeof item.name !== 'string') invalidItems.push(`Item ${idx}: Invalid name`);
            if (isNaN(parseFloat(item.price))) invalidItems.push(`Item ${idx}: Invalid price (${item.price})`);
            if (!item.quantity || isNaN(parseInt(item.quantity))) invalidItems.push(`Item ${idx}: Invalid quantity`);

            if (invalidItems.length === startLength) { // No new errors added for this item
                validItems.push({
                    id: item.id,
                    name: String(item.name).trim(),
                    price: parseFloat(item.price),
                    quantity: parseInt(item.quantity),
                    distributor: item.distributor || 'Unknown'
                    // Image removed from payload to prevent 413 errors - server fetches from DB
                });
            }
        });

        if (invalidItems.length > 0) {
            console.error('Invalid items found:', invalidItems);
            alert(`Cart has invalid items:\n\n${invalidItems.join('\n')}\n\nPlease reload the page and try again.`);
            return;
        }

        if (validItems.length === 0) {
            alert('Your cart is empty or contains no valid items');
            return;
        }

        const total = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (total <= 0) {
            alert('Order total must be greater than 0');
            return;
        }

        const purchase = {
            orderId: 'ORD-' + Date.now(),
            user: orderOwnerEmail,
            shippingDetails: {
                firstName: $('#firstName').val() || 'Guest',
                lastName: $('#lastName').val() || 'User',
                email: $('#email').val(),
                phone: $('#phone').val(),
                address: $('#address').val(),
                address2: $('#address2').val(),
                city: $('#city').val(),
                country: $('#country').val(),
                state: $('#state').val(),
                zip: $('#zip').val(),
                paymentMethod: $('input[name="paymentMethod"]:checked').val() || 'credit',
                cardName: $('#cc-name').val(),
                cardNumber: $('#cc-number').val()
            },
            items: validItems,
            total: parseFloat(total.toFixed(2)),
            date: new Date().toISOString(),
            status: 'Pending',
            shipmentStatus: 'pending'
        };

        // Debug logs removed for production

        if (!window.API || !window.API.orders) {
            alert('ERROR: API configuration not loaded. Please refresh the page.');
            return;
        }

        const submitBtn = $('button[type="submit"]');
        const originalText = submitBtn.text();
        submitBtn.prop('disabled', true).text('Processing...');

        // Send order to API with detailed logging
        fetch(window.API.orders, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchase)
        })
            .then(response => {
                console.log(`Response Status: ${response.status}`);
                console.log('Response Headers:', {
                    contentType: response.headers.get('content-type'),
                    contentLength: response.headers.get('content-length')
                });
                
                return response.text().then(text => {
                    console.log(`Response Text (${text.length} chars):`, text.substring(0, 500));
                    
                    if (!text) {
                        throw new Error('Server returned empty response');
                    }
                    
                    // Try to parse as JSON
                    try {
                        const data = JSON.parse(text);
                        return { ok: response.ok, status: response.status, data };
                    } catch (parseErr) {
                        console.error('JSON Parse Failed:', parseErr.message);
                        throw new Error(`Invalid response from server. Status: ${response.status}, Type: ${response.headers.get('content-type')}, Content: ${text.substring(0, 300)}`);
                    }
                });
            })
            .then(({ ok, status, data }) => {
                if (ok && status === 201) {
                    console.log('✓ Order successful:', data);
                    cart = [];
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartCount();
                    localStorage.setItem('lastOrder', JSON.stringify(purchase));
                    
                    let localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
                    localOrders.push(purchase);
                    localStorage.setItem('localOrders', JSON.stringify(localOrders));

                    alert('✓ Order placed successfully!\n\nOrder ID: ' + purchase.orderId + '\nTotal: $' + purchase.total.toFixed(2) + '\n\nRedirecting to receipt...');
                    localStorage.setItem('userEmail', orderOwnerEmail);
                    setTimeout(() => {
                        window.location.href = 'receipt.html?orderId=' + purchase.orderId;
                    }, 500);
                } else {
                    const errorMsg = data.error || `Server error (Status: ${status})`;
                    console.error('Order failed:', data);
                    throw new Error(errorMsg);
                }
            })
            .catch(err => {
                console.error('❌ Checkout Error:', err.message);
                console.error('Full Error:', err);
                alert(`❌ CHECKOUT ERROR:\n\n${err.message}\n\nPlease open the browser console (F12) and check for details.`);
            })
            .finally(() => {
                submitBtn.prop('disabled', false).text(originalText);
            });
    });

    // Remove Product Handler
    $(document).on('click', '.remove-product-btn', function() {
        const productId = $(this).data('product-id');

        if (confirm('Are you sure you want to remove this product?')) {
            let extraProducts = JSON.parse(localStorage.getItem('extraProducts') || '[]');
            extraProducts = extraProducts.filter(p => p.id !== productId);
            localStorage.setItem('extraProducts', JSON.stringify(extraProducts));

            // Refresh the product list
            if ($('#all-products').length > 0) {
                loadProducts(null, '#all-products');
            }
            if ($('#featured-products').length > 0) {
                loadProducts(6, '#featured-products');
            }

            alert('Product removed successfully!');
        }
    });

    // Delete Order Handler
    $(document).on('click', '.delete-order-btn', function() {
        const orderId = $(this).data('order-id');
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

        if (!currentUser) {
            alert('Please login to delete orders.');
            return;
        }

        if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            // Send delete request to server
            fetch(`${window.API.deleteOrder(orderId)}?currentUser=${encodeURIComponent(currentUser.email)}&role=${currentUser.role}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    // Remove the card from UI
                    $(this).closest('.card').fadeOut(300, function() {
                        $(this).remove();
                        // Check if no orders left
                        if ($('#orders-list .card').length === 0) {
                            $('#orders-list').html('<p class="text-center py-5">No orders found.</p>');
                        }
                    });
                    alert('Order deleted successfully!');
                } else {
                    alert('Error deleting order: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(err => {
                console.error('Error deleting order:', err);
                alert('Error deleting order. Please try again.');
            });
        }
    });

    // Scroll Animation for Product Cards
    function initScrollAnimations() {
        function isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        }

        if (!window.scrollAnimationInitialized) {
            window.scrollAnimationInitialized = true;
            let lastScrollY = window.scrollY;

            $(window).on('scroll', function() {
                $('.product-card, .product-item, .scroll-animate').each(function() {
                    if (isInViewport(this) && !$(this).hasClass('animate')) {
                        $(this).addClass('animate');
                    }
                });
            });

            // Initial check for elements already in viewport
            $('.product-card, .product-item, .scroll-animate').each(function() {
                if (isInViewport(this)) {
                    $(this).addClass('animate');
                }
            });
        }
    }

    // Initialize scroll animations after products load
    setTimeout(initScrollAnimations, 1500);

    // Re-initialize animations when new content loads
    $(document).on('productsLoaded', function() {
        setTimeout(initScrollAnimations, 100);
    });

    // Motion.dev Animations
    if (typeof motion !== 'undefined') {
        // Add entrance animations for cards
        motion.animate('.product-card', { opacity: [0, 1], y: [30, 0] }, { duration: 0.6, delay: motion.stagger(0.1) });
        motion.animate('.feature-card', { opacity: [0, 1], scale: [0.9, 1] }, { duration: 0.5, delay: motion.stagger(0.1) });
        motion.animate('.team-card', { opacity: [0, 1], x: [-30, 0] }, { duration: 0.6, delay: motion.stagger(0.1) });
    }

    // Sponsor Filter Functionality
    $('.btn-group .btn').on('click', function() {
        $('.btn-group .btn').removeClass('active');
        $(this).addClass('active');

        const filter = $(this).data('filter');
        if (filter === 'all') {
            $('.sponsor-card').fadeIn();
        } else {
            $('.sponsor-card').hide();
            $(`.sponsor-card[data-tier="${filter}"]`).fadeIn();
        }
    });

    // Enhanced hover effects
    $('.product-card, .feature-card, .team-card, .sponsor-card').hover(
        function() {
            $(this).addClass('hover-lift');
        },
        function() {
            $(this).removeClass('hover-lift');
        }
    );

    // Smooth scroll to sections
    $('a[href^="#"]').on('click', function(event) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 70
            }, 1000);
        }
    });

    // Add loading animation for buttons
    $(document).on('click', '.btn', function() {
        const $btn = $(this);
        if (!$btn.hasClass('no-loading')) {
            $btn.addClass('loading');
            setTimeout(() => $btn.removeClass('loading'), 1000);
        }
    });
});
