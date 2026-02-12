import { masterApi } from '../../api/master';

export class MasterDataManager {
    constructor(listContainerId, modalId) {
        this.currentTable = null;
        this.listContainer = document.getElementById(listContainerId);
        this.modal = document.getElementById(modalId);
        this.currentEditId = null;
        // this.supabase = supabase; // Removed

        this.tableMap = {
            'master_organization': '所属マスター',
            'master_position': '役職マスター',
            'master_project_role': '事業役割マスター',
            'master_role': '参加者役割マスター',
            'master_school': '学校マスター',
            'master_referral_source': '認知経路マスター'
        };

        this.initEventListeners();
    }

    initEventListeners() {
        const saveBtn = document.getElementById('saveMasterBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveData());

        const cancelBtn = document.getElementById('cancelMasterBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
    }

    async loadTable(tableName) {
        this.currentTable = tableName;
        if (this.listContainer) {
            this.listContainer.innerHTML = '<div style="padding:1rem; color:var(--text-dim);">読み込み中...</div>';
        }

        try {
            const data = await masterApi.getTable(tableName);
            this.renderList(data);
        } catch (err) {
            console.error('Fetch error:', err);
            if (this.listContainer) {
                this.listContainer.innerHTML = '<div style="padding:1rem; color:#ff007a;">データの取得に失敗しました。</div>';
            }
        }
    }

    renderList(items) {
        if (!this.listContainer) return;
        if (!items || items.length === 0) {
            this.listContainer.innerHTML = '<div style="padding:1rem; color:var(--text-dim);">データがありません。</div>';
            return;
        }

        let html = `
            <table class="data-table" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); text-align: left;">
                        <th style="padding: 0.5rem; color: var(--text-dim); font-size: 0.8rem;">順序</th>
                        <th style="padding: 0.5rem; color: var(--text-dim); font-size: 0.8rem;">名称</th>
                        <th style="padding: 0.5rem; color: var(--text-dim); font-size: 0.8rem; text-align: right;">操作</th>
                    </tr>
                </thead>
                <tbody>
        `;

        items.forEach(item => {
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 0.8rem 0.5rem;">${item.sort_order}</td>
                    <td style="padding: 0.8rem 0.5rem; font-weight: bold;">${this.escapeHtml(item.name)}</td>
                    <td style="padding: 0.8rem 0.5rem; text-align: right;">
                        <button onclick="window.masterManager.openEditModal('${item.id}', '${this.escapeHtml(item.name)}', ${item.sort_order})" 
                            style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; margin-right: 0.5rem;">
                            編集
                        </button>
                        <button onclick="window.masterManager.deleteItem('${item.id}', '${this.escapeHtml(item.name)}')" 
                            style="background: rgba(255,0,0,0.2); border: 1px solid rgba(255,0,0,0.3); color: #ffcccc; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                            削除
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        this.listContainer.innerHTML = html;
    }

    openAddModal() {
        this.currentEditId = null;
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) titleEl.textContent = `${this.tableMap[this.currentTable]} - 新規追加`;
        const nameInput = document.getElementById('masterNameInput');
        if (nameInput) nameInput.value = '';
        const sortInput = document.getElementById('masterSortInput');
        if (sortInput) sortInput.value = '0';
        if (this.modal) this.modal.style.display = 'flex';
    }

    openEditModal(id, name, sortOrder) {
        this.currentEditId = id;
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) titleEl.textContent = `${this.tableMap[this.currentTable]} - 編集`;
        const nameInput = document.getElementById('masterNameInput');
        if (nameInput) nameInput.value = name;
        const sortInput = document.getElementById('masterSortInput');
        if (sortInput) sortInput.value = sortOrder;
        if (this.modal) this.modal.style.display = 'flex';
    }

    closeModal() {
        if (this.modal) this.modal.style.display = 'none';
        this.currentEditId = null;
    }

    async saveData() {
        const nameInput = document.getElementById('masterNameInput');
        const sortInput = document.getElementById('masterSortInput');
        const name = nameInput ? nameInput.value.trim() : '';
        const sortOrder = sortInput ? parseInt(sortInput.value, 10) : 0;

        if (!name) {
            alert('名称を入力してください');
            return;
        }

        const btn = document.getElementById('saveMasterBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '保存中...';
        }

        try {
            if (this.currentEditId) {
                await masterApi.updateItem(this.currentTable, this.currentEditId, { name, sort_order: sortOrder });
            } else {
                await masterApi.createItem(this.currentTable, { name, sort_order: sortOrder });
            }

            this.closeModal();
            this.loadTable(this.currentTable);

        } catch (err) {
            console.error('Save error:', err);
            alert('保存に失敗しました: ' + err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '保存';
            }
        }
    }

    async deleteItem(id, name) {
        if (!confirm(`「${name}」を削除してもよろしいですか？\n※このデータを使用しているメンバーがいる場合、表示がおかしくなる可能性があります。`)) return;

        try {
            await masterApi.deleteItem(this.currentTable, id);
            this.loadTable(this.currentTable);
        } catch (err) {
            console.error('Delete error:', err);
            alert('削除に失敗しました: ' + err.message);
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
