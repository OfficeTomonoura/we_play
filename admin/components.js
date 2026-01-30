/**
 * Admin Sidebar Component
 * 共通サイドバーを生成・制御するスクリプト
 */

document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
});

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
                <a href="#" class="nav-item">
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
                        <i data-lucide="book-open"></i> <span>マニュアル</span>
                        <i data-lucide="chevron-right" class="toggle-icon"></i>
                    </div>
                    <div class="nav-submenu">
                        <a href="database.html" class="submenu-item" data-page="database.html">データベース設計</a>
                        <a href="manual_liff.html" class="submenu-item" data-page="manual_liff.html">LINE連携・LIFF実装</a>
                    </div>
                </div>

                <!-- SYSTEM Section -->
                <div class="nav-section">SYSTEM</div>
                <a href="#" class="nav-item">
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
        logoutBtn.addEventListener('click', () => {
            if (confirm('ログアウトしますか？')) {
                window.location.href = '../index.html';
            }
        });
    }
}
