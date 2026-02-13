import '../../../styles/main.css';
import { createIcons, icons } from 'lucide';
import { authApi } from '../../../api/auth';
import { membersApi } from '../../../api/members';
import { masterApi } from '../../../api/master';

document.addEventListener('DOMContentLoaded', async () => {
    createIcons({ icons });

    // Load Master Data
    await loadMasterData();

    const session = await authApi.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Check if already registered
    const member = await membersApi.getByAuthId(session.user.id);

    if (member) {
        // Already registered, redirect to dashboard
        window.location.href = 'index.html';
    }

    initFormHandler();
});

async function loadMasterData() {
    try {
        const [orgs, positions, roles] = await Promise.all([
            masterApi.getOrganizations(),
            masterApi.getPositions(),
            masterApi.getProjectRoles()
        ]);

        populateSelect('organization', orgs || []);
        populateSelect('position', positions || []);
        populateSelect('projectRole', roles || []);

    } catch (err) {
        console.error('Master data load error:', err);
        alert('マスターデータの読み込みに失敗しました。');
    }
}

function populateSelect(id, items) {
    const select = document.getElementById(id);
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

function initFormHandler() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const errorMsg = document.getElementById('errorMsg');

        errorMsg.style.display = 'none';
        btn.disabled = true;
        btn.innerHTML = '<span>登録中...</span>';

        try {
            const session = await authApi.getSession();
            if (!session) throw new Error('セッションが切れました。再ログインしてください。');

            const formData = {
                auth_user_id: session.user.id,
                email: session.user.email,
                full_name: document.getElementById('fullName').value,
                full_kana: document.getElementById('fullKana').value,
                high_school: document.getElementById('highSchool').value,
                organization_id: document.getElementById('organization').value,
                position_id: document.getElementById('position').value,
                project_role_id: document.getElementById('projectRole').value,
                is_staff: true,
                can_approve_line: false
            };

            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;

            if (newPass !== confirmPass) {
                throw new Error('パスワードが一致しません。');
            }

            // 1. Create Profile
            await membersApi.create(formData);

            // 2. Update Auth Password
            await authApi.updateUser({ password: newPass });

            alert('登録が完了しました！');
            window.location.href = 'index.html';

        } catch (err) {
            console.error(err);
            errorMsg.textContent = err.message || '登録に失敗しました。';
            errorMsg.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<span>登録して開始</span><i data-lucide="arrow-right"></i>';
            createIcons({ icons });
        }
    });
}

window.handleLogout = async function () {
    await authApi.signOut();
    window.location.href = 'login.html';
};
