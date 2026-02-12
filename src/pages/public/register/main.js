import { createIcons, icons } from 'lucide';
import liff from '@line/liff';
import { applicantsApi } from '../../../api/applicants';
import { masterApi } from '../../../api/master';
import { authApi } from '../../../api/auth';

document.addEventListener('DOMContentLoaded', async () => {
    createIcons({ icons });

    const liffId = "2009015373-QGkjtgDJ";
    try {
        await liff.init({ liffId: liffId });

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';

        if (liff.isLoggedIn()) {
            await setLiffData();
            await loadMasterData();
        } else if (!isLocal) {
            liff.login();
        } else {
            await loadMasterData();
        }
    } catch (err) {
        console.warn('LIFF Initialization failed:', err);
        if (window.location.hostname === 'localhost') {
            await loadMasterData();
        }
    }

    initFormLogic();
});

async function loadMasterData() {
    try {
        // Load Schools
        const schools = await masterApi.getSchools();

        if (schools) {
            const schoolSelect = document.getElementById('school');
            if (schoolSelect) {
                let html = '<option value="" disabled selected>選択してください</option>';
                schools.forEach(s => {
                    html += `<option value="${s.id}">${s.name}</option>`;
                });
                schoolSelect.innerHTML = html;
            }
        }

        // Load Roles
        const roles = await masterApi.getRoles();

        if (roles) {
            const roleSelects = document.querySelectorAll('.role-select');
            roleSelects.forEach(select => {
                let html = '<option value="" disabled selected>選択してください</option>';
                roles.forEach(role => {
                    html += `<option value="${role.id}">${role.name}</option>`;
                });
                select.innerHTML = html;
            });

            const updateRoleOptions = () => {
                const selectedValues = Array.from(roleSelects).map(s => s.value).filter(v => v);
                roleSelects.forEach(select => {
                    const currentValue = select.value;
                    Array.from(select.options).forEach(option => {
                        if (!option.value) return;
                        option.disabled = selectedValues.includes(option.value) && option.value !== currentValue;
                    });
                });
            };

            roleSelects.forEach(select => {
                select.addEventListener('change', updateRoleOptions);
            });
        }

        // Load Referral Sources
        const referrals = await masterApi.getReferralSources();

        if (referrals) {
            const refSelect = document.getElementById('referral');
            if (refSelect) {
                let html = '<option value="" disabled selected>選択してください</option>';
                referrals.forEach(ref => {
                    html += `<option value="${ref.id}" data-name="${ref.name}">${ref.name}</option>`;
                });
                refSelect.innerHTML = html;

                refSelect.addEventListener('change', () => {
                    const selectedOption = refSelect.options[refSelect.selectedIndex];
                    const referralOtherGroup = document.getElementById('referral-other-group');
                    const referralOtherInput = document.getElementById('referral-other');
                    const referralOtherBadge = document.getElementById('referral-other-badge');

                    if (selectedOption && selectedOption.getAttribute('data-name') === 'その他') {
                        if (referralOtherGroup) referralOtherGroup.style.display = 'block';
                        if (referralOtherInput) referralOtherInput.required = true;
                        if (referralOtherBadge) referralOtherBadge.style.display = 'inline-block';
                    } else {
                        if (referralOtherGroup) referralOtherGroup.style.display = 'none';
                        if (referralOtherInput) {
                            referralOtherInput.required = false;
                            referralOtherInput.value = '';
                        }
                        if (referralOtherBadge) referralOtherBadge.style.display = 'none';
                    }
                });
            }
        }
    } catch (err) {
        console.error('Failed to load master data:', err);
        alert('マスタデータの読み込みに失敗しました。');
    }
}

async function setLiffData() {
    try {
        const profile = await liff.getProfile();
        const userIdField = document.getElementById('line_user_id');
        const nameField = document.getElementById('line_display_name');
        const picField = document.getElementById('line_picture_url');

        if (userIdField) userIdField.value = profile.userId;
        if (nameField) nameField.value = profile.displayName;
        if (picField) picField.value = profile.pictureUrl;

        await checkRedirect(profile.userId);
    } catch (err) {
        console.error('Error getting profile:', err);
    }
}

