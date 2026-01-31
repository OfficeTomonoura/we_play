/**
 * members.js
 * 参加者（正会員）一覧のデータ取得・表示制御
 */

document.addEventListener('DOMContentLoaded', () => {
    fetchMembers();
});

async function fetchMembers() {
    if (!window.supabaseClient) {
        console.warn('Supabase client not initialized');
        return;
    }

    const tableBody = document.getElementById('membersTableBody');
    if (!tableBody) return;

    // Loading State
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-dim);">読み込み中...</td></tr>';

    try {
        console.log('Fetching members...');
        const { data: members, error } = await window.supabaseClient
            .from('members')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase Error:', error);
            throw error;
        }

        console.log('Fetched members:', members);
        renderMembers(members);

    } catch (err) {
        console.error('Error fetching members:', err);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem; color: #ff007a;">データの読み込みに失敗しました: ${err.message}</td></tr>`;
    }
}

function renderMembers(members) {
    const tableBody = document.getElementById('membersTableBody');
    if (!tableBody) return;

    if (!members || members.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-dim);">データがありません</td></tr>';
        return;
    }

    tableBody.innerHTML = '';

    members.forEach(member => {
        const tr = document.createElement('tr');

        // Badge Logic
        let badgeStyle = '';
        if (member.project_role === '事業責任者') {
            badgeStyle = 'background: rgba(0, 242, 255, 0.1); color: var(--primary); border: 1px solid rgba(0, 242, 255, 0.3);';
        } else if (member.project_role === 'コーディネーター') {
            badgeStyle = 'background: rgba(255, 0, 122, 0.1); color: #ff007a; border: 1px solid rgba(255, 0, 122, 0.3);';
        } else {
            // Default (Supporter etc.)
            badgeStyle = 'background: rgba(112, 0, 255, 0.1); color: #7000ff; border: 1px solid rgba(112, 0, 255, 0.3);';
        }

        tr.innerHTML = `
            <td>
                <div class="user-meta">
                    <span class="furigana" style="font-size: 0.7rem; color: var(--text-dim); display: block; margin-bottom: 0.2rem;">
                        ${escapeHtml(member.full_kana || '')}
                    </span>
                    <span class="name">${escapeHtml(member.full_name || '')}</span>
                    <span class="email">${escapeHtml(member.high_school || '-')}</span>
                </div>
            </td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                    <span style="color: var(--text-main);">${escapeHtml(member.organization || '')}</span>
                    <span style="font-size: 0.85rem; color: var(--text-dim);">${escapeHtml(member.position || '')}</span>
                </div>
            </td>
            <td>
                <span class="status-badge" style="${badgeStyle}">
                    ${escapeHtml(member.project_role || '')}
                </span>
            </td>
            <td style="text-align: right;">
                <button class="action-btn"><i data-lucide="more-vertical"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Re-init icons
    if (window.lucide) lucide.createIcons();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
