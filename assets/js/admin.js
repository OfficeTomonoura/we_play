// Auth Guard: Check if user is logged in
// Auth Guard: Check if user is logged in
async function checkAuth() {
    // Pages that don't need auth check (or handle it themselves)
    const path = window.location.pathname;
    if (path.includes('/login.html')) return;

    if (!window.supabaseClient) {
        console.warn('Supabase client not initialized yet.');
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        // No session, redirect to login
        // Assuming relative path works or we are in admin dir
        window.location.href = 'login.html';
        return;
    }

    // Check if user has a Member profile
    // If we are already on first_login.html, skip this check to avoid infinite loop
    // But logically first_login.html should redirect to index if ALREADY registered (handled in first_login.html specific script)
    if (path.includes('/first_login.html')) return;

    // Check members table
    try {
        const { data: member, error } = await window.supabaseClient
            .from('members')
            .select('id')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();

        if (error) {
            console.error('Member check error:', error);
            // On error (e.g. network), maybe don't block user? Or safe fail to login?
            // For now, let's assume if error, we stay (or show error UI).
            return;
        }

        if (!member) {
            // No member record found -> First time login / Not registered
            // Redirect to first_login.html
            // Adjust path if needed (if we are in subfolder, etc. admin.js assumes admin context usually)
            window.location.href = 'first_login.html';
        }
    } catch (err) {
        console.error('Unexpected error checking member status:', err);
    }
}

// Chart Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();

    // 各機能の初期化（要素が存在する場合のみ実行）
    if (document.getElementById('registrationTrend')) initTrendChart();
    if (document.getElementById('referralSource')) initReferralChart();
});

function initTrendChart() {
    const ctx = document.getElementById('registrationTrend').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1/23', '1/24', '1/25', '1/26', '1/27', '1/28', '1/29'],
            datasets: [{
                label: '累計応募人数',
                data: [2, 7, 10, 18, 30, 40, 55],
                backgroundColor: 'rgba(0, 242, 255, 0.6)',
                borderColor: '#00f2ff',
                borderWidth: 2,
                borderRadius: 4,
                hoverBackgroundColor: 'rgba(0, 242, 255, 0.8)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#00f2ff',
                    bodyColor: '#fff',
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#a1a1aa' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#a1a1aa' }
                }
            }
        }
    });
}

function initReferralChart() {
    const ctx = document.getElementById('referralSource').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['先生', '友達', 'ポスター', '家族'],
            datasets: [{
                data: [40, 25, 20, 15],
                backgroundColor: [
                    '#00f2ff',
                    '#7000ff',
                    '#ff007a',
                    '#ffea00'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#a1a1aa',
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            cutout: '70%'
        }
    });
}
