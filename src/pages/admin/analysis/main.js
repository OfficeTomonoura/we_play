import { createIcons, icons } from 'lucide';
import Chart from 'chart.js/auto';
import { applicantsApi } from '../../../api/applicants';
import { membersApi } from '../../../api/members';
import { masterApi } from '../../../api/master';
import { collaboratorsApi } from '../../../api/collaborators';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';

document.addEventListener('DOMContentLoaded', async () => {
    renderAdminLayout({
        pageTitle: '統計分析',
        pageDescription: '募集データの傾向を多角的に分析し、事業運営の意思決定をサポートします。',
        content: getTemplateContent('page-template')
    });

    createIcons({ icons });

    await initAnalysis();
});

async function initAnalysis() {
    try {
        const applicants = await applicantsApi.getAllForAnalysis();
        const members = await membersApi.getAllForAnalysis();
        const orgs = await masterApi.getOrganizations();
        const collaboratorCount = await collaboratorsApi.getCount();

        // エラーハンドリングはAPI内で行われるが、undefinedなら中断
        if (!applicants) return;

        const totalApplicantsEl = document.getElementById('total-applicants');
        if (totalApplicantsEl) totalApplicantsEl.textContent = applicants.length;

        const selectedCountEl = document.getElementById('selected-count');
        if (selectedCountEl) selectedCountEl.textContent = applicants.filter(a => a.status === '選抜済').length;

        const totalMembersEl = document.getElementById('total-members');
        if (totalMembersEl) totalMembersEl.textContent = members?.length || 0;

        const totalCollaboratorsEl = document.getElementById('total-collaborators');
        if (totalCollaboratorsEl) totalCollaboratorsEl.textContent = collaboratorCount || 0;

        renderTrendChart(applicants);
        renderGradeChart(applicants);
        renderGenderChart(applicants);
        renderFunnelChart(applicants);
        renderRoleChart(applicants);
        renderSchoolChart(applicants);
        renderCommitteeChart(members, orgs);
        renderReferralChart(applicants);
    } catch (err) { console.error('Analysis Error:', err); }
}

