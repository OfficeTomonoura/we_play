import { createIcons, icons } from 'lucide';
import { collaboratorsApi } from '../../../api/collaborators';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

document.addEventListener('DOMContentLoaded', async () => {
    renderAdminLayout({
        pageTitle: '協力者一覧',
        pageDescription: '外部協力者・パートナー企業の情報を管理します。行をクリックすると詳細を表示します。',
        content: getTemplateContent('page-template')
    });

    createIcons({ icons });

    await fetchCollaborators();

    const addBtn = document.getElementById('addCollaboratorBtn');
    const modal = document.getElementById('collaboratorModal');
    const form = document.getElementById('collaboratorForm');

    if (addBtn && modal) {
        addBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            if (form) form.reset();
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            try {
                await collaboratorsApi.add(data);
                alert('協力者を登録しました。');
                closeModal();
                await fetchCollaborators();
            } catch (err) { alert('登録に失敗しました: ' + err.message); }
        });
    }
});

function closeModal() {
    const modal = document.getElementById('collaboratorModal');
    if (modal) modal.style.display = 'none';
}

async function fetchCollaborators() {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Loading...</td></tr>';
    try {
        const { data, count } = await collaboratorsApi.getList();

        tbody.innerHTML = '';
        const totalCountEl = document.getElementById('totalCount');
        if (totalCountEl) totalCountEl.textContent = count || 0;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">登録された協力者がいません。</td></tr>';
            return;
        }
        data.forEach(item => {
            const tr = document.createElement('tr');
            const catMap = { 'filming': { label: '撮影・映像', color: '#ff007a' }, 'venue': { label: '会場提供', color: '#ffea00' }, 'instructor': { label: '講師', color: '#7000ff' }, 'sponsorship': { label: '協賛', color: '#00ff7a' }, 'promotion': { label: '広報協力', color: '#00f2ff' }, 'other': { label: 'その他', color: '#888' } };
            const catInfo = catMap[item.category] || { label: item.category || '-', color: '#888' };
            tr.innerHTML = `
                <td><div class="user-meta"><span class="furigana" style="font-size: 0.7rem; color: var(--text-dim); display: block;">${item.company_kana || '-'}</span><span class="name">${item.company_name}</span></div></td>
                <td><div class="user-meta"><span class="furigana" style="font-size: 0.7rem; color: var(--text-dim); display: block;">${item.contact_kana || '-'}</span><span class="name">${item.contact_name}</span></div></td>
                <td>${item.phone || '-'}</td>
                <td>${item.email || '-'}</td>
                <td><span class="status-badge" style="background: rgba(100, 100, 100, 0.1); color: ${catInfo.color}; border: 1px solid ${catInfo.color}44;">${catInfo.label}</span></td>
                <td style="text-align: right;"><button class="action-btn"><i data-lucide="more-vertical"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
        createIcons({ icons });
    } catch (err) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #ff007a;">データの取得に失敗しました。</td></tr>'; }
}

window.closeModal = closeModal;
