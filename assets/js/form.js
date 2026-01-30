document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const successMessage = document.getElementById('successMessage');
    const inputs = form.querySelectorAll('input, select, textarea');

    // Conditional Visibility for "Other" in Referral
    const referralSelect = document.getElementById('referral');
    const referralOtherGroup = document.getElementById('referral-other-group');
    const referralOtherInput = document.getElementById('referral-other');

    if (referralSelect && referralOtherGroup) {
        referralSelect.addEventListener('change', () => {
            if (referralSelect.value === 'other') {
                referralOtherGroup.style.display = 'block';
                referralOtherInput.required = true;
                // Trigger focus for animation consistency
                setTimeout(() => referralOtherInput.focus(), 100);
            } else {
                referralOtherGroup.style.display = 'none';
                referralOtherInput.required = false;
                referralOtherInput.value = '';
            }
        });
    }

    // Add float label effect or shadow on focus for better interactivity
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.closest('.form-group').classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (input.value === '') {
                input.parentElement.closest('.form-group').classList.remove('focused');
            }
        });
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Simple validation check
        let isValid = true;
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value) {
                isValid = false;
                showError(input);
            } else {
                removeError(input);
            }
        });

        const privacyCheckbox = form.querySelector('input[name="privacy"]');
        if (!privacyCheckbox.checked) {
            isValid = false;
            privacyCheckbox.parentElement.style.color = '#ff4b4b';
        } else {
            privacyCheckbox.parentElement.style.color = '';
        }

        if (isValid) {
            // Simulate API call
            const submitBtn = form.querySelector('.submit-button');
            const originalContent = submitBtn.innerHTML;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>送信中...</span><div class="spinner"></div>';
            submitBtn.style.opacity = '0.7';

            // Fake delay for realistic feel
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Show success animation
            successMessage.style.display = 'flex';

            // Log form data for demo
            const formData = new FormData(form);
            console.log('Form Submitted successfully:', Object.fromEntries(formData));
        }
    });

    function showError(input) {
        input.style.borderColor = '#ff4b4b';
        input.parentElement.classList.add('shake');
        setTimeout(() => {
            input.parentElement.classList.remove('shake');
        }, 500);
    }

    function removeError(input) {
        input.style.borderColor = '';
    }
});

// Add spinner CSS dynamically
const style = document.createElement('style');
style.textContent = `
    .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .shake {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
    @keyframes shake {
        10%, 90% { transform: translate3d(-1px, 0, 0); }
        20%, 80% { transform: translate3d(2px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
        40%, 60% { transform: translate3d(4px, 0, 0); }
    }
`;
document.head.appendChild(style);
