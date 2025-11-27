// Configuration
const API_BASE_URL = window.location.origin;
let authToken = null;
let currentUser = null;
let currentMaterialId = null;

// Check authentication
if (!localStorage.getItem('authToken')) {
    window.location.href = '/login.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    setupEventListeners();
    loadDashboardData();
});

// Load User Data
function loadUserData() {
    authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('currentUser');

    if (!authToken || !userData) {
        window.location.href = '/login.html';
        return;
    }

    currentUser = JSON.parse(userData);
    displayUserInfo();
}

// Display User Info
function displayUserInfo() {
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const userInitialsElement = document.getElementById('userInitials');

    if (userNameElement) userNameElement.textContent = currentUser.fullName;
    if (userRoleElement) userRoleElement.textContent = currentUser.role;

    if (userInitialsElement && currentUser.fullName) {
        const names = currentUser.fullName.split(' ');
        const initials = names.length >= 2
            ? names[0][0] + names[names.length - 1][0]
            : names[0][0];
        userInitialsElement.textContent = initials.toUpperCase();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', handleLogout);

    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // Materials
    document.getElementById('addMaterialBtn')?.addEventListener('click', () => openMaterialModal());
    document.getElementById('closeModal')?.addEventListener('click', closeMaterialModal);
    document.getElementById('cancelModal')?.addEventListener('click', closeMaterialModal);
    document.getElementById('materialForm')?.addEventListener('submit', handleMaterialSubmit);
}

// Navigation
function navigateToPage(page) {
    // Update nav active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => p.classList.remove('active'));

    // Show selected page
    document.getElementById(`page-${page}`)?.classList.add('active');

    // Update page title
    const pageTitles = {
        'overview': 'Dashboard',
        'patients': 'Patients',
        'appointments': 'Appointments',
        'materials': 'Materials & Supplies',
        'doctors': 'Doctors',
        'reports': 'Reports',
        'settings': 'Settings'
    };
    document.getElementById('pageTitle').textContent = pageTitles[page] || 'Dashboard';

    // Load page data
    if (page === 'materials') {
        loadMaterials();
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    animateValue('totalPatients', 0, 156, 1500);
    animateValue('todayAppointments', 0, 12, 1500);
    animateValue('lowStockItems', 0, 3, 1500);
    animateRevenue('monthlyRevenue', 0, 24500, 1500);
}

// Animate Number
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Animate Revenue
function animateRevenue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = '$' + Math.floor(current).toLocaleString();
    }, 16);
}

// MATERIALS MANAGEMENT

async function loadMaterials() {
    const grid = document.getElementById('materialsGrid');
    grid.innerHTML = '<div class="loading-message">Loading materials...</div>';

    const materials = await apiCall('/api/materials');
    if (!materials) {
        grid.innerHTML = '<div class="loading-message">Failed to load materials</div>';
        return;
    }

    const data = await materials.json();

    if (data.length === 0) {
        grid.innerHTML = '<div class="loading-message">No materials yet. Click "+ Add Material" to start!</div>';
        return;
    }

    grid.innerHTML = data.map(material => `
        <div class="material-card ${material.quantity <= material.minimumStock ? 'low-stock' : ''}">
            <div class="material-header">
                <div class="material-name">${material.name}</div>
                <div class="material-actions">
                    <button onclick="editMaterial(${material.id})" title="Edit">✏️</button>
                    <button onclick="deleteMaterial(${material.id})" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="material-info">
                <div class="material-row">
                    <span class="material-label">Stock:</span>
                    <span class="material-value">
                        ${material.quantity} ${material.unit || ''}
                        ${material.quantity <= material.minimumStock ?
                            '<span class="stock-badge low">Low Stock!</span>' :
                            '<span class="stock-badge ok">OK</span>'}
                    </span>
                </div>
                ${material.price ? `
                <div class="material-row">
                    <span class="material-label">Price:</span>
                    <span class="material-value">$${material.price}</span>
                </div>
                ` : ''}
                ${material.supplier ? `
                <div class="material-row">
                    <span class="material-label">Supplier:</span>
                    <span class="material-value">${material.supplier}</span>
                </div>
                ` : ''}
                ${material.description ? `
                <div class="material-row">
                    <span class="material-label">Note:</span>
                    <span class="material-value">${material.description}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function openMaterialModal(material = null) {
    const modal = document.getElementById('materialModal');
    const form = document.getElementById('materialForm');
    const title = document.getElementById('modalTitle');

    if (material) {
        title.textContent = 'Edit Material';
        currentMaterialId = material.id;
        document.getElementById('materialName').value = material.name;
        document.getElementById('materialUnit').value = material.unit || '';
        document.getElementById('materialQuantity').value = material.quantity;
        document.getElementById('materialMinStock').value = material.minimumStock;
        document.getElementById('materialPrice').value = material.price || '';
        document.getElementById('materialSupplier').value = material.supplier || '';
        document.getElementById('materialDescription').value = material.description || '';
    } else {
        title.textContent = 'Add Material';
        currentMaterialId = null;
        form.reset();
    }

    modal.classList.add('active');
}

function closeMaterialModal() {
    document.getElementById('materialModal').classList.remove('active');
    document.getElementById('materialForm').reset();
    currentMaterialId = null;
}

async function handleMaterialSubmit(e) {
    e.preventDefault();

    const materialData = {
        name: document.getElementById('materialName').value,
        unit: document.getElementById('materialUnit').value,
        quantity: parseInt(document.getElementById('materialQuantity').value),
        minimumStock: parseInt(document.getElementById('materialMinStock').value),
        price: parseFloat(document.getElementById('materialPrice').value) || 0,
        supplier: document.getElementById('materialSupplier').value,
        description: document.getElementById('materialDescription').value
    };

    const url = currentMaterialId
        ? `/api/materials/${currentMaterialId}`
        : '/api/materials';

    const method = currentMaterialId ? 'PUT' : 'POST';

    const response = await apiCall(url, {
        method: method,
        body: JSON.stringify(materialData)
    });

    if (response && (response.ok || response.status === 204)) {
        closeMaterialModal();
        loadMaterials();
    } else {
        alert('Failed to save material');
    }
}

async function editMaterial(id) {
    const response = await apiCall(`/api/materials/${id}`);
    if (response && response.ok) {
        const material = await response.json();
        openMaterialModal(material);
    }
}

async function deleteMaterial(id) {
    if (!confirm('Are you sure you want to delete this material?')) {
        return;
    }

    const response = await apiCall(`/api/materials/${id}`, {
        method: 'DELETE'
    });

    if (response && (response.ok || response.status === 204)) {
        loadMaterials();
    } else {
        alert('Failed to delete material');
    }
}

// Make functions global for onclick handlers
window.editMaterial = editMaterial;
window.deleteMaterial = deleteMaterial;

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login.html';
    }
}

// API Call Helper
async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = '/login.html';
            return null;
        }

        return response;
    } catch (error) {
        console.error('API Call Error:', error);
        return null;
    }
}
