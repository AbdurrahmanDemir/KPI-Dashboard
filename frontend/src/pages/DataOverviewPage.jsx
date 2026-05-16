import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const formatNumber = (value) => new Intl.NumberFormat('tr-TR').format(Number(value || 0));
const formatDate = (value) => value ? new Date(value).toLocaleString('tr-TR') : 'Henüz yok';

const cardStyle = {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '20px',
};

const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 14px',
    color: 'var(--color-text-primary)',
};

const tableCellStyle = {
    padding: '12px 14px',
    borderBottom: '1px solid var(--color-border)',
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    textAlign: 'left',
};

export default function DataOverviewPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['data-summary'],
        queryFn: async () => (await api.get('/data/summary')).data.data,
    });

    const observations = React.useMemo(() => {
        if (!data) return [];

        const items = [];
        if (data.overview.active_integrations === 0) {
            items.push('Aktif API entegrasyonu yok; otomatik veri akışı şu anda kapalı.');
        }
        if (data.overview.processing_imports > 0) {
            items.push(`${data.overview.processing_imports} adet import kaydı hala işleniyor veya eşleme bekliyor.`);
        }
        if (data.overview.failed_imports > 0) {
            items.push(`${data.overview.failed_imports} adet başarısız import kaydı var; Veri Yükleme ekranından kontrol edilmeli.`);
        }
        if (data.overview.manual_records > data.overview.api_records) {
            items.push('Veri havuzunun ağırlığı manuel import tarafında; API otomasyonu ikincil kaynak gibi çalışıyor.');
        } else if (data.overview.api_records > 0) {
            items.push('API kaynaklı veri hacmi manuel importu geçmiş durumda; entegrasyonlar aktif kullanımda.');
        }
        if (items.length === 0) {
            items.push('Veri akışında belirgin bir blokaj görünmüyor; manuel ve API kaynakları dengeli ilerliyor.');
        }
        return items;
    }, [data]);

    if (isLoading) {
        return <div style={{ padding: '24px', color: 'var(--color-text-secondary)' }}>Veri özeti yükleniyor...</div>;
    }

    if (error) {
        return <div style={{ padding: '24px', color: '#dc2626' }}>Veri özeti yüklenemedi.</div>;
    }

    return (
        <div style={{ padding: '24px', display: 'grid', gap: '24px', color: 'var(--color-text-primary)' }}>
            <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>Veri Merkezi</h1>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', maxWidth: '900px', lineHeight: 1.6 }}>
                    Bu alan, sistemdeki verinin nereden geldiğini, ne kadar olduğunu ve hangi kısımların manuel veya API tabanlı beslendiğini toplu olarak gösterir.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {[
                    ['Toplam Veri Satırı', data.overview.total_records],
                    ['Manuel Kayıtlar', data.overview.manual_records],
                    ['API Kayıtları', data.overview.api_records],
                    ['Tamamlanan Import', data.overview.completed_imports],
                    ['Başarısız Import', data.overview.failed_imports],
                    ['Aktif Entegrasyon', `${data.overview.active_integrations}/${data.overview.total_integrations}`],
                ].map(([label, value]) => (
                    <div key={label} style={cardStyle}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>{label}</div>
                        <div style={{ fontSize: '28px', fontWeight: 800 }}>{typeof value === 'number' ? formatNumber(value) : value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
                <section style={cardStyle}>
                    <h2 style={sectionTitleStyle}>Veri Kaynağı Özetleri</h2>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Son Manuel Import</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{formatDate(data.overview.last_manual_import_at)}</div>
                        </div>
                        <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Son API Senkronu</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{formatDate(data.overview.last_api_sync_at)}</div>
                        </div>
                    </div>
                </section>

                <section style={cardStyle}>
                    <h2 style={sectionTitleStyle}>Yorumlar</h2>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {observations.map((item) => (
                            <div key={item} style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                {item}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section style={cardStyle}>
                <h2 style={sectionTitleStyle}>Veri Seti Detay?</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={tableCellStyle}>Veri Seti</th>
                                <th style={tableCellStyle}>Kaynak</th>
                                <th style={tableCellStyle}>Kayıt Sayısı</th>
                                <th style={tableCellStyle}>Son Güncellenme</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.datasets.map((item) => (
                                <tr key={item.key}>
                                    <td style={tableCellStyle}>{item.label}</td>
                                    <td style={tableCellStyle}>{item.source === 'manual' ? 'Manuel Import' : 'API / Test'}</td>
                                    <td style={tableCellStyle}>{formatNumber(item.records)}</td>
                                    <td style={tableCellStyle}>{formatDate(item.last_updated_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                <section style={cardStyle}>
                    <h2 style={sectionTitleStyle}>Manuel Veri Akışı</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={tableCellStyle}>Kaynak</th>
                                    <th style={tableCellStyle}>Import</th>
                                    <th style={tableCellStyle}>Satır</th>
                                    <th style={tableCellStyle}>Başarısız</th>
                                    <th style={tableCellStyle}>Son Import</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.manual_sources.map((item) => (
                                    <tr key={item.key}>
                                        <td style={tableCellStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span>{item.label}</span>
                                                {item.inferred_from_data && (
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: '#2563eb',
                                                        background: 'rgba(37,99,235,0.12)',
                                                        border: '1px solid rgba(37,99,235,0.22)',
                                                        padding: '3px 7px',
                                                        borderRadius: '999px'
                                                    }}>
                                                        veritabaninda bulundu
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={tableCellStyle}>{formatNumber(item.import_count)}</td>
                                        <td style={tableCellStyle}>{formatNumber(item.row_count)}</td>
                                        <td style={tableCellStyle}>{formatNumber(item.failed_count)}</td>
                                        <td style={tableCellStyle}>{formatDate(item.last_import_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section style={cardStyle}>
                    <h2 style={sectionTitleStyle}>API Entegrasyon Durumu</h2>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {data.api_sources.map((item) => (
                            <div key={item.key} style={{ padding: '16px', borderRadius: '14px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 700 }}>{item.label}</div>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: item.is_active ? '#059669' : '#b45309',
                                        background: item.is_active ? 'rgba(5,150,105,0.12)' : 'rgba(180,83,9,0.12)',
                                        border: `1px solid ${item.is_active ? 'rgba(5,150,105,0.25)' : 'rgba(180,83,9,0.25)'}`,
                                        padding: '4px 8px',
                                        borderRadius: '999px'
                                    }}>
                                        {item.is_active ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                                    <div>Reklam kaydı: {formatNumber(item.ads_records)}</div>
                                    <div>Kampanya kaydı: {formatNumber(item.campaign_records)}</div>
                                <div>Son senkron: {formatDate(item.last_sync_at)}</div>
                                    <div>Hesap kimliği: {item.account_id || 'Girilmemiş'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

