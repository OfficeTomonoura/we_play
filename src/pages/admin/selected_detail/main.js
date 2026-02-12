import { createIcons, icons } from 'lucide';
import { applicantsApi } from '../../../api/applicants';
import { membersApi } from '../../../api/members';
import { authApi } from '../../../api/auth';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

let currentApplicantId = null;
let currentUser = null;
let allMembers = [];
let editingCommentId = null;

const CONFIG = {
    COMMENT_MAX_LENGTH: 2000,
    COMMENT_WARNING_LENGTH: 1500,
    COMMENT_DANGER_LENGTH: 1800,
    FOCUS_DELAY: 100
};

const utils = {
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    },
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                const focusable = modal.querySelectorAll('button, [href], input, select, textarea');
                if (focusable.length > 0) focusable[0].focus();
            }, CONFIG.FOCUS_DELAY);
        }
    },
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    },
    escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    renderAdminLayout({
        pageTitle: '選抜者詳細',
        pageDescription: '選抜された参加者の詳細情報を確認・編集します。',
        content: getTemplateContent('page-template'),
        activeNav: 'selected.html'
    });
    createIcons({ icons });

    const id = new URLSearchParams(window.location.search).get('id') || sessionStorage.getItem('selected_applicant_id');
    if (!id) {
        alert('IDが指定されていません。');
        window.close();
        return;
    }
    currentApplicantId = id;

    await initPage();
});

async function initPage() {
    try {
        const session = await authApi.getSession();
        const user = session?.user;

        if (user) {
            const memberData = await membersApi.getByAuthId(user.id);
            currentUser = { id: user.id, name: memberData ? memberData.full_name : (user.email || 'Unknown') };
        } else {
            currentUser = { id: 'dummy-admin', name: '管理者(Guest)' };
        }
        await fetchMembers();
        await fetchApplicantDetails(currentApplicantId);
    } catch (err) { console.error(err); }
}

async function fetchMembers() {
    const data = await membersApi.getList();
    allMembers = data || [];
}

async function fetchApplicantDetails(id) {
    const applicant = await applicantsApi.getById(id);
    const comments = await applicantsApi.getComments(id);

    let schedules = applicant.supporter_schedules || [];
    // 別途取得して上書き（確実なソートのため）
    const sortedSchedules = await applicantsApi.getSupporterSchedules(id);
    if (sortedSchedules) schedules = sortedSchedules;

    renderDetail({ ...applicant, supporter_schedules: schedules, comments: comments || [] });
}

function renderDetail(data) {
    const nameEl = document.getElementById('applicantName');
    if (nameEl) nameEl.textContent = data.full_name;

    document.getElementById('valKana').textContent = data.full_kana || '-';
    document.getElementById('valSchool').textContent = data.school_name || data.school?.name || '-';
    document.getElementById('valGrade').textContent = data.grade || '-';
    document.getElementById('valPhone').textContent = data.phone || '-';
    document.getElementById('valEmail').textContent = data.email || '-';
    document.getElementById('valEmergencyContactPhone').textContent = data.emergency_contact_phone || '-';
    document.getElementById('valEmergencyContactCategory').textContent = data.emergency_contact_category || '';

    const roleName = data.arm?.name || '未定';
    let roleClass = 'role-props';
    if (roleName.includes('監督')) roleClass = 'role-director';
    else if (roleName.includes('演者')) roleClass = 'role-actor';
    else if (roleName.includes('プロデューサー')) roleClass = 'role-producer';

    const badgeContainer = document.getElementById('statusBadgeContainer');
    if (badgeContainer) badgeContainer.innerHTML = `<span class="role-tag ${roleClass}">${roleName}</span>`;

    const valRole = document.getElementById('valRole');
    if (valRole) valRole.textContent = roleName;

    renderSupportSystem(data);
    renderComments(data.comments);
    createIcons({ icons });
}

function renderSupportSystem(data) {
    const today = new Date();
    let currentSchedule = null;
    if (data.supporter_schedules && data.supporter_schedules.length > 0) {
        const sorted = [...data.supporter_schedules].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        currentSchedule = sorted.find(s => {
            const start = new Date(s.start_date); const end = new Date(s.end_date);
            start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
            return start <= today && today <= end;
        }) || sorted[0];
    }
    const sVal = document.getElementById('valSupporter');
    if (sVal) {
        if (currentSchedule) { sVal.textContent = currentSchedule.supporter_name || '担当あり'; sVal.style.color = 'white'; }
        else { sVal.textContent = '未定'; sVal.style.color = 'var(--text-dim)'; }
    }

    const pVal = document.getElementById('valPeriod');
    if (pVal) {
        if (currentSchedule && currentSchedule.start_date) pVal.textContent = `${utils.formatDate(currentSchedule.start_date)} - ${utils.formatDate(currentSchedule.end_date)}`;
        else if (data.period_start) pVal.textContent = `${utils.formatDate(data.period_start)} - ${utils.formatDate(data.period_end)}`;
        else pVal.textContent = '未設定';
    }

    const hList = document.getElementById('valSupporterHistory');
    if (hList) {
        const schedules = data.supporter_schedules || [];
        hList.innerHTML = schedules.length ? schedules.map(s => {
            const isCur = currentSchedule && currentSchedule.id === s.id;
            return `<li><span style="${isCur ? 'color: var(--primary); font-weight:bold;' : ''}">${utils.formatDate(s.start_date)} ~ ${utils.formatDate(s.end_date)} : ${utils.escapeHtml(s.supporter_name)}</span></li>`;
        }).join('') : '<li>履歴なし</li>';
    }
}

