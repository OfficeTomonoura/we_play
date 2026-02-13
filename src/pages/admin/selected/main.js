import '../../../styles/admin/index.js';
import { createIcons, icons } from 'lucide';
import { applicantsApi } from '../../../api/applicants';
import { masterApi } from '../../../api/master';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

const CONFIG = {
    STATUS_FILTER: '採用',
    ROLES: {
        DIRECTOR: { name: '監督', styles: 'background: rgba(112, 0, 255, 0.1); color: #7000ff; border: 1px solid rgba(112, 0, 255, 0.3);' },
        ACTOR: { name: '演者', styles: 'background: rgba(255, 0, 122, 0.1); color: #ff007a; border: 1px solid rgba(255, 0, 122, 0.3);' },
        PRODUCER: { name: 'プロデューサー', styles: 'background: rgba(255, 234, 0, 0.1); color: #ffea00; border: 1px solid rgba(255, 234, 0, 0.3);' },
        PROPS: { name: '小道具', styles: 'background: rgba(0, 255, 122, 0.1); color: #00ff7a; border: 1px solid rgba(0, 255, 122, 0.3);' },
        DEFAULT: { name: '未定', styles: 'background: rgba(255, 255, 255, 0.1); color: #fff; border: 1px solid rgba(255, 255, 255, 0.3);' }
    }
};

let currentPage = 1;
let totalCount = 0;
let allSelectedApplicants = [];

document.addEventListener('DOMContentLoaded', async () => {
    renderAdminLayout({
        pageTitle: '選抜者一覧',
        pageDescription: '選抜された参加者の情報を管理します。行をクリックすると詳細を表示します。',
        content: getTemplateContent('page-template')
    });

    createIcons({ icons });

    await fetchRoles();
    await fetchSelectedApplicants();

    document.getElementById('filter-role')?.addEventListener('change', resetAndFetch);
    document.getElementById('filter-supporter')?.addEventListener('change', resetAndFetch);
    document.getElementById('filter-limit')?.addEventListener('change', resetAndFetch);
});

async function fetchRoles() {
    const select = document.getElementById('filter-role');
    if (!select) return;
    try {
        const roles = await masterApi.getRoles();
        select.innerHTML = '<option value="">すべての役職</option>';
        if (roles) {
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.name;
                option.textContent = role.name;
                select.appendChild(option);
            });
        }
    } catch (err) { console.error('Error fetching roles:', err); }
}

