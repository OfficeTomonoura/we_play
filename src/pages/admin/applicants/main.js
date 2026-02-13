import '../../../styles/admin/index.js';
import { createIcons, icons } from 'lucide';
import { applicantsApi } from '../../../api/applicants';
import { masterApi } from '../../../api/master';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

let allApplicants = [];
let currentPage = 1;
let itemsPerPage = 20;
let totalCount = 0;
let currentApplicantId = null;

document.addEventListener('DOMContentLoaded', async () => {
    renderAdminLayout({
        pageTitle: '応募者一覧',
        pageDescription: '全応募者の情報をリスト形式で確認できます。行をクリックすると詳細を表示します。',
        content: getTemplateContent('page-template')
    });

    createIcons({ icons });

    await initFilters();
    await fetchApplicants();

    const saveBtn = document.getElementById('saveStatusBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveStatus);
});

async function initFilters() {
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        const roles = await masterApi.getRoles();
        if (roles) {
            roles.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = r.name;
                roleFilter.appendChild(opt);
            });
        }
    }

    ['roleFilter', 'statusFilter', 'limitFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                currentPage = 1;
                fetchApplicants();
            });
        }
    });

    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            alert('CSV出力機能は準備中です。');
        });
    }
}

async function fetchApplicants() {
    try {
        const roleId = document.getElementById('roleFilter')?.value;
        const status = document.getElementById('statusFilter')?.value;
        itemsPerPage = parseInt(document.getElementById('limitFilter')?.value) || 20;

        const tbody = document.getElementById('applicantsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 2rem;">Loading...</td></tr>';

        const result = await applicantsApi.getList({
            page: currentPage,
            limit: itemsPerPage,
            roleId,
            status
        });

        allApplicants = result.data || [];
        totalCount = result.count || 0;

        renderTable(allApplicants);
        renderPagination();

    } catch (err) {
        console.error('Error fetching applicants:', err);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('applicantsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 2rem; color: var(--text-dim);">データがありません</td></tr>';
        return;
    }
    data.forEach(item => {
        const tr = document.createElement('tr');
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('ja-JP') : '-';
        let statusClass = 'new';
        if (item.status === '確認済み') statusClass = 'reviewed';
        else if (item.status === '不採用') statusClass = 'rejected';
        else if (item.status === '採用') statusClass = 'selected';

        tr.innerHTML = `
            <td>
                <div class="user-meta">
                    <span class="furigana" style="font-size: 0.7rem; color: var(--text-dim); display: block; margin-bottom: 0.2rem;">${item.full_kana || ''}</span>
                    <span class="name">${item.full_name || '未設定'}</span>
                    <span class="email">${item.school?.name || ''}</span>
                </div>
            </td>
            <td>${item.grade || '-'}</td>
            <td>${item.gender || '-'}</td>
            <td>${item.r1?.name || '-'}</td>
            <td style="color: var(--text-dim);">${item.r2?.name || '-'}</td>
            <td style="color: var(--text-dim);">${item.r3?.name || '-'}</td>
            <td>${dateStr}</td>
            <td><span class="status-badge ${statusClass}">${item.status || '新規'}</span></td>
            <td style="text-align: right;">
                <button class="action-btn"><i data-lucide="more-horizontal"></i></button>
            </td>
        `;
        tr.addEventListener('click', () => openDetails(item));
        tbody.appendChild(tr);
    });
    createIcons({ icons });

    const resultInfo = document.querySelector('.results-info');
    if (resultInfo) {
        const from = (currentPage - 1) * itemsPerPage + 1;
        const to = Math.min(currentPage * itemsPerPage, totalCount);
        resultInfo.textContent = totalCount > 0 ? `全 ${totalCount} 件中 ${from} - ${to} 件を表示` : '全 0 件を表示';
    }
}

function renderPagination() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;
    pagination.innerHTML = '';
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.disabled = currentPage === 1;
    prevBtn.innerHTML = '<i data-lucide="chevron-left" style="width: 20px;"></i>';
    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; fetchApplicants(); } };
    pagination.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => { currentPage = i; fetchApplicants(); };
        pagination.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.innerHTML = '<i data-lucide="chevron-right" style="width: 20px;"></i>';
    nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; fetchApplicants(); } };
    pagination.appendChild(nextBtn);
    createIcons({ icons });
}

async function openDetails(data) {
    currentApplicantId = data.id;
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setText('modalName', data.full_name || '未設定');
    setText('modalKana', data.full_kana || '');
    setText('modalGender', data.gender || '-');
    setText('modalEmail', data.email || (data.line_user_id ? 'LINE連携済み' : '-'));
    setText('modalPhone', data.phone || '-');
    const lineEl = document.getElementById('modalLineId');
    if (lineEl) {
        if (data.line_user_id) { lineEl.textContent = data.line_user_id; lineEl.style.color = '#00b900'; }
        else { lineEl.textContent = '未連携'; lineEl.style.color = 'var(--text-dim)'; }
    }
    setText('modalSchoolGrade', (data.school?.name || '') + ' / ' + (data.grade || ''));
    setText('modalDate', '応募日: ' + (data.created_at ? new Date(data.created_at).toLocaleDateString('ja-JP') : '-'));
    setText('modalReferral', data.ref?.name || '-');
    setText('modalReferralOther', data.referral_source_other || '');
    setText('modalMessage', data.message || '（メッセージなし）');
    setText('role1', data.r1?.name || '-');
    setText('role2', data.r2?.name || '-');
    setText('role3', data.r3?.name || '-');

    const modal = document.getElementById('detailModal');
    if (modal) modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const statusSelect = document.getElementById('modalStatus');
    if (statusSelect) statusSelect.value = data.status || '新規';

    const assignedSelect = document.getElementById('modalAssignedRole');
    if (assignedSelect) {
        assignedSelect.innerHTML = '<option value="">読み込み中...</option>';
        const roles = await masterApi.getRoles();
        if (roles) {
            assignedSelect.innerHTML = '<option value="">未定</option>';
            roles.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id; opt.textContent = r.name;
                assignedSelect.appendChild(opt);
            });
            if (data.assigned_role_id) assignedSelect.value = data.assigned_role_id;
        }
    }
}

async function saveStatus() {
    if (!currentApplicantId) return;
    const status = document.getElementById('modalStatus')?.value;
    const assignedRoleId = document.getElementById('modalAssignedRole')?.value || null;
    try {
        await applicantsApi.updateStatus(currentApplicantId, {
            status,
            assignedRoleId
        });
        closeModal();
        fetchApplicants();
    } catch (err) { alert('更新に失敗しました'); }
}

function closeModal() {
    const modal = document.getElementById('detailModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

window.closeModal = closeModal;
