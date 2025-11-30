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

    // Doctors
    document.getElementById('addDoctorBtn')?.addEventListener('click', () => openDoctorModal());
    document.getElementById('closeDoctorModal')?.addEventListener('click', closeDoctorModal);
    document.getElementById('cancelDoctorModal')?.addEventListener('click', closeDoctorModal);
    document.getElementById('doctorForm')?.addEventListener('submit', handleDoctorSubmit);
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
        'doctors': 'Doctors Management',
        'reports': 'Reports',
        'settings': 'Settings'
    };
    document.getElementById('pageTitle').textContent = pageTitles[page] || 'Dashboard';

    // Load page data
    if (page === 'materials') {
        loadMaterials();
    } else if (page === 'doctors') {
        loadDoctors();
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
    const tbody = document.getElementById('materialsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">Loading materials...</td></tr>';

    const materials = await apiCall('/api/materials');
    if (!materials) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">Failed to load materials</td></tr>';
        return;
    }

    const data = await materials.json();

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">No materials yet. Click "+ Add Material" to start!</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(material => {
        const isLowStock = material.quantity <= material.minimumStock;
        const statusClass = material.quantity === 0 ? 'critical' : (isLowStock ? 'low' : 'ok');
        const statusText = material.quantity === 0 ? 'Out of Stock' : (isLowStock ? 'Low Stock' : 'In Stock');

        return `
            <tr class="material-row" data-material-id="${material.id}">
                <td>
                    <button class="expand-btn" onclick="toggleHistory(${material.id})" title="View History">
                        ▶
                    </button>
                </td>
                <td class="material-name-cell">${material.name}</td>
                <td class="stock-cell ${isLowStock ? 'low-stock' : ''}">
                    ${material.quantity} ${material.unit || 'units'}
                </td>
                <td>${material.minimumStock}</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>$${material.price ? material.price.toFixed(2) : '0.00'}</td>
                <td>${material.supplier || '-'}</td>
                <td>
                    <button class="action-btn" onclick="editMaterial(${material.id})" title="Edit">Edit</button>
                    <button class="action-btn" onclick="deleteMaterial(${material.id})" title="Delete">Delete</button>
                </td>
            </tr>
            <tr class="history-row" id="history-${material.id}">
                <td colspan="8" class="history-cell">
                    <div class="history-content" id="history-content-${material.id}">
                        <div class="loading-message">Loading history...</div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function toggleHistory(materialId) {
    const historyRow = document.getElementById(`history-${materialId}`);
    const expandBtn = document.querySelector(`[onclick="toggleHistory(${materialId})"]`);
    const historyContent = document.getElementById(`history-content-${materialId}`);

    if (historyRow.classList.contains('visible')) {
        // Collapse
        historyRow.classList.remove('visible');
        expandBtn.classList.remove('expanded');
    } else {
        // Expand and load history
        historyRow.classList.add('visible');
        expandBtn.classList.add('expanded');
        await loadMaterialHistory(materialId, historyContent);
    }
}

async function loadMaterialHistory(materialId, container) {
    container.innerHTML = '<div class="loading-message" style="padding: 20px;">Loading history...</div>';

    const response = await apiCall(`/api/materials/${materialId}/transactions`);
    if (!response || !response.ok) {
        container.innerHTML = '<div class="no-history">Failed to load history</div>';
        return;
    }

    const transactions = await response.json();

    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="history-header">Transaction History</div>
            <div class="no-history">No transactions yet</div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="history-header">Transaction History (${transactions.length} records)</div>
        <table class="history-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Balance After</th>
                    <th>Unit Cost</th>
                    <th>Supplier</th>
                    <th>Performed By</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(t => {
                    const date = new Date(t.createdAt).toLocaleString();
                    const quantityClass = t.quantity > 0 ? 'quantity-positive' : 'quantity-negative';
                    const quantityText = t.quantity > 0 ? `+${t.quantity}` : t.quantity;

                    return `
                        <tr>
                            <td>${date}</td>
                            <td><span class="transaction-type ${t.transactionType.toLowerCase()}">${t.transactionType}</span></td>
                            <td class="${quantityClass}">${quantityText}</td>
                            <td>${t.balanceAfter}</td>
                            <td>${t.unitCost ? '$' + t.unitCost.toFixed(2) : '-'}</td>
                            <td>${t.supplier || '-'}</td>
                            <td>${t.performedBy || '-'}</td>
                            <td>${t.notes || '-'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
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
    console.log('Form submitted - starting save process');

    const materialData = {
        name: document.getElementById('materialName').value,
        unit: document.getElementById('materialUnit').value,
        quantity: parseInt(document.getElementById('materialQuantity').value),
        minimumStock: parseInt(document.getElementById('materialMinStock').value),
        price: parseFloat(document.getElementById('materialPrice').value) || 0,
        supplier: document.getElementById('materialSupplier').value,
        description: document.getElementById('materialDescription').value
    };

    // Add id when editing
    if (currentMaterialId) {
        materialData.id = currentMaterialId;
    }

    console.log('Material data to save:', materialData);

    const url = currentMaterialId
        ? `/api/materials/${currentMaterialId}`
        : '/api/materials';

    const method = currentMaterialId ? 'PUT' : 'POST';
    console.log(`Making ${method} request to: ${url}`);

    const response = await apiCall(url, {
        method: method,
        body: JSON.stringify(materialData)
    });

    console.log('Response received:', response);
    console.log('Response status:', response?.status);
    console.log('Response ok:', response?.ok);

    if (response && (response.ok || response.status === 204)) {
        console.log('Save successful! Closing modal and reloading materials');
        closeMaterialModal();
        loadMaterials();
    } else {
        // Show more detailed error message
        console.error('Save failed - response:', response);
        let errorMsg = 'Failed to save material';
        if (response) {
            try {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);

                // Try to parse JSON error
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMsg = errorData.message;
                    } else if (errorData.errors) {
                        errorMsg = JSON.stringify(errorData.errors);
                    }
                } catch {
                    // Not JSON, use text as-is
                    if (errorText.length < 200) {
                        errorMsg = errorText;
                    } else {
                        errorMsg += `. Status: ${response.status}. Check console for details.`;
                    }
                }
            } catch (e) {
                console.error('Could not read error response:', e);
                errorMsg += `. Status: ${response.status}`;
            }
        } else {
            console.error('No response received - possible network error');
            errorMsg = 'No response from server. Check network connection.';
        }
        alert(errorMsg);
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
window.toggleHistory = toggleHistory;

