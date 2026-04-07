import React from 'react';
import Chart from 'react-apexcharts';

export default function CohortHeatmap({ data = [], isLoading }) {
    if (isLoading) {
        return (
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                Grafik Yükleniyor...
            </div>
        );
    }

    if (!data || !data.length) {
        return (
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                Mevcut filtrede cohort verisi bulunamadı.
            </div>
        );
    }

    // Cohort aylarını ve offset'leri bul
    const cohortMonths = [...new Set(data.map(d => d.cohort_month))].sort();
    const maxOffset = Math.max(...data.map(d => d.month_offset));

    // Her cohort ayı için retention satırı oluştur
    const series = cohortMonths.map((month) => {
        const rowData = [];
        for (let offset = 0; offset <= maxOffset; offset++) {
            const cell = data.find(d => d.cohort_month === month && d.month_offset === offset);
            rowData.push(cell ? cell.retention_rate : null);
        }
        return {
            name: month,
            data: rowData
        };
    });

    const offsetLabels = Array.from({ length: maxOffset + 1 }, (_, i) =>
        i === 0 ? 'Ay 0 (Yeni)' : `Ay ${i}`
    );

    const options = {
        chart: {
            type: 'heatmap',
            height: 400,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
        },
        plotOptions: {
            heatmap: {
                shadeIntensity: 0.5,
                radius: 4,
                useFillColorAsStroke: false,
                colorScale: {
                    ranges: [
                        { from: 0, to: 0, name: 'Veri yok', color: '#1e2535' },
                        { from: 1, to: 15, name: 'Düşük', color: '#ef4444' },
                        { from: 16, to: 35, name: 'Orta', color: '#f59e0b' },
                        { from: 36, to: 65, name: 'İyi', color: '#10b981' },
                        { from: 66, to: 100, name: 'Mükemmel', color: '#6366f1' }
                    ]
                }
            }
        },
        dataLabels: {
            enabled: true,
            style: { fontSize: '11px', colors: ['rgba(255,255,255,0.9)'] },
            formatter: (val) => val !== null && val > 0 ? `%${val.toFixed(0)}` : ''
        },
        xaxis: {
            categories: offsetLabels,
            labels: { style: { colors: 'var(--color-text-muted)', fontSize: '12px' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: { style: { colors: 'var(--color-text-muted)', fontSize: '12px' } }
        },
        grid: { borderColor: 'transparent' },
        theme: { mode: 'dark' },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (val, { seriesIndex, dataPointIndex }) => {
                    const cohort = cohortMonths[seriesIndex];
                    const cell = data.find(d => d.cohort_month === cohort && d.month_offset === dataPointIndex);
                    if (!cell) return 'Veri yok';
                    return `%${val.toFixed(1)} retention | ${cell.customers} müşteri | ${cell.orders} sipariş`;
                }
            }
        },
        legend: { show: true, position: 'top', labels: { colors: 'var(--color-text-muted)' } }
    };

    return (
        <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-primary)' }}>
                Cohort Retention Heatmap
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                İlk sipariş ayına göre müşteri tekrar satın alma oranları (%)
            </p>
            <Chart options={options} series={series} type="heatmap" height={Math.max(300, cohortMonths.length * 42 + 80)} />
        </div>
    );
}
