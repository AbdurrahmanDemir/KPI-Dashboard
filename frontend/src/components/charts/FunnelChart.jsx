import React from 'react';
import Chart from 'react-apexcharts';

export default function FunnelChart({ data = [], isLoading }) {
    if (isLoading) {
        return (
            <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                Grafik Yükleniyor...
            </div>
        );
    }

    if (!data || !data.length) {
        return (
            <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                Mevcut filtrede funnel verisi bulunamadı.
            </div>
        );
    }

    const categories = data.map(d => d.step_name || d.step || `Adım ${d.step_order}`);
    const values = data.map(d => d.session_count || 0);
    const conversionRates = data.map(d => d.conversion_rate || 0);

    const options = {
        chart: {
            type: 'bar',
            height: 380,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                horizontal: true,
                barHeight: '60%',
                distributed: true,
                dataLabels: { position: 'bottom' }
            }
        },
        colors: ['#6366f1', '#818cf8', '#a5b4fc', '#c4b5fd', '#ddd6fe'],
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            style: { fontSize: '13px', colors: ['#fff'] },
            formatter: (val, opts) => {
                const rate = conversionRates[opts.dataPointIndex];
                return `  ${val.toLocaleString('tr-TR')} oturum  (${rate.toFixed(1)}%)`;
            },
            offsetX: 0,
            dropShadow: { enabled: true }
        },
        stroke: { width: 1, colors: ['transparent'] },
        xaxis: {
            categories,
            labels: { style: { colors: 'var(--color-text-muted)', fontSize: '13px' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: { style: { colors: 'var(--color-text-muted)', fontSize: '13px' } }
        },
        grid: { borderColor: 'rgba(255,255,255,0.04)' },
        theme: { mode: 'dark' },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (val, { dataPointIndex }) => {
                    const rate = conversionRates[dataPointIndex];
                    const prev = dataPointIndex > 0 ? data[dataPointIndex - 1] : null;
                    const dropoff = prev
                        ? `Önceki adımdan kayıp: %${data[dataPointIndex]?.dropoff_rate?.toFixed(1) || 0}`
                        : 'Giriş adımı';
                    return `${val.toLocaleString('tr-TR')} oturum | Toplam CVR: %${rate.toFixed(1)} | ${dropoff}`;
                }
            }
        },
        legend: { show: false }
    };

    const series = [{ name: 'Oturum Sayısı', data: values }];

    return (
        <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                Satın Alma Hunisi (Funnel)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                Her adım için oturum sayısı ve toplam dönüşüm oranı
            </p>
            <Chart options={options} series={series} type="bar" height={380} />

            {/* Adım bazlı metrik kart satırı */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                {data.map((step, i) => (
                    <div key={i} style={{
                        flex: '1 1 140px',
                        background: 'var(--color-bg-primary)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                            {step.step_name || `Adım ${step.step_order}`}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {(step.session_count || 0).toLocaleString('tr-TR')}
                        </div>
                        {i > 0 && (
                            <div style={{ fontSize: '12px', color: step.dropoff_rate > 30 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
                                ▼ %{(step.dropoff_rate || 0).toFixed(1)} kayıp
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
