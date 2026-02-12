/* eslint-env node */
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                register: resolve(__dirname, 'register.html'),
                admin_dashboard: resolve(__dirname, 'admin/dashboard.html'),
                admin_applicants: resolve(__dirname, 'admin/applicants.html'),
                admin_members: resolve(__dirname, 'admin/members.html'),
                admin_meetings: resolve(__dirname, 'admin/meetings.html'),
                admin_meeting_details: resolve(__dirname, 'admin/meeting-details.html'),
                admin_agenda_item_details: resolve(__dirname, 'admin/agenda-item-details.html'),
                admin_login: resolve(__dirname, 'admin/login.html'),
                admin_first_login: resolve(__dirname, 'admin/first_login.html'),
                admin_analysis: resolve(__dirname, 'admin/analysis.html'),
                admin_line_link: resolve(__dirname, 'admin/line_link.html'),
                admin_line: resolve(__dirname, 'admin/line.html'),
                admin_manual_liff: resolve(__dirname, 'admin/manual_liff.html'),
                admin_manual_notify: resolve(__dirname, 'admin/manual_notify.html'),
                admin_member_registration: resolve(__dirname, 'admin/member_registration.html'),
                admin_collaborators: resolve(__dirname, 'admin/collaborators.html'),
                admin_selected: resolve(__dirname, 'admin/selected.html'),
                admin_selected_detail: resolve(__dirname, 'admin/selected_detail.html'),
                admin_settings: resolve(__dirname, 'admin/settings.html'),
                admin_database: resolve(__dirname, 'admin/database.html'),
            },
        },
    },
});
