import React, { useEffect, useState } from 'react';
import useFilterStore from '../store/filterStore';
import api from '../services/api';

const cardStyle = {
    background: 'var(--color-bg-secondary)',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
};

const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
};

const primaryButtonStyle = {
    padding: '12px 16px',
    background: 'var(--color-accent-primary)',
    color: 'white',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
};

const mutedButtonStyle = {
    padding: '10px 14px',
    background: 'transparent',
    color: 'var(--color-text-primary)',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    fontWeight: 600,
};

const initialForm = {
    name: '',
    frequency: 'weekly',
    recipients: '',
    is_active: true,
};

const formatDateTime = (value) => {
    if (!value) return 'Henüz yok';
    return new Date(value).toLocaleString('tr-TR');
};

const frequencyLabel = (value) => {
    if (value === 'daily') return 'Günlük';
    if (value === 'weekly') return 'Haftalık';
    return 'Aylık';
};

export default function ExportPage() {
    const { filters } = useFilterStore();
    const queryString = new URLSearchParams(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    ).toString();

    const [downloadingFormat, setDownloadingFormat] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(true);
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState('');
    const [busyScheduleId, setBusyScheduleId] = useState(null);

    const loadSchedules = async () => {
        try {
            setLoadingSchedules(true);
            const res = await api.get('/report-schedules');
            setSchedules(res.data.data || []);
        } catch (_) {
            setActionError('Kayıtlı rapor planları yüklenemedi.');
        } finally {
            setLoadingSchedules(false);
        }
    };

    useEffect(() => {
        loadSchedules();
    }, []);

    const handleDownload = async (format) => {
        try {
            setDownloadingFormat(format);
            setActionError('');
            const res = await api.get(`/export/${format}?${queryString}`, {
                responseType: 'blob',
                timeout: format === 'xlsx' ? 120000 : 30000,
            });

            const blob = new Blob([res.data], {
                type: format === 'pdf' ? 'application/pdf' : format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Dashboard_Raporu_${new Date().toISOString().split('T')[0]}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Indirme hatasi', err);
            setActionError(`${format.toUpperCase()} indirilirken bir hata oluştu.`);
        } finally {
            setDownloadingFormat(null);
        }
    };

    const handleFormChange = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleCreateSchedule = async () => {
        try {
            setSavingSchedule(true);
            setActionError('');
            setActionMessage('');

            await api.post('/report-schedules', {
                ...form,
                filter_config: filters,
            });

            setForm(initialForm);
            setActionMessage('Rapor planı kaydedildi. Aktif planlar backend scheduler tarafından otomatik çalıştırılır.');
            await loadSchedules();
        } catch (err) {
            setActionError(err.response?.data?.error?.message || 'Rapor planı kaydedilemedi.');
        } finally {
            setSavingSchedule(false);
        }
    };

    const handleToggleSchedule = async (schedule) => {
        try {
            setBusyScheduleId(schedule.id);
            setActionError('');
            setActionMessage('');
            await api.put(`/report-schedules/${schedule.id}`, {
                is_active: !schedule.is_active,
            });
            setActionMessage('Rapor planı güncellendi.');
            await loadSchedules();
        } catch (err) {
            setActionError(err.response?.data?.error?.message || 'Rapor planı güncellenemedi.');
        } finally {
            setBusyScheduleId(null);
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        try {
            setBusyScheduleId(scheduleId);
            setActionError('');
            setActionMessage('');
            await api.delete(`/report-schedules/${scheduleId}`);
            setActionMessage('Rapor planı silindi.');
            await loadSchedules();
        } catch (err) {
            setActionError(err.response?.data?.error?.message || 'Rapor planı silinemedi.');
        } finally {
            setBusyScheduleId(null);
        }
    };

    const handleSendTest = async (scheduleId) => {
        try {
            setBusyScheduleId(scheduleId);
            setActionError('');
            setActionMessage('');
            const res = await api.post(`/report-schedules/${scheduleId}/test`);
            setActionMessage(`${res.data.data.message} Teslimat modu: ${res.data.data.delivery_mode}.`);
            await loadSchedules();
        } catch (err) {
            setActionError(err.response?.data?.error?.message || 'Test raporu gönderilemedi.');
        } finally {
            setBusyScheduleId(null);
        }
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Export ve Otomatik Raporlama</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Mevcut filtrelerinizle anlık çıktı alın ya da aynı filtre seti için tekrar kullanılabilir rapor planları oluşturun.
            </p>

            {(actionMessage || actionError) && (
                <div
                    style={{
                        marginBottom: '20px',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: `1px solid ${actionError ? '#ef4444' : '#10b981'}`,
                        background: actionError ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                        color: actionError ? '#fecaca' : '#bbf7d0',
                    }}
                >
                    {actionError || actionMessage}
                </div>
            )}

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ ...cardStyle, flex: '1 1 320px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Hemen İndir</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px', fontSize: '14px', lineHeight: 1.6 }}>
                        Geçerli tarih aralığı ve seçili filtreler:
                        {' '}
                        <strong>{filters.start_date || 'Tümü'} - {filters.end_date || 'Tümü'}</strong>
                    </p>
                    <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-secondary)',
                        fontSize: '13px',
                        lineHeight: 1.6
                    }}>
                        Excel raporu; KPI ozeti, trendler, kanal/kampanya/urun performansi, attribution, funnel, cohort,
                        ham satis-trafik-reklam verileri ve yonetim tablolarini ayri sekmeler halinde indirir.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            onClick={() => handleDownload('pdf')}
                            disabled={downloadingFormat !== null}
                            style={{ ...primaryButtonStyle, background: '#ef4444' }}
                        >
                            {downloadingFormat === 'pdf' ? 'Hazırlanıyor...' : 'PDF Olarak İndir'}
                        </button>
                        <button
                            onClick={() => handleDownload('xlsx')}
                            disabled={downloadingFormat !== null}
                            style={{ ...primaryButtonStyle, background: '#3b82f6' }}
                        >
                            {downloadingFormat === 'xlsx' ? 'Hazirlaniyor...' : 'Detayli Excel (XLSX) Indir'}
                        </button>
                        <button
                            onClick={() => handleDownload('csv')}
                            disabled={downloadingFormat !== null}
                            style={{ ...primaryButtonStyle, background: '#10b981' }}
                        >
                            {downloadingFormat === 'csv' ? 'Hazırlanıyor...' : 'CSV Olarak İndir'}
                        </button>
                    </div>
                </div>

                <div style={{ ...cardStyle, flex: '1 1 480px', borderColor: 'var(--color-accent-primary)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px', color: 'var(--color-accent-primary)' }}>
                        Otomatik E-posta Raporları
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px', fontSize: '14px', lineHeight: 1.6 }}>
                        Aktif planlar backend scheduler tarafından düzenli olarak taranır. Bu sürümde teslimat modu mock olarak çalışır; yani akış gerçekten koşar ama gerçek SMTP teslimatı simüle edilir.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Plan Adı</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => handleFormChange('name', e.target.value)}
                                placeholder="Haftalık Yönetici Özeti"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Sıklık</label>
                            <select
                                value={form.frequency}
                                onChange={(e) => handleFormChange('frequency', e.target.value)}
                                style={inputStyle}
                            >
                                <option value="daily">Her gün</option>
                                <option value="weekly">Haftalık</option>
                                <option value="monthly">Aylık</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                                Alıcılar
                            </label>
                            <input
                                type="text"
                                value={form.recipients}
                                onChange={(e) => handleFormChange('recipients', e.target.value)}
                                placeholder="yonetim@sirket.com, marketing@sirket.com"
                                style={inputStyle}
                            />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) => handleFormChange('is_active', e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent-primary)' }}
                            />
                            Plan aktif başlasın
                        </label>
                        <button
                            onClick={handleCreateSchedule}
                            disabled={savingSchedule}
                            style={primaryButtonStyle}
                        >
                            {savingSchedule ? 'Kaydediliyor...' : 'Rapor Planını Kaydet'}
                        </button>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Kayıtlı Planlar</h3>
                        {loadingSchedules ? (
                            <p style={{ color: 'var(--color-text-muted)' }}>Planlar yükleniyor...</p>
                        ) : schedules.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                                Henüz kayıtlı plan yok. Kaydettiğiniz her plan, o andaki filtreleri kendi içinde saklar.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {schedules.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        style={{
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '10px',
                                            padding: '14px',
                                            background: 'var(--color-bg-primary)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ flex: '1 1 260px' }}>
                                                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{schedule.name}</div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', lineHeight: 1.5 }}>
                                                    {frequencyLabel(schedule.frequency)} | {schedule.is_active ? 'Aktif' : 'Pasif'} | Teslimat: {schedule.delivery_mode}
                                                </div>
                                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
                                                    {Array.isArray(schedule.recipients) ? schedule.recipients.join(', ') : ''}
                                                </div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '6px', lineHeight: 1.6 }}>
                                                    Son gönderim: {formatDateTime(schedule.last_sent_at)}
                                                    <br />
                                                    Son çalışma: {formatDateTime(schedule.last_run_at)}
                                                    <br />
                                                    Sonraki koşum: {formatDateTime(schedule.next_run_at)}
                                                </div>
                                                {schedule.last_error && (
                                                    <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '8px', lineHeight: 1.5 }}>
                                                        Son hata: {schedule.last_error}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => handleToggleSchedule(schedule)}
                                                    disabled={busyScheduleId === schedule.id}
                                                    style={mutedButtonStyle}
                                                >
                                                    {schedule.is_active ? 'Pasife Al' : 'Aktifleştir'}
                                                </button>
                                                <button
                                                    onClick={() => handleSendTest(schedule.id)}
                                                    disabled={busyScheduleId === schedule.id}
                                                    style={mutedButtonStyle}
                                                >
                                                    Test Gönder
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                                    disabled={busyScheduleId === schedule.id}
                                                    style={{ ...mutedButtonStyle, color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
