import { apiCall, showNotification } from './utils.js';

let currentMaterialId = null;

// Initialize Materials Page
export function initMaterials() {
    console.log('Initializing Materials page...');

    // Verify elements exist
    const addBtn = document.getElementById('addMaterialBtn');
    const tbody = document.getElementById('materialsTableBody');

    if (!addBtn || !tbody) {
        console.error('Materials page elements not found!', { addBtn, tbody });
        return;
    }

    setupEventListeners();
    loadMaterials();
}

// Setup Event Listeners
function setupEventListeners() {
    const addBtn = document.getElementById('addMaterialBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModal');
    const form = document.getElementById('materialForm');

    if (addBtn) addBtn.addEventListener('click', () => openMaterialModal());
    if (closeBtn) closeBtn.addEventListener('click', closeMaterialModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeMaterialModal);
    if (form) form.addEventListener('submit', handleMaterialSubmit);
}

// Load Materials
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
                    <button class="expand-btn" onclick="window.toggleHistory(${material.id})" title="View History">▶</button>
                </td>
                <td class="material-name-cell">${material.name}</td>
                <td class="stock-cell ${isLowStock ? 'low-stock' : ''}">
                    ${material.quantity} ${material.unit || 'units'}
                </td>
                <td>${material.minimumStock}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>$${material.price ? material.price.toFixed(2) : '0.00'}</td>
                <td>${material.supplier || '-'}</td>
                <td>
                    <button class="action-btn" onclick="window.editMaterial(${material.id})">Edit</button>
                    <button class="action-btn" onclick="window.deleteMaterial(${material.id})">Delete</button>
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

// Toggle History
async function toggleHistory(materialId) {
    const historyRow = document.getElementById(`history-${materialId}`);
    const expandBtn = document.querySelector(`[onclick="window.toggleHistory(${materialId})"]`);
    const historyContent = document.getElementById(`history-content-${materialId}`);

    if (historyRow.classList.contains('visible')) {
        historyRow.classList.remove('visible');
        expandBtn.classList.remove('expanded');
    } else {
        historyRow.classList.add('visible');
        expandBtn.classList.add('expanded');
        await loadMaterialHistory(materialId, historyContent);
    }
}

// Load Material History
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

    const historyTable = `
        <div class="history-header">Transaction History</div>
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
                ${transactions.map(t => `
                    <tr>
                        <td>${new Date(t.createdAt).toLocaleString()}</td>
                        <td><span class="transaction-type ${t.transactionType.toLowerCase()}">${t.transactionType}</span></td>
                        <td class="${t.quantity > 0 ? 'positive' : 'negative'}">${t.quantity > 0 ? '+' : ''}${t.quantity}</td>
                        <td>${t.balanceAfter}</td>
                        <td>${t.unitCost ? '$' + t.unitCost.toFixed(2) : '-'}</td>
                        <td>${t.supplier || '-'}</td>
                        <td>${t.performedBy || '-'}</td>
                        <td>${t.notes || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = historyTable;
}

// Open Material Modal
function openMaterialModal(materialId = null) {
    const modal = document.getElementById('materialModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('materialForm');

    currentMaterialId = materialId;

    if (materialId) {
        modalTitle.textContent = 'Edit Material';
        loadMaterialData(materialId);
    } else {
        modalTitle.textContent = 'Add New Material';
        form.reset();
    }

    modal.classList.add('active');
}

// Close Material Modal
function closeMaterialModal() {
    const modal = document.getElementById('materialModal');
    const form = document.getElementById('materialForm');
    form.reset();
    modal.classList.remove('active');
    currentMaterialId = null;
}

// Load Material Data
async function loadMaterialData(materialId) {
    const response = await apiCall(`/api/materials/${materialId}`);
    if (!response || !response.ok) return;

    const material = await response.json();

    document.getElementById('materialName').value = material.name;
    document.getElementById('quantity').value = material.quantity;
    document.getElementById('unit').value = material.unit || '';
    document.getElementById('minimumStock').value = material.minimumStock;
    document.getElementById('price').value = material.price || '';
    document.getElementById('supplier').value = material.supplier || '';
    document.getElementById('notes').value = material.notes || '';
}

// Handle Material Submit
async function handleMaterialSubmit(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('materialName').value,
        quantity: parseInt(document.getElementById('quantity').value),
        unit: document.getElementById('unit').value,
        minimumStock: parseInt(document.getElementById('minimumStock').value),
        price: parseFloat(document.getElementById('price').value) || 0,
        supplier: document.getElementById('supplier').value,
        notes: document.getElementById('notes').value
    };

    try {
        let response;
        if (currentMaterialId) {
            response = await apiCall(`/api/materials/${currentMaterialId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
        } else {
            response = await apiCall('/api/materials', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
        }

        if (response && response.ok) {
            closeMaterialModal();
            loadMaterials();
            showNotification(currentMaterialId ? 'Material updated successfully!' : 'Material added successfully!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to save material', 'error');
        }
    } catch (error) {
        console.error('Error saving material:', error);
        showNotification('Error saving material', 'error');
    }
}

// Edit Material
function editMaterial(materialId) {
    openMaterialModal(materialId);
}

// Delete Material
async function deleteMaterial(materialId) {
    if (!confirm('Are you sure you want to delete this material?')) {
        return;
    }

    const response = await apiCall(`/api/materials/${materialId}`, {
        method: 'DELETE'
    });

    if (response && response.ok) {
        loadMaterials();
        showNotification('Material deleted successfully', 'success');
    } else {
        showNotification('Failed to delete material', 'error');
    }
}

// Expose functions to window
window.toggleHistory = toggleHistory;
window.editMaterial = editMaterial;
window.deleteMaterial = deleteMaterial;
