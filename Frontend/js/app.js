const API_URL = `http://${window.location.hostname}:5000/api`;

// Cart Management
function getCartKey() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? `cart_${user.id}` : 'cart_guest';
}

function getCart() {
    return JSON.parse(localStorage.getItem(getCartKey())) || [];
}

function saveCart(cart) {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
    updateUI();
}

function addToCart(product) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        showCustomModal({
            title: 'Login Required',
            message: 'Please login first to add products to your cart!',
            onConfirm: () => window.location.href = '/auth'
        });
        return;
    }

    // Prevent self-carting
    if (product.owner_id === user.id) {
        showCustomModal({
            title: 'Not Allowed',
            message: 'You cannot add your own product to the cart!'
        });
        return;
    }

    let cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);
    showCustomModal({
        title: 'Added to Cart',
        message: `${product.name} has been added to your shopping cart.`
    });
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    renderCart();
}

function updateQuantity(productId, newQty) {
    if (newQty < 1) return;
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = parseInt(newQty);
        saveCart(cart);
        renderCart();
    }
}

async function checkoutSingleItem(productId) {
    const token = localStorage.getItem('token');
    const cart = getCart();
    const item = cart.find(i => i.id === productId);

    if (!item) return;

    if (!token) {
        showCustomModal({
            title: 'Login Required',
            message: 'Please login to checkout',
            onConfirm: function() { window.location.href = '/auth'; }
        });
        return;
    }

    showCustomModal({
        title: 'Confirm Purchase',
        message: 'Buy ' + item.quantity + 'x ' + item.name + ' for $' + (item.price * item.quantity).toFixed(2) + '?',
        type: 'confirm',
        onConfirm: async function() {
            try {
                const response = await fetch(API_URL + '/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ 
                        items: [item], 
                        totalPrice: item.price * item.quantity 
                    })
                });

                if (response.ok) {
                    showCustomModal({
                        title: 'Order Placed!',
                        message: 'Your order has been placed successfully.',
                        onConfirm: function() {
                            removeFromCart(item.id);
                            window.location.href = '/orders';
                        }
                    });
                } else {
                    const data = await response.json();
                    showCustomModal({ title: 'Error', message: data.message || 'Checkout failed' });
                }
            } catch (err) {
                showCustomModal({ title: 'Error', message: 'Connection failed' });
            }
        }
    });
}

// Theme Management
function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeIcon(next);
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
}

// Sidebar Management
function initSidebar() {
    const openBtn = document.getElementById('open-sidebar');
    const closeBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (openBtn && closeBtn && sidebar && overlay) {
        openBtn.onclick = () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        };

        const closeSidebar = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        };

        closeBtn.onclick = closeSidebar;
        overlay.onclick = closeSidebar;
    }
}

