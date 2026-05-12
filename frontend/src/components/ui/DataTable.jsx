import React, { useEffect, useMemo, useRef, useState } from 'react';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';

const FALLBACK_VALUE_HINTS = {
    'Tanımsız ürün': 'Bu satırdaki kayıtlarda ürün adı alanı boş geldiği için sistem bunları Tanımsız ürün olarak gruplayıp gösterir.',
    Kategorisiz: 'Bu kayıtlarda kategori bilgisi boş geldiği için sistem Kategorisiz etiketiyle gösterir.',
    Bilinmiyor: 'Bu kayıtlarda ilgili alan boş veya eşleşememiş geldiği için sistem Bilinmiyor etiketiyle gösterir.',
    Kampanyasız: 'Bu kayıtlarda kampanya adı bilgisi bulunmadığı için sistem Kampanyasız etiketiyle gösterir.',
};

export default function DataTable({ 
    columns = [], 
    data = [], 
    title = 'Veri Tablosu', 
    exportFileName = 'export.csv',
    rowsPerPage = 10,
    isLoading = false,
    enableGrouping = false,
    groupByOptions = []
}) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [groupBy, setGroupBy] = useState('');
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => columns.map((column) => column.key));
    const previousColumnKeysRef = useRef(columns.map((column) => column.key));
    const columnKeySignature = columns.map((column) => column.key).join('|');

    useEffect(() => {
        const nextKeys = columnKeySignature ? columnKeySignature.split('|') : [];
        const previousKeys = previousColumnKeysRef.current;

        setVisibleColumnKeys((current) => {
            const validCurrent = current.filter((key) => nextKeys.includes(key));
            const newKeys = nextKeys.filter((key) => !previousKeys.includes(key));
            const nextVisible = [...validCurrent, ...newKeys];

            return nextVisible.length > 0 ? nextVisible : nextKeys;
        });

        previousColumnKeysRef.current = nextKeys;
    }, [columnKeySignature]);

    const visibleColumns = useMemo(() => {
        const visibleSet = new Set(visibleColumnKeys);
        return columns.filter((column) => visibleSet.has(column.key));
    }, [columns, visibleColumnKeys]);

    const resolvedGroupOptions = useMemo(() => {
        if (!enableGrouping) return [];

        if (groupByOptions.length > 0) {
            return groupByOptions.map((item) => {
                if (typeof item === 'string') {
                    const column = columns.find((c) => c.key === item);
                    return { key: item, label: column?.label || item };
                }
                return item;
            });
        }

        const sample = data[0] || {};
        return columns
            .filter((column) => typeof sample[column.key] === 'string')
            .map((column) => ({ key: column.key, label: column.label }));
    }, [columns, data, enableGrouping, groupByOptions]);

    const inferAggregation = (column) => {
        const text = `${column.key} ${column.label}`.toLowerCase();
        if (text.includes('oran') || text.includes('%') || text.includes('rate') || text.includes('roas') || text.includes('ctr') || text.includes('cvr')) {
            return 'avg';
        }
        return 'sum';
    };

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;

        const normalizedSearch = searchTerm.trim().toLowerCase();
        return data.filter((row) =>
            visibleColumns.some((column) => {
                const cell = row[column.key];
                if (cell === null || cell === undefined) return false;
                return String(cell).toLowerCase().includes(normalizedSearch);
            })
        );
    }, [data, searchTerm, visibleColumns]);

    const transformedData = useMemo(() => {
        if (!enableGrouping || !groupBy) return filteredData;

        const groups = new Map();

        filteredData.forEach((row) => {
            const groupValue = row[groupBy] || 'Bilinmiyor';

            if (!groups.has(groupValue)) {
                const initial = {
                    ...row,
                    [groupBy]: groupValue,
                    __group_count: 0,
                    __aggregate_meta: {},
                    __rows: []
                };

                columns.forEach((column) => {
                    if (column.key === groupBy) return;
                    if (typeof row[column.key] === 'number' && Number.isFinite(row[column.key])) {
                        initial[column.key] = 0;
                        initial.__aggregate_meta[column.key] = { sum: 0, count: 0 };
                    }
                });

                groups.set(groupValue, initial);
            }

            const bucket = groups.get(groupValue);
            bucket.__group_count += 1;
            bucket.__rows.push(row);

            columns.forEach((column) => {
                if (column.key === groupBy) return;
                if (typeof column.aggregate === 'function') return;

                const value = row[column.key];
                if (typeof value === 'number' && Number.isFinite(value)) {
                    const aggregation = inferAggregation(column);
                    const meta = bucket.__aggregate_meta[column.key];
                    if (!meta) return;

                    meta.sum += value;
                    meta.count += 1;

                    if (aggregation === 'avg') {
                        bucket[column.key] = meta.count > 0 ? meta.sum / meta.count : 0;
                    } else {
                        bucket[column.key] = meta.sum;
                    }
                }
            });
        });

        return Array.from(groups.values()).map((item) => {
            columns.forEach((column) => {
                if (typeof column.aggregate === 'function') {
                    item[column.key] = column.aggregate(item.__rows);
                }
            });

            const rest = { ...item };
            delete rest.__aggregate_meta;
            delete rest.__rows;
            return rest;
        });
    }, [columns, enableGrouping, filteredData, groupBy]);

    // Sıralama mantığı
    const sortedData = useMemo(() => {
        let sortableItems = [...transformedData];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [transformedData, sortConfig]);

    // Sayfalama mantığı
    const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return sortedData.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedData, currentPage, rowsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [groupBy, searchTerm]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // CSV dışa aktar
    const exportToCSV = () => {
        const headers = visibleColumns.map(c => c.label).join(',');
        const rows = sortedData.map(row => 
            visibleColumns.map(c => {
                let val = row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : '';
                // Virgül içeren metinleri tırnak içine al.
                if (typeof val === 'string' && val.includes(',')) {
                    val = `"${val}"`;
                }
                return val;
            }).join(',')
        );

        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', exportFileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isGrouped = Boolean(enableGrouping && groupBy);
    const canHideColumn = visibleColumns.length > 1;

    const toggleColumnVisibility = (key) => {
        setVisibleColumnKeys((current) => {
            if (current.includes(key)) {
                if (current.length === 1) return current;
                return current.filter((item) => item !== key);
            }

            const next = columns
                .map((column) => column.key)
                .filter((columnKey) => current.includes(columnKey) || columnKey === key);
            return next;
        });
    };

    const renderFallbackHint = (content) => {
        if (React.isValidElement(content)) return content;
        if (typeof content !== 'string') return content;

        const hint = FALLBACK_VALUE_HINTS[content];
        if (!hint) return content;

        return (
            <span
                title={hint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'help' }}
            >
                <span>{content}</span>
                <span
                    aria-label="Açıklama"
                    style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#1d4ed8',
                        background: 'rgba(29, 78, 216, 0.12)',
                        border: '1px solid rgba(29, 78, 216, 0.2)',
                    }}
                >
                    ?
                </span>
            </span>
        );
    };

    if (isLoading) {
        return (
            <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{title}</h3>
                </div>
                <LoadingState message="Tablo yükleniyor..." height={170} />
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <input
                        type="text"
                        placeholder="Tabloda ara..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        style={{
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            minWidth: '180px',
                            fontSize: '13px'
                        }}
                    />

                    {enableGrouping && resolvedGroupOptions.length > 0 && (
                        <select
                            value={groupBy}
                            onChange={(event) => setGroupBy(event.target.value)}
                            style={{
                                padding: '7px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)',
                                fontSize: '13px'
                            }}
                        >
                            <option value="">Boyut: Ham Veri</option>
                            {resolvedGroupOptions.map((option) => (
                                <option key={option.key} value={option.key}>
                                    Boyut: {option.label}
                                </option>
                            ))}
                        </select>
                    )}

                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setColumnMenuOpen((current) => !current)}
                            style={{
                                padding: '6px 12px',
                                background: 'transparent',
                                color: 'var(--color-text-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            Sütunlar
                        </button>

                        {columnMenuOpen && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    minWidth: '220px',
                                    maxHeight: '320px',
                                    overflowY: 'auto',
                                    background: 'var(--color-bg-secondary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '10px',
                                    boxShadow: 'var(--shadow-card)',
                                    padding: '10px',
                                    zIndex: 20,
                                }}
                            >
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                                    Görünecek sütunları seçin
                                </div>
                                <div style={{ display: 'grid', gap: '6px' }}>
                                    {columns.map((column) => {
                                        const checked = visibleColumnKeys.includes(column.key);
                                        const disabled = checked && !canHideColumn;

                                        return (
                                            <label
                                                key={column.key}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    fontSize: '13px',
                                                    color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={disabled}
                                                    onChange={() => toggleColumnVisibility(column.key)}
                                                />
                                                <span>{column.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={exportToCSV}
                        style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        CSV Aktar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead style={{ background: 'var(--color-bg-tertiary)' }}>
                        <tr>
                            {visibleColumns.map(col => (
                                <th 
                                    key={col.key} 
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    style={{ 
                                        padding: '12px 24px', 
                                        color: 'var(--color-text-secondary)',
                                        fontWeight: 500,
                                        cursor: col.sortable !== false ? 'pointer' : 'default',
                                        borderBottom: '1px solid var(--color-border)',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {col.label}
                                    {sortConfig.key === col.key && (
                                        <span style={{ marginLeft: '6px', fontSize: '11px' }}>
                                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? paginatedData.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {visibleColumns.map(col => (
                                    <td key={col.key} style={{ padding: '12px 24px', color: 'var(--color-text-primary)' }}>
                                        {renderFallbackHint(col.formatter ? col.formatter(row[col.key], row) : row[col.key])}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={visibleColumns.length} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    <EmptyState compact message="Aramanıza/filtrenize uygun tablo verisi bulunamadı." />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {isGrouped ? 'Gruplanmış ' : ''}toplam {sortedData.length} kayıttan {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, sortedData.length)} arası gösteriliyor
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            style={{ padding: '6px 12px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: '6px', color: currentPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}
                        >
                            Önceki
                        </button>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            style={{ padding: '6px 12px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: '6px', color: currentPage === totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}
                        >
                            Sonraki
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

