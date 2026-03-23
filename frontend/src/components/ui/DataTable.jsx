import React, { useState, useMemo } from 'react';

export default function DataTable({ 
    columns = [], 
    data = [], 
    title = 'Veri Tablosu', 
    exportFileName = 'export.csv',
    rowsPerPage = 10 
}) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);

    // Sıralama Mantığı
    const sortedData = useMemo(() => {
        let sortableItems = [...data];
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
    }, [data, sortConfig]);

    // Sayfalama Mantığı
    const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return sortedData.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedData, currentPage, rowsPerPage]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // CSV Dışa Aktar
    const exportToCSV = () => {
        const headers = columns.map(c => c.label).join(',');
        const rows = sortedData.map(row => 
            columns.map(c => {
                let val = row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : '';
                // virgül içeren metinleri tırnak içine al
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

    return (
        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{title}</h3>
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
                    📥 Excel'e Aktar
                </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead style={{ background: 'var(--color-bg-tertiary)' }}>
                        <tr>
                            {columns.map(col => (
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
                                {columns.map(col => (
                                    <td key={col.key} style={{ padding: '12px 24px', color: 'var(--color-text-primary)' }}>
                                        {col.formatter ? col.formatter(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    Gösterilecek veri bulunamadı.
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
                        Toplam {data.length} kayıttan {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, data.length)} arası gösteriliyor
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
