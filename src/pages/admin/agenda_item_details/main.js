import { createIcons, icons } from 'lucide';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

document.addEventListener('DOMContentLoaded', () => {
    renderAdminLayout({
        pageTitle: '議案詳細',
        pageDescription: '事業ポータルにおける各議案の詳細内容・履歴を確認します。',
        content: getTemplateContent('page-template'),
        activeNav: 'meetings.html'
    });

    createIcons({ icons });

    // Custom Breadcrumb Injection
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'header-breadcrumb';
        breadcrumb.style.cssText = 'display: flex; align-items: center; gap: 1rem; color: var(--text-dim); font-size: 0.9rem; margin-left: 1rem; border-left: 1px solid var(--glass-border); padding-left: 1.5rem;';
        breadcrumb.innerHTML = `
            <a href="meeting-details.html" style="color: var(--text-dim); text-decoration: none;">第01回理事会</a>
            <i data-lucide="chevron-right" style="width: 14px;"></i>
            <span style="color: var(--text-main);">議案詳細</span>
        `;
        headerTitle.after(breadcrumb);
        createIcons({ icons });
    }
});
