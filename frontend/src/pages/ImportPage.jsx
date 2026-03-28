import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';

export default function ImportPage() {
    const [step, setStep] = useState(1);
    const [sourceType, setSourceType] = useState('sales');
    const [uploading, setUploading] = useState(false);
    const [importId, setImportId] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [mapping, setMapping] = useState({});
    const [autoMappedCount, setAutoMappedCount] = useState(0);
    const [validationMessage, setValidationMessage] = useState('');
    const [validationSummary, setValidationSummary] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    const sourceTypes = [
        { value: 'sales', label: 'Satis Verisi' },
        { value: 'google_analytics', label: 'Google Analytics' },
        { value: 'meta_ads', label: 'Meta Ads' },
        { value: 'google_ads', label: 'Google Ads' },
        { value: 'funnel', label: 'Funnel Verisi' }
    ];

    const sourceColumns = {
        sales: ['order_id', 'order_date', 'customer_id', 'channel', 'source', 'medium', 'campaign_name', 'product_name', 'product_category', 'product_sku', 'product_count', 'order_revenue', 'discount_amount', 'refund_amount', 'order_status', 'city', 'country', 'device', 'payment_method'],
        google_analytics: ['date', 'source', 'medium', 'campaign_name', 'channel_group', 'channel', 'device', 'city', 'sessions', 'users', 'new_users', 'bounce_rate', 'avg_session_duration', 'pages_per_session', 'pages_viewed', 'conversions', 'revenue'],
        meta_ads: ['date', 'campaign_name', 'platform_id', 'adset', 'ad_name', 'impressions', 'clicks', 'reach', 'spend', 'ctr', 'cpc', 'conversions', 'conversion_value', 'currency'],
        google_ads: ['date', 'campaign_name', 'platform_id', 'ad_group', 'ad_name', 'impressions', 'clicks', 'reach', 'spend', 'ctr', 'cpc', 'conversions', 'conversion_value', 'currency'],
        funnel: ['date', 'channel', 'device', 'step_name', 'step_order', 'session_count']
    };

    const resetFlow = (successMessage = '') => {
        setStep(1);
        setImportId(null);
        setPreviewData(null);
        setMapping({});
        setAutoMappedCount(0);
        setValidationSummary(null);
        setValidationMessage('');
        setError(null);
        setMessage(successMessage);
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setUploading(true);
        setError(null);
        setMessage('');
        setValidationSummary(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('source_type', sourceType);

        try {
            const uploadRes = await api.post('/imports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const id = uploadRes.data.data.id;
            const previewRes = await api.get(`/imports/${id}/preview`);
            const preview = previewRes.data.data.preview || [];
            const suggestedMapping = previewRes.data.data.suggested_mapping || {};

            setImportId(id);
            setPreviewData(preview);
            setMapping(suggestedMapping);
            setAutoMappedCount(Object.keys(suggestedMapping).length);
            setStep(2);
            setMessage('Dosya yuklendi. Kolon eslemesini kontrol edin.');
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Yukleme sirasinda hata olustu.');
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
            setStep(3);
            setIsValidating(true);
            const res = await api.post(`/imports/${importId}/validate`);
            setValidationSummary(res.data.data);
            setValidationMessage(res.data.data.message);
        } catch (err) {
            const apiError = err.response?.data?.error;
            setValidationSummary(null);
            setError(apiError?.message || 'Esleme veya dogrulama sirasinda hata olustu.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleCommit = async () => {
        try {
            await api.post(`/imports/${importId}/commit`);
            setStep(4);
            setMessage('Import basariyla tamamlandi.');
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Veri kaydedilirken hata olustu.');
        }
    };

    const cancelImport = async () => {
        if (!importId) return;
        try {
            await api.delete(`/imports/${importId}`);
            resetFlow('Aktarim iptal edildi ve yuklenen dosya silindi.');
        } catch (err) {
            setError('Iptal sirasinda hata olustu.');
        }
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Veri Ice Aktarma</h1>
                {step > 1 && step < 4 && (
                    <button
                        onClick={cancelImport}
                        style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Iptal Et
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                <div style={{ flex: 1, padding: '8px', borderBottom: step >= 1 ? '3px solid var(--color-accent-primary)' : '3px solid var(--color-border)' }}>1. Yukle</div>
                <div style={{ flex: 1, padding: '8px', borderBottom: step >= 2 ? '3px solid var(--color-accent-primary)' : '3px solid var(--color-border)' }}>2. Eslestir</div>
                <div style={{ flex: 1, padding: '8px', borderBottom: step >= 3 ? '3px solid var(--color-accent-primary)' : '3px solid var(--color-border)' }}>3. Dogrula ve Onayla</div>
            </div>

            {error && <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '6px', marginBottom: '24px' }}>{error}</div>}
            {message && !error && <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '6px', marginBottom: '24px' }}>{message}</div>}

            {step === 1 && (
                <>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>CSV, XLSX veya JSON dosyalarinizi sisteme yukleyin.</p>

                    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 500 }}>Veri Kaynagi Secin</label>
                        <select
                            value={sourceType}
                            onChange={(e) => setSourceType(e.target.value)}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                        >
                            {sourceTypes.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                        </select>
                    </div>

                    <div
                        {...getRootProps()}
                        style={{
                            border: `2px dashed ${isDragActive ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                            borderRadius: '8px',
                            padding: '40px',
                            textAlign: 'center',
                            background: isDragActive ? 'rgba(99,102,241,0.05)' : 'var(--color-bg-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            marginBottom: '24px'
                        }}
                    >
                        <input {...getInputProps()} />
                        {uploading ? (
                            <p>Yukleniyor...</p>
                        ) : isDragActive ? (
                            <p style={{ color: 'var(--color-accent-primary)', fontWeight: 500 }}>Birakin...</p>
                        ) : (
                            <div>
                                <p style={{ fontWeight: 500, marginBottom: '4px' }}>Dosya secmek icin tiklayin veya surukleyin</p>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Maksimum boyut: 50MB (CSV, Excel, JSON)</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {step === 2 && previewData && (
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Sistem Kolonlarini Eslestirin</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Yuklediginiz dosyadaki kolonlari hedef sistem kolonlariyla eslestirin.</p>

                    <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
                        {Object.keys(previewData[0] || {}).map((fileCol) => (
                            <div key={fileCol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontWeight: 500 }}>{fileCol}</span>
                                <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                                <select
                                    value={mapping[fileCol] || ''}
                                    style={{ padding: '8px', borderRadius: '6px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', width: '220px' }}
                                    onChange={(e) => setMapping((prev) => ({ ...prev, [fileCol]: e.target.value }))}
                                >
                                    <option value="">-- Yoksay --</option>
                                    {sourceColumns[sourceType].map((sc) => <option key={sc} value={sc}>{sc}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                        {autoMappedCount > 0
                            ? `${autoMappedCount} kolon otomatik eslestirildi. Devam etmeden once kontrol edebilirsiniz.`
                            : 'Otomatik eslesen kolon bulunamadi. Lutfen gerekli alanlari secin.'}
                    </div>

                    <button
                        onClick={handleMapColumns}
                        style={{ padding: '10px 24px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Eslemeyi Kaydet ve Dogrula
                    </button>
                </div>
            )}

            {step === 3 && (
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Veri Dogrulama</h3>
                    {isValidating ? (
                        <p style={{ color: 'var(--color-accent-primary)' }}>Veriler taraniyor, hatalar kontrol ediliyor...</p>
                    ) : (
                        <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: validationSummary?.valid ? '#10b981' : '#f59e0b', marginBottom: '16px' }}>
                                <span style={{ fontSize: '24px' }}>{validationSummary?.valid ? '✓' : '!'}</span>
                                <span style={{ fontWeight: 500 }}>{validationMessage}</span>
                            </div>

                            {validationSummary && (
                                <div style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                    Toplam satir: {validationSummary.row_count} | Gecerli: {validationSummary.valid_row_count} | Hatali: {validationSummary.error_count}
                                </div>
                            )}

                            {!validationSummary?.valid && validationSummary?.errors?.length > 0 && (
                                <div style={{ marginBottom: '16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ fontWeight: 600, marginBottom: '8px', color: '#f59e0b' }}>Ilk hata ornekleri</div>
                                    {validationSummary.errors.slice(0, 5).map((row) => (
                                        <div key={row.row_number} style={{ marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                                            Satir {row.row_number}: {row.details.map((detail) => `${detail.field} - ${detail.message}`).join(', ')}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleCommit}
                                disabled={!validationSummary?.valid}
                                style={{ padding: '10px 24px', background: validationSummary?.valid ? '#10b981' : '#6b7280', color: 'white', borderRadius: '6px', border: 'none', cursor: validationSummary?.valid ? 'pointer' : 'not-allowed', fontWeight: 600 }}
                            >
                                Veriyi Kaydet (Commit)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {step === 4 && (
                <div style={{ textAlign: 'center', padding: '40px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>Tamam</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Basarili</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Yuklenen veriler basariyla veritabanina yazildi.</p>
                    <button
                        onClick={() => resetFlow('')}
                        style={{ padding: '10px 24px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Yeni Veri Ekle
                    </button>
                </div>
            )}
        </div>
    );
}
