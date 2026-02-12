import { createIcons, icons } from 'lucide';
import { meetingsApi } from '../../../api/meetings';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

document.addEventListener('DOMContentLoaded', async () => {
    renderAdminLayout({
        pageTitle: '議案・資料一覧',
        pageDescription: '理事会および常任理事会の議案・資料を確認できます。',
        content: getTemplateContent('page-template')
    });

    createIcons({ icons });

    await fetchMeetings();

    const addBtn = document.getElementById('addMeetingBtn');
    const modal = document.getElementById('meetingModal'); // ID要確認
    // 必要なら新規作成モーダル処理を追加
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            alert('新規会議作成機能は準備中です（必要であれば実装してください）');
        });
    }
});

async function fetchMeetings() {
    const grid = document.querySelector('.meeting-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="color:white; padding:2rem;">読み込み中...</div>';

    try {
        const meetings = await meetingsApi.getList();

        if (!meetings || meetings.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-dim); padding:2rem;">会議データがありません</div>';
            return;
        }

        grid.innerHTML = '';

        // 開催月ごとにグルーピング
        // 既存のデザインに合わせて、カード形式で表示
        meetings.forEach(meeting => {
            const date = new Date(meeting.meeting_date);
            const dateStr = date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });

            const card = document.createElement('a');
            card.href = `meeting-details.html?id=${meeting.id}`;
            card.className = 'meeting-card';
            card.innerHTML = `
                <div class="meeting-header">
                    <div class="meeting-badge ${meeting.category === '理事会' ? 'badge-board' : 'badge-standing'}">
                        ${meeting.category || 'その他'}
                    </div>
                    <div class="meeting-date">${dateStr}</div>
                </div>
                <div class="meeting-title">${meeting.title}</div>
                <div class="meeting-meta">
                    <span><i data-lucide="map-pin"></i> ${meeting.location || '場所未定'}</span>
                    <span><i data-lucide="clock"></i> ${meeting.start_time ? meeting.start_time.slice(0, 5) : '--:--'} - ${meeting.end_time ? meeting.end_time.slice(0, 5) : '--:--'}</span>
                </div>
            `;
            grid.appendChild(card);
        });

        createIcons({ icons });
    } catch (err) {
        console.error('Meetings fetch error:', err);
        grid.innerHTML = '<div style="color:#ff007a; padding:2rem;">データの読み込みに失敗しました</div>';
    }
}
