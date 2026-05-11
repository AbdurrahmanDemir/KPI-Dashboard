import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
    SEGMENT_TYPES,
    createEmptyRule,
    buildDerivedFiltersFromRules,
    getOperatorMeta,
    getRuleFieldMeta,
    getRuleFieldOptions,
    normalizeSegmentRulesConfig,
} from '../utils/segmentBuilder';

const panelStyle = {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '20px',
};

export default function SegmentBuilderPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [segmentType, setSegmentType] = useState('customer');
    const [rules, setRules] = useState([createEmptyRule()]);

    const { data: filterOptions } = useQuery({
        queryKey: ['filter-options'],
        queryFn: async () => (await api.get('/filters/options')).data.data || {}
    });

    const { data: segmentData } = useQuery({
        enabled: isEdit,
        queryKey: ['segment', id],
        queryFn: async () => (await api.get(`/segments/${id}`)).data.data
    });

    useEffect(() => {
        if (!segmentData) return;
        const config = normalizeSegmentRulesConfig(segmentData);
        setName(segmentData.name || '');
        setDescription(config.description || '');
        setSegmentType(config.segment_type || 'customer');
        setRules(config.rules?.length ? config.rules : [createEmptyRule()]);
    }, [segmentData]);

    const fieldOptions = useMemo(() => getRuleFieldOptions(segmentType), [segmentType]);
    const handleSegmentTypeChange = (nextType) => {
        setSegmentType(nextType);
        const nextAllowedFields = new Set(getRuleFieldOptions(nextType).map((item) => item.key));
        setRules((prev) => {
            const sanitized = prev
                .filter((rule) => nextAllowedFields.has(rule.field))
                .map((rule) => {
                    const fieldMeta = getRuleFieldMeta(rule.field);
                    return {
                        ...rule,
                        operator: fieldMeta.operators.includes(rule.operator) ? rule.operator : fieldMeta.operators[0],
                    };
                });

            return sanitized.length ? sanitized : [createEmptyRule(getRuleFieldOptions(nextType)[0]?.key || 'city')];
        });
    };

    const buildPayload = () => {
        const filteredRules = rules.filter((rule) => rule.value !== '' && rule.value !== null && rule.value !== undefined);
        const derivedFilters = buildDerivedFiltersFromRules(filteredRules, 'and');

        return {
            name,
            rules_config: {
                version: 2,
                segment_type: segmentType,
                description,
                logical_operator: 'and',
                rules: filteredRules,
                derived_filters: derivedFilters || {},
            }
        };
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = buildPayload();
            if (isEdit) {
                return api.put(`/segments/${id}`, payload);
            }
            return api.post('/segments', payload);
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['segments'] });
            const segmentId = response?.data?.data?.id || id;
            navigate(segmentId ? `/segments/${segmentId}` : '/segments');
        }
    });

    const updateRule = (ruleId, patch) => {
        setRules((prev) => prev.map((rule) => {
            if (rule.id !== ruleId) return rule;
            const next = { ...rule, ...patch };
            if (patch.field) {
                const fieldMeta = getRuleFieldMeta(patch.field);
                next.operator = fieldMeta.operators[0];
                next.value = '';
            }
            return next;
        }));
    };

    const addRule = () => {
        setRules((prev) => [...prev, createEmptyRule(fieldOptions[0]?.key || 'city')]);
    };

    const removeRule = (ruleId) => {
        setRules((prev) => prev.length === 1 ? prev : prev.filter((rule) => rule.id !== ruleId));
    };

    return (
        <div style={{ padding: '24px', display: 'grid', gap: '24px', color: 'var(--color-text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{isEdit ? 'Segmenti Düzenle' : 'Yeni Segment'}</h1>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                        Reklam analizi ekiplerinin en sık kullandığı segment yapısı: tip seçimi, alan seçimi, operatör ve değer ile hızlı kural tanımı.
                    </p>
                </div>
                <Link to="/segments" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600 }}>
                    ← Segmentlere Dön
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px', alignItems: 'start' }}>
                <section style={panelStyle}>
                    <h2 style={{ marginTop: 0, fontSize: '18px' }}>Segment Bilgileri</h2>
                    <div style={{ display: 'grid', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Segment Adı</label>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Örn: Yüksek ROAS Kampanyaları"
                                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Açıklama</label>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Bu segment neyi hedefliyor?"
                                rows={4}
                                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                            />
                        </div>

                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Segment Tipi</div>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {SEGMENT_TYPES.map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => handleSegmentTypeChange(item.key)}
                                        style={{
                                            textAlign: 'left',
                                            padding: '14px',
                                            borderRadius: '10px',
                                            border: segmentType === item.key ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                                            background: segmentType === item.key ? 'rgba(99,102,241,0.08)' : 'var(--color-bg-primary)',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-primary)'
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{item.label}</div>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{item.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section style={panelStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                        <div>
                            <h2 style={{ margin: '0 0 4px', fontSize: '18px' }}>Filtre Kurallari</h2>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                                Bu sürümde kurallar AND mantığı ile çalışır. Bu seçim mevcut dashboard filtre altyapısı ile birebir uyumludur.
                            </div>
                        </div>
                        <div style={{ padding: '8px 12px', borderRadius: '999px', background: 'rgba(99,102,241,0.08)', color: 'var(--color-accent-primary)', fontSize: '12px', fontWeight: 700 }}>
                            {rules.length} kural
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '12px' }}>
                        {rules.map((rule, index) => {
                            const fieldMeta = getRuleFieldMeta(rule.field);
                            const operators = fieldMeta.operators.map((key) => getOperatorMeta(key));
                            const selectOptionsMap = {
                                city: filterOptions?.cities || [],
                                country: filterOptions?.countries || [],
                                device: filterOptions?.devices || [],
                                channel: filterOptions?.channels || [],
                                platform: filterOptions?.platforms || [],
                                campaign_name: filterOptions?.campaigns || [],
                                product_name: filterOptions?.products || [],
                            };
                            const rawOptions = selectOptionsMap[rule.field] || [];
                            const normalizedOptions = rawOptions.map((option) => typeof option === 'string'
                                ? { value: option, label: option }
                                : { value: option.value, label: option.label || option.value });

                            return (
                                <div key={rule.id} style={{ display: 'grid', gridTemplateColumns: '80px 1.1fr 1fr 1.4fr 48px', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: index === 0 ? 'var(--color-accent-primary)' : 'var(--color-text-muted)' }}>
                                        {index === 0 ? 'GİRİŞ' : 'AND'}
                                    </div>

                                    <select
                                        value={rule.field}
                                        onChange={(event) => updateRule(rule.id, { field: event.target.value })}
                                        style={{ padding: '11px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                    >
                                        {fieldOptions.map((option) => (
                                            <option key={option.key} value={option.key}>{option.label}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={rule.operator}
                                        onChange={(event) => updateRule(rule.id, { operator: event.target.value })}
                                        style={{ padding: '11px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                    >
                                        {operators.map((option) => (
                                            <option key={option.key} value={option.key}>{option.label}</option>
                                        ))}
                                    </select>

                                    {fieldMeta.type === 'select' ? (
                                        <select
                                            value={rule.value}
                                            onChange={(event) => updateRule(rule.id, { value: event.target.value })}
                                            style={{ padding: '11px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                        >
                                            <option value="">Değer seçin</option>
                                            {normalizedOptions.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="number"
                                            value={rule.value}
                                            onChange={(event) => updateRule(rule.id, { value: event.target.value })}
                                            placeholder="Değer..."
                                            style={{ padding: '11px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                        />
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => removeRule(rule.id)}
                                        style={{ border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', borderRadius: '8px', height: '42px', cursor: 'pointer' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
                        <button
                            type="button"
                            onClick={addRule}
                            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontWeight: 700, cursor: 'pointer' }}
                        >
                            + Kural Ekle
                        </button>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link
                                to="/segments"
                                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 700 }}
                            >
                                İptal
                            </Link>
                            <button
                                type="button"
                                onClick={() => saveMutation.mutate()}
                                disabled={!name || saveMutation.isPending}
                                style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'var(--color-accent-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: !name || saveMutation.isPending ? 0.7 : 1 }}
                            >
                                {saveMutation.isPending ? 'Kaydediliyor...' : isEdit ? 'Segmenti Güncelle' : 'Segmenti Oluştur'}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

