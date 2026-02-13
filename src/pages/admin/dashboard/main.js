import '../../../styles/admin/index.js';
import { createIcons, icons } from 'lucide';
import Chart from 'chart.js/auto';
import { applicantsApi } from '../../../api/applicants';
import { masterApi } from '../../../api/master';
import { analysisApi } from '../../../api/analysis';
import { renderAdminLayout, getTemplateContent } from '../../../lib/admin/layout';
import { debugLog } from '../../../lib/admin/components';

document.addEventListener('DOMContentLoaded', () => {
    renderAdminLayout({
        pageTitle: 'Dashboard',
        pageDescription: '現在の応募状況とステータスを確認できます',
        content: getTemplateContent('page-template')
    });

    fetchDashboardData();
});

async function fetchDashboardData() {
    debugLog('fetchDashboardData started');

    try {
        const totalCount = await applicantsApi.getTotalCount();
        const totalEl = document.getElementById('stat-total');
        if (totalEl) totalEl.textContent = totalCount || 0;

        const roles = await masterApi.getRoles();
        const rolesContainer = document.getElementById('roles-stats-container');

        if (roles && rolesContainer) {
            rolesContainer.innerHTML = '';
            const colors = ['#7000ff', '#ff007a', '#ffea00', '#00ff7a', '#ffae00', '#6366f1'];

            for (let i = 0; i < roles.length; i++) {
                const role = roles[i];
                const count = await applicantsApi.getCountByRole(role.id);

                const color = colors[i % colors.length];
                const statCard = document.createElement('div');
                statCard.className = 'stat-card';
                statCard.innerHTML = `
                    <div class="stat-icon" style="--color: ${color};">
                        <i data-lucide="user"></i>
                    </div>
                    <div class="stat-info">
                        <span class="label">${role.name}希望</span>
                        <span class="count">${count || 0}</span>
                    </div>
                `;
                rolesContainer.appendChild(statCard);
            }
            createIcons({ icons });
        }

        const applicants = await applicantsApi.getRecentOrNew();
        const tbody = document.querySelector('.data-table tbody');
        if (tbody) {
            if (applicants && applicants.length > 0) {
                tbody.innerHTML = '';
                applicants.forEach(item => {
                    const date = new Date(item.created_at).toLocaleDateString();
                    const isNew = item.status === '新規';
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <div class="user-meta">
                                <span class="name">${item.full_name}</span>
                                <span class="email">${item.email || '-'}</span>
                            </div>
                        </td>
                        <td>${item.school?.name || '-'} / ${item.grade || ''}</td>
                        <td>${item.r1?.name || '-'}</td>
                        <td>${date}</td>
                        <td><span class="status-badge ${isNew ? 'new' : item.status === '選抜済' ? 'selected' : ''}">${item.status}</span></td>
                        <td><button class="action-btn" onclick="location.href='applicants.html?id=${item.id}'"><i data-lucide="more-horizontal"></i></button></td>
                    `;
                    tbody.appendChild(tr);
                });
                createIcons({ icons });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-dim);">対応が必要な応募はありません</td></tr>';
            }
        }

        if (document.getElementById('registrationTrend')) {
            await initTrendChart();
        }

        if (document.getElementById('referralSource')) {
            await initReferralChart();
        }

    } catch (err) {
        console.error('Dashboard Error:', err);
    }
}

async function initTrendChart() {
    const ctx = document.getElementById('registrationTrend');
    if (!ctx) return;

    const { labels, counts } = await analysisApi.getDailyRegistrationCounts();

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '累計応募数',
                data: counts,
                backgroundColor: 'rgba(0, 242, 255, 0.4)',
                borderColor: '#00f2ff',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.5)', precision: 0, stepSize: 1 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255,255,255,0.5)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#00f2ff', bodyColor: '#fff', padding: 10, displayColors: false }
            }
        }
    });
}

async function initReferralChart() {
    const ctx = document.getElementById('referralSource');
    if (!ctx) return;

    const { labels, counts } = await analysisApi.getReferralDistribution();
    const colors = ['#00f2ff', '#7000ff', '#ff007a', '#ffea00', '#00ff7a', '#ffae00', '#6366f1'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: 'white', font: { size: 10 } } },
                tooltip: { enabled: true }
            },
            cutout: '65%'
        }
    });
}
