import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';

export default function ImportPage() {
    const [step, setStep] = useState(1);
    
    // Step 1: Upload state
    const [sourceType, setSourceType] = useState('sales');
    const [uploading, setUploading] = useState(false);
    const [importId, setImportId] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

    // Step 2: Mapping state
    const [mapping, setMapping] = useState({});
    
    // Step 3: Validation state
    const [validationMessage, setValidationMessage] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const sourceTypes = [
        { value: 'sales', label: 'Satış Verisi' },
        { value: 'google_analytics', label: 'Google Analytics' },
        { value: 'meta_ads', label: 'Meta Ads' },
        { value: 'google_ads', label: 'Google Ads' },
        { value: 'funnel', label: 'Funnel Verisi' }
    ];

    const sourceColumns = {
        sales: ['order_id', 'order_date', 'customer_id', 'channel', 'product_count', 'order_revenue', 'discount_amount', 'city', 'country'],
        google_analytics: ['date', 'channel', 'sessions', 'users', 'bounce_rate', 'avg_duration'],
        meta_ads: ['date', 'campaign_name', 'spend', 'impressions', 'clicks', 'conversions'],
        google_ads: ['date', 'campaign_name', 'spend', 'impressions', 'clicks', 'conversions'],
        funnel: ['date', 'channel', 'step_name', 'user_count']
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        const file = acceptedFiles[0];
        
        setUploading(true);
        setError(null);
        setPreviewData(null);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('source_type', sourceType);

        try {
            const uploadRes = await api.post('/imports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const id = uploadRes.data.data.id;
            setImportId(id);
            setMessage('Dosya başarıyla yüklendi. Önizleme getiriliyor...');

            const previewRes = await api.get(`/imports/${id}/preview`);
            setPreviewData(previewRes.data.data.preview);
            setStep(2); // Go to mapping step
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Bir hata oluştu.');
        } finally {
            setUploading(false);
        }
    }, [sourceType]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/json': ['.json']
        },
        maxFiles: 1
    });

    const handleMapColumns = async () => {
        try {
            await api.post(`/imports/${importId}/map-columns`, { mapping });
            setMessage('Kolon eşlemeleri kaydedildi. Doğrulanıyor...');
            setStep(3);
            
            setIsValidating(true);
            await api.post(`/imports/${importId}/validate`);
            setValidationMessage('Tüm veriler doğrulandı. Onaylamak için aşağıdaki butona tıklayın.');
        } catch (err) {
            setError('Eşleme veya doğrulama sırasında hata oluştu.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleCommit = async () => {
        try {
            await api.post(`/imports/${importId}/commit`);
            setMessage('Tebrikler, içe aktarma başarıyla tamamlandı!');
            setValidationMessage('');
            setStep(4); // Success step
        } catch (err) {
            setError('Veri kaydedilirken hata oluştu.');
        }
    };

    const cancelImport = async () => {
        if (!importId) return;
        try {
            await api.delete(`/imports/${importId}`);
            setStep(1);
            setImportId(null);
            setPreviewData(null);
            setMessage('Aktarım iptal edildi ve dosya silindi.');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError('İptal sırasında hata oluştu.');
        }
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Veri İçe Aktarma</h1>
                {step > 1 && step < 4 && (
                    <button 
                        onClick={cancelImport}
                        style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        İptal Et
                    </button>
                )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                <div style={{ flex: 1, padding: '8px', borderBottom: step >= 1 ? '3px solid var(--color-accent-primary)' : '3px solid var(--color-border)' }}>1. Yükle</div>
                <div style={{ flex: 1, padding: '8px', borderBottom: step >= 2 ? '3px solid var(--color-accent-primary)' : '3px solid var(--color-border)' }}>2. Eşleştir</div>
                <div style={{ flex: 1, padding: '8px', borderBottom: step >= 3 ? '3px solid var(--color-accent-primary)' : '3px solid var(--color-border)' }}>3. Doğrula & Onayla</div>
            </div>

            {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', marginBottom: '24px' }}>{error}</div>}
            {message && step === 1 && !error && <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', marginBottom: '24px' }}>{message}</div>}

            {step === 1 && (
                <>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>CSV, XLSX veya JSON dosyalarınızı sisteme yükleyin.</p>

                    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 500 }}>Veri Kaynağı Seçin</label>
                        <select 
                            value={sourceType} 
                            onChange={e => setSourceType(e.target.value)}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                        >
                            {sourceTypes.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                        </select>
                    </div>

                    <div 
                        {...getRootProps()} 
                        style={{
                            border: `2px dashed ${isDragActive ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                            borderRadius: '8px', padding: '40px', textAlign: 'center',
                            background: isDragActive ? 'rgba(99,102,241,0.05)' : 'var(--color-bg-secondary)',
                            cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: '24px'
                        }}
                    >
                        <input {...getInputProps()} />
                        {uploading ? <p>Yükleniyor...</p> : isDragActive ? <p style={{ color: 'var(--color-accent-primary)', fontWeight: 500 }}>Bırakın...</p> : <div>
                            <p style={{ fontWeight: 500, marginBottom: '4px' }}>Dosya seçmek için tıklayın veya sürükleyin</p>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Maksimum boyut: 50MB (CSV, Excel, JSON)</p>
                        </div>}
                    </div>
                </>
            )}

            {step === 2 && previewData && (
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Sistem Kolonlarını Eşleştirin</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Yüklediğiniz dosyadaki kolonları hedef sistem kolonlarıyla eşleştirin.</p>
                    
                    <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
                        {Object.keys(previewData[0] || {}).map(fileCol => (
                            <div key={fileCol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontWeight: 500 }}>{fileCol}</span>
                                <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                                <select 
                                    style={{ padding: '8px', borderRadius: '6px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', width: '200px' }}
                                    onChange={e => setMapping(prev => ({ ...prev, [fileCol]: e.target.value }))}
                                >
                                    <option value="">-- Yoksay --</option>
                                    {sourceColumns[sourceType].map(sc => (
                                        <option key={sc} value={sc}>{sc}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={handleMapColumns}
                        style={{ padding: '10px 24px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Eşlemeyi Kaydet ve Doğrula
                    </button>
                </div>
            )}

            {step === 3 && (
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Veri Doğrulama</h3>
                    {isValidating ? (
                        <p style={{ color: 'var(--color-accent-primary)' }}>Veriler taranıyor, hatalar kontrol ediliyor...</p>
                    ) : (
                        <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#10b981', marginBottom: '16px' }}>
                                <span style={{ fontSize: '24px' }}>✅</span>
                                <span style={{ fontWeight: 500 }}>{validationMessage}</span>
                            </div>
                            <button 
                                onClick={handleCommit}
                                style={{ padding: '10px 24px', background: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Veriyi Kaydet (Commit)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {step === 4 && (
                <div style={{ textAlign: 'center', padding: '40px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Tamamlandı!</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Yüklenen veriler başarıyla veritabanına yazıldı.</p>
                    <button 
                        onClick={() => { setStep(1); setPreviewData(null); setImportId(null); setMapping({}); }}
                        style={{ padding: '10px 24px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Yeni Veri Ekle
                    </button>
                </div>
            )}
        </div>
    );
}
