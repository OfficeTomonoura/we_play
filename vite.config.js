/* eslint-env node */
import { resolve } from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
    root: 'site',
    publicDir: '../public',

    resolve: {
        alias: {
            '/src': resolve(__dirname, 'src'),
        },
    },

    plugins: [
        {
            name: 'dev-preview-middleware',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    const url = new URL(req.url, 'http://localhost');
                    let pathname = url.pathname;

                    // Capture all /dev requests
                    if (pathname === '/dev' || pathname.startsWith('/dev/')) {
                        // Use resolve(__dirname) to stay relative to this config file (project root)
                        const projectRoot = resolve(__dirname);

                        // Default to preview.html for /dev or /dev/
                        if (pathname === '/dev' || pathname === '/dev/') {
                            pathname = '/dev/preview.html';
                        }

                        const relativePath = pathname.slice(1); // e.g., "dev/preview.html"
                        const filePath = path.join(projectRoot, relativePath);

                        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                            const content = fs.readFileSync(filePath);
                            const ext = path.extname(filePath);
                            const contentType = ext === '.html' ? 'text/html; charset=utf-8' : 'application/octet-stream';

                            res.statusCode = 200;
                            res.setHeader('Content-Type', contentType);
                            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                            res.setHeader('Pragma', 'no-cache');
                            res.setHeader('Expires', '0');
                            res.end(content);
                            return; // Terminates request, no next() call
                        } else {
                            // Block any further Vite processing for /dev/* to prevent SPA fallback to index.html
                            res.statusCode = 404;
                            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                            res.end('Dev preview asset not found: ' + pathname + ' (checked path: ' + filePath + ')');
                            return; // Terminates request, no next() call
                        }
                    }

                    next();
                });
            },
        },
    ],

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