async function checkRedirect(userId) {
    try {
        const data = await applicantsApi.getByLineUserId(userId);

        if (data) {
            window.location.href = 'index.html';
        }
    } catch (e) {
        console.warn('Check redirect failed', e);
    }
}

function initFormLogic() {
    const form = document.getElementById('registrationForm');
    const successMessage = document.getElementById('successMessage');
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        let isComposing = false;

        input.addEventListener('compositionstart', () => { isComposing = true; });
        input.addEventListener('compositionend', () => {
            isComposing = false;
            if (input.id === 'name-kana') {
                input.value = input.value.replace(/[^ぁ-んー\s]/g, '');
            }
        });

        if (input.id === 'name-kana') {
            input.addEventListener('input', () => {
                if (isComposing) return;
                input.value = input.value.replace(/[^ぁ-んー\s]/g, '');
            });
        }

        if (input.id === 'phone') {
            input.addEventListener('input', () => {
                if (isComposing) return;
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;

        form.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select, textarea').forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                if (input.id === 'referral-other' && input.offsetParent === null) return;
                isValid = false;
                showError(input);
            } else {
                removeError(input);
            }
        });

        const genderRadios = form.querySelectorAll('input[name="gender"]');
        let genderChecked = Array.from(genderRadios).some(r => r.checked);
        if (!genderChecked) {
            isValid = false;
            const container = genderRadios[0].closest('.radio-cloud');
            if (container) container.style.border = '1px solid #ff4b4b';
        } else {
            const container = genderRadios[0].closest('.radio-cloud');
            if (container) container.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        }

        const privacyCheckbox = form.querySelector('input[name="privacy"]');
        if (!privacyCheckbox || !privacyCheckbox.checked) {
            isValid = false;
            const label = privacyCheckbox.closest('.custom-checkbox');
            if (label) label.style.color = '#ff4b4b';
        } else {
            const label = privacyCheckbox.closest('.custom-checkbox');
            if (label) label.style.color = '#ddd';
        }

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
                const formData = new FormData(form);
                const gradeVal = formData.get('grade');
                const formattedGrade = gradeVal && !gradeVal.includes('年生') ? gradeVal + '年生' : gradeVal;

                const genderMap = { 'male': '男', 'female': '女', 'other': '選択しない' };
                const genderVal = formData.get('gender');

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
                    phone: formData.get('phone'),
                    message: formData.get('message'),
                    status: '新規',
                    line_user_id: formData.get('line_user_id') || null,
                };

                const insertedApplicant = await applicantsApi.create(data);

                try {
                    // Send Notification using Edge Function
                    await authApi.invokeFunction('notify-applicant', {
                        body: {
                            record: insertedApplicant,
                            roles: [insertedApplicant.r1?.name, insertedApplicant.r2?.name, insertedApplicant.r3?.name].filter(Boolean),
                            referral: insertedApplicant.ref?.name
                        }
                    });
                } catch (notifyErr) {
                    console.warn('Notification failed, but registration succeeded:', notifyErr);
                }

                successMessage.style.display = 'flex';
            } catch (err) {
                console.error('Error submitting form:', err);
                alert('送信に失敗しました: ' + (err.message || '不明なエラー'));
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
                submitBtn.style.opacity = '1';
            }
        }
    });

    function showError(input) {
        input.style.borderColor = '#ff4b4b';
        const wrapper = input.parentElement.closest('.glow-input');
        if (wrapper) {
            wrapper.classList.add('shake');
            setTimeout(() => wrapper.classList.remove('shake'), 500);
        } else {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
        }
    }

    function removeError(input) {
        input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    }
}

// Global reference for close button
window.reloadPage = () => location.reload();

// CSS insertion
const style = document.createElement('style');
style.textContent = `
.spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite; margin-left:10px; }
@keyframes spin { to { transform: rotate(360deg); } }
.shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
`;
document.head.appendChild(style);
