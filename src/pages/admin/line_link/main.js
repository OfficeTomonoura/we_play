import { createIcons, icons } from 'lucide';
import liff from '@line/liff';
import { authApi } from '../../../api/auth';
import { membersApi } from '../../../api/members';

const LIFF_ID = "2009015373-QGkjtgDJ";

document.addEventListener('DOMContentLoaded', async () => {
    createIcons({ icons });

    const session = await authApi.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    try {
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
            await processLineLink();
        }
    } catch (err) {
        console.error('LIFF Init failed:', err);
        alert('LIFFの初期化に失敗しました。');
    }

    const linkBtn = document.getElementById('linkBtn');
    if (linkBtn) {
        linkBtn.addEventListener('click', async () => {
            if (!liff.isLoggedIn()) {
                liff.login({ redirectUri: window.location.href });
                return;
            }
            await processLineLink();
        });
    }
});

async function processLineLink() {
    const btn = document.getElementById('linkBtn');
    const loadingArea = document.getElementById('loadingArea');
    const actionArea = document.getElementById('actionArea');

    if (actionArea) actionArea.style.display = 'none';
    if (loadingArea) {
        loadingArea.style.display = 'block';
        loadingArea.innerHTML = '<p>LINEアカウントを確認中...</p>';
    }
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '処理中...';
    }

    try {
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;

        const session = await authApi.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        const data = await membersApi.upsert({
            auth_user_id: session.user.id,
            email: session.user.email,
            line_user_id: lineUserId,
        }, 'auth_user_id');

        if (loadingArea) loadingArea.innerHTML = '<p>連携成功！移動します...</p>';
        setTimeout(() => {
            window.location.href = 'member_registration.html';
        }, 1000);

    } catch (err) {
        console.error('Link Error:', err);
        alert('連携処理に失敗しました: ' + err.message);
        if (actionArea) actionArea.style.display = 'block';
        if (loadingArea) loadingArea.style.display = 'none';
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'LINEアカウントと連携する';
        }
    }
}

window.handleLogout = async () => {
    if (liff.isLoggedIn()) liff.logout();
    await authApi.signOut();
    window.location.href = 'login.html';
};