function renderTrendChart(data) {
    const ctx = document.getElementById('cumulativeTrendChart');
    if (!ctx) return;
    const sortedData = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const labels = [];
    const counts = [];
    let cumulative = 0;
    const dailyData = {};
    sortedData.forEach(a => { const date = a.created_at.split('T')[0]; dailyData[date] = (dailyData[date] || 0) + 1; });
    Object.entries(dailyData).forEach(([date, count]) => {
        cumulative += count;
        labels.push(date.split('-').slice(1).join('/'));
        counts.push(cumulative);
    });
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: '累計応募数', data: counts, backgroundColor: 'rgba(0, 242, 255, 0.4)', borderColor: '#00f2ff', borderWidth: 1, borderRadius: 5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)', precision: 0, stepSize: 1 } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderGradeChart(data) {
    const ctx = document.getElementById('gradeChart');
    if (!ctx) return;
    const counts = {};
    data.forEach(a => { const g = a.grade || '未設定'; counts[g] = (counts[g] || 0) + 1; });
    new Chart(ctx, {
        type: 'bar',
        data: { labels: Object.keys(counts), datasets: [{ label: '人数', data: Object.values(counts), backgroundColor: 'rgba(0, 242, 255, 0.5)', borderRadius: 5 }] },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { precision: 0, stepSize: 1 } },
                y: { display: true, ticks: { color: '#fff' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderGenderChart(data) {
    const ctx = document.getElementById('genderChart');
    if (!ctx) return;
    const counts = {};
    data.forEach(a => { const g = a.gender || '他/未回答'; counts[g] = (counts[g] || 0) + 1; });
    new Chart(ctx, {
        type: 'doughnut',
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#7000ff', '#ff007a', '#00f2ff', '#ffea00'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#fff' } } }, cutout: '65%' }
    });
}

function renderFunnelChart(data) {
    const ctx = document.getElementById('funnelChart');
    if (!ctx) return;
    const stages = {
        '全応募': data.length,
        '確認済み': data.filter(a => ['確認済み', '選抜済'].includes(a.status)).length,
        '選抜済': data.filter(a => a.status === '選抜済').length
    };
    new Chart(ctx, {
        type: 'bar',
        data: { labels: Object.keys(stages), datasets: [{ data: Object.values(stages), backgroundColor: ['rgba(0,242,255,0.2)', 'rgba(0,242,255,0.5)', 'rgba(0,242,255,0.8)'], borderRadius: 10 }] },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            scales: { x: { display: false }, y: { ticks: { color: '#fff', font: { weight: 'bold' } }, grid: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderRoleChart(data) {
    const ctx = document.getElementById('roleDistributionChart');
    if (!ctx) return;
    const counts = {};
    data.forEach(a => { const role = a.r1?.name || '未設定'; counts[role] = (counts[role] || 0) + 1; });
    new Chart(ctx, {
        type: 'polarArea',
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['rgba(0,242,255,0.4)', 'rgba(112,0,255,0.4)', 'rgba(255,0,122,0.4)', 'rgba(255,234,0,0.4)', 'rgba(0,255,122,0.4)'], borderColor: '#fff', borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } } }
    });
}

function renderSchoolChart(data) {
    const ctx = document.getElementById('schoolChart');
    if (!ctx) return;
    const counts = {};
    data.forEach(a => { const schoolName = a.school?.name; if (schoolName) counts[schoolName] = (counts[schoolName] || 0) + 1; });
    const top5 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    new Chart(ctx, {
        type: 'bar',
        data: { labels: top5.map(e => e[0]), datasets: [{ data: top5.map(e => e[1]), backgroundColor: 'rgba(112,0,255,0.5)', borderRadius: 5 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { ticks: { color: '#fff', font: { size: 10 } } }, y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { precision: 0, stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderCommitteeChart(members, orgs) {
    const ctx = document.getElementById('committeeChart');
    if (!ctx) return;
    const counts = {};
    orgs.forEach(o => counts[o.name] = 0);
    members.forEach(m => { if (m.organization) counts[m.organization.name]++; });
    new Chart(ctx, {
        type: 'bar',
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: 'rgba(0,255,122,0.5)', borderRadius: 5 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { ticks: { color: '#fff', font: { size: 10 } } }, y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { precision: 0, stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderReferralChart(data) {
    const ctx = document.getElementById('referralDepthChart');
    if (!ctx) return;
    const counts = {};
    data.forEach(a => { const source = a.rs?.name || '不明'; counts[source] = (counts[source] || 0) + 1; });
    new Chart(ctx, {
        type: 'doughnut',
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#00f2ff', '#7000ff', '#ff007a', '#ffea00', '#00ff7a', '#ffae00', '#6366f1'], hoverOffset: 20 }] },
        plugins: [{
            id: 'custom-labels',
            afterDraw: (chart) => {
                const { ctx } = chart;
                ctx.save();
                chart.data.datasets.forEach((dataset, i) => {
                    const meta = chart.getDatasetMeta(i);
                    meta.data.forEach((element, index) => {
                        const { x, y, startAngle, endAngle, outerRadius } = element;
                        const midAngle = startAngle + (endAngle - startAngle) / 2;
                        const label = chart.data.labels[index];
                        const startX = x + Math.cos(midAngle) * outerRadius;
                        const startY = y + Math.sin(midAngle) * outerRadius;
                        const line1X = x + Math.cos(midAngle) * (outerRadius + 25);
                        const line1Y = y + Math.sin(midAngle) * (outerRadius + 25);
                        const isRight = Math.cos(midAngle) > 0;
                        const line2X = line1X + (isRight ? 20 : -20);
                        const line2Y = line1Y;
                        ctx.beginPath();
                        ctx.strokeStyle = dataset.backgroundColor[index];
                        ctx.lineWidth = 1.6;
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(line1X, line1Y);
                        ctx.lineTo(line2X, line2Y);
                        ctx.stroke();
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 11px sans-serif';
                        ctx.textAlign = isRight ? 'left' : 'right';
                        ctx.textBaseline = 'middle';
                        const lines = label.includes('(') ? label.split(/(?=\()/) : [label];
                        const lineHeight = 14;
                        const textX = line2X + (isRight ? 8 : -8);
                        lines.forEach((lineNum, idx) => {
                            const yOffset = (idx - (lines.length - 1) / 2) * lineHeight;
                            ctx.fillText(lineNum.trim(), textX, line2Y + yOffset);
                        });
                    });
                });
                ctx.restore();
            }
        }],
        options: {
            responsive: true, maintainAspectRatio: false, layout: { padding: 80 },
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            cutout: '65%'
        }
    });
}
