// Configuration
const API_BASE_URL = window.location.origin;

// Check if already logged in
if (localStorage.getItem('authToken')) {
    window.location.href = '/dashboard.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const createTestDataBtn = document.getElementById('createTestDataBtn');

    loginForm?.addEventListener('submit', handleLogin);
    togglePassword?.addEventListener('click', handleTogglePassword);
    createTestDataBtn?.addEventListener('click', createTestData);
}

// Toggle Password Visibility
function handleTogglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// Create Test Data
async function createTestData() {
    const btn = document.getElementById('createTestDataBtn');
    const resultDiv = document.getElementById('devResult');

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
            showDevResult(resultDiv, 'success', `
                ✅ تم إنشاء البيانات بنجاح!
                <br><br>
                <strong>البيانات:</strong><br>
                Email: admin@clinic.com<br>
                Password: Admin123!
            `);

            // Auto-fill the form
            document.getElementById('email').value = 'admin@clinic.com';
            document.getElementById('password').value = 'Admin123!';
        } else {
            showDevResult(resultDiv, 'error', `
                ⚠️ ${data.message || 'البيانات موجودة بالفعل'}
            `);
        }
    } catch (error) {
        showDevResult(resultDiv, 'error', `
            ❌ خطأ في الاتصال: ${error.message}
        `);
    } finally {
        btn.disabled = false;
        btn.textContent = 'إنشاء بيانات تجريبية';
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const alertDiv = document.getElementById('loginAlert');
    const submitBtn = document.getElementById('loginBtn');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">⏳ جاري تسجيل الدخول...</span>';

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
            // Save auth data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify({
                userId: data.userId,
                fullName: data.fullName,
                email: data.email,
                role: data.role,
                clinicId: data.clinicId,
                clinicName: data.clinicName
            }));

            showAlert(alertDiv, 'success', '✅ تم تسجيل الدخول بنجاح! جاري التحويل...');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            showAlert(alertDiv, 'error', `❌ ${data.message || 'فشل تسجيل الدخول'}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">تسجيل الدخول</span><span class="btn-icon">→</span>';
        }
    } catch (error) {
        showAlert(alertDiv, 'error', `❌ خطأ في الاتصال: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">تسجيل الدخول</span><span class="btn-icon">→</span>';
    }
}

// Show Alert
function showAlert(element, type, message) {
    element.className = `alert show ${type}`;
    element.innerHTML = message;
}

// Show Dev Result
function showDevResult(element, type, message) {
    element.className = `show ${type}`;
    element.innerHTML = message;
}
