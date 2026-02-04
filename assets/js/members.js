/**
 * members.js
 * 参加者（正会員）一覧のデータ取得・表示制御
 */

let allMembers = [];
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchMasterDataForFilters();
    fetchMembers();
});

function setupEventListeners() {
    document.getElementById('filterRole').addEventListener('change', () => filterMembers(true));
    document.getElementById('filterOrg').addEventListener('change', () => filterMembers(true));
    document.getElementById('dispLimit').addEventListener('change', () => filterMembers(true));
}

async function fetchMasterDataForFilters() {
    if (!window.supabaseClient) return;
    try {
        const [orgs, roles] = await Promise.all([
            window.supabaseClient.from('master_organization').select('id, name').order('sort_order'),
            window.supabaseClient.from('master_project_role').select('id, name').order('sort_order')
        ]);

        const orgSelect = document.getElementById('filterOrg');
        if (orgSelect && orgs.data) {
            orgs.data.forEach(o => {
                const opt = document.createElement('option');
                opt.value = o.id;
                opt.textContent = o.name;
                orgSelect.appendChild(opt);
            });
        }

        const roleSelect = document.getElementById('filterRole');
        if (roleSelect && roles.data) {
            roles.data.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = r.name;
                roleSelect.appendChild(opt);
            });
        }

    } catch (e) {
        console.error('Filter Data Error:', e);
    }
}

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
        const { data: members, error } = await window.supabaseClient
            .from('members')
            .select(`
                *,
                master_organization (name),
                master_position (name),
                master_project_role (name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase Error:', error);
            throw error;
        }

        allMembers = members || [];
        filterMembers(true); // Reset to page 1 on load

    } catch (err) {
        console.error('Error fetching members:', err);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem; color: #ff007a;">データの読み込みに失敗しました: ${err.message}</td></tr>`;
    }
}

function filterMembers(resetPage = false) {
    if (resetPage) currentPage = 1;

    const roleId = document.getElementById('filterRole').value;
    const orgId = document.getElementById('filterOrg').value;
    const limit = parseInt(document.getElementById('dispLimit').value, 10);

    let filtered = allMembers.filter(m => {
        let matchRole = true;
        let matchOrg = true;

        if (roleId) {
            matchRole = (m.project_role_id === roleId);
        }
        if (orgId) {
            matchOrg = (m.organization_id === orgId);
        }
        return matchRole && matchOrg;
    });

    const totalItems = filtered.length;
    let totalPages = 1;
    let paginatedItems = filtered;

    if (limit > 0) {
        totalPages = Math.ceil(totalItems / limit);
        if (currentPage > totalPages) currentPage = totalPages || 1;

        const start = (currentPage - 1) * limit;
        paginatedItems = filtered.slice(start, start + limit);
    }

    // Update count display
    const countDisplay = document.querySelector('.results-info');
    if (countDisplay) {
        if (limit > 0) {
            const start = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
            const end = Math.min(currentPage * limit, totalItems);
            countDisplay.textContent = `全${totalItems}件中 ${start}〜${end}件を表示`;
        } else {
            countDisplay.textContent = `全${totalItems}件を表示`;
        }
    }

    renderMembers(paginatedItems);
    renderPagination(totalItems, limit, totalPages);
}

