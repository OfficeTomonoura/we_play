class MasterDataManager {
    constructor(listContainerId, modalId) {
        this.currentTable = null;
        this.listContainer = document.getElementById(listContainerId);
        this.modal = document.getElementById(modalId);
        this.currentEditId = null;

        // Table Display Names
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
        // Modal Save Button
        document.getElementById('saveMasterBtn').addEventListener('click', () => this.saveData());
        // Modal Cancel/Close
        document.getElementById('cancelMasterBtn').addEventListener('click', () => this.closeModal());
    }

    async loadTable(tableName) {
        this.currentTable = tableName;
        this.listContainer.innerHTML = '<div style="padding:1rem; color:var(--text-dim);">読み込み中...</div>';

        try {
            const { data, error } = await window.supabaseClient
                .from(tableName)
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            this.renderList(data);
        } catch (err) {
            console.error('Fetch error:', err);
            this.listContainer.innerHTML = '<div style="padding:1rem; color:#ff007a;">データの取得に失敗しました。</div>';
        }
    }

    renderList(items) {
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
                        <button onclick="masterManager.openEditModal('${item.id}', '${this.escapeHtml(item.name)}', ${item.sort_order})" 
                            style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; margin-right: 0.5rem;">
                            編集
                        </button>
                        <button onclick="masterManager.deleteItem('${item.id}', '${this.escapeHtml(item.name)}')" 
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
        document.getElementById('modalTitle').textContent = `${this.tableMap[this.currentTable]} - 新規追加`;
        document.getElementById('masterNameInput').value = '';
        document.getElementById('masterSortInput').value = '0';
        this.modal.style.display = 'flex';
    }

    openEditModal(id, name, sortOrder) {
        this.currentEditId = id;
        document.getElementById('modalTitle').textContent = `${this.tableMap[this.currentTable]} - 編集`;
        document.getElementById('masterNameInput').value = name;
        document.getElementById('masterSortInput').value = sortOrder;
        this.modal.style.display = 'flex';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.currentEditId = null;
    }

    async saveData() {
        const name = document.getElementById('masterNameInput').value.trim();
        const sortOrder = parseInt(document.getElementById('masterSortInput').value);

        if (!name) {
            alert('名称を入力してください');
            return;
        }

        const btn = document.getElementById('saveMasterBtn');
        btn.disabled = true;
        btn.textContent = '保存中...';

        try {
            let error;
            if (this.currentEditId) {
                // Update
                const res = await window.supabaseClient
                    .from(this.currentTable)
                    .update({ name, sort_order: sortOrder })
                    .eq('id', this.currentEditId);
                error = res.error;
            } else {
                // Insert
                const res = await window.supabaseClient
                    .from(this.currentTable)
                    .insert({ name, sort_order: sortOrder });
                error = res.error;
            }

            if (error) throw error;

            this.closeModal();
            this.loadTable(this.currentTable);

        } catch (err) {
            console.error('Save error:', err);
            alert('保存に失敗しました: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = '保存';
        }
    }

    async deleteItem(id, name) {
        if (!confirm(`「${name}」を削除してもよろしいですか？\n※このデータを使用しているメンバーがいる場合、表示がおかしくなる可能性があります。`)) return;

        try {
            const { error } = await window.supabaseClient
                .from(this.currentTable)
                .delete()
                .eq('id', id);

            if (error) throw error;

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
