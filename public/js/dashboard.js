const API_URL = 'http://localhost:3000/api';
const authToken = localStorage.getItem('authToken');
const userId = localStorage.getItem('userId');
const userName = localStorage.getItem('userName');

if (!authToken) {
    window.location.href = '/';
}

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
};

if (userName) {
    document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.dataset.page;
        if (page === 'logout') {
            logout();
        } else {
            navigateTo(page);
        }
    });
});

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(page + '-page').classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    const titles = {
        'dashboard': '📊 Dashboard',
        'products': '📦 Products',
        'profile': '👤 Profile'
    };
    document.getElementById('pageTitle').textContent = titles[page];
    
    if (page === 'dashboard') {
        loadDashboard();
    } else if (page === 'products') {
        loadProducts();
    } else if (page === 'profile') {
        loadProfile();
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = '/';
}

async function loadDashboard() {
    try {
        const statsResponse = await fetch(`${API_URL}/dashboard/stats`, { headers });
        const stats = await statsResponse.json();
        
        document.getElementById('totalProducts').textContent = stats.total_products || 0;
        document.getElementById('totalQuantity').textContent = stats.total_quantity || 0;
        document.getElementById('totalValue').textContent = '$' + (stats.total_value || 0).toFixed(2);
        document.getElementById('lowStockCount').textContent = stats.low_stock_count || 0;
        
        const lowStockResponse = await fetch(`${API_URL}/dashboard/low-stock`, { headers });
        const lowStockProducts = await lowStockResponse.json();
        
        const tbody = document.getElementById('lowStockBody');
        tbody.innerHTML = '';
        
        if (lowStockProducts.length === 0) {
            document.getElementById('lowStockEmpty').style.display = 'block';
            document.getElementById('lowStockTable').style.display = 'none';
        } else {
            document.getElementById('lowStockEmpty').style.display = 'none';
            document.getElementById('lowStockTable').style.display = 'table';
            
            lowStockProducts.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.quantity}</td>
                    <td>${product.reorder_level}</td>
                    <td>
                        <button class="action-btn edit" onclick="editProduct(${product.id})">Edit</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, { headers });
        const products = await response.json();
        
        const tbody = document.getElementById('productsBody');
        tbody.innerHTML = '';
        
        if (products.length === 0) {
            document.getElementById('productsEmpty').style.display = 'block';
            document.getElementById('productsTable').style.display = 'none';
        } else {
            document.getElementById('productsEmpty').style.display = 'none';
            document.getElementById('productsTable').style.display = 'table';
            
            products.forEach(product => {
                const row = document.createElement('tr');
                const totalValue = (product.quantity * product.price).toFixed(2);
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.sku || '-'}</td>
                    <td>${product.category || '-'}</td>
                    <td>${product.quantity}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>$${totalValue}</td>
                    <td>
                        <button class="action-btn edit" onclick="editProduct(${product.id})">Edit</button>
                        <button class="action-btn delete" onclick="deleteProduct(${product.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/profile`, { headers });
        const profile = await response.json();
        
        document.getElementById('profileName').value = profile.name;
        document.getElementById('profileEmail').value = profile.email;
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileAddress').value = profile.address || '';
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productModal').classList.add('active');
});

document.getElementById('addProductBtnEmpty').addEventListener('click', () => {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productModal').classList.add('active');
});

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('active');
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('active');
});

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = document.getElementById('productId').value;
    const product = {
        name: document.getElementById('productName').value,
        sku: document.getElementById('productSKU').value,
        category: document.getElementById('productCategory').value,
        quantity: parseInt(document.getElementById('productQuantity').value),
        price: parseFloat(document.getElementById('productPrice').value),
        reorder_level: parseInt(document.getElementById('productReorderLevel').value),
        description: document.getElementById('productDescription').value
    };
    
    try {
        const url = productId ? `${API_URL}/products/${productId}` : `${API_URL}/products`;
        const method = productId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(product)
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('Product saved successfully!');
            document.getElementById('productModal').classList.remove('active');
            loadProducts();
            loadDashboard();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error saving product: ' + error.message);
    }
});

async function editProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, { headers });
        const product = await response.json();
        
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productSKU').value = product.sku || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productReorderLevel').value = product.reorder_level;
        document.getElementById('productDescription').value = product.description || '';
        
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        alert('Error loading product: ' + error.message);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers
        });
        
        if (response.ok) {
            alert('Product deleted successfully!');
            loadProducts();
            loadDashboard();
        } else {
            alert('Error deleting product');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

let searchTimeout;
document.getElementById('searchProducts').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (!query) {
        loadProducts();
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_URL}/products/search/${encodeURIComponent(query)}`, { headers });
            const products = await response.json();
            
            const tbody = document.getElementById('productsBody');
            tbody.innerHTML = '';
            
            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No products found</td></tr>';
            } else {
                products.forEach(product => {
                    const row = document.createElement('tr');
                    const totalValue = (product.quantity * product.price).toFixed(2);
                    row.innerHTML = `
                        <td>${product.name}</td>
                        <td>${product.sku || '-'}</td>
                        <td>${product.category || '-'}</td>
                        <td>${product.quantity}</td>
                        <td>$${product.price.toFixed(2)}</td>
                        <td>$${totalValue}</td>
                        <td>
                            <button class="action-btn edit" onclick="editProduct(${product.id})">Edit</button>
                            <button class="action-btn delete" onclick="deleteProduct(${product.id})">Delete</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error searching products:', error);
        }
    }, 300);
});

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                name: document.getElementById('profileName').value,
                phone: document.getElementById('profilePhone').value,
                address: document.getElementById('profileAddress').value
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('Profile updated successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/profile/change-password`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                currentPassword: document.getElementById('currentPassword').value,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('Password changed successfully!');
            document.getElementById('changePasswordForm').reset();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

loadDashboard();
