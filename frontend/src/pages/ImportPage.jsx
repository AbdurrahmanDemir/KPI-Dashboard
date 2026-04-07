import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_MAP = {
    pending:    { label: 'Bekliyor',   color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
    mapping:    { label: 'Eşleniyor', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    processing: { label: 'İşleniyor', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    completed:  { label: 'Tamamlandı', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    failed:     { label: 'Başarısız',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const SOURCE_LABEL = {
    sales:            'Satış Verisi',
    google_analytics: 'Google Analytics',
    meta_ads:         'Meta Ads',
    google_ads:       'Google Ads',
    funnel:           'Funnel Verisi',
};

const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || { label: status, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            color: s.color, background: s.bg, border: `1px solid ${s.color}33`,
        }}>
            {s.label}
        </span>
    );
};

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
const DeleteModal = ({ importItem, onConfirm, onCancel, loading }) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
        <div style={{
            background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
            borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '90%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', flexShrink: 0,
                }}>⚠️</div>
                <div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        Veri Seti Silinsin mi?
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Bu işlem geri alınamaz.
                    </div>
                </div>
            </div>

            <div style={{
                background: 'var(--color-bg-tertiary)', borderRadius: '10px', padding: '14px 16px',
                marginBottom: '24px', border: '1px solid var(--color-border)',
            }}>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Silinecek kayıt:</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    {SOURCE_LABEL[importItem?.source_type] || importItem?.source_type}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {importItem?.row_count?.toLocaleString()} satır · {importItem?.file_type?.toUpperCase()} ·{' '}
                    {new Date(importItem?.created_at).toLocaleString('tr-TR')}
                </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
                Bu import kaydı ve sisteme yüklenmiş <strong style={{ color: '#ef4444' }}>tüm ilişkili veriler</strong> kalıcı olarak silinecek.
                Dashboard istatistikleri bu verilerden hesaplanmayacak.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    style={{
                        padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-border)',
                        background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer',
                        fontWeight: 600, fontSize: '14px',
                    }}
                >
                    Vazgeç
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    style={{
                        padding: '10px 24px', borderRadius: '8px', border: 'none',
                        background: loading ? '#7f1d1d' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: '14px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.2s',
                    }}
                >
                    {loading ? (
                        <>
                            <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            Siliniyor...
                        </>
                    ) : '🗑️ Evet, Sil'}
                </button>
            </div>
        </div>
    </div>
);

// ─── Import History Tab ───────────────────────────────────────────────────────
const ImportHistory = ({ onRefresh }) => {
    const [imports, setImports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchImports = async (p = 1) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/imports?page=${p}&limit=10`);
            setImports(res.data.data || []);
            setPagination(res.data.meta || null);
        } catch {
            setError('Import geçmişi yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImports(page);
    }, [page]);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/imports/${deleteTarget.id}`);
            showToast(`"${SOURCE_LABEL[deleteTarget.source_type]}" verisi başarıyla silindi.`);
            setDeleteTarget(null);
            fetchImports(page);
            if (onRefresh) onRefresh();
        } catch {
            showToast('Silme işlemi başarısız oldu.', 'error');
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Yükleme geçmişi getiriliyor...</p>
        </div>
    );

    if (error) return (
        <div style={{ padding: '24px', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', textAlign: 'center' }}>
            {error}
            <button onClick={() => fetchImports(page)} style={{ display: 'block', margin: '12px auto 0', padding: '8px 16px', background: 'none', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>
                Tekrar Dene
            </button>
        </div>
    );

    return (
        <div>
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9998,
                    padding: '14px 20px', borderRadius: '10px', maxWidth: '360px',
                    background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
                    color: 'white', fontWeight: 600, fontSize: '14px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'slideInRight 0.3s ease',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <DeleteModal
                    importItem={deleteTarget}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}

            {imports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
                    <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Henüz yükleme yapılmamış</p>
                    <p style={{ fontSize: '13px', marginTop: '6px' }}>İlk veri setinizi yüklemek için "Yeni İçe Aktarma" sekmesini kullanın.</p>
                </div>
            ) : (
                <>
                    {/* Stats summary */}
                    {pagination && (
                        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Toplam Kayıt', value: pagination.total, icon: '📋' },
                                { label: 'Tamamlanan', value: imports.filter(i => i.status === 'completed').length + (pagination.currentPage > 1 ? '...' : ''), icon: '✅' },
                                { label: 'Başarısız', value: imports.filter(i => i.status === 'failed').length + (pagination.currentPage > 1 ? '...' : ''), icon: '❌' },
                            ].map(stat => (
                                <div key={stat.label} style={{
                                    flex: '1', minWidth: '140px', padding: '14px 18px',
                                    background: 'var(--color-bg-secondary)', borderRadius: '10px',
                                    border: '1px solid var(--color-border)',
                                }}>
                                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{stat.value}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Table */}
                    <div style={{ borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                                    {['Kaynak', 'Dosya Tipi', 'Satır Sayısı', 'Durum', 'Tarih', 'İşlem'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {imports.map((imp, idx) => (
                                    <tr
                                        key={imp.id}
                                        style={{
                                            borderBottom: idx < imports.length - 1 ? '1px solid var(--color-border)' : 'none',
                                            background: 'var(--color-bg-secondary)',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                    >
                                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                            {SOURCE_LABEL[imp.source_type] || imp.source_type}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)',
                                                border: '1px solid var(--color-border)', textTransform: 'uppercase',
                                            }}>
                                                {imp.file_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: 'var(--color-text-primary)' }}>
                                            {imp.row_count != null ? imp.row_count.toLocaleString('tr-TR') : '—'}
                                            {imp.error_count > 0 && (
                                                <span style={{ color: '#f59e0b', fontSize: '12px', marginLeft: '6px' }}>
                                                    ({imp.error_count} hata)
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <StatusBadge status={imp.status} />
                                        </td>
                                        <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                            {new Date(imp.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <button
                                                onClick={() => setDeleteTarget(imp)}
                                                title="Bu import kaydını ve verilerini sil"
                                                style={{
                                                    padding: '7px 14px', borderRadius: '8px',
                                                    background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                                                    border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer',
                                                    fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
                                            >
                                                🗑️ Sil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px', alignItems: 'center' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
                            >
                                ← Önceki
                            </button>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', padding: '0 8px' }}>
                                {page} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer', opacity: page === pagination.totalPages ? 0.4 : 1 }}
                            >
                                Sonraki →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ─── Main Import Page ─────────────────────────────────────────────────────────
export default function ImportPage() {
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
    const [historyKey, setHistoryKey] = useState(0); // force re-fetch after commit

    // ── New Import wizard state ──
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
        { value: 'sales', label: 'Satış Verisi' },
        { value: 'google_analytics', label: 'Google Analytics' },
        { value: 'meta_ads', label: 'Meta Ads' },
        { value: 'google_ads', label: 'Google Ads' },
        { value: 'funnel', label: 'Funnel Verisi' },
    ];

    const sourceColumns = {
        sales: ['order_id', 'order_date', 'customer_id', 'channel', 'source', 'medium', 'campaign_name', 'product_name', 'product_category', 'product_sku', 'product_count', 'order_revenue', 'discount_amount', 'refund_amount', 'order_status', 'city', 'country', 'device', 'payment_method'],
        google_analytics: ['date', 'source', 'medium', 'campaign_name', 'channel_group', 'channel', 'device', 'city', 'sessions', 'users', 'new_users', 'bounce_rate', 'avg_session_duration', 'pages_per_session', 'pages_viewed', 'conversions', 'revenue'],
        meta_ads: ['date', 'campaign_name', 'platform_id', 'adset', 'ad_name', 'impressions', 'clicks', 'reach', 'spend', 'ctr', 'cpc', 'conversions', 'conversion_value', 'currency'],
        google_ads: ['date', 'campaign_name', 'platform_id', 'ad_group', 'ad_name', 'impressions', 'clicks', 'reach', 'spend', 'ctr', 'cpc', 'conversions', 'conversion_value', 'currency'],
        funnel: ['date', 'channel', 'device', 'step_name', 'step_order', 'session_count'],
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
            const uploadRes = await api.post('/imports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const id = uploadRes.data.data.id;
            const previewRes = await api.get(`/imports/${id}/preview`);
            const preview = previewRes.data.data.preview || [];
            const suggestedMapping = previewRes.data.data.suggested_mapping || {};

            setImportId(id);
            setPreviewData(preview);
            setMapping(suggestedMapping);
            setAutoMappedCount(Object.keys(suggestedMapping).length);
            setStep(2);
            setMessage('Dosya yüklendi. Kolon eşlemesini kontrol edin.');
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Yükleme sırasında hata oluştu.');
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
            'application/json': ['.json'],
        },
        maxFiles: 1,
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
            setError(apiError?.message || 'Eşleme veya doğrulama sırasında hata oluştu.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleCommit = async () => {
        try {
            await api.post(`/imports/${importId}/commit`);
            setStep(4);
            setMessage('Import başarıyla tamamlandı.');
            setHistoryKey(k => k + 1); // refresh history
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Veri kaydedilirken hata oluştu.');
        }
    };

    const cancelImport = async () => {
        if (!importId) return;
        try {
            await api.delete(`/imports/${importId}`);
            resetFlow('Aktarım iptal edildi ve yüklenen dosya silindi.');
        } catch {
            setError('İptal sırasında hata oluştu.');
        }
    };

    // ── Tab style helper ──
    const tabStyle = (tab) => ({
        padding: '10px 24px', borderRadius: '10px', border: 'none',
        background: activeTab === tab ? 'var(--color-accent-primary)' : 'transparent',
        color: activeTab === tab ? 'white' : 'var(--color-text-secondary)',
        cursor: 'pointer', fontWeight: 600, fontSize: '14px',
        transition: 'all 0.2s',
    });

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)', maxWidth: '1000px' }}>
            {/* CSS Animations */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
            `}</style>

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Veri İçe Aktarma</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>CSV, XLSX veya JSON formatında veri yükleyin ve yönetin.</p>
                </div>
                {activeTab === 'new' && step > 1 && step < 4 && (
                    <button
                        onClick={cancelImport}
                        style={{ padding: '8px 18px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                    >
                        ✕ İptal Et
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: '4px', marginBottom: '28px', padding: '6px',
                background: 'var(--color-bg-secondary)', borderRadius: '14px', border: '1px solid var(--color-border)',
                width: 'fit-content',
            }}>
                <button id="tab-new-import" style={tabStyle('new')} onClick={() => { setActiveTab('new'); }}>
                    📤 Yeni İçe Aktarma
                </button>
                <button id="tab-import-history" style={tabStyle('history')} onClick={() => setActiveTab('history')}>
                    📋 Yükleme Geçmişi
                </button>
            </div>

            {/* ── New Import Tab ── */}
            {activeTab === 'new' && (
                <div>
                    {/* Stepper */}
                    <div style={{ display: 'flex', gap: '0', marginBottom: '32px' }}>
                        {[
                            { n: 1, label: 'Yükle' },
                            { n: 2, label: 'Eşleştir' },
                            { n: 3, label: 'Doğrula & Onayla' },
                        ].map(({ n, label }, idx) => (
                            <div key={n} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '13px', fontWeight: 700, flexShrink: 0,
                                            background: step > n ? '#10b981' : step === n ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
                                            color: step >= n ? 'white' : 'var(--color-text-muted)',
                                            border: step === n ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                                        }}>
                                            {step > n ? '✓' : n}
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: step === n ? 700 : 500, color: step >= n ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{label}</span>
                                    </div>
                                    <div style={{ height: '3px', background: step > n ? '#10b981' : step === n ? 'var(--color-accent-primary)' : 'var(--color-border)', borderRadius: '2px' }} />
                                </div>
                                {idx < 2 && <div style={{ width: '16px', flexShrink: 0 }} />}
                            </div>
                        ))}
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.3)', fontSize: '14px' }}>
                            ⚠️ {error}
                        </div>
                    )}
                    {message && !error && (
                        <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(16,185,129,0.3)', fontSize: '14px' }}>
                            ✓ {message}
                        </div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <>
                            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600 }}>Veri Kaynağı Seçin</label>
                                <select
                                    value={sourceType}
                                    onChange={(e) => setSourceType(e.target.value)}
                                    style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: '14px' }}
                                >
                                    {sourceTypes.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                                </select>
                            </div>

                            <div
                                {...getRootProps()}
                                style={{
                                    border: `2px dashed ${isDragActive ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                                    borderRadius: '12px', padding: '48px', textAlign: 'center',
                                    background: isDragActive ? 'rgba(99,102,241,0.05)' : 'var(--color-bg-secondary)',
                                    cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: '24px',
                                }}
                            >
                                <input {...getInputProps()} />
                                {uploading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--color-accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        <p style={{ color: 'var(--color-accent-primary)', fontWeight: 500 }}>Yükleniyor...</p>
                                    </div>
                                ) : isDragActive ? (
                                    <p style={{ color: 'var(--color-accent-primary)', fontWeight: 600, fontSize: '16px' }}>📂 Dosyayı bırakın...</p>
                                ) : (
                                    <div>
                                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>☁️</div>
                                        <p style={{ fontWeight: 600, marginBottom: '6px', fontSize: '15px' }}>Dosya seçmek için tıklayın veya sürükleyin</p>
                                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Maksimum boyut: 50MB (CSV, Excel, JSON)</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Step 2 */}
                    {step === 2 && previewData && (
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Sistem Kolonlarını Eşleştirin</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px', fontSize: '14px' }}>Yüklediğiniz dosyadaki kolonları hedef sistem kolonlarıyla eşleştirin.</p>

                            <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                                {Object.keys(previewData[0] || {}).map((fileCol, idx) => (
                                    <div key={fileCol} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px 16px', borderBottom: idx < Object.keys(previewData[0]).length - 1 ? '1px solid var(--color-border)' : 'none',
                                    }}>
                                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{fileCol}</span>
                                        <span style={{ color: 'var(--color-text-muted)', margin: '0 12px' }}>→</span>
                                        <select
                                            value={mapping[fileCol] || ''}
                                            style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', width: '230px', fontSize: '13px' }}
                                            onChange={(e) => setMapping((prev) => ({ ...prev, [fileCol]: e.target.value }))}
                                        >
                                            <option value="">-- Yoksay --</option>
                                            {sourceColumns[sourceType].map((sc) => <option key={sc} value={sc}>{sc}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: '20px', color: 'var(--color-text-secondary)', fontSize: '14px', padding: '10px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
                                {autoMappedCount > 0
                                    ? `ℹ️ ${autoMappedCount} kolon otomatik eşleştirildi. Devam etmeden önce kontrol edebilirsiniz.`
                                    : 'ℹ️ Otomatik eşleşen kolon bulunamadı. Lütfen gerekli alanları seçin.'}
                            </div>

                            <button
                                onClick={handleMapColumns}
                                style={{ padding: '11px 28px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}
                            >
                                Eşlemeyi Kaydet ve Doğrula →
                            </button>
                        </div>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Veri Doğrulama</h3>
                            {isValidating ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ width: '24px', height: '24px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--color-accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                                    <p style={{ color: 'var(--color-accent-primary)', fontWeight: 500 }}>Veriler taranıyor, hatalar kontrol ediliyor...</p>
                                </div>
                            ) : (
                                <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '28px' }}>{validationSummary?.valid ? '✅' : '⚠️'}</span>
                                        <span style={{ fontWeight: 600, fontSize: '16px', color: validationSummary?.valid ? '#10b981' : '#f59e0b' }}>{validationMessage}</span>
                                    </div>

                                    {validationSummary && (
                                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                            {[
                                                { label: 'Toplam Satır', value: validationSummary.row_count, color: 'var(--color-text-primary)' },
                                                { label: 'Geçerli', value: validationSummary.valid_row_count, color: '#10b981' },
                                                { label: 'Hatalı', value: validationSummary.error_count, color: '#ef4444' },
                                            ].map(s => (
                                                <div key={s.label} style={{ padding: '12px 20px', background: 'var(--color-bg-tertiary)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center', minWidth: '100px' }}>
                                                    <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!validationSummary?.valid && validationSummary?.errors?.length > 0 && (
                                        <div style={{ marginBottom: '20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '14px' }}>
                                            <div style={{ fontWeight: 600, marginBottom: '10px', color: '#f59e0b', fontSize: '13px' }}>⚠️ Hata Örnekleri (ilk 5)</div>
                                            {validationSummary.errors.slice(0, 5).map((row) => (
                                                <div key={row.row_number} style={{ marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                                                    <strong>Satır {row.row_number}:</strong> {row.details.map((d) => `${d.field} — ${d.message}`).join(', ')}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCommit}
                                        disabled={!validationSummary?.valid}
                                        style={{
                                            padding: '11px 28px', borderRadius: '8px', border: 'none',
                                            background: validationSummary?.valid ? 'linear-gradient(135deg, #10b981, #059669)' : '#374151',
                                            color: 'white', cursor: validationSummary?.valid ? 'pointer' : 'not-allowed',
                                            fontWeight: 700, fontSize: '14px', opacity: validationSummary?.valid ? 1 : 0.6,
                                            boxShadow: validationSummary?.valid ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                                        }}
                                    >
                                        ✓ Veriyi Kaydet (Commit)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4 */}
                    {step === 4 && (
                        <div style={{ textAlign: 'center', padding: '48px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)' }}>
                            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
                            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#10b981' }}>Başarıyla Tamamlandı!</h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '28px' }}>Yüklenen veriler başarıyla veritabanına yazıldı.</p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => resetFlow('')}
                                    style={{ padding: '11px 24px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    + Yeni Veri Ekle
                                </button>
                                <button
                                    onClick={() => { setActiveTab('history'); resetFlow(''); }}
                                    style={{ padding: '11px 24px', background: 'transparent', color: 'var(--color-text-primary)', borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    📋 Geçmişi Görüntüle
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === 'history' && (
                <ImportHistory key={historyKey} onRefresh={() => setHistoryKey(k => k + 1)} />
            )}
        </div>
    );
}
