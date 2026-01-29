// Chart Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTrendChart();
    initReferralChart();
    initLogout();
});

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

function initTrendChart() {
    const ctx = document.getElementById('registrationTrend').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1/23', '1/24', '1/25', '1/26', '1/27', '1/28', '1/29'],
            datasets: [{
                label: '応募数',
                data: [2, 5, 3, 8, 12, 10, 15],
                borderColor: '#00f2ff',
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#00f2ff',
                pointBorderWidth: 0,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
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
