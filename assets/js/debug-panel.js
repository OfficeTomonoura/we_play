/**
 * UI Debug Panel
 * Allows switching between Desktop and Mobile (Simulator) views.
 */

(function () {
    // 1. Check if inside iframe (Simulator Mode)
    if (window.self !== window.top) {
        // Inside iframe: Do NOT render the panel
        console.log('Debug Panel: Running inside simulator.');
        return;
    }

    // 2. Insert HTML for Panel
    const panelHtml = `
        <div id="ui-debug-panel">
            <div class="debug-header">
                <span class="debug-title">DEBUG UI</span>
                <button class="debug-toggle" id="debug-minimize" title="Minimize">−</button>
            </div>
            <div class="debug-controls">
                <button class="debug-btn active" id="btn-desktop" title="Desktop View">PC</button>
                <button class="debug-btn" id="btn-mobile" title="Mobile View (375px)">SP</button>
            </div>
            
            <div class="debug-toggles">
                <div class="debug-toggle-row">
                    <span>LINE連携 (Login)</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="chk-login">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="debug-toggle-row">
                    <span>申し込み済み (Applied)</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="chk-applied">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="debug-toggle-row">
                    <span>管理者 (Admin)</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="chk-admin">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div style="font-size: 0.7rem; color: #666; text-align: right; margin-top: 5px;">
                ${window.innerWidth}px x ${window.innerHeight}px
            </div>
        </div>
    `;

    // 3. Insert HTML for Simulator Overlay
    const overlayHtml = `
        <div id="device-simulator-overlay" style="display: none;">
            <div class="device-frame">
                <iframe id="simulator-frame"></iframe>
            </div>
            <button class="simulator-close" id="btn-close-sim">Close Simulator</button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', panelHtml + overlayHtml);

    // 4. Logic
    const panel = document.getElementById('ui-debug-panel');
    const overlay = document.getElementById('device-simulator-overlay');
    const iframe = document.getElementById('simulator-frame');
    const btnDesktop = document.getElementById('btn-desktop');
    const btnMobile = document.getElementById('btn-mobile');
    const btnCloseSim = document.getElementById('btn-close-sim');
    const btnMinimize = document.getElementById('debug-minimize');

    const chkLogin = document.getElementById('chk-login');
    const chkApplied = document.getElementById('chk-applied');
    const chkAdmin = document.getElementById('chk-admin');

    // UI Update Logic
    function updateUI() {
        // Target documents: Main window AND iframe (if exists)
        const docs = [document];
        if (iframe.contentDocument) docs.push(iframe.contentDocument);

        docs.forEach(doc => {
            if (!doc) return;

            const headerLeft = doc.getElementById('header-left');
            const headerRight = doc.getElementById('header-right');
            const ctaBtns = doc.querySelectorAll('.btn-primary');
            const logoHtml = '<div class="logo-brand">WE PLAY</div>';

            // 1. Header Left (LINE Login State)
            if (headerLeft) {
                if (chkLogin.checked) {
                    // Unified height: Top row ~30px, Gap 0.5rem, Bottom row ~40px
                    headerLeft.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
                            <div style="height: 24px; display: flex; align-items: center;">${logoHtml}</div>
                            <div style="display: flex; align-items: center; gap: 0.8rem; background: rgba(255, 255, 255, 0.1); padding: 0 1rem; border: 1px solid var(--orange); height: 40px;">
                                <div style="width: 24px; height: 24px; background: #06c755; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <span style="font-size:12px; color:#fff;">U</span>
                                </div>
                                <div style="text-align: left; line-height: 1.1;">
                                    <div style="font-size: 0.75rem; font-weight: bold; color: #f0f0f0;">テストユーザー</div>
                                    <div style="font-size: 0.6rem; color: var(--orange);">連携済み</div>
                                </div>
                                <button style="background: transparent; border: 1px solid #666; color: #aaa; font-size: 0.6rem; padding: 2px 6px; margin-left: 0.5rem; cursor: pointer;">解除</button>
                            </div>
                        </div>`;
                } else {
                    headerLeft.innerHTML = logoHtml;
                }
            }

            // 2. Header Right (Admin State)
            if (headerRight) {
                if (chkAdmin.checked) {
                    headerRight.innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                            <div style="height: 24px; display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #aaa;">
                                <span>デバッグ管理者</span>
                                <button style="background: transparent; border: 1px solid #666; color: #aaa; padding: 2px 6px; cursor: pointer;">ログアウト</button>
                            </div>
                            <a href="javascript:void(0)" class="btn-login" onclick="alert('管理者ポータルへ遷移')" style="height: 40px; display: flex; align-items: center; box-sizing: border-box; margin: 0;">
                                <i data-lucide="layout-dashboard"></i><span>管理者ポータル</span>
                            </a>
                        </div>`;
                } else {
                    headerRight.innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                            <div style="height: 24px;"></div>
                            <a href="javascript:void(0)" class="btn-login" onclick="alert('管理者ログイン画面へ遷移')" style="height: 40px; display: flex; align-items: center; box-sizing: border-box; margin: 0;">
                                <i data-lucide="log-in"></i><span>管理者ログイン</span>
                            </a>
                        </div>`;
                }
            }

            // 3. CTA Buttons (Applied State)
            ctaBtns.forEach(btn => {
                // Skip footer link
                if (btn.textContent.includes('お問い合わせ') || btn.innerText.includes('お問い合わせ')) return;

                if (chkApplied.checked) {
                    btn.textContent = '申し込み状況の確認';
                    btn.style.background = ''; // Reset to default primary style
                    btn.style.pointerEvents = 'auto';
                    btn.style.opacity = '1';
                    btn.onclick = (e) => {
                        e.preventDefault();
                        openStatusModal(doc);
                    };
                    btn.href = "javascript:void(0)";
                } else {
                    btn.textContent = '参加申し込み';
                    btn.style.background = '';
                    btn.style.pointerEvents = 'auto';
                    btn.style.opacity = '1';
                    btn.onclick = () => alert('参加申し込みフローへ');
                    btn.href = "javascript:void(0)";
                }
            });

            // Status Modal Close Logic (Attach event once per doc)
            const closeBtn = doc.getElementById('closeStatusModal');
            if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
                closeBtn.addEventListener('click', () => {
                    const modal = doc.getElementById('statusModal');
                    if (modal) modal.style.display = 'none';
                });
                closeBtn.setAttribute('data-listener', 'true');
            }

            // Re-init icons
            if (window.lucide) window.lucide.createIcons();
            if (iframe.contentWindow && iframe.contentWindow.lucide) iframe.contentWindow.lucide.createIcons();
        });
    }

    // Modal Logic
    function openStatusModal(doc) {
        const modal = doc.getElementById('statusModal');
        const container = doc.getElementById('applicantDetailsContent');
        if (modal && container) {
            // Dummy Data
            const dummyData = {
                full_name: '山田 太郎',
                full_kana: 'ヤマダ タロウ',
                status: '審査中'
            };

            let statusColor = '#ffea00'; // Yellow for 審査中

            container.innerHTML = `
                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 1.5rem; margin-top: 1rem; text-align: left;">
                    <div style="margin-bottom: 1rem; font-size: 0.9rem; color: #aaa; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">登録内容</div>
                    <div style="display: grid; grid-template-columns: 80px 1fr; gap: 1rem; font-size: 0.95rem;">
                        <div style="color: #aaa;">お名前</div>
                        <div style="color: white; font-weight: 500;">
                            ${dummyData.full_name} 
                            <div style="font-size: 0.8em; color: #aaa; font-weight: normal;">${dummyData.full_kana}</div>
                        </div>
                        <div style="color: #aaa;">ステータス</div>
                        <div style="color: ${statusColor}; font-weight: bold;">${dummyData.status}</div>
                     </div>
                     <p style="margin-top:1rem; font-size:0.8rem; color:#aaa;">※詳細は運営事務局までお問い合わせください。</p>
                </div>
            `;
            modal.style.display = 'flex';
        }
    }

    // Event Listeners for Toggles
    [chkLogin, chkApplied, chkAdmin].forEach(chk => {
        chk.addEventListener('change', updateUI);
    });

    // Switch to Mobile
    btnMobile.addEventListener('click', () => {
        const currentUrl = window.location.href;
        iframe.src = currentUrl;

        // Sync state to iframe when loaded
        iframe.onload = () => {
            // Inject CSS for panel into iframe to hide duplicate panel inside
            const style = iframe.contentDocument.createElement('style');
            style.textContent = '#ui-debug-panel { display: none !important; }';
            iframe.contentDocument.head.appendChild(style);

            // Apply current UI state
            updateUI();
        };

        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        btnMobile.classList.add('active');
        btnDesktop.classList.remove('active');
    });

    // Close Mobile Simulator (Back to Desktop)
    function closeSimulator() {
        overlay.style.display = 'none';
        iframe.src = '';
        document.body.style.overflow = '';

        btnDesktop.classList.add('active');
        btnMobile.classList.remove('active');
    }

    btnDesktop.addEventListener('click', closeSimulator);
    btnCloseSim.addEventListener('click', closeSimulator);

    // Mimimize Panel
    btnMinimize.addEventListener('click', () => {
        panel.classList.toggle('minimized');
        btnMinimize.textContent = panel.classList.contains('minimized') ? '+' : '−';
    });
})();
