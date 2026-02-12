import { createIcons, icons } from 'lucide';
import { lineApi } from '../../../api/line';
import { authApi } from '../../../api/auth';
import { membersApi } from '../../../api/members';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';
import flatpickr from "flatpickr";
import { Japanese } from "flatpickr/dist/l10n/ja.js";
import "flatpickr/dist/flatpickr.min.css";
import "flatpickr/dist/themes/dark.css";

document.addEventListener('DOMContentLoaded', () => {
    renderAdminLayout({
        pageTitle: 'LINE公式運用',
        pageDescription: '対外向け・対内向けのLINEメッセージを作成・配信します。',
        content: getTemplateContent('page-template'),
        activeNav: 'line.html'
    });

    createIcons({ icons });
    initLinePage();
});

function initLinePage() {
    // 2026 Japanese Holidays
    const HOLIDAYS_2026 = [
        '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20',
        '2026-03-21', '2026-04-29', '2026-05-03', '2026-05-04', '2026-05-05',
        '2026-05-06', '2026-07-20', '2026-08-11', '2026-09-21', '2026-09-22',
        '2026-09-23', '2026-10-12', '2026-11-03', '2026-11-23',
    ];

    function isJapaneseHoliday(date) {
        const dateStr = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
        return HOLIDAYS_2026.includes(dateStr);
    }

    function validateDateTime(date) {
        const day = date.getDay();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const timeVal = hours * 100 + minutes;
        if (day === 0 || day === 6) return false;
        if (isJapaneseHoliday(date)) return false;
        if (timeVal >= 930 && timeVal <= 2030) return true;
        return false;
    }

    const titleInput = document.getElementById('messageTitle');
    const bodyInput = document.getElementById('messageBody');
    const previewTitle = document.getElementById('previewTitle');
    const previewBody = document.getElementById('previewBody');
    const previewTime = document.getElementById('previewTime');
    const previewDate = document.getElementById('previewDate');
    const titleCount = document.getElementById('titleCount');
    const bodyCount = document.getElementById('bodyCount');
    const recipientInfo = document.getElementById('recipientInfo');
    const dateInput = document.getElementById('sendDate');
    const timeInput = document.getElementById('sendTime');
    const dateTimeError = document.getElementById('dateTimeError');

    const fpDate = flatpickr("#sendDate", {
        locale: Japanese,
        dateFormat: "Y-m-d",
        minDate: "today",
        disable: [
            function (date) {
                return (date.getDay() === 0 || date.getDay() === 6 || isJapaneseHoliday(date));
            }
        ],
        onChange: function () {
            checkAndAlertDateTime();
        }
    });

    const fpTime = flatpickr("#sendTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        onChange: function () {
            checkAndAlertDateTime();
        }
    });

    function checkAndAlertDateTime() {
        const dateVal = dateInput.value;
        const timeVal = timeInput.value;
        if (!dateVal || !timeVal) return;
        const date = new Date(`${dateVal}T${timeVal}`);
        const now = new Date();
        const errorSpan = dateTimeError.querySelector('span');
        let errorMessage = "";
        if (date < now) {
            errorMessage = "過去の日時は指定できません";
        } else if (!validateDateTime(date)) {
            errorMessage = "指定できない日時（祝日・時間外）が選択されています";
        }
        if (errorMessage) {
            errorSpan.textContent = errorMessage;
            dateTimeError.style.display = 'flex';
            dateInput.style.borderColor = '#ff4d4d';
            timeInput.style.borderColor = '#ff4d4d';
        } else {
            dateTimeError.style.display = 'none';
            dateInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            timeInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
        updatePreviewDateTime(date);
    }

    function updatePreviewDateTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const weekday = weekdays[date.getDay()];
        previewTime.textContent = `${hours}:${minutes}`;
        previewDate.textContent = `${month}/${day}(${weekday})`;
    }

    function setDefaultDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        fpDate.setDate(`${year}-${month}-${day}`);
        fpTime.setDate(`${hours}:${minutes}`);
        checkAndAlertDateTime();
    }
    setDefaultDateTime();

    titleInput.addEventListener('input', (e) => {
        const value = e.target.value;
        previewTitle.textContent = value || 'タイトルがここに表示されます';
        titleCount.textContent = value.length;
    });

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    function linkify(text) {
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlPattern, '<a href="$1" target="_blank" class="preview-link">$1</a>');
    }

    bodyInput.addEventListener('input', (e) => {
        const value = e.target.value;
        const isAdminBypass = value.startsWith('/admin');
        if (isAdminBypass) {
            fpDate.set('minDate', null);
            fpDate.set('disable', []);
        } else {
            fpDate.set('minDate', 'today');
            fpDate.set('disable', [
                function (date) {
                    return (date.getDay() === 0 || date.getDay() === 6 || isJapaneseHoliday(date));
                }
            ]);
        }
        if (!value) {
            previewBody.textContent = '本文がここに表示されます';
        } else {
            const escaped = escapeHTML(value);
            previewBody.innerHTML = linkify(escaped);
        }
        bodyCount.textContent = value.length;
        checkAndAlertDateTime();
    });

    const targetRadios = document.querySelectorAll('input[name="target"]');
    targetRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'external') {
                recipientInfo.textContent = '対外向け: 応募者・選抜者';
            } else {
                recipientInfo.textContent = '対内向け: 正会員';
            }
        });
    });

    window.sendMessage = async function () {
        let body = bodyInput.value.trim();
        const title = titleInput.value.trim();
        const target = document.querySelector('input[name="target"]:checked').value;
        const dateVal = dateInput.value;
        const timeVal = timeInput.value;

        if (!dateVal || !timeVal) {
            alert('送信日時を指定してください。');
            return;
        }

        const sendDateTimeObj = new Date(`${dateVal}T${timeVal}`);
        const sendTime = sendDateTimeObj.toISOString();
        const now = new Date();

        const isAdminBypass = body.startsWith('/admin');
        if (isAdminBypass) {
            body = body.replace(/^\/admin\n?/, '').trim();
        }

        let validationMsg = "";
        if (sendDateTimeObj < now) {
            validationMsg = '過去の日時は指定できません';
        } else if (!validateDateTime(sendDateTimeObj)) {
            validationMsg = '配信可能時間外です（平日 9:30-20:30）';
        }

        if (validationMsg && !isAdminBypass) {
            alert(validationMsg);
            return;
        }

        if (!title || !body) {
            alert('タイトルと本文を入力してください。');
            return;
        }

        showConfirmModal('new', {
            title,
            body,
            target: target === 'external' ? '対外向け' : '対内向け',
            schedule: `${previewDate.textContent} ${previewTime.textContent}`,
            execute: async () => {
                closeConfirmModal();
                try {
                    const session = await authApi.getSession();
                    const user = session?.user;
                    if (!user) throw new Error('ログインユーザーの情報が取得できません。');

                    await lineApi.createMessage({
                        title: title,
                        message_body: body,
                        target_type: target,
                        scheduled_at: sendTime,
                        status: 'pending',
                        created_by: user.id
                    });

                    showSuccessModal();
                    titleInput.value = '';
                    bodyInput.value = '';
                    setDefaultDateTime();
                    loadMessages();
                    createIcons({ icons });
                } catch (err) {
                    alert('エラーが発生しました: ' + (err.message || '不明なエラー'));
                }
            }
        });
    };

    window.closeConfirmModal = function () {
        document.getElementById('confirmApprovalModal').classList.remove('active');
    };

    window.closeSuccessModal = function () {
        document.getElementById('successModal').classList.remove('active');
    };

    function showConfirmModal(type, data) {
        document.getElementById('confirmTitle').textContent = data.title;
        document.getElementById('confirmTarget').textContent = data.target;
        document.getElementById('confirmSchedule').textContent = data.schedule;
        document.getElementById('confirmBody').textContent = data.body;
        const finalBtn = document.getElementById('finalConfirmBtn');
        finalBtn.innerHTML = type === 'new' ? '<i data-lucide="check-circle"></i> 依頼を確定する' : '<i data-lucide="save"></i> 修正内容で依頼';
        finalBtn.onclick = data.execute;
        document.getElementById('confirmApprovalModal').classList.add('active');
        createIcons({ icons });
    }

    function showSuccessModal() {
        document.getElementById('successModal').classList.add('active');
        createIcons({ icons });
    }

    async function loadMessages() {
        try {
            const allPending = await lineApi.getMessagesByStatus('pending');
            const now = new Date();
            const expiredIds = allPending?.filter(m => new Date(m.scheduled_at) < now).map(m => m.id);
            if (expiredIds?.length > 0) {
                await lineApi.batchUpdateStatus(expiredIds, {
                    status: 'rejected',
                    rejection_comment: '送信予定日時を経過したため、自動的に修正待ちとなりました。'
                });
            }

            const members = await membersApi.getList();
            const memberMap = {};
            members?.forEach(m => { if (m.auth_user_id) memberMap[m.auth_user_id] = m.full_name; });
            const getName = (userId) => memberMap[userId] || '不明';

            // Revision
            const revision = await lineApi.getMessagesByStatus('rejected');
            document.getElementById('revisionNeededBody').innerHTML = revision?.length > 0 ? revision.map(m => `
                <tr>
                    <td><a class="clickable-title" onclick="viewMessage('${m.id}')">${m.title}</a></td>
                    <td>${m.target_type === 'external' ? '対外向け' : '対内向け'}</td>
                    <td>${getName(m.created_by)}</td>
                    <td>${getName(m.approved_by)}</td>
                    <td><span class="badge-status badge-revision">修正待ち</span></td>
                    <td style="text-align: center;">
                        <button class="btn-action btn-danger-ghost" onclick="viewCommentOnly('${m.id}')">
                            <i data-lucide="message-square"></i>
                        </button>
                    </td>
                    <td style="text-align: right;">
                        <div class="action-group">
                            <button class="btn-action btn-primary-ghost" onclick="editMessage('${m.id}')"><i data-lucide="edit-3"></i>編集</button>
                            <button class="btn-action btn-danger-ghost" onclick="deleteMessage('${m.id}')"><i data-lucide="trash-2"></i>削除</button>
                        </div>
                    </td>
                </tr>
            `).join('') : '<tr><td colspan="7" style="text-align:center; opacity:0.5;">データがありません</td></tr>';

            // Waiting Approval
            const waiting = await lineApi.getMessagesByStatus('pending');
            document.getElementById('waitingApprovalBody').innerHTML = waiting?.length > 0 ? waiting.map(m => {
                const d = new Date(m.scheduled_at);
                return `
                <tr>
                    <td><a class="clickable-title" onclick="viewMessage('${m.id}')">${m.title}</a></td>
                    <td>${m.target_type === 'external' ? '対外向け' : '対内向け'}</td>
                    <td>${d.toLocaleDateString('ja-JP')}</td>
                    <td>${d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${getName(m.created_by)}</td>
                    <td>${new Date(m.created_at).toLocaleDateString('ja-JP')}</td>
                    <td><span class="badge-status badge-waiting">承認待ち</span></td>
                    <td style="text-align: right;">
                        <div class="action-group">
                            <button class="btn-action btn-primary-ghost" onclick="approveMessage('${m.id}')"><i data-lucide="check"></i>承認</button>
                            <button class="btn-action btn-warning-ghost" onclick="requestRevision('${m.id}')"><i data-lucide="message-square"></i>修正依頼</button>
                            <button class="btn-action btn-danger-ghost" onclick="deleteMessage('${m.id}')"><i data-lucide="trash-2"></i>削除</button>
                        </div>
                    </td>
                </tr>`;
            }).join('') : '<tr><td colspan="8" style="text-align:center; opacity:0.5;">データがありません</td></tr>';

            // Scheduled
            const scheduled = await lineApi.getMessagesByStatus('scheduled');
            document.getElementById('scheduledMessageBody').innerHTML = scheduled?.length > 0 ? scheduled.map(m => {
                const sd = new Date(m.scheduled_at);
                const ad = new Date(m.approved_at);
                return `
                <tr>
                    <td><a class="clickable-title" onclick="viewMessage('${m.id}')">${m.title}</a></td>
                    <td>${m.target_type === 'external' ? '対外向け' : '対内向け'}</td>
                    <td>${sd.toLocaleDateString('ja-JP')}</td>
                    <td>${sd.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${getName(m.approved_by)}</td>
                    <td>${ad.toLocaleDateString('ja-JP')}</td>
                    <td>${ad.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span class="badge-status badge-scheduled">送信待ち</span></td>
                    <td style="text-align: right;">
                        <div class="action-group">
                            <button class="btn-action btn-primary-ghost" onclick="broadcastMessage('${m.id}')"><i data-lucide="send"></i>今すぐ配信</button>
                            <button class="btn-action btn-secondary-ghost" onclick="unapproveMessage('${m.id}')"><i data-lucide="rotate-ccw"></i>承認取消</button>
                        </div>
                    </td>
                </tr>`;
            }).join('') : '<tr><td colspan="9" style="text-align:center; opacity:0.5;">データがありません</td></tr>';

            // Sent
            const sent = await lineApi.getMessagesByStatus('sent');
            document.getElementById('sentMessageBody').innerHTML = sent?.length > 0 ? sent.map(m => {
                const ad = new Date(m.approved_at);
                return `
                <tr>
                    <td><a class="clickable-title" onclick="viewMessage('${m.id}')">${m.title}</a></td>
                    <td>${m.target_type === 'external' ? '対外向け' : '対内向け'}</td>
                    <td>${ad.toLocaleDateString('ja-JP')}</td>
                    <td>${ad.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span class="badge-status" style="background:rgba(0,255,122,0.1); color:#00ff7a;">送信済み</span></td>
                    <td style="text-align: right;">
                        <button class="btn-action btn-secondary-ghost" onclick="viewMessage('${m.id}')"><i data-lucide="eye"></i>表示</button>
                    </td>
                </tr>`;
            }).join('') : '<tr><td colspan="6" style="text-align:center; opacity:0.5;">データがありません</td></tr>';

            // Received
            const received = await lineApi.getReceivedMessages();
            document.getElementById('receivedMessageBody').innerHTML = received?.length > 0 ? received.map(m => `
                <tr>
                    <td style="font-family:monospace; font-size:0.8rem; opacity:0.7;">${m.line_user_id}</td>
                    <td style="max-width:400px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.message_text}</td>
                    <td>${new Date(m.received_at).toLocaleString('ja-JP')}</td>
                    <td style="text-align: right;">
                        <button class="btn-action btn-secondary-ghost"><i data-lucide="message-square"></i>返信(未実装)</button>
                    </td>
                </tr>
            `).join('') : '<tr><td colspan="4" style="text-align:center; opacity:0.5;">受信履歴はありません</td></tr>';

            createIcons({ icons });
        } catch (err) { console.error('Load Messages Error:', err); }
    }
    loadMessages();

    window.editMessage = async function (id) {
        try {
            const m = await lineApi.getMessageById(id);
            if (!m) throw new Error('Message not found');
            titleInput.value = m.title;
            bodyInput.value = m.message_body;
            document.querySelector(`input[name="target"][value="${m.target_type}"]`).checked = true;
            const d = new Date(m.scheduled_at);
            fpDate.setDate(d);
            fpTime.setDate(d);
            titleInput.dispatchEvent(new Event('input'));
            bodyInput.dispatchEvent(new Event('input'));
            recipientInfo.textContent = m.target_type === 'external' ? '対外向け: 応募者・選抜者' : '対内向け: 正会員';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) { alert('エラー: ' + err.message); }
    };

    window.deleteMessage = function (id) {
        const modal = document.getElementById('deleteConfirmModal');
        const finalBtn = document.getElementById('finalDeleteBtn');
        window.closeDeleteModal = () => modal.classList.remove('active');
        finalBtn.onclick = async () => {
            try {
                await lineApi.deleteMessage(id);
                modal.classList.remove('active');
                loadMessages();
            } catch (err) { alert('削除エラー: ' + err.message); }
        };
        modal.classList.add('active');
        createIcons({ icons });
    };

    window.approveMessage = function (id) {
        const modal = document.getElementById('approveConfirmModal');
        const finalBtn = document.getElementById('finalApproveBtn');
        window.closeApproveModal = () => modal.classList.remove('active');
        finalBtn.onclick = async () => {
            const originalContent = finalBtn.innerHTML;
            finalBtn.disabled = true;
            finalBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> 処理中...';
            createIcons({ icons });
            try {
                const session = await authApi.getSession();
                const user = session?.user;
                if (!user) throw new Error('Auth Error');

                await lineApi.updateMessage(id, {
                    status: 'scheduled',
                    approved_by: user.id,
                    approved_at: new Date().toISOString()
                });
                modal.classList.remove('active');
                loadMessages();
            } catch (err) { alert('承認エラー: ' + err.message); }
            finally {
                finalBtn.disabled = false;
                finalBtn.innerHTML = originalContent;
                createIcons({ icons });
            }
        };
        modal.classList.add('active');
        createIcons({ icons });
    };

    let targetRevisionId = null;
    window.requestRevision = function (id) {
        targetRevisionId = id;
        document.getElementById('rejectionCommentInput').value = '';
        document.getElementById('revisionRequestModal').classList.add('active');
        createIcons({ icons });
    };

    window.closeRevisionModal = function () {
        document.getElementById('revisionRequestModal').classList.remove('active');
        targetRevisionId = null;
    };

    window.submitRevision = async function () {
        const comment = document.getElementById('rejectionCommentInput').value.trim();
        if (!comment) { alert('修正が必要な理由を入力してください。'); return; }
        try {
            const session = await authApi.getSession();
            const user = session?.user;
            if (!user) throw new Error('Auth Error');

            await lineApi.updateMessage(targetRevisionId, {
                status: 'rejected',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                rejection_comment: comment
            });
            alert('修正依頼を出しました。');
            closeRevisionModal();
            loadMessages();
        } catch (err) { alert('エラー: ' + err.message); }
    };

    window.unapproveMessage = async function (id) {
        if (!confirm('承認を取り消しますか？\nメッセージは「承認待ちリスト」へ戻ります。')) return;
        try {
            await lineApi.updateMessage(id, { status: 'pending' });
            alert('承認を取り消しました。');
            loadMessages();
        } catch (err) { alert('エラー: ' + err.message); }
    };

    window.viewMessage = async function (id) {
        try {
            const m = await lineApi.getMessageById(id);
            if (!m) throw new Error('Message not found');
            document.getElementById('detailTitle').textContent = m.title;
            document.getElementById('detailTarget').textContent = m.target_type === 'external' ? '対外向け' : '対内向け';
            const statusMap = { 'pending': '承認待ち', 'scheduled': '送信待ち', 'sent': '送信済み', 'rejected': '修正待ち' };
            document.getElementById('detailStatus').textContent = statusMap[m.status] || m.status;
            document.getElementById('dateLabel').textContent = m.status === 'sent' ? '完了日' : '予定日';
            document.getElementById('timeLabel').textContent = m.status === 'sent' ? '完了時間' : '時間';
            const d = new Date(m.status === 'sent' ? m.approved_at : m.scheduled_at);
            document.getElementById('detailDate').textContent = d.toLocaleDateString('ja-JP');
            document.getElementById('detailTime').textContent = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('detailPreviewTitle').textContent = m.title;
            document.getElementById('detailPreviewBody').innerHTML = linkify(escapeHTML(m.message_body));
            const revArea = document.getElementById('detailRevisionArea');
            if (m.status === 'rejected' && m.rejection_comment) {
                document.getElementById('detailRevisionComment').textContent = m.rejection_comment;
                revArea.style.display = 'block';
            } else {
                revArea.style.display = 'none';
            }
            document.getElementById('messageDetailModal').classList.add('active');
            createIcons({ icons });
        } catch (err) { alert('エラー: ' + err.message); }
    };

    window.closeMessageDetail = function () {
        document.getElementById('messageDetailModal').classList.remove('active');
    };

    window.viewCommentOnly = function (id) {
        window.viewMessage(id);
    };

    window.broadcastMessage = async function (id) {
        if (!confirm('このメッセージの配信を実行しますか？\n実行後は取り消せません。')) return;
        try {
            await lineApi.broadcastMessage(id);
            alert('配信を完了しました！');
            loadMessages();
        } catch (err) { alert('配信エラー: ' + err.message); }
    };
}