function renderComments(comments) {
    const container = document.getElementById('commentsContainer');
    if (!container) return;
    if (!comments || !comments.length) { container.innerHTML = '<div style="color:var(--text-dim); text-align:center; padding:2rem;">コメントはまだありません</div>'; return; }
    container.innerHTML = comments.map(c => {
        const canEdit = currentUser && (c.author_id === currentUser.id || currentUser.id === 'dummy-admin');
        const authorName = c.members?.full_name || c.author_name || '不明'; // API getCommentsでmembersをjoinしている
        return `<div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 1rem; border-left: 3px solid var(--primary);"><div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;"><div style="font-size:0.85rem; color:var(--text-dim);"><div><strong style="color:var(--primary);">記入者:</strong> ${utils.escapeHtml(authorName)}</div><div><strong style="color:var(--primary);">記入日:</strong> ${utils.formatDate(c.created_at)}</div></div>${canEdit ? `<button onclick="openEditCommentModal('${c.id}')" style="padding:0.4rem 0.8rem; background:rgba(255,255,255,0.1); border:1px solid var(--glass-border); color:var(--text-dim); border-radius:4px; cursor:pointer; font-size:0.85rem; display:flex; align-items:center; gap:0.3rem;"><i data-lucide="edit-2" style="width:14px; height:14px;"></i>編集</button>` : ''}</div><div style="color:white; line-height:1.6; white-space:pre-wrap; margin-top:0.8rem;">${utils.escapeHtml(c.content)}</div></div>`;
    }).join('');
    createIcons({ icons });
}

window.openCommentModal = () => {
    editingCommentId = null;
    const title = document.getElementById('commentModalTitle');
    if (title) title.textContent = 'コメントを追加';
    const textarea = document.getElementById('commentTextarea');
    if (textarea) textarea.value = '';
    updateCharCount();
    utils.openModal('comment-modal');
};

window.openEditCommentModal = async (id) => {
    const data = await applicantsApi.getCommentById(id);
    editingCommentId = id;
    const title = document.getElementById('commentModalTitle');
    if (title) title.textContent = 'コメントを編集';
    const textarea = document.getElementById('commentTextarea');
    if (textarea && data) textarea.value = data.content;
    updateCharCount();
    utils.openModal('comment-modal');
};

window.closeCommentModal = () => { utils.closeModal('comment-modal'); };

function updateCharCount() {
    const textarea = document.getElementById('commentTextarea');
    if (!textarea) return;
    const val = textarea.value.length;
    const el = document.getElementById('charCount');
    if (el) {
        el.textContent = val;
        el.style.color = val > CONFIG.COMMENT_DANGER_LENGTH ? '#ff6b6b' : (val > CONFIG.COMMENT_WARNING_LENGTH ? '#ffd93d' : 'var(--text-dim)');
    }
}
window.updateCharCount = updateCharCount;

window.saveComment = async () => {
    const content = document.getElementById('commentTextarea')?.value.trim();
    if (!content) return;

    // API側で created_by などが自動設定されない場合、明示的に送る必要がある
    // backendのTriggerがあれば不要だが、念のため author_id を送る（API定義に従う）
    const payload = {
        applicant_id: currentApplicantId,
        author_name: currentUser.name,
        author_id: currentUser.id,
        content
    };

    if (editingCommentId) await applicantsApi.updateComment(editingCommentId, content);
    else await applicantsApi.addComment(payload);

    window.closeCommentModal();
    await fetchApplicantDetails(currentApplicantId);
};

window.openEditModal = async () => {
    const select = document.getElementById('newHistoryName');
    if (select) {
        select.innerHTML = '<option value="">メンバーを選択</option>' + allMembers.map(m => `<option value="${m.full_name}">${m.full_name}</option>`).join('');
    }
    await renderEditModalHistory();
    utils.openModal('edit-modal');
};

window.closeEditModal = () => { utils.closeModal('edit-modal'); };

async function renderEditModalHistory() {
    const data = await applicantsApi.getSupporterSchedules(currentApplicantId);
    const container = document.getElementById('editHistoryContainer');
    if (container) {
        container.innerHTML = data.length ? data.map(item => `<div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; border-bottom:1px solid var(--glass-border);"><span>${utils.formatDate(item.start_date)} ~ ${utils.formatDate(item.end_date)} : ${utils.escapeHtml(item.supporter_name)}</span><button onclick="deleteHistoryItem('${item.id}')" style="color:#ff6b6b; background:none; border:none; cursor:pointer;"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button></div>`).join('') : '<div style="padding:0.5rem; color:var(--text-dim);">履歴はありません</div>';
    }
    createIcons({ icons });
}

window.addHistoryItem = async () => {
    const start = document.getElementById('newHistoryStart')?.value;
    const end = document.getElementById('newHistoryEnd')?.value;
    const name = document.getElementById('newHistoryName')?.value;
    if (!start || !end || !name) return;

    await applicantsApi.addSupporterSchedule({
        applicant_id: currentApplicantId,
        supporter_name: name,
        start_date: start,
        end_date: end
    });

    await renderEditModalHistory();
};

window.deleteHistoryItem = async (id) => {
    if (confirm('削除しますか？')) {
        await applicantsApi.deleteSupporterSchedule(id);
        await renderEditModalHistory();
    }
};

window.saveEdit = async () => {
    window.closeEditModal();
    await fetchApplicantDetails(currentApplicantId);
};
