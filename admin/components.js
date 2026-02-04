/**
 * Admin Sidebar Component
 * 共通サイドバーを生成・制御するスクリプト
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Render UI components immediately so page is not blank
    try {
        renderSidebar();
        renderHeaderProfile();
        injectProfileModal();
    } catch (e) {
        console.error('UI Render Error:', e);
    }

    // 2. Check Auth Status (Async)
    try {
        await checkAuthStatus();
    } catch (e) {
        console.error('Auth Check Error:', e);
        // Fallback: redirects to login if checking fails might be too aggressive? 
        // Let's just log it for now, or maybe alert user.
    }
});

async function checkAuthStatus() {
    // Only run on dashboard pages (pages that use components.js)
    // We assume login, line_link, and member_registration do NOT use this file.
    if (!window.supabaseClient) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Check Member Status
    const { data: member } = await window.supabaseClient
        .from('members')
        .select('line_user_id, is_registered')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

    if (!member || !member.line_user_id) {
        window.location.href = 'line_link.html';
    } else if (!member.is_registered) {
        window.location.href = 'member_registration.html';
    }
    // If all good, proceed.
}

function renderSidebar() {
    const sidebarPlaceholder = document.getElementById('app-sidebar');
    if (!sidebarPlaceholder) return;

    const sidebarHTML = `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <span class="logo-text">WE PLAY</span>
                </div>
            </div>
            <nav class="sidebar-nav">
                <!-- MAIN Section -->
                <div class="nav-section">MAIN</div>
                <a href="index.html" class="nav-item" data-page="index.html">
                    <i data-lucide="layout-dashboard"></i> <span>ダッシュボード</span>
                </a>
                <a href="applicants.html" class="nav-item" data-page="applicants.html">
                    <i data-lucide="users"></i> <span>応募者一覧</span>
                </a>
                <a href="selected.html" class="nav-item" data-page="selected.html">
                    <i data-lucide="user-check"></i> <span>選抜者</span>
                </a>
                <a href="members.html" class="nav-item" data-page="members.html">
                    <i data-lucide="briefcase"></i> <span>参加者（正会員）</span>
                </a>
                <a href="collaborators.html" class="nav-item" data-page="collaborators.html">
                    <i data-lucide="heart"></i> <span>協力者一覧</span>
                </a>
                <a href="analysis.html" class="nav-item" data-page="analysis.html">
                    <i data-lucide="bar-chart-3"></i> <span>統計分析</span>
                </a>
                <a href="line.html" class="nav-item" data-page="line.html">
                    <i data-lucide="message-circle"></i> <span>LINE公式運用</span>
                </a>

                <!-- DOCUMENTS Section -->
                <div class="nav-section">DOCUMENTS</div>
                <div class="nav-item-container">
                    <div class="nav-item nav-item-toggle">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <i data-lucide="file-text"></i> <span>議案</span>
                        </div>
                        <i data-lucide="chevron-right" class="toggle-icon"></i>
                    </div>
                    <div class="nav-submenu">
                        <!-- 2段目: 理事会 -->
                        <div class="nav-item-container">
                            <div class="nav-item nav-item-toggle level-2">
                                <span>理事会</span>
                                <i data-lucide="chevron-right" class="toggle-icon"></i>
                            </div>
                            <div class="nav-submenu">
                                <a href="meeting-details.html" class="submenu-item level-3" data-page="meeting-details.html">第06回理事予定者会議</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第07回理事予定者会議</a>
                                <a href="meeting-details.html" class="submenu-item level-3">臨時理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第01回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第02回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第03回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第04回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第05回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第06回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第07回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第08回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第09回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第10回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第11回理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第12回理事会</a>
                            </div>
                        </div>
                        <!-- 2段目: 常任理事会 -->
                        <div class="nav-item-container">
                            <div class="nav-item nav-item-toggle level-2">
                                <span>常任理事会</span>
                                <i data-lucide="chevron-right" class="toggle-icon"></i>
                            </div>
                            <div class="nav-submenu">
                                <a href="meeting-details.html" class="submenu-item level-3">第01回常任理事会</a>
                                <a href="meeting-details.html" class="submenu-item level-3">第02回常任理事会</a>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- MANUAL Section -->
                <div class="nav-section">MANUAL</div>
                <div class="nav-item-container">
                    <div class="nav-item nav-item-toggle">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <i data-lucide="book-open"></i> <span>マニュアル</span>
                        </div>
                        <i data-lucide="chevron-right" class="toggle-icon"></i>
                    </div>
                    <div class="nav-submenu">
                        <a href="database.html" class="submenu-item" data-page="database.html">データベース設計</a>
                        <a href="manual_liff.html" class="submenu-item" data-page="manual_liff.html">LINE連携・LIFF実装</a>
                        <a href="manual_notify.html" class="submenu-item" data-page="manual_notify.html">LINE通知機能設定</a>
                    </div>
                </div>

                <!-- SYSTEM Section -->
                <div class="nav-section">SYSTEM</div>
                <a href="settings.html" class="nav-item" data-page="settings.html">
                    <i data-lucide="settings"></i> <span>設定</span>
                </a>

                <!-- OTHERS Section -->
                <div class="nav-section">OTHERS</div>
                <a href="../register.html" class="nav-item">
                    <i data-lucide="external-link"></i> <span>応募フォームを表示</span>
                </a>
            </nav>
            <div class="sidebar-footer">
                <button class="logout-btn">
                    <i data-lucide="log-out"></i> <span>ログアウト</span>
                </button>
            </div>
        </aside>
    `;

    sidebarPlaceholder.outerHTML = sidebarHTML;

    // Active State Logic
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    setActiveLink(currentPage);

    // Re-initialize functionality
    if (window.lucide) lucide.createIcons();
    initSidebarAccordion();
    initLogout();
}

async function renderHeaderProfile() {
    const profileContainer = document.querySelector('.user-profile');
    if (!profileContainer) return;

    let email = 'admin@example.com';
    let initials = 'AD';

    if (window.supabaseClient) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
            email = user.email;
            // Get initials from email or full_name if available (using email prefix for now)
            const prefix = email.split('@')[0];
            initials = prefix.substring(0, 2).toUpperCase();
        }
    }

    profileContainer.innerHTML = `
        <span class="user-email" style="color: var(--text-dim); font-size: 0.85rem; font-weight: 500;">${email}</span>
        <div class="avatar" id="headerAvatar" style="width: 40px; height: 40px; background: rgba(112, 0, 255, 0.1); border: 1px solid var(--secondary); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--primary); font-size: 0.9rem; cursor: pointer;">
            ${initials}
        </div>
    `;

    // Add click listener for My Page
    document.getElementById('headerAvatar').addEventListener('click', openProfileModal);
}

function injectProfileModal() {
    if (document.getElementById('userProfileModal')) return;

    const modalHTML = `
        <div id="userProfileModal" class="modal-overlay" style="display: none;">
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h3 style="display: flex; align-items: center; gap: 0.8rem;">
                        <i data-lucide="user-circle"></i> マイプロフィール
                    </h3>
                    <button class="close-modal" onclick="closeProfileModal()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 1.5rem 2rem;">
                    <form id="profileForm">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div class="form-group">
                                <label style="display: block; color: var(--text-dim); font-size: 0.75rem; margin-bottom: 0.4rem;">氏名</label>
                                <input type="text" id="profileName" required style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 0.6rem 0.8rem; border-radius: 8px; color: white; outline: none; font-size: 0.9rem;">
                            </div>
                            <div class="form-group">
                                <label style="display: block; color: var(--text-dim); font-size: 0.75rem; margin-bottom: 0.4rem;">ふりがな</label>
                                <input type="text" id="profileKana" required style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 0.6rem 0.8rem; border-radius: 8px; color: white; outline: none; font-size: 0.9rem;">
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; color: var(--text-dim); font-size: 0.75rem; margin-bottom: 0.4rem;">出身高校</label>
                            <input type="text" id="profileHighSchool" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 0.6rem 0.8rem; border-radius: 8px; color: white; outline: none; font-size: 0.9rem;">
                        </div>

                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; color: var(--text-dim); font-size: 0.75rem; margin-bottom: 0.4rem;">所属</label>
                            <select id="profileOrg" style="width: 100%; background: rgba(255,255,255,0.08); border: 1px solid var(--glass-border); padding: 0.6rem 0.8rem; border-radius: 8px; color: white; outline: none; font-size: 0.9rem;">
                                <option value="">選択してください</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label style="display: block; color: var(--text-dim); font-size: 0.75rem; margin-bottom: 0.4rem;">役職</label>
                            <select id="profilePos" style="width: 100%; background: rgba(255,255,255,0.08); border: 1px solid var(--glass-border); padding: 0.6rem 0.8rem; border-radius: 8px; color: white; outline: none; font-size: 0.9rem;">
                                <option value="">選択してください</option>
                            </select>
                        </div>

                        <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                            <button type="button" onclick="closeProfileModal()" style="flex: 1; padding: 0.8rem; border-radius: 12px; background: rgba(255,255,255,0.05); border: none; color: white; cursor: pointer;">キャンセル</button>
                            <button type="submit" id="saveProfileBtn" style="flex: 2; padding: 0.8rem; border-radius: 12px; background: var(--primary); border: none; color: #000; font-weight: bold; cursor: pointer;">プロフィール保存</button>
                        </div>
                    </form>

                    <!-- Password Change Section -->
                    <div style="border-top: 1px solid var(--glass-border); padding-top: 1.5rem; margin-top: 1rem;">
                        <h4 style="color: var(--text-dim); font-size: 0.8rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="key-round" style="width: 14px;"></i> パスワード変更
                        </h4>
                        <div id="passwordFields">
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label style="display: block; color: var(--text-dim); font-size: 0.75rem; margin-bottom: 0.4rem;">新しいパスワード (6文字以上)</label>
                                <input type="password" id="newPassword" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 0.6rem 0.8rem; border-radius: 8px; color: white; outline: none; font-size: 0.9rem;">
                            </div>
                            <div class="form-group" style="margin-bottom: 1.5rem;">
                                <label style="display: block; color: var(--text-dim); font-size: 0.75rem; margin-bottom: 0.4rem;">新しいパスワード (確認)</label>
                                <input type="password" id="confirmPassword" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 0.6rem 0.8rem; border-radius: 8px; color: white; outline: none; font-size: 0.9rem;">
                            </div>
                            <button type="button" id="updatePasswordBtn" onclick="updateUserPassword()" style="width: 100%; padding: 0.8rem; border-radius: 12px; background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); color: white; font-weight: bold; cursor: pointer; transition: all 0.3s;">
                                パスワードを更新する
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        saveProfileData();
    });
}

async function openProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (!modal || !window.supabaseClient) return;

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;

        // Fetch member data and master data in parallel
        // NO PROJECT ROLE fetch needed now
        const [memberRes, orgsRes, posRes] = await Promise.all([
            window.supabaseClient.from('members').select('*').eq('auth_user_id', user.id).single(),
            window.supabaseClient.from('master_organization').select('id, name').order('sort_order'),
            window.supabaseClient.from('master_position').select('id, name').order('sort_order')
        ]);

        if (memberRes.error) throw memberRes.error;
        const member = memberRes.data;

        // Populate Selects
        const populateSelect = (id, data, currentId) => {
            const select = document.getElementById(id);
            if (!select) return;
            let html = '<option value="">選択してください</option>';
            data.forEach(item => {
                html += `<option value="${item.id}" ${item.id === currentId ? 'selected' : ''}>${item.name}</option>`;
            });
            select.innerHTML = html;
        };

        populateSelect('profileOrg', orgsRes.data || [], member.organization_id);
        populateSelect('profilePos', posRes.data || [], member.position_id);

        document.getElementById('profileName').value = member.full_name || '';
        document.getElementById('profileKana').value = member.full_kana || '';
        document.getElementById('profileHighSchool').value = member.high_school || '';

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error('Profile Load Error:', err);
        alert('プロフィールの読み込みに失敗しました。');
    }
}

function closeProfileModal() {
    document.getElementById('userProfileModal').style.display = 'none';
}

async function saveProfileData() {
    const btn = document.getElementById('saveProfileBtn');
    const name = document.getElementById('profileName').value.trim();
    const kana = document.getElementById('profileKana').value.trim();
    const highSchool = document.getElementById('profileHighSchool').value.trim();
    const organization_id = document.getElementById('profileOrg').value;
    const position_id = document.getElementById('profilePos').value;
    // const project_role_id = document.getElementById('profileProjectRole').value; // Removed

    if (!name || !kana) return;

    btn.disabled = true;
    btn.textContent = '保存中...';

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();

        const { error } = await window.supabaseClient
            .from('members')
            .update({
                full_name: name,
                full_kana: kana,
                high_school: highSchool,
                organization_id: organization_id || null,
                position_id: position_id || null
                // project_role_id: project_role_id || null // Removed
            })
            .eq('auth_user_id', user.id);

        if (error) throw error;

        if (window.showToast) {
            window.showToast('プロフィールを更新しました', 'success');
        } else {
            alert('プロフィールを更新しました。');
        }

        closeProfileModal();
        // Refresh initials in header
        renderHeaderProfile();
    } catch (err) {
        console.error('Profile Save Error:', err);
        if (window.showToast) {
            window.showToast('保存に失敗しました: ' + err.message, 'error');
        } else {
            alert('保存に失敗しました: ' + err.message);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'プロフィール保存';
    }
}

async function updateUserPassword() {
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    const btn = document.getElementById('updatePasswordBtn');

    if (!newPass) {
        window.showToast ? window.showToast('新しいパスワードを入力してください', 'error') : alert('新しいパスワードを入力してください');
        return;
    }
    if (newPass.length < 6) {
        window.showToast ? window.showToast('パスワードは6文字以上で設定してください', 'error') : alert('パスワードは6文字以上で設定してください');
        return;
    }
    if (newPass !== confirmPass) {
        window.showToast ? window.showToast('パスワードが一致しません', 'error') : alert('パスワードが一致しません');
        return;
    }

    if (!confirm('パスワードを更新してもよろしいですか？')) return;

    btn.disabled = true;
    btn.textContent = '更新中...';

    try {
        const { error } = await window.supabaseClient.auth.updateUser({
            password: newPass
        });

        if (error) throw error;

        if (window.showToast) {
            window.showToast('パスワードを更新しました', 'success');
        } else {
            alert('パスワードを更新しました');
        }

        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';

    } catch (err) {
        console.error('Password Update Error:', err);
        if (window.showToast) {
            window.showToast('エラーが発生しました: ' + err.message, 'error');
        } else {
            alert('エラーが発生しました: ' + err.message);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'パスワードを更新する';
    }
}

function setActiveLink(currentPage) {
    // 1. 完全一致で探す
    const links = document.querySelectorAll(`a[href="${currentPage}"], a[data-page="${currentPage}"]`);

    links.forEach(link => {
        link.classList.add('active');

        // 親メニューを開く処理
        let parent = link.parentElement;
        while (parent && !parent.classList.contains('sidebar-nav')) {
            if (parent.classList.contains('nav-submenu')) {
                parent.classList.add('open');
                // そのサブメニューのトグルボタンも開く状態にする
                const toggleContainer = parent.previousElementSibling;
                if (toggleContainer && toggleContainer.classList.contains('nav-item-toggle')) {
                    toggleContainer.classList.add('open');
                }
                // さらに親のnav-item-containerを探すため続行
            }
            if (parent.classList.contains('nav-item-container')) {
                const toggle = parent.querySelector('.nav-item-toggle');
                if (toggle) toggle.classList.add('open');

                const submenu = parent.querySelector('.nav-submenu');
                if (submenu) submenu.classList.add('open');
            }
            parent = parent.parentElement;
        }
    });
}

function initSidebarAccordion() {
    const toggles = document.querySelectorAll('.nav-item-toggle');
    toggles.forEach(toggle => {
        // 重複登録防止
        if (toggle.hasAttribute('data-init')) return;
        toggle.setAttribute('data-init', 'true');

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();

            const container = toggle.parentElement;
            const submenu = container.querySelector('.nav-submenu');

            if (submenu) {
                const isOpen = submenu.classList.contains('open');

                // 他の開いているメニューを閉じる（オプション: 必要に応じて有効化）
                // closeOtherMenus(container);

                if (isOpen) {
                    // 閉じる：高さを現在の pixel から 0 に
                    submenu.style.maxHeight = submenu.scrollHeight + "px"; // 一旦固定値にする
                    requestAnimationFrame(() => {
                        submenu.style.maxHeight = "0px";
                        toggle.classList.remove('open');
                        submenu.classList.remove('open');
                    });
                } else {
                    // 開く
                    toggle.classList.add('open');
                    submenu.classList.add('open');
                    submenu.style.maxHeight = submenu.scrollHeight + "px";

                    // アニメーション完了後に max-height を解除（ネスト対応やリサイズ対応のため）
                    submenu.addEventListener('transitionend', () => {
                        if (submenu.classList.contains('open')) {
                            submenu.style.maxHeight = 'none';
                        }
                    }, { once: true });
                }
            }
        });
    });
}

function initLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (window.supabaseClient) {
                await window.supabaseClient.auth.signOut();
            }
            window.location.href = '../index.html';
        });
    }
}

/**
 * Global Toast Notification
 * @param {string} message 
 * @param {'success'|'error'|'info'} type 
 */
window.showToast = function (message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check';
    if (type === 'error') iconName = 'alert-circle';

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconName}" style="width: 16px; height: 16px;"></i>
        </div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Icon render
    if (window.lucide) lucide.createIcons();

    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
};
