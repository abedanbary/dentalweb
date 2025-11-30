// Initialize Overview Page
export function initOverview() {
    loadDashboardData();
}

// Load Dashboard Data
function loadDashboardData() {
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
