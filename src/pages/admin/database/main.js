import '../../../styles/admin/index.js';
import { createIcons, icons } from 'lucide';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

document.addEventListener('DOMContentLoaded', () => {
    renderAdminLayout({
        pageTitle: 'データベース設計',
        pageDescription: 'システムで使用されている主要なテーブル定義とリレーションの一覧です。',
        content: getTemplateContent('page-template'),
        activeNav: 'database.html'
    });

    createIcons({ icons });
});