// UI Updates
function updateUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Select elements to show/hide
    const navLinks = document.querySelector('.nav-links');
    const sidebarLinks = document.querySelector('.sidebar-links');
    const cartIcon = document.querySelector('.cart-icon');
    const userLink = document.getElementById('user-link');

    // Handle Desktop Nav Links
    if (navLinks) {
        if (token) {
            navLinks.innerHTML = `
                <li><a href="/">Home</a></li>
                <li><a href="/add-product">Sell</a></li>
                <li><a href="/my-products">My Listings</a></li>
                <li>
                    <a href="/sales" style="position: relative; display: inline-block;">
                        Manage Sales
                        <span id="sales-badge" class="notif-badge" style="display: none;"></span>
                    </a>
                </li>
                <li><a href="/orders">My Orders</a></li>
            `;
            
            // Fetch unread count
            fetch(`${API_URL}/orders/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()).then(data => {
                const badge = document.getElementById('sales-badge');
                if (badge && data.count > 0) {
                    badge.style.display = 'flex';
                    badge.innerText = data.count > 99 ? '99+' : data.count;
                }
            }).catch(() => {});
        } else {
            navLinks.innerHTML = `<li><a href="/">Home</a></li>`;
        }
    }

    // Handle Sidebar Links
    if (sidebarLinks) {
        if (token) {
            sidebarLinks.innerHTML = `
                <a href="/">Home</a>
                <a href="/add-product">Sell Product</a>
                <a href="/my-products">My Listings</a>
                <a href="/sales" style="position: relative; display: flex; align-items: center; justify-content: space-between;">
                    Manage Sales
                    <span id="sidebar-sales-badge" class="notif-badge" style="display: none; position: static; transform: none;"></span>
                </a>
                <a href="/orders">My Orders</a>
                <a href="/cart">Cart</a>
            `;
            
            fetch(`${API_URL}/orders/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()).then(data => {
                const badge = document.getElementById('sidebar-sales-badge');
                if (badge && data.count > 0) {
                    badge.style.display = 'flex';
                    badge.innerText = data.count;
                }
            }).catch(() => {});
        } else {
            sidebarLinks.innerHTML = `<a href="/">Home</a>`;
        }
    }

    // Handle Cart Icon (hide if not logged in)
    if (cartIcon) {
        cartIcon.style.display = token ? 'block' : 'none';
        if (token) {
            const cart = getCart();
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const cartCount = document.getElementById('cart-count');
            if (cartCount) cartCount.innerText = totalItems;
        }
    }

    // Handle User Profile / Login Link
    const sidebarProfile = document.getElementById('sidebar-user-profile');
    
    if (userLink) {
        if (token && user) {
            const firstChar = user.name.charAt(0).toUpperCase();
            userLink.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="header-user-name" style="font-size: 0.9rem; color: var(--text-muted);">
                        Hi, ${user.name.split(' ')[0]}
                    </span>
                    <div class="user-avatar" id="header-avatar" title="Logout">
                        ${firstChar}
                    </div>
                </div>
            `;

            // Update Sidebar Profile Section
            if (sidebarProfile) {
                sidebarProfile.innerHTML = `
                    <div class="sidebar-profile-section">
                        <div class="sidebar-user-info">
                            <div class="user-avatar">${firstChar}</div>
                            <div class="sidebar-user-name">${user.name}</div>
                        </div>
                        <div class="logout-link" id="sidebar-logout">
                            <i class="fa-solid fa-right-from-bracket"></i> Logout
                        </div>
                    </div>
                `;

                document.getElementById('sidebar-logout').onclick = handleLogout;
            }

            const logoutAction = () => {
                showCustomModal({
                    title: 'Confirm Logout',
                    message: 'Are you sure you want to log out from Lumina?',
                    type: 'confirm',
                    onConfirm: () => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/';
                    }
                });
            };

            document.getElementById('header-avatar').onclick = logoutAction;
            
            function handleLogout() {
                logoutAction();
            }

        } else {
            userLink.innerHTML = `<a href="/auth" title="Login" style="display: flex; align-items: center; gap: 8px;"><i class="fa-regular fa-user"></i> <span class="header-user-name">Login</span></a>`;
            if (sidebarProfile) sidebarProfile.innerHTML = '';
        }
    }
}

// Call init functions on load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    updateUI();
});

// Fetch and Render Products
async function loadProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        grid.innerHTML = products.map(product => `
            <div class="product-card glass animate-fade-in" onclick="if(!event.target.closest('button')) window.location.href='/product?id=${product.id}'">
                <div class="product-image-container">
                    <img src="${product.image_url}" alt="${product.name}" class="product-image">
                    <div class="view-overlay">
                        <div class="view-badge">View Product</div>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <button class="btn btn-primary" onclick='event.stopPropagation(); addToCart(${JSON.stringify(product).replace(/'/g, "&apos;")})'>
                        <i class="fa-solid fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = `
            <div class="error" style="text-align: center; padding: 50px; grid-column: 1/-1;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; color: var(--secondary); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">Connection Failed</h3>
                <p style="color: var(--text-muted); margin-bottom: 20px;">We couldn't connect to the server. Please ensure the backend is running.</p>
                <button class="btn btn-secondary" onclick="location.reload()" style="width: auto;">
                    <i class="fa-solid fa-rotate"></i> Retry Connection
                </button>
            </div>
        `;
    }
}

// Render Cart Page
function renderCart() {
    const itemsTableBody = document.getElementById('cart-items');
    const itemsGrid = document.getElementById('cart-items-grid');
    const emptyMsg = document.getElementById('empty-cart');
    const content = document.getElementById('cart-content');
    
    if (!itemsTableBody && !itemsGrid) return;

    const cart = getCart();

    if (cart.length === 0) {
        emptyMsg.style.display = 'block';
        content.style.display = 'none';
        return;
    }

    emptyMsg.style.display = 'none';
    content.style.display = 'block';

    const isGridVisible = itemsGrid && window.getComputedStyle(itemsGrid).display !== 'none';
    const isTableVisible = itemsTableBody && window.getComputedStyle(itemsTableBody.parentElement).display !== 'none';

    if (isGridVisible && itemsGrid) {
        itemsGrid.innerHTML = cart.map(item => `
            <div class="cart-card glass animate-fade-in">
                <img src="${item.image_url}" class="cart-card-img">
                <div class="cart-card-info">
                    <div style="font-weight: 600; font-size: 1.1rem;">${item.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${item.category}</div>
                    <div class="cart-card-price">$${item.price.toFixed(2)}</div>
                    <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px; justify-content: center;">
                        <span>Qty:</span>
                        <input type="number" value="${item.quantity}" min="1" 
                            onchange="updateQuantity(${item.id}, this.value)"
                            style="width: 50px; padding: 5px; background: var(--surface-light); border: 1px solid var(--glass-border); color: white; border-radius: 5px;">
                    </div>
                    <div style="margin-top: 10px; font-weight: 700; color: var(--primary);">Total: $${(item.price * item.quantity).toFixed(2)}</div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 15px; width: 100%;">
                    <button class="btn btn-primary btn-small" onclick="checkoutSingleItem(${item.id})" style="flex: 1;">Checkout</button>
                    <button class="btn btn-secondary btn-small" onclick="removeFromCart(${item.id})" style="width: 40px; padding: 0;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } 
    
    if (isTableVisible && itemsTableBody) {
        itemsTableBody.innerHTML = cart.map(item => `
            <tr>
                <td>
                    <div class="cart-item-info">
                        <img src="${item.image_url}" class="cart-item-img">
                        <div>
                            <div style="font-weight: 600;">${item.name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${item.category}</div>
                        </div>
                    </div>
                </td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                    <input type="number" value="${item.quantity}" min="1" 
                        onchange="updateQuantity(${item.id}, this.value)"
                        style="width: 50px; padding: 5px; background: var(--surface-light); border: 1px solid var(--glass-border); color: white; border-radius: 5px;">
                </td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                <td>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button class="btn btn-primary btn-small" onclick="checkoutSingleItem(${item.id})">Checkout</button>
                        <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: var(--secondary); cursor: pointer; font-size: 1.1rem;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Only update if elements exist (they might be removed in the new UI)
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    if (subtotalEl && totalEl) {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
        totalEl.innerText = `$${subtotal.toFixed(2)}`;
    }
}

// Custom Modal System
function showCustomModal({ title, message, type = 'alert', onConfirm = null }) {
    const existing = document.getElementById('custom-modal');
    if (existing) existing.remove();

    const modalHtml = `
        <div class="modal-overlay" id="custom-modal">
            <div class="modal-content">
                <div class="modal-title">${title}</div>
                <div class="modal-message">${message}</div>
                <div class="modal-btns">
                    ${type === 'confirm' ? `<button class="modal-btn modal-btn-cancel" id="modal-cancel">Cancel</button>` : ''}
                    <button class="modal-btn modal-btn-confirm" id="modal-ok">OK</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('custom-modal');
    
    setTimeout(() => modal.classList.add('active'), 10);

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    document.getElementById('modal-ok').onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };

    if (type === 'confirm') {
        document.getElementById('modal-cancel').onclick = closeModal;
    }
}
