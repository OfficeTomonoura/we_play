/* eslint-env node */
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    root: 'site',
    publicDir: '../public',
    resolve: {
        alias: {
            '/src': resolve(__dirname, 'src'),
        },
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'site/index.html'),
                register: resolve(__dirname, 'site/register.html'),
                admin_dashboard: resolve(__dirname, 'site/admin/dashboard.html'),
                admin_applicants: resolve(__dirname, 'site/admin/applicants.html'),
                admin_members: resolve(__dirname, 'site/admin/members.html'),
                admin_meetings: resolve(__dirname, 'site/admin/meetings.html'),
                admin_meeting_details: resolve(__dirname, 'site/admin/meeting-details.html'),
                admin_agenda_item_details: resolve(__dirname, 'site/admin/agenda-item-details.html'),
                admin_login: resolve(__dirname, 'site/admin/login.html'),
                admin_first_login: resolve(__dirname, 'site/admin/first_login.html'),
                admin_analysis: resolve(__dirname, 'site/admin/analysis.html'),
                admin_line_link: resolve(__dirname, 'site/admin/line_link.html'),
                admin_line: resolve(__dirname, 'site/admin/line.html'),
                admin_manual_liff: resolve(__dirname, 'site/admin/manual_liff.html'),
                admin_manual_notify: resolve(__dirname, 'site/admin/manual_notify.html'),
                admin_member_registration: resolve(__dirname, 'site/admin/member_registration.html'),
                admin_collaborators: resolve(__dirname, 'site/admin/collaborators.html'),
                admin_selected: resolve(__dirname, 'site/admin/selected.html'),
                admin_selected_detail: resolve(__dirname, 'site/admin/selected_detail.html'),
                admin_settings: resolve(__dirname, 'site/admin/settings.html'),
                admin_database: resolve(__dirname, 'site/admin/database.html'),
            },
        },
    },
});
