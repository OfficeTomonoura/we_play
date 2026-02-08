/**
 * dashboard.js
 * Logic specific to the admin dashboard (index.html)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Wait for supabaseClient to be initialized
    const checkClient = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(checkClient);
            fetchDashboardData();
        }
    }, 100);
});

async function fetchDashboardData() {
    window.debugLog('fetchDashboardData started');
    if (!window.supabaseClient) return;

    try {
        // 1. Get Totals
        const { count: totalCount, error: totalErr } = await window.supabaseClient
            .from('applicants')
            .select('*', { count: 'exact', head: true });

        const totalEl = document.getElementById('stat-total');
        if (!totalErr && totalEl) totalEl.textContent = totalCount;

        // 2. Get Dynamic Role counts
        const { data: roles } = await window.supabaseClient.from('master_role').select('id, name').order('sort_order');
        const rolesContainer = document.getElementById('roles-stats-container');

        if (roles && rolesContainer) {
            rolesContainer.innerHTML = ''; // Clear previous
            // Define some vibrant colors to rotate through
            const colors = ['#7000ff', '#ff007a', '#ffea00', '#00ff7a', '#ffae00', '#6366f1'];

            for (let i = 0; i < roles.length; i++) {
                const role = roles[i];
                const { count } = await window.supabaseClient
                    .from('applicants')
                    .select('*', { count: 'exact', head: true })
                    .eq('desired_role_1_id', role.id);

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
            if (window.lucide) window.lucide.createIcons();
        }

        // 3. Get Recent Applicants
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoDaysAgoISO = twoDaysAgo.toISOString();

        const { data: applicants, error: appErr } = await window.supabaseClient
            .from('applicants')
            .select('*, r1:master_role!desired_role_1_id(name), school:master_school(name)')
            .or(`status.eq.新規,created_at.gte.${twoDaysAgoISO}`)
            .order('created_at', { ascending: false });

        const tbody = document.querySelector('.data-table tbody');
        if (tbody) {
            if (!appErr && applicants && applicants.length > 0) {
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
                if (window.lucide) window.lucide.createIcons();
            } else {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-dim);">対応が必要な応募はありません</td></tr>';
            }
        }

        // 4. Trend Chart
        if (document.getElementById('registrationTrend')) {
            await initTrendChart();
        }

        // 5. Referral Chart
        if (document.getElementById('referralSource')) {
            await initReferralChart();
        }

    } catch (err) {
        console.error('Dashboard Error:', err);
        window.debugLog('Dashboard Error: ' + err.message);
    }
}

async function initTrendChart() {
    window.debugLog('initTrendChart');
    const ctx = document.getElementById('registrationTrend');
    if (!ctx) return;

    const labels = [];
    const counts = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push((date.getMonth() + 1) + '/' + date.getDate());

        const dateStr = date.toISOString().split('T')[0];
        const { count } = await window.supabaseClient
            .from('applicants')
            .select('*', { count: 'exact', head: true })
            .lte('created_at', dateStr + 'T23:59:59');

        counts.push(count || 0);
    }

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
    window.debugLog('initReferralChart');
    const ctx = document.getElementById('referralSource');
    if (!ctx) return;

    const { data: sources } = await window.supabaseClient.from('master_referral_source').select('id, name');
    if (!sources) return;

    const labels = [];
    const counts = [];
    const colors = ['#00f2ff', '#7000ff', '#ff007a', '#ffea00', '#00ff7a', '#ffae00', '#6366f1'];

    for (const source of sources) {
        const { count } = await window.supabaseClient
            .from('applicants')
            .select('*', { count: 'exact', head: true })
            .eq('referral_source_id', source.id);

        if (count > 0) {
            labels.push(source.name);
            counts.push(count);
        }
    }

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
