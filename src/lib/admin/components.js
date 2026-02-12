import { createIcons, icons } from 'lucide';
import { authApi } from '../../api/auth';
import { membersApi } from '../../api/members';

export const debugLog = (msg) => {
    console.log('[Admin]', msg);
};

export const handleLogout = async () => {
    await authApi.signOut();
    window.location.href = 'login.html';
};

// Make it global for onclick handlers in HTML
window.handleLogout = handleLogout;

export const checkAuthStatus = async () => {
    try {
        const session = await authApi.getSession();

        if (!session) {
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
            return;
        }

        // メンバー情報チェック
        // membersApi を使用してメンバー情報を取得
        const member = await membersApi.getByAuthId(session.user.id);

        // エラーハンドリングは membersApi 内で行われるが、member が null の場合の処理
        if (member === undefined) {
            // エラーが発生した場合（undefinedが返る）
            // console.error は utils.js で行われている
            return;
        }

        const currentPath = window.location.pathname;

        if (!member || !member.line_user_id) {
            if (!currentPath.includes('line_link.html')) {
                window.location.href = 'line_link.html';
            }
        } else if (!member.is_registered) {
            if (!currentPath.includes('member_registration.html')) {
                window.location.href = 'member_registration.html';
            }
        }
    } catch (e) {
        console.error('Auth Check Error:', e);
    }
};

export const renderHeaderProfile = () => {
    const profileContainer = document.querySelector('.user-profile');
    if (!profileContainer) return;

    profileContainer.innerHTML = `
        <div class="avatar" style="cursor:pointer;" onclick="console.log('Profile clicked')">
            <i data-lucide="user"></i>
        </div>
    `;
    createIcons({ icons });
};

export const ensureMobileToggle = () => {
    const existing = document.querySelector('.mobile-menu-toggle');
    if (existing) existing.remove();

    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.style.cssText = 'display:flex !important; position:fixed; top:15px; left:15px; z-index:2147483647; background:#0f0f13; border:1px solid #00f2ff; color:white; width:40px; height:40px; border-radius:8px; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.5);';
    toggleBtn.innerHTML = '<i data-lucide="menu" style="width:24px; height:24px;"></i>';

    document.body.appendChild(toggleBtn);

    const overlay = document.querySelector('.sidebar-overlay') || document.createElement('div');
    if (!overlay.parentNode) {
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    toggleBtn.addEventListener('click', () => {
        const s = document.querySelector('.sidebar');
        if (s) {
            s.classList.toggle('open');
            if (s.classList.contains('open')) {
                overlay.classList.add('visible');
            } else {
                overlay.classList.remove('visible');
            }
        }
    });

    overlay.addEventListener('click', () => {
        const s = document.querySelector('.sidebar');
        if (s) {
            s.classList.remove('open');
        }
        overlay.classList.remove('visible');
    });
};

export const initMobileMenuClose = () => {
    document.querySelectorAll('.sidebar-nav a').forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                const overlay = document.querySelector('.sidebar-overlay');
                const sidebar = document.querySelector('.sidebar');
                if (overlay) overlay.classList.remove('visible');
                if (sidebar) sidebar.classList.remove('open');
            }
        });
    });
};

export const renderSidebar = () => {
    const sidebarPlaceholder = document.getElementById('app-sidebar');
    if (!sidebarPlaceholder) return;

    ensureMobileToggle();

    const sidebarHTML = `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                     <span class="logo-text">WE PLAY ADMIN</span>
                </div>
            </div>
            <nav class="sidebar-nav">
                <div class="nav-section">メイン</div>
                <a href="dashboard.html" class="nav-item"><i data-lucide="layout-dashboard"></i> <span>ダッシュボード</span></a>
                <a href="applicants.html" class="nav-item"><i data-lucide="users"></i> <span>応募者一覧</span></a>
                <a href="selected.html" class="nav-item"><i data-lucide="user-check"></i> <span>選抜者管理</span></a>
                
                <div class="nav-section">管理</div>
                <a href="members.html" class="nav-item"><i data-lucide="contact"></i> <span>会員リスト</span></a>
                <a href="collaborators.html" class="nav-item"><i data-lucide="briefcase"></i> <span>協力者リスト</span></a>
                <a href="analysis.html" class="nav-item"><i data-lucide="bar-chart-2"></i> <span>分析・統計</span></a>
                
                <div class="nav-section">業務・運用</div>
                <a href="line.html" class="nav-item"><i data-lucide="message-circle"></i> <span>LINE公式運用</span></a>
                <a href="meetings.html" class="nav-item"><i data-lucide="file-text"></i> <span>議案・資料</span></a>

                <div class="nav-section">システム</div>
                <a href="manual_liff.html" class="nav-item"><i data-lucide="book-open"></i> <span>マニュアル</span></a>
                <a href="settings.html" class="nav-item"><i data-lucide="settings"></i> <span>設定</span></a>
            </nav>
            <div class="sidebar-footer">
                <button class="logout-btn" onclick="handleLogout()">
                    <i data-lucide="log-out"></i> <span>ログアウト</span>
                </button>
            </div>
        </aside>
    `;

    sidebarPlaceholder.outerHTML = sidebarHTML;

    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const effectivePage = (currentPage === 'index.html') ? 'dashboard.html' : currentPage;

    const links = document.querySelectorAll('.nav-item');
    links.forEach(l => {
        if (l.getAttribute('href') === effectivePage) l.classList.add('active');
    });

    createIcons({ icons });
    initMobileMenuClose();
};

export const initAdminUI = async () => {
    try {
        renderSidebar();
        renderHeaderProfile();
    } catch (e) {
        console.error('UI Render Error:', e);
    }

    try {
        await checkAuthStatus();
    } catch (e) {
        console.error('Auth Check Error:', e);
    }

    createIcons({ icons });
};