function renderPagination(totalItems, limit, totalPages) {
    const container = document.getElementById('paginationControls');
    if (!container) return;

    container.innerHTML = '';
    if (limit <= 0 || totalPages <= 1) return;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i data-lucide="chevron-left" style="width:16px;"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.style.cssText = `
        background: rgba(255,255,255,0.05); 
        border: 1px solid var(--glass-border); 
        color: white; 
        width: 32px; height: 32px; 
        border-radius: 8px; 
        display: flex; align-items: center; justify-content: center;
        cursor: ${currentPage === 1 ? 'default' : 'pointer'};
        opacity: ${currentPage === 1 ? '0.5' : '1'};
    `;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            filterMembers(false);
        }
    };
    container.appendChild(prevBtn);

    // Page Numbers
    // Simple logic: Show all pages if small number, or window?
    // User requested "pagination function", simple list is fine for 70 items (max 4 pages with limit 20).
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        const isActive = i === currentPage;
        btn.style.cssText = `
            background: ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; 
            border: 1px solid var(--glass-border); 
            color: ${isActive ? '#000' : 'white'}; 
            min-width: 32px; height: 32px; 
            border-radius: 8px; 
            font-weight: bold;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
        `;
        btn.onclick = () => {
            currentPage = i;
            filterMembers(false);
        };
        container.appendChild(btn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i data-lucide="chevron-right" style="width:16px;"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.style.cssText = `
        background: rgba(255,255,255,0.05); 
        border: 1px solid var(--glass-border); 
        color: white; 
        width: 32px; height: 32px; 
        border-radius: 8px; 
        display: flex; align-items: center; justify-content: center;
        cursor: ${currentPage === totalPages ? 'default' : 'pointer'};
        opacity: ${currentPage === totalPages ? '0.5' : '1'};
    `;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            filterMembers(false);
        }
    };
    container.appendChild(nextBtn);

    if (window.lucide) lucide.createIcons();
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

        // Add click event for ROW (View Details)
        tr.onclick = (e) => {
            // Avoid triggering if action button clicked
            if (e.target.closest('.action-btn')) return;
            openMemberModal(member);
        };

        // Helper to get name safely
        const orgName = member.master_organization?.name || '';
        const posName = member.master_position?.name || '';
        const roleName = member.master_project_role?.name || '未設定';

        // Badge Logic
        let badgeStyle = '';
        if (roleName === '事業責任者') {
            badgeStyle = 'background: rgba(0, 242, 255, 0.1); color: var(--primary); border: 1px solid rgba(0, 242, 255, 0.3);';
        } else if (roleName === 'コーディネーター') {
            badgeStyle = 'background: rgba(255, 0, 122, 0.1); color: #ff007a; border: 1px solid rgba(255, 0, 122, 0.3);';
        } else if (roleName === '未設定') {
            badgeStyle = 'background: rgba(255, 255, 255, 0.05); color: var(--text-dim); border: 1px solid var(--glass-border);';
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
                    <span style="color: var(--text-main);">${escapeHtml(orgName)}</span>
                    <span style="font-size: 0.85rem; color: var(--text-dim);">${escapeHtml(posName)}</span>
                </div>
            </td>
            <td>
                <span class="status-badge" style="${badgeStyle}">
                    ${escapeHtml(roleName)}
                </span>
            </td>
            <td style="text-align: right;">
                <button class="action-btn" onclick="openEditMemberModal('${member.id}')" style="background: rgba(255, 255, 255, 0.1);">
                    <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Re-init icons
    if (window.lucide) lucide.createIcons();
}

/**
 * VIEW Member Details
 */
