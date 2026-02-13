import '../../../styles/admin/index.js';
import { createIcons, icons } from 'lucide';
import { authApi } from '../../../api/auth';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';
import { MasterDataManager } from '../../../lib/admin/master-data';

document.addEventListener('DOMContentLoaded', () => {
    renderAdminLayout({
        pageTitle: 'システム設定',
        pageDescription: 'ユーザー登録および各種マスターデータの管理を行います。',
        content: getTemplateContent('page-template')
    });
    createIcons({ icons });

    // Initializations
    setTimeout(() => {
        initCsvImport();
        initIndividualRegister();
        initMasterManager();
    }, 300);
});

window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');

    const buttons = document.querySelectorAll('.tab-btn');
    if (tabId === 'user-registration') buttons[0]?.classList.add('active');
    if (tabId === 'master-data') buttons[1]?.classList.add('active');
};

function initMasterManager() {
    // MasterDataManager now internally uses masterApi
    const masterManager = new MasterDataManager('masterListContainer', 'masterModal');
    window.masterManager = masterManager;
    masterManager.loadTable('master_organization');

    const navItems = document.querySelectorAll('.master-nav-item');
    const titleEl = document.getElementById('masterDisplayName');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const tableName = item.getAttribute('data-table');
            const displayName = item.textContent.trim();
            if (titleEl) titleEl.innerHTML = `<i data-lucide="database"></i> ${displayName}設定`;
            masterManager.loadTable(tableName);
            createIcons({ icons });
        });
    });
}

function initIndividualRegister() {
    const form = document.getElementById('individualForm');
    if (!form) return;
    const logConsole = document.getElementById('indLog');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('ind_email')?.value;
        const password = document.getElementById('ind_password')?.value;
        const name = document.getElementById('ind_name')?.value;
        const btn = form.querySelector('button');

        if (password && password.length < 6) { alert('パスワードは6文字以上で入力してください。'); return; }
        if (!confirm(`${email} を登録しますか？`)) return;

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i></i> 処理中...';
        }

        if (logConsole) {
            logConsole.style.display = 'block';
            logConsole.innerHTML = '';
        }

        try {
            const data = await authApi.invokeFunction('import-users', { body: { users: [{ email, password, full_name: name }] } });

            if (data && data.error) { logResult('エラー: ' + data.error, false); }
            else if (data && data.results) {
                const res = data.results[0];
                if (res.error) logResult(`失敗: ${res.error}`, false);
                else { logResult(`成功: ${res.email}`, true); form.reset(); }
            }
        } catch (err) { logResult('通信エラー: ' + err.message, false); }
        finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="plus"></i> 登録';
            }
            createIcons({ icons });
        }
    });

    function logResult(msg, isSuccess) {
        if (!logConsole) return;
        const div = document.createElement('div');
        div.className = `log-entry ${isSuccess ? 'success' : 'error'}`;
        div.textContent = msg;
        logConsole.appendChild(div);
    }
}

function initCsvImport() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    const fileInput = document.getElementById('csvFile');
    const previewSection = document.getElementById('csvPreview');
    const executeBtn = document.getElementById('executeImportBtn');
    let parsedData = [];

    dropZone.addEventListener('click', () => fileInput?.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer) handleFiles(e.dataTransfer.files); });

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files) handleFiles(e.target.files);
        });
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target) parseCSV(e.target.result);
        };
        reader.readAsText(file);
    }

    function parseCSV(text) {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return;
        const headers = lines[0].split(',').map(h => h.trim());
        if (!headers.includes('email') || !headers.includes('password')) { alert('CSVヘッダーエラー'); return; }

        parsedData = [];
        const previewBody = document.getElementById('previewBody');
        if (previewBody) previewBody.innerHTML = '';

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            const row = {}; headers.forEach((h, idx) => row[h] = cols[idx]);
            parsedData.push(row);
            if (i <= 5 && previewBody) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${row.email || ''}</td><td>********</td><td>${row.full_name || ''}</td>`;
                previewBody.appendChild(tr);
            }
        }
        const totalCountEl = document.getElementById('totalCount');
        if (totalCountEl) totalCountEl.textContent = parsedData.length;
        if (previewSection) previewSection.style.display = 'block';
    }

    if (executeBtn) {
        executeBtn.addEventListener('click', async () => {
            if (parsedData.length === 0) return;
            if (!confirm(`${parsedData.length} 件の一括登録を実行しますか？`)) return;
            const logConsole = document.getElementById('importLog');
            if (logConsole) {
                logConsole.style.display = 'block';
                logConsole.innerHTML = '<div>処理中...</div>';
            }
            executeBtn.disabled = true;
            try {
                const data = await authApi.invokeFunction('import-users', { body: { users: parsedData } });

                if (data && data.results) {
                    data.results.forEach(r => { if (r.error) logMsg(`${r.email}: 失敗 - ${r.error}`, false); else logMsg(`${r.email}: 成功`, true); });
                }
            } catch (err) { logMsg(`通信エラー: ${err.message}`, false); }
            finally { executeBtn.disabled = false; }
        });
    }

    function logMsg(msg, isSuccess) {
        const logConsole = document.getElementById('importLog');
        if (!logConsole) return;
        const div = document.createElement('div');
        div.className = `log-entry ${isSuccess ? 'success' : 'error'}`;
        div.textContent = msg;
        logConsole.appendChild(div);
    }
}
