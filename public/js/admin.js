// =============================================
// ADMIN.JS — Dashboard Interactivity
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  initSidebar();
});

// --- Sidebar Toggle ---
function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  const close = document.getElementById('sidebarClose');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
  if (close && sidebar) {
    close.addEventListener('click', () => sidebar.classList.remove('open'));
  }
}

// --- Toast Notification ---
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// --- Booking Status Update ---
async function updateBookingStatus(id, status, selectEl) {
  try {
    const res = await fetch(`/admin/bookings/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    const result = await res.json();
    if (result.success) {
      // Update select styling
      selectEl.className = 'status-select status-' + status.toLowerCase().replace(' ', '-');
      showToast('Status updated to ' + status, 'success');
    } else {
      showToast('Failed to update status', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

// --- Delete Booking ---
async function deleteBooking(id) {
  if (!confirm('Are you sure you want to delete this booking?')) return;

  try {
    const res = await fetch(`/admin/bookings/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (result.success) {
      const row = document.getElementById(`booking-row-${id}`);
      if (row) {
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
        // Also remove message row if exists
        const nextRow = row.nextElementSibling;
        setTimeout(() => {
          row.remove();
          if (nextRow && nextRow.classList.contains('message-row')) {
            nextRow.remove();
          }
        }, 300);
      }
      showToast('Booking deleted successfully', 'success');
    }
  } catch (err) {
    showToast('Failed to delete booking', 'error');
  }
}

// --- Service Modal ---
function openServiceModal(service = null) {
  const modal = document.getElementById('serviceModal');
  const title = document.getElementById('serviceModalTitle');
  const idField = document.getElementById('serviceId');
  const nameField = document.getElementById('serviceName');
  const iconField = document.getElementById('serviceIcon');
  const priceField = document.getElementById('servicePrice');
  const descField = document.getElementById('serviceDesc');
  const benefitsField = document.getElementById('serviceBenefits');
  const activeField = document.getElementById('serviceActive');

  if (service) {
    title.textContent = 'Edit Service';
    idField.value = service.id;
    nameField.value = service.name;
    iconField.value = service.icon || '';
    priceField.value = service.price_display || '';
    descField.value = service.description || '';
    benefitsField.value = service.benefits || '';
    activeField.checked = service.is_active;
  } else {
    title.textContent = 'Add New Service';
    idField.value = '';
    nameField.value = '';
    iconField.value = 'palette';
    priceField.value = 'Contact for Quote';
    descField.value = '';
    benefitsField.value = '';
    activeField.checked = true;
  }

  modal.classList.add('active');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function editService(service) {
  openServiceModal(service);
}

function closeServiceModal() {
  document.getElementById('serviceModal').classList.remove('active');
}

// --- Save Service ---
async function saveService(e) {
  e.preventDefault();

  const id = document.getElementById('serviceId').value;
  const data = {
    name: document.getElementById('serviceName').value,
    icon: document.getElementById('serviceIcon').value,
    price_display: document.getElementById('servicePrice').value,
    description: document.getElementById('serviceDesc').value,
    benefits: document.getElementById('serviceBenefits').value,
    is_active: document.getElementById('serviceActive').checked ? 1 : 0
  };

  const url = id ? `/admin/services/${id}` : '/admin/services';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (result.success) {
      showToast(id ? 'Service updated!' : 'Service added!', 'success');
      closeServiceModal();
      setTimeout(() => location.reload(), 500);
    } else {
      showToast(result.error || 'Failed to save', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

// --- Delete Service ---
async function deleteService(id) {
  if (!confirm('Are you sure you want to delete this service?')) return;

  try {
    const res = await fetch(`/admin/services/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (result.success) {
      const row = document.getElementById(`service-row-${id}`);
      if (row) {
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '0';
        setTimeout(() => row.remove(), 300);
      }
      showToast('Service deleted', 'success');
    }
  } catch (err) {
    showToast('Failed to delete service', 'error');
  }
}

// Make functions global
window.updateBookingStatus = updateBookingStatus;
window.deleteBooking = deleteBooking;
window.openServiceModal = openServiceModal;
window.editService = editService;
window.closeServiceModal = closeServiceModal;
window.saveService = saveService;
window.deleteService = deleteService;
window.showToast = showToast;
