import { createIcons, icons } from 'lucide';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

document.addEventListener('DOMContentLoaded', () => {
    renderAdminLayout({
        pageTitle: '会議詳細',
        pageDescription: '理事会・委員会における各議案の状態と担当情報を一覧で確認します。',
        content: getTemplateContent('page-template'),
        activeNav: 'meetings.html'
    });

    createIcons({ icons });

    // Custom Breadcrumb Injection
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'header-breadcrumb';
        breadcrumb.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; color: var(--text-dim); font-size: 0.9rem; margin-left: 1rem; border-left: 1px solid var(--glass-border); padding-left: 1.5rem;';
        breadcrumb.innerHTML = `
            <span>議案</span>
            <i data-lucide="chevron-right" style="width: 14px;"></i>
            <span>理事会</span>
            <i data-lucide="chevron-right" style="width: 14px;"></i>
            <span style="color: var(--text-main);">第01回理事会</span>
        `;
        headerTitle.after(breadcrumb);
        createIcons({ icons });
    }
});
