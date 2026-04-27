import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useFilterStore from '../../store/filterStore';
import api from '../../services/api';
import { getActiveFilterCount, getComparisonLabel } from '../../utils/filterComparison';

export default function FilterPanel() {
    const { filters, setFilter, setFilters, resetFilters } = useFilterStore();
    const queryClient = useQueryClient();
    const [segmentName, setSegmentName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);
    const comparisonLabel = useMemo(() => getComparisonLabel(filters), [filters]);

    // Hızlı tarih aralığı seçenekleri
    const handleQuickDate = (daysBack) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - daysBack);
        setFilters({
            start_date: start.toISOString().slice(0, 10),
            end_date: end.toISOString().slice(0, 10)
        });
    };

    const handleThisMonth = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        setFilters({
            start_date: start.toISOString().slice(0, 10),
            end_date: now.toISOString().slice(0, 10)
        });
    };

    const handleComparisonToggle = (checked) => {
        setFilter('compare_previous_period', checked);
    };

    const { data: segmentsData } = useQuery({
        queryKey: ['segments'],
        queryFn: async () => (await api.get('/segments')).data.data || []
    });

    const { data: filterOptions } = useQuery({
        queryKey: ['filter-options'],
        queryFn: async () => (await api.get('/filters/options')).data.data || {}
    });

    const saveSegmentMutation = useMutation({
        mutationFn: async () => {
            await api.post('/segments', { name: segmentName, rules_config: filters });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['segments'] });
            setSegmentName('');
            setShowSaveInput(false);
        }
    });

    const handleSegmentSelect = (e) => {
        const id = Number(e.target.value);
        if (!id) return;
        const target = segmentsData.find((segment) => segment.id === id);
        if (target?.rules_config) {
            setFilters(target.rules_config);
        }
    };

    const renderSelect = (key, label, options = [], optionLabel) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</label>
            <select
                value={filters[key] || ''}
                onChange={(e) => setFilter(key, e.target.value)}
                style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    minWidth: '150px'
                }}
            >
                <option value="">Tumu</option>
                {options.map((option) => {
                    const value = typeof option === 'string' ? option : option.value;
                    const labelValue = typeof option === 'string' ? option : optionLabel ? option[optionLabel] : option.label;
                    return <option key={value} value={value}>{labelValue}</option>;
                })}
            </select>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '24px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-accent-primary)', fontWeight: 600 }}>Kayıtlı Segment</label>
                <select
                    onChange={handleSegmentSelect}
                    defaultValue=""
                    style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-accent-primary)', background: 'rgba(99,102,241,0.1)', color: 'var(--color-text-primary)' }}
                >
                    <option value="">Şablon Seç</option>
                    {segmentsData?.map((segment) => <option key={segment.id} value={segment.id}>{segment.name}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Başlangıç Tarihi</label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <input type="date" value={filters.start_date} onChange={(e) => setFilter('start_date', e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '13px' }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Bitiş Tarihi</label>
                <input type="date" value={filters.end_date} onChange={(e) => setFilter('end_date', e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '13px' }} />
            </div>

            {/* Hızlı tarih seçenekleri */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Hızlı Seçim</label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Son 7G', fn: () => handleQuickDate(7) },
                        { label: 'Son 28G', fn: () => handleQuickDate(28) },
                        { label: 'Son 30G', fn: () => handleQuickDate(30) },
                        { label: 'Bu Ay', fn: handleThisMonth },
                        { label: 'Son 90G', fn: () => handleQuickDate(90) },
                    ].map(({ label, fn }) => (
                        <button key={label} onClick={fn} style={{
                            padding: '7px 10px', borderRadius: '5px', border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)',
                            cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap'
                        }}>{label}</button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Donem Karsilastirma</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={Boolean(filters.compare_previous_period)}
                        onChange={(e) => handleComparisonToggle(e.target.checked)}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>Onceki donem ile karsilastir</span>
                </label>
                {filters.compare_previous_period && (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Karsilastirma araligi: {comparisonLabel || 'Tarih secimi gerekli'}
                    </span>
                )}
            </div>

            {renderSelect('channel', 'Kanal', filterOptions?.channels || [])}
            {renderSelect('platform', 'Platform', filterOptions?.platforms || [])}
            {renderSelect('campaign_name', 'Kampanya', filterOptions?.campaigns || [])}
            {renderSelect('product_name', 'Ürün', filterOptions?.products || [])}
            {renderSelect('city', 'Şehir', filterOptions?.cities || [])}
            {renderSelect('device', 'Cihaz', filterOptions?.devices || [])}
            {renderSelect('country', 'Ülke', filterOptions?.countries || [])}

            {/* Gelişmiş Filtreler (Advanced) Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'transparent' }}>-</label>
                <button onClick={() => setShowAdvancedFilters((prev) => !prev)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px dashed var(--color-text-muted)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    {showAdvancedFilters ? '▲ Gelismis Filtreleri Gizle' : '🛠 Gelismis Filtreler'}
                </button>
            </div>

            <div style={{ width: '100%', display: showAdvancedFilters ? 'flex' : 'none', gap: '16px', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-light)', marginTop: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Min. Ciro (TL)</label>
                    <input type="number" placeholder="Örn: 5000" value={filters.min_revenue || ''} onChange={(e) => setFilter('min_revenue', e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '13px', minWidth: '130px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Max. Ciro (TL)</label>
                    <input type="number" placeholder="Örn: 50000" value={filters.max_revenue || ''} onChange={(e) => setFilter('max_revenue', e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '13px', minWidth: '130px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Min. ROAS (x)</label>
                    <input type="number" placeholder="Örn: 2.5" step="0.1" value={filters.min_roas || ''} onChange={(e) => setFilter('min_roas', e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '13px', minWidth: '130px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Min. Sipariş</label>
                    <input type="number" placeholder="Örn: 10" value={filters.min_orders || ''} onChange={(e) => setFilter('min_orders', e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '13px', minWidth: '130px' }} />
                </div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', position: 'relative', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '6px' }}>
                    <span style={{
                        padding: '7px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-secondary)'
                    }}>
                        {activeFilterCount} aktif filtre
                    </span>
                </div>

                {showSaveInput ? (
                    <>
                        <input
                            type="text"
                            placeholder="Segment adı..."
                            value={segmentName}
                            onChange={(e) => setSegmentName(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-accent-primary)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                        />
                        <button onClick={() => saveSegmentMutation.mutate()} disabled={!segmentName} style={{ padding: '8px 14px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            Kaydet
                        </button>
                        <button onClick={() => setShowSaveInput(false)} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}>
                            İptal
                        </button>
                    </>
                ) : (
                    <button onClick={() => setShowSaveInput(true)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--color-accent-primary)', background: 'transparent', color: 'var(--color-accent-primary)', cursor: 'pointer', fontWeight: 600 }}>
                        Kriterleri Şablon Olarak Kaydet
                    </button>
                )}

                <button onClick={resetFilters} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>
                    Filtreleri Sıfırla
                </button>
            </div>
        </div>
    );
}
