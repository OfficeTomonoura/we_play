import { createIcons, icons } from 'lucide';
import { authApi } from '../../../api/auth';
import { membersApi } from '../../../api/members';

document.addEventListener('DOMContentLoaded', () => {
    createIcons({ icons });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            const errorMsg = document.getElementById('loginError');
            const submitBtn = e.target.querySelector('button[type="submit"]');

            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span>認証中...</span>';
                }

                const data = await authApi.signInWithPassword(email, password);

                // data.session.user.id is available
                if (!data || !data.session) throw new Error('認証に失敗しました。');

                const member = await membersApi.getByAuthId(data.session.user.id);

                if (!member || !member.line_user_id) {
                    window.location.href = 'line_link.html';
                } else if (!member.is_registered) {
                    window.location.href = 'member_registration.html';
                } else {
                    window.location.href = 'dashboard.html';
                }

            } catch (err) {
                console.error('Login error:', err);
                if (errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.textContent = 'メールアドレスまたはパスワードが正しくありません。';
                    errorMsg.style.animation = 'none';
                    void errorMsg.offsetHeight; // trigger reflow
                    errorMsg.style.animation = 'shake 0.5s ease-in-out';
                }

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>ログイン</span><i data-lucide="log-in"></i>';
                    createIcons({ icons });
                }
            }
        });
    }
});
