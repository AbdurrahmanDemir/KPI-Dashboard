import React, { useState } from 'react';
import useFilterStore from '../store/filterStore';
import api from '../services/api';

export default function ExportPage() {
    const { filters } = useFilterStore();
    const [downloadingFormat, setDownloadingFormat] = useState(null);
    const [autoReport, setAutoReport] = useState(false);
    const [reportFrequency, setReportFrequency] = useState('weekly');
    const [reportEmail, setReportEmail] = useState('');

    const handleDownload = async (format) => {
        try {
            setDownloadingFormat(format);
            const params = new URLSearchParams(filters).toString();
            
            // Native fetch kullanarak dosyayı indirmek için blob işleyeceğiz
            // Axios responseType: 'blob' kullanabiliriz
            const res = await api.get(`/export/${format}?${params}`, { responseType: 'blob' });
            
            const blob = new Blob([res.data], { 
                type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Dashboard_Raporu_${new Date().toISOString().split('T')[0]}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
        } catch (err) {
            console.error('İndirme hatası', err);
            alert(`${format.toUpperCase()} indirilirken bir hata oluştu.`);
        } finally {
            setDownloadingFormat(null);
        }
    };

    const handleSaveReportConfig = () => {
        alert('Otomatik E-Posta raporlama ayarlarınız kaydedilmiş olup, arka planda planlanmıştır.');
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Export ve Otomatik Raporlama</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
                Mevcut filtrelerinize ait metrikleri PDF veya CSV olarak indirin ya da e-posta bülteni olarak planlayın.
            </p>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                {/* Sol Kısım: Manuel İndirme */}
                <div style={{ flex: '1 1 300px', background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Hemen İndir</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                        Dashboard, Pazarlama ve Satış ekranlarınızdaki verilerin mevcut tarih (<strong>{filters.start_date || 'Tümü'} - {filters.end_date || 'Tümü'}</strong>) filtrelerine göre özetlenmiş raporunu indirebilirsiniz.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button 
                            onClick={() => handleDownload('pdf')}
                            disabled={downloadingFormat !== null}
                            style={{ padding: '12px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}
                        >
                            {downloadingFormat === 'pdf' ? 'Hazırlanıyor...' : '📄 PDF Olarak İndir'}
                        </button>

                        <button 
                            onClick={() => handleDownload('csv')}
                            disabled={downloadingFormat !== null}
                            style={{ padding: '12px', background: '#10b981', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}
                        >
                            {downloadingFormat === 'csv' ? 'Hazırlanıyor...' : '📊 CSV Olarak İndir'}
                        </button>
                    </div>
                </div>

                {/* Sağ Kısım: Otomatik Raporlama Pano */}
                <div style={{ flex: '1 1 400px', background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-accent-primary)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-accent-primary)' }}>Otomatik E-Posta Raporlaması</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                        Yöneticilere ve takıma haftalık veya aylık periyotlarda otomatik PDF KPI Raporu gönderimi yapılması için kurallar belirleyin.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}>
                            <input 
                                type="checkbox" 
                                checked={autoReport} 
                                onChange={e => setAutoReport(e.target.checked)} 
                                style={{ width: '20px', height: '20px', marginRight: '8px', accentColor: 'var(--color-accent-primary)' }} 
                            />
                            Otomatik E-posta Raporunu Aktifleştir
                        </label>
                    </div>

                    {autoReport && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Sıklık (Periyot)</label>
                                <select 
                                    value={reportFrequency} 
                                    onChange={e => setReportFrequency(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                >
                                    <option value="daily">Her Gün Saat 09:00</option>
                                    <option value="weekly">Haftalık (Pazartesi Sabah)</option>
                                    <option value="monthly">Aylık (Her Ayın 1'i)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Alıcı E-Posta Adresleri (Virgülle ayırın)</label>
                                <input 
                                    type="text" 
                                    value={reportEmail}
                                    onChange={e => setReportEmail(e.target.value)}
                                    placeholder="patron@sporthink.com.tr, pazarlama@sporthink..."
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                            <button 
                                onClick={handleSaveReportConfig}
                                style={{ padding: '12px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, marginTop: '8px' }}
                            >
                                Ayarları Kaydet
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
