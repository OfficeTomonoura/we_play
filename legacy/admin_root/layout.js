/**
 * layout.js - Admin UI Layout Engine
 * Orchestrates the common sidebar and header structure across all admin pages.
 */

window.renderAdminLayout = (options = {}) => {
    const {
        title = 'We Play 管理システム',
        pageTitle = '',
        pageDescription = '',
        content = '',
        activeMenu = null // For explicit active menu setting if needed
    } = options;

    // Set Document Title
    if (pageTitle) {
        document.title = `${pageTitle} | ${title}`;
    } else {
        document.title = title;
    }

    const appRoot = document.getElementById('app');
    if (!appRoot) {
        console.warn('Layout Warning: #app element not found. Attempting to use document.body.');
        // If no #app, we might be in a legacy page. We'll skip for now or handle gracefully.
        return;
    }

    // Build the shell
    // Note: We use the same classes (dashboard-container, main-content, etc.) 
    // to ensure existing admin.css works perfectly.
    appRoot.innerHTML = `
    <div class="dashboard-container">
        <!-- Sidebar placeholder -->
        <div id="app-sidebar"></div>
        
        <!-- Main Content Area -->
        <main class="main-content">
            <header class="top-header">
                <div class="header-title" style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 3px; height: 18px; background: var(--primary); border-radius: 2px;"></div>
                    <h1 style="font-size: 1.1rem; font-weight: 800; color: #fff; letter-spacing: 0.5px;">
                        We Play 未来人財育成委員会 事業ポータル
                    </h1>
                </div>
                <div class="user-profile">
                    <!-- Dynamic Profile Rendered by components.js -->
                </div>
            </header>

            <div class="content-wrapper">
                ${pageTitle ? `
                <div class="welcome-banner">
                    <h1>${pageTitle}</h1>
                    ${pageDescription ? `<p>${pageDescription}</p>` : ''}
                </div>
                ` : ''}
                
                <div id="page-content">
                    ${content}
                </div>
            </div>
        </main>
    </div>
    `;

    // Re-initialize UI components (sidebar, header profile, auth check, lucide icons)
    // These functions are defined in admin/components.js
    if (window.initAdminUI) {
        window.initAdminUI();
    } else {
        console.error('Layout Error: window.initAdminUI not found. Ensure components.js is loaded.');
    }
};

// Helper to extract content from a hidden template or element
window.getTemplateContent = (id) => {
    const el = document.getElementById(id);
    if (!el) return '';
    const content = el.innerHTML;
    el.remove(); // Clean up
    return content;
};