async function fetchSelectedApplicants() {
    const tbody = document.querySelector('.data-table tbody');
    const resultInfo = document.querySelector('.results-info');
    if (!tbody) return;
    const roleFilter = document.getElementById('filter-role')?.value;
    const supporterFilter = document.getElementById('filter-supporter')?.value;
    const limitSelect = document.getElementById('filter-limit');
    const limit = limitSelect ? parseInt(limitSelect.value, 10) : 20;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Loading...</td></tr>';
    try {
        // 初回ロード時のみ取得し、フィルタリングはフロントで行う（件数が多くない前提）
        if (allSelectedApplicants.length === 0) {
            allSelectedApplicants = await applicantsApi.getSelectedList(CONFIG.STATUS_FILTER);
        }

        let filteredData = allSelectedApplicants || [];
        if (roleFilter) filteredData = filteredData.filter(item => item.arm?.name?.includes(roleFilter));
        if (supporterFilter === 'assigned') filteredData = filteredData.filter(item => item.supporter_schedules && item.supporter_schedules.length > 0);
        else if (supporterFilter === 'pending') filteredData = filteredData.filter(item => !item.supporter_schedules || item.supporter_schedules.length === 0);

        totalCount = filteredData.length;
        const start = (currentPage - 1) * limit;
        const end = start + limit;
        const displayData = filteredData.slice(start, end);

        tbody.innerHTML = '';
        const currentPageSpan = document.getElementById('current-page');
        if (currentPageSpan) currentPageSpan.textContent = currentPage;

        const prevBtn = document.getElementById('prev-btn');
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
            prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
        }

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            const maxPage = Math.ceil(totalCount / limit) || 1;
            nextBtn.disabled = currentPage >= maxPage;
            nextBtn.style.opacity = currentPage >= maxPage ? '0.5' : '1';
        }

        if (resultInfo) {
            if (totalCount === 0) {
                resultInfo.textContent = '全 0 件中 0 件を表示';
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">該当するデータはありません。</td></tr>';
                return;
            }
            resultInfo.textContent = `全 ${totalCount} 件中 ${start + 1} - ${Math.min(end, totalCount)} 件を表示`;
        }

        const fragment = document.createDocumentFragment();
        displayData.forEach(item => {
            const tr = document.createElement('tr');
            tr.onclick = () => {
                sessionStorage.setItem('selected_applicant_id', item.id);
                window.open(`selected_detail.html?id=${item.id}`, '_blank');
            };
            const roleName = item.arm?.name || '未定';
            let roleStyle = CONFIG.ROLES.DEFAULT.styles;
            if (roleName.includes('監督')) roleStyle = CONFIG.ROLES.DIRECTOR.styles;
            else if (roleName.includes('演者')) roleStyle = CONFIG.ROLES.ACTOR.styles;
            else if (roleName.includes('プロデューサー')) roleStyle = CONFIG.ROLES.PRODUCER.styles;
            else if (roleName.includes('小道具')) roleStyle = CONFIG.ROLES.PROPS.styles;

            let contactHtml = `<span style="color: var(--text-main);">${escapeHtml(item.phone || '-')}</span>`;
            if (item.emergency_contact_phone) contactHtml += `<span style="font-size: 0.85rem; color: var(--text-dim); display:block; margin-top:0.2rem;">緊急: ${escapeHtml(item.emergency_contact_phone)} (${escapeHtml(item.emergency_contact_category || '関係なし')})</span>`;

            let supporterHtml = '<span style="color: var(--text-dim); font-size: 0.9rem;">未定</span>';
            let schedulePeriod = '';
            if (item.supporter_schedules && item.supporter_schedules.length > 0) {
                const now = new Date();
                const schedules = item.supporter_schedules.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
                let targetSchedule = schedules.find(s => {
                    const start = new Date(s.start_date);
                    const end = new Date(s.end_date);
                    start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
                    return start <= now && now <= end;
                }) || schedules[0];
                if (targetSchedule) {
                    supporterHtml = `<span style="color: var(--text-main);">${escapeHtml(targetSchedule.supporter_name || '担当あり')}</span>`;
                    if (targetSchedule.start_date && targetSchedule.end_date) {
                        schedulePeriod = `<span style="font-size: 0.85rem; color: var(--text-dim);">${new Date(targetSchedule.start_date).toLocaleDateString('ja-JP')} - ${new Date(targetSchedule.end_date).toLocaleDateString('ja-JP')}</span>`;
                    }
                }
            }
            tr.innerHTML = `<td><div class="user-meta"><span class="furigana" style="font-size: 0.7rem; color: var(--text-dim); display: block;">${escapeHtml(item.full_kana || '')}</span><span class="name">${escapeHtml(item.full_name || '未設定')}</span><span class="email">${escapeHtml(item.school_name || '')}</span></div></td><td>${escapeHtml(item.grade || '-')}</td><td><span class="status-badge" style="${roleStyle}">${escapeHtml(roleName)}</span></td><td><div style="display: flex; flex-direction: column; gap: 0.3rem;">${contactHtml}</div></td><td><div style="display: flex; flex-direction: column; gap: 0.3rem;">${supporterHtml}${schedulePeriod}</div></td>`;
            fragment.appendChild(tr);
        });
        tbody.appendChild(fragment);
        createIcons({ icons });
    } catch (err) { console.error('Error:', err); }
}

function resetAndFetch() { currentPage = 1; fetchSelectedApplicants(); }
window.prevPage = () => { if (currentPage > 1) { currentPage--; fetchSelectedApplicants(); } };
window.nextPage = () => {
    const limitSelect = document.getElementById('filter-limit');
    const limit = limitSelect ? parseInt(limitSelect.value, 10) : 20;
    const maxPage = Math.ceil(totalCount / limit);
    if (currentPage < maxPage) { currentPage++; fetchSelectedApplicants(); }
};

function escapeHtml(unsafe) { if (typeof unsafe !== 'string') return unsafe; return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
