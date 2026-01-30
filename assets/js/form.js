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
        // Check text inputs
        inputs.forEach(input => {
            if (input.type !== 'checkbox' && input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                showError(input);
            } else {
                removeError(input);
            }
        });

        // Check privacy checkbox
        const privacyCheckbox = form.querySelector('input[name="privacy"]');
        if (!privacyCheckbox || !privacyCheckbox.checked) {
            isValid = false;
            if (privacyCheckbox) {
                // 親ラベルの色を変えるなどのエラー表示
                privacyCheckbox.closest('.custom-checkbox').style.color = '#ff4b4b';
            }
        } else {
            privacyCheckbox.closest('.custom-checkbox').style.color = '';
        }

        if (isValid) {
            const submitBtn = form.querySelector('.submit-button');
            const originalContent = submitBtn.innerHTML;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>送信中...</span><div class="spinner"></div>';
            submitBtn.style.opacity = '0.7';

            try {
                // Get Form Data
                const formData = new FormData(form);
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

                // 1. Get roles and referral_sources to map
                const [rolesResponse, referralsResponse] = await Promise.all([
                    window.supabaseClient.from('roles').select('id, code'),
                    window.supabaseClient.from('referral_sources').select('id, name')
                ]);

                if (rolesResponse.error) throw rolesResponse.error;

                const roleMap = {};
                rolesResponse.data.forEach(r => roleMap[r.code] = r.id);

                const referralMap = {};
                if (referralsResponse.data) {
                    referralsResponse.data.forEach(r => referralMap[r.name] = r.id);
                }

                const referralCodeToName = {
                    'teacher': '学校の先生',
                    'advisor': '部活動の顧問',
                    'friend': '友人・知人',
                    'poster': 'ポスター・チラシ',
                    'family': '家族',
                    'sns': 'SNS (Instagram/X)',
                    'other': 'その他'
                };

                const referralVal = formData.get('referral');
                const dbName = referralCodeToName[referralVal] || referralVal;
                let referralSourceId = referralMap[dbName] || null;

                const data = {
                    full_name: formData.get('name'),
                    full_kana: formData.get('name-kana'),
                    gender: genderMap[genderVal] || genderVal,
                    school_name: formData.get('school'),
                    grade: formattedGrade,
                    // Legacy columns support
                    desired_role_1: formData.get('role-1'),
                    desired_role_2: formData.get('role-2'),
                    desired_role_3: formData.get('role-3'),
                    referral_source: referralVal,
                    referral_source_id: referralSourceId,
                    referral_source_other: formData.get('referral-other'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    message: formData.get('message'),
                    status: '新規',
                };

                // 2. Insert into 'applicants' and get ID
                const { data: insertedApplicant, error: insertError } = await window.supabaseClient
                    .from('applicants')
                    .insert([data])
                    .select()
                    .single();

                if (insertError) throw insertError;

                const newApplicantId = insertedApplicant.id;

                // 3. Insert role preferences
                const preferences = [];
                const role1 = formData.get('role-1');
                const role2 = formData.get('role-2');
                const role3 = formData.get('role-3');

                if (role1 && roleMap[role1]) preferences.push({ applicant_id: newApplicantId, role_id: roleMap[role1], preference_rank: 1 });
                if (role2 && roleMap[role2]) preferences.push({ applicant_id: newApplicantId, role_id: roleMap[role2], preference_rank: 2 });
                if (role3 && roleMap[role3]) preferences.push({ applicant_id: newApplicantId, role_id: roleMap[role3], preference_rank: 3 });

                if (preferences.length > 0) {
                    const { error: prefError } = await window.supabaseClient
                        .from('applicant_role_preferences')
                        .insert(preferences);

                    if (prefError) console.error('Error inserting preferences:', prefError); // Non-fatal?
                }

                // 4. Send LINE Notify (via Edge Function)
                try {
                    const { error: notifyError } = await window.supabaseClient.functions.invoke('notify-applicant', {
                        body: {
                            record: insertedApplicant,
                            roles: [role1, role2, role3].filter(Boolean)
                        }
                    });
                    if (notifyError) console.error('LINE Notify Error:', notifyError);
                } catch (notifyErr) {
                    // Suppress error so user sees success message
                    console.warn('Failed to invoke notify function:', notifyErr);
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
