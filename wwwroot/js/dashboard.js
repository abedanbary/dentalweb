// Configuration
const API_BASE_URL = window.location.origin;
let authToken = null;
let currentUser = null;

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

    // Get initials (first letters of first and last name)
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
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', handleLogout);

    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// Load Dashboard Data
async function loadDashboardData() {
    // Simulate loading data
    // In real app, fetch from API
    animateValue('totalPatients', 0, 156, 1500);
    animateValue('todayAppointments', 0, 12, 1500);
    animateValue('totalDoctors', 0, 5, 1500);

    // Animate revenue
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

// Handle Logout
function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
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
            // Token expired or invalid
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

// Example: Load Patients (for future use)
async function loadPatients() {
    const response = await apiCall('/api/patients');
    if (response && response.ok) {
        const patients = await response.json();
        console.log('Patients:', patients);
        // Update UI with patients data
    }
}