function openMemberModal(member) {
    const modal = document.getElementById('memberDetailModal');
    const content = document.getElementById('memberDetailContent');
    if (!modal || !content) return;

    const orgName = member.master_organization?.name || '-';
    const posName = member.master_position?.name || '-';
    const roleName = member.master_project_role?.name || '未設定';

    const isLineLinked = !!member.line_user_id;

    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="width: 80px; height: 80px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #000; font-weight: 800; font-size: 1.5rem;">
                ${member.full_name ? member.full_name.charAt(0) : '?'}
            </div>
            <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: white;">${escapeHtml(member.full_name)}</h2>
            <p style="color: var(--text-dim); font-size: 0.9rem;">${escapeHtml(member.full_kana)}</p>
        </div>

        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 1.5rem;">
            <div style="display: grid; grid-template-columns: 100px 1fr; gap: 1rem; margin-bottom: 1rem; font-size: 0.95rem;">
                <div style="color: var(--text-dim);">出身高校</div>
                <div style="color: white;">${escapeHtml(member.high_school || '-')}</div>
            </div>
            <div style="display: grid; grid-template-columns: 100px 1fr; gap: 1rem; margin-bottom: 1rem; font-size: 0.95rem;">
                <div style="color: var(--text-dim);">所属</div>
                <div style="color: white;">${escapeHtml(orgName)}</div>
            </div>
            <div style="display: grid; grid-template-columns: 100px 1fr; gap: 1rem; margin-bottom: 1rem; font-size: 0.95rem;">
                <div style="color: var(--text-dim);">役職</div>
                <div style="color: white;">${escapeHtml(posName)}</div>
            </div>
            <div style="display: grid; grid-template-columns: 100px 1fr; gap: 1rem; margin-bottom: 1rem; font-size: 0.95rem;">
                <div style="color: var(--text-dim);">事業役割</div>
                <div style="color: white; color: var(--primary); font-weight: bold;">${escapeHtml(roleName)}</div>
            </div>
            <div style="width: 100%; height: 1px; background: rgba(255,255,255,0.1); margin: 1rem 0;"></div>
            <div style="display: grid; grid-template-columns: 100px 1fr; gap: 1rem; margin-bottom: 1rem; font-size: 0.95rem;">
                <div style="color: var(--text-dim);">Email</div>
                <div style="color: white;">${escapeHtml(member.email || '-')}</div>
            </div>
            <div style="display: grid; grid-template-columns: 100px 1fr; gap: 1rem; font-size: 0.95rem;">
                <div style="color: var(--text-dim);">LINE連携</div>
                <div>
                    ${isLineLinked
            ? '<span style="color: #06C755; font-weight: bold;">連携済み</span>'
            : '<span style="color: var(--text-dim);">未連携</span>'}
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

/**
 * EDIT Member Modal
 */
let currentEditingMemberId = null;

async function openEditMemberModal(memberId) {
    // Note: We need to fetch the member again or find it from a cache to get the full object + IDs
    // For simplicity, let's fetch individual or find from DOM if stored?
    // Better: fetch from DB to ensure latest data

    const modal = document.getElementById('memberDetailModal');
    const content = document.getElementById('memberDetailContent');
    if (!modal || !content) return;

    currentEditingMemberId = memberId;

    try {
        const { data: member, error } = await window.supabaseClient
            .from('members')
            .select('*')
            .eq('id', memberId)
            .single();

        if (error) throw error;

        // Fetch Masters for Dropdowns
        const [orgsRes, posRes, rolesRes] = await Promise.all([
            window.supabaseClient.from('master_organization').select('id, name').order('sort_order'),
            window.supabaseClient.from('master_position').select('id, name').order('sort_order'),
            window.supabaseClient.from('master_project_role').select('id, name').order('sort_order')
        ]);

        const createOptions = (items, selectedId) => {
            return items.map(i => `<option value="${i.id}" ${i.id === selectedId ? 'selected' : ''}>${i.name}</option>`).join('');
        };

        const orgOptions = createOptions(orgsRes.data || [], member.organization_id);
        const posOptions = createOptions(posRes.data || [], member.position_id);
        const roleOptions = createOptions(rolesRes.data || [], member.project_role_id);

        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h3 style="color: white; font-size: 1.2rem;">メンバー情報編集</h3>
            </div>
            <form id="editMemberForm" onsubmit="saveMemberUpdates(event)">
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; color: var(--text-dim); font-size: 0.8rem; margin-bottom: 0.3rem;">氏名</label>
                    <input type="text" id="editName" value="${escapeHtml(member.full_name)}" required style="width: 100%; padding: 0.6rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">
                </div>
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; color: var(--text-dim); font-size: 0.8rem; margin-bottom: 0.3rem;">ふりがな</label>
                    <input type="text" id="editKana" value="${escapeHtml(member.full_kana)}" required style="width: 100%; padding: 0.6rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">
                </div>
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; color: var(--text-dim); font-size: 0.8rem; margin-bottom: 0.3rem;">出身高校</label>
                    <input type="text" id="editHighSchool" value="${escapeHtml(member.high_school)}" style="width: 100%; padding: 0.6rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">
                </div>
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; color: var(--text-dim); font-size: 0.8rem; margin-bottom: 0.3rem;">所属</label>
                    <select id="editOrg" style="width: 100%; padding: 0.6rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">
                        <option value="">選択なし</option>
                        ${orgOptions}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; color: var(--text-dim); font-size: 0.8rem; margin-bottom: 0.3rem;">役職</label>
                    <select id="editPos" style="width: 100%; padding: 0.6rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">
                        <option value="">選択なし</option>
                        ${posOptions}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="display: block; color: var(--text-dim); font-size: 0.8rem; margin-bottom: 0.3rem;">事業役割</label>
                    <select id="editRole" style="width: 100%; padding: 0.6rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">
                        <option value="">選択なし</option>
                        ${roleOptions}
                    </select>
                </div>
                <button type="submit" style="width: 100%; padding: 0.8rem; background: var(--primary); border: none; border-radius: 8px; font-weight: bold; color: #000; cursor: pointer;">保存する</button>
            </form>
        `;

        modal.style.display = 'flex';

    } catch (err) {
        console.error('Edit Load Error:', err);
        alert('編集データの読み込みに失敗しました');
    }
}

async function saveMemberUpdates(e) {
    e.preventDefault();
    if (!currentEditingMemberId) return;

    const name = document.getElementById('editName').value;
    const kana = document.getElementById('editKana').value;
    const highSchool = document.getElementById('editHighSchool').value;
    const orgId = document.getElementById('editOrg').value || null;
    const posId = document.getElementById('editPos').value || null;
    const roleId = document.getElementById('editRole').value || null;

    try {
        const { error } = await window.supabaseClient
            .from('members')
            .update({
                full_name: name,
                full_kana: kana,
                high_school: highSchool,
                organization_id: orgId,
                position_id: posId,
                project_role_id: roleId
            })
            .eq('id', currentEditingMemberId);

        if (error) throw error;

        // Use custom Toast instead of alert
        if (window.showToast) {
            window.showToast('メンバー情報を更新しました', 'success');
        } else {
            alert('更新しました');
        }

        closeMemberModal();
        fetchMembers(); // Refresh list

    } catch (err) {
        console.error('Update Error:', err);
        if (window.showToast) {
            window.showToast('更新に失敗しました: ' + err.message, 'error');
        } else {
            alert('更新に失敗しました: ' + err.message);
        }
    }
}

function closeMemberModal() {
    const modal = document.getElementById('memberDetailModal');
    if (modal) modal.style.display = 'none';
    currentEditingMemberId = null;
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