// DOCTORS MANAGEMENT

let currentDoctorId = null;

async function loadDoctors() {
    const tbody = document.getElementById('doctorsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Loading doctors...</td></tr>';

    const response = await apiCall('/api/doctors');
    if (!response) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Failed to load doctors</td></tr>';
        return;
    }

    const doctors = await response.json();

    if (doctors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No doctors yet. Click "+ Add Doctor" to start!</td></tr>';
        return;
    }

    tbody.innerHTML = doctors.map(doctor => {
        const statusClass = doctor.status === 'Active' ? 'ok' : (doctor.status === 'On Leave' ? 'low' : 'critical');

        return `
            <tr>
                <td class="doctor-name-cell">${doctor.fullName}</td>
                <td>${doctor.specialization}</td>
                <td>${doctor.phone || '-'}</td>
                <td>${doctor.email || '-'}</td>
                <td>
                    <span class="status-badge ${statusClass}">${doctor.status || 'Active'}</span>
                </td>
                <td>
                    <button class="action-btn" onclick="editDoctor(${doctor.id})" title="Edit">Edit</button>
                    <button class="action-btn" onclick="deleteDoctor(${doctor.id})" title="Delete">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openDoctorModal(doctor = null) {
    const modal = document.getElementById('doctorModal');
    const form = document.getElementById('doctorForm');
    const title = document.getElementById('doctorModalTitle');

    if (doctor) {
        title.textContent = 'Edit Doctor';
        currentDoctorId = doctor.id;
        document.getElementById('doctorName').value = doctor.fullName;
        document.getElementById('doctorSpecialization').value = doctor.specialization;
        document.getElementById('doctorPhone').value = doctor.phone || '';
        document.getElementById('doctorEmail').value = doctor.email || '';
        document.getElementById('doctorLicense').value = doctor.licenseNumber || '';
        document.getElementById('doctorStatus').value = doctor.status || 'Active';
        document.getElementById('doctorNotes').value = doctor.notes || '';
    } else {
        title.textContent = 'Add Doctor';
        currentDoctorId = null;
        form.reset();
    }

    modal.classList.add('active');
}

function closeDoctorModal() {
    document.getElementById('doctorModal').classList.remove('active');
    document.getElementById('doctorForm').reset();
    currentDoctorId = null;
}

async function handleDoctorSubmit(e) {
    e.preventDefault();

    const doctorData = {
        fullName: document.getElementById('doctorName').value,
        specialization: document.getElementById('doctorSpecialization').value,
        phone: document.getElementById('doctorPhone').value,
        email: document.getElementById('doctorEmail').value,
        licenseNumber: document.getElementById('doctorLicense').value,
        status: document.getElementById('doctorStatus').value,
        notes: document.getElementById('doctorNotes').value
    };

    if (currentDoctorId) {
        doctorData.id = currentDoctorId;
    }

    const url = currentDoctorId
        ? `/api/doctors/${currentDoctorId}`
        : '/api/doctors';

    const method = currentDoctorId ? 'PUT' : 'POST';

    const response = await apiCall(url, {
        method: method,
        body: JSON.stringify(doctorData)
    });

    if (response && (response.ok || response.status === 204)) {
        closeDoctorModal();
        loadDoctors();
    } else {
        let errorMsg = 'Failed to save doctor';
        if (response) {
            try {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMsg = errorData.message;
                    } else if (errorData.errors) {
                        errorMsg = JSON.stringify(errorData.errors);
                    }
                } catch {
                    if (errorText.length < 200) {
                        errorMsg = errorText;
                    } else {
                        errorMsg += `. Status: ${response.status}`;
                    }
                }
            } catch (e) {
                errorMsg += `. Status: ${response.status}`;
            }
        } else {
            errorMsg = 'No response from server. Check network connection.';
        }
        alert(errorMsg);
    }
}

async function editDoctor(id) {
    const response = await apiCall(`/api/doctors/${id}`);
    if (response && response.ok) {
        const doctor = await response.json();
        openDoctorModal(doctor);
    }
}

async function deleteDoctor(id) {
    if (!confirm('Are you sure you want to delete this doctor?')) {
        return;
    }

    const response = await apiCall(`/api/doctors/${id}`, {
        method: 'DELETE'
    });

    if (response && (response.ok || response.status === 204)) {
        loadDoctors();
    } else {
        alert('Failed to delete doctor');
    }
}

// Make doctor functions global for onclick handlers
window.editDoctor = editDoctor;
window.deleteDoctor = deleteDoctor;

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
