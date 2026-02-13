import '../../../styles/main.css';
import { createIcons, icons } from 'lucide';
import { authApi } from '../../../api/auth';
import { membersApi } from '../../../api/members';
import { masterApi } from '../../../api/master';

document.addEventListener('DOMContentLoaded', async () => {
    createIcons({ icons });

    const session = await authApi.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const emailField = document.getElementById('email');
    if (emailField) emailField.value = session.user.email;

    try {
        const [orgs, positions] = await Promise.all([
            masterApi.getOrganizations(),
            masterApi.getPositions()
        ]);

        populateSelect('organization', orgs || []);
        populateSelect('position', positions || []);

    } catch (err) {
        console.error('Master load error:', err);
        alert('マスターデータの読み込みに失敗しました。');
    }

    const form = document.getElementById('memberForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const errorMsg = document.getElementById('errorMsg');

            if (errorMsg) errorMsg.style.display = 'none';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span>登録中...</span>';
            }

            try {
                const currentSession = await authApi.getSession();
                if (!currentSession) throw new Error('セッションが切れました。再ログインしてください。');

                const newPass = document.getElementById('newPassword')?.value;
                const confirmPass = document.getElementById('confirmPassword')?.value;

                if (newPass !== confirmPass) {
                    throw new Error('パスワードが一致しません。');
                }

                const formData = {
                    auth_user_id: currentSession.user.id,
                    email: currentSession.user.email,
                    full_name: document.getElementById('fullName')?.value,
                    full_kana: document.getElementById('fullKana')?.value,
                    high_school: document.getElementById('highSchool')?.value,
                    organization_id: document.getElementById('organization')?.value,
                    position_id: document.getElementById('position')?.value,
                    is_staff: true,
                    is_registered: true,
                    updated_at: new Date()
                };

                // Update using membersApi with member ID if known, but here we likely only have auth_id or need to query first.
                // However, we can use the 'members' table directly with auth_user_id unique constraint if we knew the ID.
                // Or better, fetch the member first to get ID.
                const existingMember = await membersApi.getByAuthId(currentSession.user.id);
                if (existingMember) {
                    await membersApi.update(existingMember.id, formData);
                } else {
                    // Should not happen if upserted in line_link, but handle just in case
                    await membersApi.create(formData);
                }

                // Update password
                await authApi.updateUser({ password: newPass });

                // Verify update
                const verifyMember = await membersApi.getByAuthId(currentSession.user.id);
                if (!verifyMember || verifyMember.is_registered !== true) {
                    throw new Error('登録情報の更新がデータベースに反映されませんでした。もう一度お試しください。');
                }

                alert('登録が完了しました！ダッシュボードへ移動します。');
                window.location.href = 'index.html?t=' + new Date().getTime();

            } catch (err) {
                console.error(err);
                if (errorMsg) {
                    errorMsg.textContent = err.message || '登録に失敗しました。';
                    errorMsg.style.display = 'block';
                }
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<span>登録して開始</span><i data-lucide="arrow-right"></i>';
                }
                createIcons({ icons });
            }
        });
    }
});

function populateSelect(elementId, items) {
    const select = document.getElementById(elementId);
    if (!select) return;
    select.innerHTML = '<option value="" style="color: black;">選択してください</option>';
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = item.name;
        opt.style.color = 'black';
        select.appendChild(opt);
    });
}
