import React from 'react';
import { IconArrowUpLeft, IconArrowDownRight } from '@tabler/icons-react';

export default function KpiCard({ title, value, prefix = '', suffix = '', change, isLoading }) {
    const formattedValue = typeof value === 'number' 
        ? new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value) 
        : value;

    const isPositive = change > 0;
    const isNegative = change < 0;

    let changeColor = 'var(--color-text-muted)';
    let changeBg = 'transparent';
    let Icon = null;

    if (isPositive) {
        changeColor = 'var(--color-accent-success)';
        changeBg = 'rgba(75, 208, 139, 0.15)'; // Spike Admin lightsuccess
        Icon = IconArrowUpLeft;
    } else if (isNegative) {
        changeColor = 'var(--color-accent-danger)';
        changeBg = 'rgba(251, 151, 125, 0.15)'; // Spike Admin lighterror
        Icon = IconArrowDownRight;
    }

    return (
        <div style={{
            background: 'var(--color-bg-card)',
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>{title}</h3>
            
            <div style={{ marginTop: '16px' }}>
                {isLoading ? (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>Yükleniyor...</span>
                ) : (
                    <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {prefix}{formattedValue}{suffix}
                    </span>
                )}
            </div>

            {change !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                    {Icon && (
                        <div style={{ 
                            width: '24px', height: '24px', borderRadius: '50%', 
                            background: changeBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: changeColor 
                        }}>
                            <Icon size={16} stroke={2} />
                        </div>
                    )}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isPositive || isNegative ? changeColor : 'var(--color-text-muted)' }}>
                        {isPositive ? '+' : ''}{change}%
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>önceki yıl</span>
                </div>
            )}
        </div>
    );
}
