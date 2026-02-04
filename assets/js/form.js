document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const successMessage = document.getElementById('successMessage');
    const inputs = form.querySelectorAll('input, select, textarea');

    // Add float label effect or shadow on focus for better interactivity
    inputs.forEach(input => {
        let isComposing = false;

        input.addEventListener('compositionstart', () => {
            isComposing = true;
        });

        input.addEventListener('compositionend', () => {
            isComposing = false;
            // Trigger filter once composition finishes
            if (input.id === 'name-kana') {
                input.value = input.value.replace(/[^ぁ-んー\s]/g, '');
            }
        });

        // Hiragana Enforcement for name-kana
        if (input.id === 'name-kana') {
            input.addEventListener('input', () => {
                if (isComposing) return;
                input.value = input.value.replace(/[^ぁ-んー\s]/g, '');
            });
        }

        // Phone Validation (Single Input)
        if (input.id === 'phone') {
            input.addEventListener('input', () => {
                if (isComposing) return;
                // Allow numbers and hyphens only
                input.value = input.value.replace(/[^\d-]/g, '');
            });
        }

        input.addEventListener('focus', () => {
            const group = input.parentElement.closest('.glow-input');
            if (group) group.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (input.value === '') {
                const group = input.parentElement.closest('.glow-input');
                if (group) group.classList.remove('focused');
            }
        });
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Simple validation check
        let isValid = true;

        // 1. Check all required visible text/select/textarea inputs
        form.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select, textarea').forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                // If it's the "Other" referral input, only require it if visible
                if (input.id === 'referral-other' && input.offsetParent === null) {
                    return;
                }
                isValid = false;
                showError(input);
            } else {
                removeError(input);
            }
        });

        // 2. Check Radio Buttons (Gender)
        const genderRadios = form.querySelectorAll('input[name="gender"]');
        let genderChecked = false;
        genderRadios.forEach(r => {
            if (r.checked) genderChecked = true;
        });
        if (!genderChecked) {
            isValid = false;
            // Highlight the container
            const container = genderRadios[0].closest('.radio-cloud');
            if (container) container.style.border = '1px solid #ff4b4b';
        } else {
            const container = genderRadios[0].closest('.radio-cloud');
            if (container) container.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        }

        // 3. Check privacy checkbox
        const privacyCheckbox = form.querySelector('input[name="privacy"]');
        if (!privacyCheckbox || !privacyCheckbox.checked) {
            isValid = false;
            // Highlight checkbox text
            const label = privacyCheckbox.closest('.custom-checkbox');
            if (label) label.style.color = '#ff4b4b';
        } else {
            const label = privacyCheckbox.closest('.custom-checkbox');
            if (label) label.style.color = '#ddd';
        }

        // 4. Check for duplicate roles
        const role1 = form.querySelector('#role-1')?.value;
        const role2 = form.querySelector('#role-2')?.value;
        const role3 = form.querySelector('#role-3')?.value;

        if (role1 && (role1 === role2 || role1 === role3)) {
            isValid = false;
            alert('希望役職が重複しています。別の役職を選択してください。');
        } else if (role2 && role2 === role3) {
            isValid = false;
            alert('希望役職が重複しています。別の役職を選択してください。');
        }

        if (isValid) {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalContent = submitBtn.innerHTML;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>TRANSMITTING...</span><div class="spinner"></div>';
            submitBtn.style.opacity = '0.7';

            try {
                // Get Form Data
                const formData = new FormData(form);

                // Formatted Values
                const gradeVal = formData.get('grade');
                let formattedGrade = gradeVal;
                if (gradeVal && !gradeVal.includes('年生')) {
                    formattedGrade = gradeVal + '年生';
                }

                const genderMap = {
                    'male': '男',
                    'female': '女',
                    'other': '選択しない'
                };
                const genderVal = formData.get('gender');

                // 1. Prepare data for 'applicants' table
                const data = {
                    full_name: formData.get('applicant_name'),
                    full_kana: formData.get('applicant_kana'),
                    gender: genderMap[genderVal] || genderVal,
                    school_id: formData.get('school_id'),
                    grade: formattedGrade,
                    desired_role_1_id: formData.get('role-1'),
                    desired_role_2_id: formData.get('role-2'),
                    desired_role_3_id: formData.get('role-3'),
                    referral_source_id: formData.get('referral'),
                    referral_source_other: formData.get('referral-other'),
                    email: formData.get('email'),
                    phone: formData.get('phone'), // Direct single input
                    message: formData.get('message'),
                    status: '新規',
                    // LINE Linkage
                    line_user_id: formData.get('line_user_id') || null,
                };

                // 2. Insert into 'applicants'
                const { data: insertedApplicant, error: insertError } = await window.supabaseClient
                    .from('applicants')
                    .insert([data])
                    .select('*, r1:master_role!desired_role_1_id(name), r2:master_role!desired_role_2_id(name), r3:master_role!desired_role_3_id(name), ref:master_referral_source!referral_source_id(name)')
                    .single();

                if (insertError) throw insertError;

                // 3. Send LINE Notify (via Edge Function)
                try {
                    await window.supabaseClient.functions.invoke('notify-applicant', {
                        body: {
                            record: insertedApplicant,
                            roles: [insertedApplicant.r1?.name, insertedApplicant.r2?.name, insertedApplicant.r3?.name].filter(Boolean),
                            referral: insertedApplicant.ref?.name
                        }
                    });
                } catch (notifyErr) {
                    console.warn('Notification failed, but registration succeeded:', notifyErr);
                }

                // Show success animation
                successMessage.style.display = 'flex';
                console.log('Form Submitted successfully:', data);

            } catch (err) {
                console.error('Error submitting form:', err);
                alert('送信に失敗しました: ' + (err.message || '不明なエラー'));

                // Reset button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
                submitBtn.style.opacity = '1';
            }
        }
    });

    function showError(input) {
        input.style.borderColor = '#ff4b4b';
        // Attempt to find the closest glow-input wrapper to shake
        const wrapper = input.parentElement.closest('.glow-input');
        if (wrapper) {
            wrapper.classList.add('shake');
            setTimeout(() => {
                wrapper.classList.remove('shake');
            }, 500);
        } else {
            input.classList.add('shake');
            setTimeout(() => {
                input.classList.remove('shake');
            }, 500);
        }
    }

    function removeError(input) {
        input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
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
        margin-left: 10px;
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
