// =============================================
// BOOKING.JS — Form Validation & Submission
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  form.addEventListener('submit', handleBookingSubmit);

  // Real-time validation
  const fields = form.querySelectorAll('input[required], select[required]');
  fields.forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => clearError(field));
  });
});

async function handleBookingSubmit(e) {
  e.preventDefault();
  const form = e.target;
  
  // Validate all
  let valid = true;
  const fields = {
    name: { el: form.querySelector('#bookingName'), msg: 'Please enter your name' },
    district: { el: form.querySelector('#bookingDistrict'), msg: 'Please enter your district' },
    contact_number: { el: form.querySelector('#bookingContact'), msg: 'Please enter a valid contact number', validate: validatePhone },
    email: { el: form.querySelector('#bookingEmail'), msg: 'Please enter a valid email', validate: validateEmail },
    service_id: { el: form.querySelector('#bookingService'), msg: 'Please select a service' }
  };

  for (const [key, field] of Object.entries(fields)) {
    if (!field.el.value.trim()) {
      showError(field.el, field.msg);
      valid = false;
    } else if (field.validate && !field.validate(field.el.value)) {
      showError(field.el, field.msg);
      valid = false;
    }
  }

  if (!valid) return;

  // Submit
  const btn = document.getElementById('bookingSubmit');
  btn.disabled = true;
  btn.innerHTML = '<span>Submitting...</span> <i data-lucide="loader" class="spin"></i>';
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.success) {
      const successMsg = document.getElementById('successMessage');
      if (successMsg) successMsg.textContent = result.message;
      document.getElementById('successModal').classList.add('active');
      form.reset();
    } else {
      showToast(result.error || 'Something went wrong', 'error');
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Submit Booking</span> <i data-lucide="send"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function validateField(field) {
  if (!field.value.trim()) {
    showError(field, 'This field is required');
    return false;
  }

  if (field.type === 'email' && !validateEmail(field.value)) {
    showError(field, 'Please enter a valid email');
    return false;
  }

  if (field.type === 'tel' && !validatePhone(field.value)) {
    showError(field, 'Please enter a valid phone number');
    return false;
  }

  clearError(field);
  return true;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[+]?[\d\s-]{10,15}$/.test(phone);
}

function showError(field, message) {
  const group = field.closest('.form-group');
  const errorEl = group?.querySelector('.form-error');
  if (errorEl) errorEl.textContent = message;
  const wrapper = field.closest('.input-wrapper');
  if (wrapper) wrapper.style.borderColor = '#EF4444';
}

function clearError(field) {
  const group = field.closest('.form-group');
  const errorEl = group?.querySelector('.form-error');
  if (errorEl) errorEl.textContent = '';
  const wrapper = field.closest('.input-wrapper');
  if (wrapper) wrapper.style.borderColor = '';
}
