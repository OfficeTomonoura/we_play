/**
 * components.js - Production Mode
 * Core specific logic for admin UI
 */

// Debug Logger - Minimal for Production
window.debugLog = function (msg) {
    console.log('[Admin]', msg);
};

/**
 * Core Initialization
 */
window.initAdminUI = async () => {
    // 1. Render UI components immediately
    try {
        renderSidebar();
        renderHeaderProfile();
        injectProfileModal();
    } catch (e) {
        console.error('UI Render Error:', e);
    }

    // 2. Check Auth Status (Async)
    try {
        await checkAuthStatus();
    } catch (e) {
        console.error('Auth Check Error:', e);
    }

    if (window.lucide) window.lucide.createIcons();
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initAdminUI);
} else {
    window.initAdminUI();
}

// =============================================================================
// Authentication Logic
// =============================================================================

async function checkAuthStatus() {
    if (!window.supabaseClient) {
        console.error('CRITICAL: Supabase client missing!');
        return;
    }

    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (sessionError) console.error('Session Error:', sessionError.message);

    if (!session) {
        // Redirect check
        if (!window.location.pathname.includes('login.html')) {
            console.log('No session, redirecting to login...');
            window.location.href = 'login.html';
        }
        return;
    }

    // Check Member Status
    const { data: member, error } = await window.supabaseClient
        .from('members')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

    if (error) {
        console.error('Member Query Error:', error.message);
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
    } else {
        // Auth OK
    }
}

// =============================================================================
// UI Components
// =============================================================================

function renderSidebar() {
    const sidebarPlaceholder = document.getElementById('app-sidebar');
    if (!sidebarPlaceholder) return;

    // Mobile Menu Toggle logic (Ensure this runs!)
    ensureMobileToggle();

    // FULL Production Sidebar HTML
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

    // Set Active Link based on filename
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    // Handle index.html as dashboard (just in case)
    const effectivePage = (currentPage === 'index.html') ? 'dashboard.html' : currentPage;

    const links = document.querySelectorAll('.nav-item');
    links.forEach(l => {
        if (l.getAttribute('href') === effectivePage) l.classList.add('active');
    });

    if (window.lucide) window.lucide.createIcons();

    // Mobile Close Logic
    initMobileMenuClose();
}

function ensureMobileToggle() {
    // Remove existing if any to prevent duplicates/old versions
    const existing = document.querySelector('.mobile-menu-toggle');
    if (existing) existing.remove();

    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'mobile-menu-toggle';
    // Use clear inline style to ensure visibility, HIGH z-index
    toggleBtn.style.cssText = 'display:flex !important; position:fixed; top:15px; left:15px; z-index:2147483647; background:#0f0f13; border:1px solid #00f2ff; color:white; width:40px; height:40px; border-radius:8px; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.5);';
    toggleBtn.innerHTML = '<i data-lucide="menu" style="width:24px; height:24px;"></i>';

    document.body.appendChild(toggleBtn);

    const overlay = document.querySelector('.sidebar-overlay') || document.createElement('div');
    if (!overlay.parentNode) {
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    // Event Listeners
    // Event Listeners
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
}

function initMobileMenuClose() {
    document.querySelectorAll('.sidebar-nav a').forEach(function (link) {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 1024) {
                var overlay = document.querySelector('.sidebar-overlay');
                var sidebar = document.querySelector('.sidebar');
                if (overlay) overlay.classList.remove('visible');
                if (sidebar) sidebar.classList.remove('open');
            }
        });
    });
}

function renderHeaderProfile() {
    const profileContainer = document.querySelector('.user-profile');
    if (!profileContainer) return;

    // Potentially load real user info here later
    profileContainer.innerHTML = `
        <div class="avatar" style="cursor:pointer;" onclick="console.log('Profile clicked')">
            <i data-lucide="user"></i>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

function injectProfileModal() {
    // Placeholder for profile modal
}

window.showToast = function (message, type = 'info') {
    // Simple toast placeholder
    // console.log('Toast:', message);
};

window.handleLogout = async function () {
    if (!window.supabaseClient) return;
    await window.supabaseClient.auth.signOut();
    window.location.href = 'login.html';
};
