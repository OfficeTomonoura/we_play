import { createIcons, icons } from 'lucide';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

document.addEventListener('DOMContentLoaded', () => {
    renderAdminLayout({
        pageTitle: 'LINE連携・LIFF実装マニュアル',
        pageDescription: '応募フォームとLINEアカウントを連携し、LINE User IDを取得するための実装ガイドです。',
        content: getTemplateContent('page-template'),
        activeNav: 'database.html'
    });

    createIcons({ icons });
});
