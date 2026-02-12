import { initAdminUI } from './components.js';

export const renderAdminLayout = (options = {}) => {
    const {
        title = 'We Play 管理システム',
        pageTitle = '',
        pageDescription = '',
        content = '',
    } = options;

    if (pageTitle) {
        document.title = `${pageTitle} | ${title}`;
    } else {
        document.title = title;
    }

    const appRoot = document.getElementById('app');
    if (!appRoot) {
        console.warn('Layout Warning: #app element not found.');
        return;
    }

    appRoot.innerHTML = `
    <div class="dashboard-container">
        <div id="app-sidebar"></div>
        
        <main class="main-content">
            <header class="top-header">
                <div class="header-title" style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 3px; height: 18px; background: var(--primary); border-radius: 2px;"></div>
                    <h1 style="font-size: 1.1rem; font-weight: 800; color: #fff; letter-spacing: 0.5px;">
                        We Play 未来人財育成委員会 事業ポータル
                    </h1>
                </div>
                <div class="user-profile"></div>
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

    initAdminUI();
};

export const getTemplateContent = (id) => {
    const el = document.getElementById(id);
    if (!el) return '';
    const content = el.innerHTML;
    el.remove();
    return content;
};
