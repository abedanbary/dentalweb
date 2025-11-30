import { checkAuth, getCurrentUser, handleLogout, loadPage } from './utils.js';
import { initOverview } from './overview.js';
import { initDoctors } from './doctors.js';
import { initMaterials } from './materials.js';

// Page initialization functions
const pageInitializers = {
    'overview': initOverview,
    'doctors': initDoctors,
    'materials': initMaterials
};

// Page titles
const pageTitles = {
    'overview': 'Dashboard',
    'doctors': 'Doctors',
    'materials': 'Materials & Supplies'
};

// Check authentication on load
if (!checkAuth()) {
    throw new Error('Not authenticated');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    displayUserInfo();
    setupNavigation();
    setupLogout();

    // Load default page (overview)
    navigateToPage('overview');
});

// Display User Info
function displayUserInfo() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

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

// Setup Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateToPage(page);
        });
    });
}

// Setup Logout
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', handleLogout);
}

// Navigate to Page
async function navigateToPage(page) {
    // Update nav active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    // Update page title
    document.getElementById('pageTitle').textContent = pageTitles[page] || 'Dashboard';

    // Load page content
    const pageContainer = document.getElementById('pageContainer');
    const pageContent = await loadPage(page);
    pageContainer.innerHTML = pageContent;

    // Initialize page-specific functionality
    if (pageInitializers[page]) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            pageInitializers[page]();
        }, 100);
    }
}

// Export for global access if needed
window.navigateToPage = navigateToPage;
