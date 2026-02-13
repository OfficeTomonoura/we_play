import '../../../styles/lp.css';
import '../../../styles/print.css';
import { createIcons, icons } from 'lucide';
import liff from '@line/liff';
import { authApi } from '../../../api/auth';
import { membersApi } from '../../../api/members';
import { applicantsApi } from '../../../api/applicants';

// State Variables
let state = {
    isLineLinked: false,
    isAdminLoggedIn: false,
    hasApplied: false,
    lineProfile: null,
    applicantData: null,
    adminName: null
};

// Config
const LIFF_ID = "2009015373-QGkjtgDJ";

document.addEventListener('DOMContentLoaded', async () => {
    // Initial Render
    createIcons({ icons });
    renderUI();

    // 1. Check Admin Session
    await checkAdminSession();

    // 2. Initialize LIFF
    await initLIFF();
});

async function checkAdminSession() {
    try {
        const session = await authApi.getSession();
        if (session) {
            state.isAdminLoggedIn = true;
            const member = await membersApi.getByAuthId(session.user.id);
            state.adminName = member ? member.full_name : '管理者';
        } else {
            state.isAdminLoggedIn = false;
        }
    } catch (err) {
        console.error('Error checking admin session:', err);
    }
    renderUI();
}

async function initLIFF() {
    try {
        await liff.init({ liffId: LIFF_ID });

        if (liff.isLoggedIn()) {
            state.isLineLinked = true;
            state.lineProfile = await liff.getProfile();
            await checkApplicationStatus(state.lineProfile.userId);
        } else {
            state.isLineLinked = false;
        }
    } catch (err) {
        console.warn('LIFF Init failed:', err);
    }
    renderUI();
}

async function checkApplicationStatus(lineUserId) {
    try {
        const data = await applicantsApi.getByLineUserId(lineUserId);

        if (data) {
            state.hasApplied = true;
            state.applicantData = data;
        } else {
            state.hasApplied = false;
        }
    } catch (err) {
        console.error('Error checking application status:', err);
    }
    renderUI();
}

/**
 * Global Handlers (attached to window for HTML compatibility)
 */
window.startLineLogin = () => {
    if (liff.isLoggedIn()) return;
    liff.login();
};

window.logoutLine = () => {
    if (liff.isLoggedIn()) {
        if (liff.isInClient()) {
            window.alert('LINEアプリ内ではログアウトできません。');
            return;
        }
        liff.logout();
        window.location.reload();
    }
};

window.logoutAdmin = async () => {
    await authApi.signOut();
    window.location.reload();
};

window.openStatusModal = () => {
    const modal = document.getElementById('statusModal');
    if (modal) {
        modal.style.display = 'flex';
        renderApplicantDetails();
    }
};

window.closeStatusModal = () => {
    const modal = document.getElementById('statusModal');
    if (modal) modal.style.display = 'none';
};

function renderApplicantDetails() {
    const container = document.getElementById('applicantDetailsContent');
    if (!container || !state.applicantData) return;

    const d = state.applicantData;
    let statusColor = '#a1a1aa';
    if (d.status === '採用' || d.status === '合格') statusColor = '#00f2ff';
    if (d.status === '不採用' || d.status === '不合格') statusColor = '#ff4b4b';
    if (d.status === '確認済み' || d.status === '審査中' || d.status === '新規') statusColor = '#ffea00';

    container.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 1.5rem; margin-top: 1rem; text-align: left;">
            <div style="margin-bottom: 1rem; font-size: 0.9rem; color: #aaa; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">登録内容</div>
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 1rem; font-size: 0.95rem;">
                <div style="color: #aaa;">お名前</div>
                <div style="color: white; font-weight: 500;">
                    ${d.full_name} 
                    <div style="font-size: 0.8em; color: #aaa; font-weight: normal;">${d.full_kana || ''}</div>
                </div>
                <div style="color: #aaa;">ステータス</div>
                <div style="color: ${statusColor}; font-weight: bold;">${d.status}</div>
             </div>
             <p style="margin-top:1rem; font-size:0.8rem; color:#aaa;">※詳細は運営事務局までお問い合わせください。</p>
        </div>
    `;
}

function renderUI() {
    const headerLeft = document.getElementById('header-left');
    const headerRight = document.getElementById('header-right');
    const ctaBtns = document.querySelectorAll('.btn-primary');

    if (!headerLeft || !headerRight) return;

    const logoHtml = '<div class="logo-brand">WE PLAY</div>';

    if (state.isLineLinked && state.lineProfile) {
        headerLeft.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
                ${logoHtml}
                <div style="display: flex; align-items: center; gap: 0.8rem; background: rgba(255, 255, 255, 0.1); padding: 0.3rem 1rem; border: 1px solid var(--orange); margin-top: 0.5rem;">
                    <div style="width: 24px; height: 24px; background: #06c755; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <img src="${state.lineProfile.pictureUrl}" alt="" style="width: 24px; height: 24px; border-radius: 50%;">
                    </div>
                    <div style="text-align: left; line-height: 1.2;">
                        <div style="font-size: 0.75rem; font-weight: bold; color: var(--white);">${state.lineProfile.displayName}</div>
                        <div style="font-size: 0.6rem; color: var(--orange);">連携済み</div>
                    </div>
                    <button onclick="logoutLine()" style="background: transparent; border: 1px solid #666; color: #aaa; font-size: 0.6rem; padding: 2px 6px; margin-left: 0.5rem; cursor: pointer;">解除</button>
                </div>
            </div>`;
    } else {
        headerLeft.innerHTML = logoHtml;
    }

    if (state.isAdminLoggedIn) {
        headerRight.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                    <a href="admin/dashboard.html" class="btn-login">
                        <i data-lucide="layout-dashboard"></i><span>管理者ポータル</span>
                    </a>
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #aaa;">
                        <span>${state.adminName || 'Admin'}</span>
                        <button onclick="logoutAdmin()" style="background: transparent; border: 1px solid #666; color: #aaa; padding: 2px 6px; cursor: pointer;">ログアウト</button>
                    </div>
                </div>`;
    } else {
        headerRight.innerHTML = `
                <a href="admin/login.html" class="btn-login">
                    <i data-lucide="log-in"></i><span>管理者ログイン</span>
                </a>`;
    }

    ctaBtns.forEach(btn => {
        if (btn.closest('#statusModal')) return;

        if (state.hasApplied) {
            btn.textContent = '申し込み状況の確認';
            btn.onclick = (e) => { e.preventDefault(); window.openStatusModal(); };
            btn.href = "javascript:void(0)";
        } else if (state.isLineLinked) {
            btn.textContent = '参加申し込み';
            btn.onclick = null;
            btn.href = "register.html";
        } else {
            btn.textContent = '参加申し込み';
            btn.onclick = (e) => {
                e.preventDefault();
                window.startLineLogin();
            };
            btn.href = "javascript:void(0)";
        }
    });

    createIcons({ icons });
}
