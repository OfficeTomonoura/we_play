import { createIcons, icons } from 'lucide';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

document.addEventListener('DOMContentLoaded', () => {
    renderAdminLayout({
        pageTitle: 'LINE通知機能設定マニュアル',
        pageDescription: '応募フォームから新しい応募があった際に、指定したLINEグループへ自動的に通知を送る機能のセットアップ手順です。',
        content: getTemplateContent('page-template'),
        activeNav: 'database.html'
    });

    createIcons({ icons });
});
