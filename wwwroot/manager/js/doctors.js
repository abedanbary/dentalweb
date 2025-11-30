import { apiCall, showNotification } from './utils.js';

let currentDoctorId = null;

// Initialize Doctors Page
export function initDoctors() {
    setupEventListeners();
    loadDoctors();
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('addDoctorBtn')?.addEventListener('click', () => openDoctorModal());
    document.getElementById('closeDoctorModal')?.addEventListener('click', closeDoctorModal);
    document.getElementById('cancelDoctorBtn')?.addEventListener('click', closeDoctorModal);
    document.getElementById('doctorForm')?.addEventListener('submit', handleDoctorSubmit);
}

// Load Doctors
async function loadDoctors() {
    const tbody = document.getElementById('doctorsTableBody');

    try {
        const response = await apiCall('/api/users/doctors');
        if (!response || !response.ok) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Failed to load doctors</td></tr>';
            return;
        }

        const doctors = await response.json();

        if (doctors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No doctors found. Click "Add Doctor" to create one.</td></tr>';
            return;
        }

        tbody.innerHTML = doctors.map(doctor => {
            const statusClass = doctor.isActive ? 'ok' : 'critical';
            const statusText = doctor.isActive ? 'Active' : 'Inactive';
            const createdDate = new Date(doctor.createdAt).toLocaleDateString();

            return `
                <tr>
                    <td class="material-name-cell">${doctor.fullName}</td>
                    <td>${doctor.email}</td>
                    <td>${doctor.phone || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="action-btn" onclick="window.editDoctor(${doctor.id})">Edit</button>
                        <button class="action-btn" onclick="window.deleteDoctor(${doctor.id}, '${doctor.fullName}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading doctors:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Error loading doctors</td></tr>';
    }
}

// Open Doctor Modal
function openDoctorModal(doctorId = null) {
    const modal = document.getElementById('doctorModal');
    const modalTitle = document.getElementById('doctorModalTitle');
    const form = document.getElementById('doctorForm');
    const passwordField = document.getElementById('doctorPassword');

    currentDoctorId = doctorId;

    if (doctorId) {
        modalTitle.textContent = 'Edit Doctor';
        passwordField.required = false;
        passwordField.placeholder = 'Leave blank to keep current password';
        loadDoctorData(doctorId);
    } else {
        modalTitle.textContent = 'Add New Doctor';
        form.reset();
        passwordField.required = true;
        passwordField.placeholder = '';
    }

    modal.classList.add('active');
}

// Close Doctor Modal
function closeDoctorModal() {
    const modal = document.getElementById('doctorModal');
    const form = document.getElementById('doctorForm');
    form.reset();
    modal.classList.remove('active');
    currentDoctorId = null;
}

// Load Doctor Data for Editing
async function loadDoctorData(doctorId) {
    try {
        const response = await apiCall('/api/users/doctors');
        if (!response || !response.ok) return;

        const doctors = await response.json();
        const doctor = doctors.find(d => d.id === doctorId);

        if (doctor) {
            document.getElementById('doctorFullName').value = doctor.fullName;
            document.getElementById('doctorEmail').value = doctor.email;
            document.getElementById('doctorPhone').value = doctor.phone || '';
            document.getElementById('doctorPassword').value = '';
        }
    } catch (error) {
        console.error('Error loading doctor data:', error);
    }
}

// Handle Doctor Form Submit
async function handleDoctorSubmit(e) {
    e.preventDefault();

    const formData = {
        fullName: document.getElementById('doctorFullName').value,
        email: document.getElementById('doctorEmail').value,
        phone: document.getElementById('doctorPhone').value,
        password: document.getElementById('doctorPassword').value
    };

    const saveBtn = document.getElementById('saveDoctorBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        let response;
        if (currentDoctorId) {
            response = await apiCall(`/api/users/doctors/${currentDoctorId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
        } else {
            response = await apiCall('/api/users/doctors', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
        }

        if (response && response.ok) {
            closeDoctorModal();
            loadDoctors();
            showNotification(currentDoctorId ? 'Doctor updated successfully!' : 'Doctor added successfully!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to save doctor', 'error');
        }
    } catch (error) {
        console.error('Error saving doctor:', error);
        showNotification('Error saving doctor. Please try again.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// Edit Doctor
function editDoctor(doctorId) {
    openDoctorModal(doctorId);
}

// Delete Doctor
async function deleteDoctor(doctorId, doctorName) {
    if (!confirm(`Are you sure you want to deactivate Dr. ${doctorName}?`)) {
        return;
    }

    try {
        const response = await apiCall(`/api/users/doctors/${doctorId}`, {
            method: 'DELETE'
        });

        if (response && response.ok) {
            loadDoctors();
            showNotification('Doctor deactivated successfully', 'success');
        } else {
            showNotification('Failed to deactivate doctor', 'error');
        }
    } catch (error) {
        console.error('Error deleting doctor:', error);
        showNotification('Error deactivating doctor', 'error');
    }
}

// Expose functions to window for onclick handlers
window.editDoctor = editDoctor;
window.deleteDoctor = deleteDoctor;
