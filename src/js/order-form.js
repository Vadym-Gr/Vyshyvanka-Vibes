export function initOrderForm() {
  const form = document.querySelector('[data-order-form]');
  if (!form) return;

  const fields = [...form.querySelectorAll('input, textarea')];
  const status = form.querySelector('.order-form__status');

  function clearStatus() {
    status.textContent = '';
  }

  function validate(field) {
    const value = field.value.trim();
    let message = '';
    if (field.required && !value) {
      message =
        field.name === 'email' ? 'Enter your email.' : 'Enter your full name.';
    } else if (field.name === 'fullName' && value.length < 2) {
      message = 'Use at least 2 characters for your name.';
    } else if (field.type === 'email' && field.validity.typeMismatch) {
      message = 'Enter a valid email address, for example name@example.com.';
    } else if (field.maxLength > 0 && value.length > field.maxLength) {
      message = `Use no more than ${field.maxLength} characters.`;
    }

    const error = document.getElementById(
      field.getAttribute('aria-describedby')
    );
    error.textContent = message;
    error.hidden = !message;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return !message;
  }

  for (const field of fields) {
    field.addEventListener('blur', () => {
      if (field.value || field.hasAttribute('aria-invalid')) validate(field);
    });
    field.addEventListener('input', () => {
      clearStatus();
      if (field.hasAttribute('aria-invalid')) validate(field);
    });
  }

  form.addEventListener('reset', () => {
    clearStatus();
    for (const field of fields) {
      field.removeAttribute('aria-invalid');
      const error = document.getElementById(
        field.getAttribute('aria-describedby')
      );
      error.textContent = '';
      error.hidden = true;
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearStatus();
    for (const field of fields) field.value = field.value.trim();
    const invalidFields = fields.filter(field => !validate(field));
    if (invalidFields.length) {
      invalidFields[0].focus();
      return;
    }

    form.reset();
    status.textContent =
      'The sending service is not connected yet. Your request has not been sent. The form has been cleared.';
  });

  // Keep native validation as a fallback until the local handler is ready.
  form.noValidate = true;
  form.querySelector('[type="submit"]').disabled = false;
}
