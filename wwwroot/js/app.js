// Configuration
const API_BASE_URL = window.location.origin;
let authToken = null;
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkApiStatus();
    setupEventListeners();
    loadStoredAuth();
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('createTestDataBtn').addEventListener('click', createTestData);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('copyTokenBtn')?.addEventListener('click', copyToken);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

// Check API Status
async function checkApiStatus() {
    const statusElement = document.getElementById('apiStatus');
    const baseUrlElement = document.getElementById('baseUrl');

    baseUrlElement.textContent = API_BASE_URL;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'OPTIONS'
        });
        statusElement.textContent = '✅ Connected';
        statusElement.style.color = '#10b981';
    } catch (error) {
        statusElement.textContent = '❌ Offline';
        statusElement.style.color = '#ef4444';
    }
}

// Create Test Data
async function createTestData() {
    const btn = document.getElementById('createTestDataBtn');
    const resultDiv = document.getElementById('seedResult');

    btn.disabled = true;
    btn.textContent = '⏳ جاري الإنشاء...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/seed/create-test-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            showResult(resultDiv, 'success', `
                <strong>✅ تم إنشاء البيانات بنجاح!</strong>
                <pre>${JSON.stringify(data, null, 2)}</pre>
                <p><strong>يمكنك الآن تسجيل الدخول:</strong></p>
                <p>Email: ${data.manager.Email || 'admin@clinic.com'}</p>
                <p>Password: ${data.manager.Password || 'Admin123!'}</p>
            `);
        } else {
            showResult(resultDiv, 'error', `
                <strong>⚠️ ${data.message || 'Error creating test data'}</strong>
                <p>البيانات موجودة بالفعل، يمكنك تسجيل الدخول مباشرة.</p>
            `);
        }
    } catch (error) {
        showResult(resultDiv, 'error', `
            <strong>❌ خطأ في الاتصال</strong>
            <p>${error.message}</p>
            <p>تأكد من تشغيل الـ API على: ${API_BASE_URL}</p>
        `);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">🚀</span> إنشاء البيانات التجريبية';
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const resultDiv = document.getElementById('loginResult');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ جاري تسجيل الدخول...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data;

            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            showResult(resultDiv, 'success', '<strong>✅ تم تسجيل الدخول بنجاح!</strong>');

            // Show user section
            setTimeout(() => {
                document.getElementById('login-section').classList.add('hidden');
                document.getElementById('user-section').classList.remove('hidden');
                displayUserInfo();
            }, 1000);
        } else {
            showResult(resultDiv, 'error', `
                <strong>❌ فشل تسجيل الدخول</strong>
                <p>${data.message || 'Invalid credentials'}</p>
            `);
        }
    } catch (error) {
        showResult(resultDiv, 'error', `
            <strong>❌ خطأ في الاتصال</strong>
            <p>${error.message}</p>
        `);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">🔐</span> تسجيل الدخول';
    }
}

// Display User Info
function displayUserInfo() {
    if (!currentUser) return;

    const userInfoDiv = document.getElementById('userInfo');
    const tokenDiv = document.getElementById('tokenDisplay');

    userInfoDiv.innerHTML = `
        <div class="user-info-item">
            <span class="user-info-label">👤 الاسم:</span>
            <span class="user-info-value">${currentUser.fullName}</span>
        </div>
        <div class="user-info-item">
            <span class="user-info-label">📧 البريد الإلكتروني:</span>
            <span class="user-info-value">${currentUser.email}</span>
        </div>
        <div class="user-info-item">
            <span class="user-info-label">👔 الدور:</span>
            <span class="user-info-value">${currentUser.role}</span>
        </div>
        <div class="user-info-item">
            <span class="user-info-label">🏥 العيادة:</span>
            <span class="user-info-value">${currentUser.clinicName}</span>
        </div>
        <div class="user-info-item">
            <span class="user-info-label">🆔 Clinic ID:</span>
            <span class="user-info-value">${currentUser.clinicId}</span>
        </div>
    `;

    tokenDiv.textContent = authToken;
}

// Copy Token
function copyToken() {
    if (!authToken) return;

    navigator.clipboard.writeText(authToken).then(() => {
        const btn = document.getElementById('copyTokenBtn');
        const originalText = btn.textContent;
        btn.textContent = '✅ تم النسخ!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

// Logout
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');

    document.getElementById('user-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('loginForm').reset();
    document.getElementById('email').value = 'admin@clinic.com';
    document.getElementById('password').value = 'Admin123!';
}

// Load Stored Auth
function loadStoredAuth() {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');

    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);

        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('user-section').classList.remove('hidden');
        displayUserInfo();
    }
}

// Show Result Helper
function showResult(element, type, message) {
    element.className = `result show ${type}`;
    element.innerHTML = message;
}

// Make authenticated API call (for future use)
async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });
}
