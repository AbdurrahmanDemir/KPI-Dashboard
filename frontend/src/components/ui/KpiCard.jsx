import React from 'react';
import { IconArrowUpLeft, IconArrowDownRight, IconInfoCircle } from '@tabler/icons-react';
import { getMetricDefinitionByTitle } from '../../utils/metricDefinitions';

export default function KpiCard({
    title,
    value,
    prefix = '',
    suffix = '',
    change,
    comparisonLabel = 'onceki donem',
    isLoading,
    subtitle
}) {
    const formattedValue = typeof value === 'number' 
        ? new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value) 
        : value;
    const metricInfo = getMetricDefinitionByTitle(title);

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
        <div className="premium-card" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>{title}</h3>
                {metricInfo && (
                    <span
                        title={`${metricInfo.definition}\n${metricInfo.formula}`}
                        style={{ display: 'inline-flex', color: 'var(--color-text-muted)', cursor: 'help' }}
                    >
                        <IconInfoCircle size={16} stroke={1.6} />
                    </span>
                )}
            </div>
            
            <div style={{ marginTop: '16px' }}>
                {isLoading ? (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>Yükleniyor...</span>
                ) : (
                    <>
                        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {prefix}{formattedValue}{suffix}
                        </span>
                        {subtitle && (
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                {subtitle}
                            </div>
                        )}
                    </>
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
                        {change === null ? 'karsilastirma yok' : `${isPositive ? '+' : ''}${change}%`}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{comparisonLabel}</span>
                </div>
            )}
        </div>
    );
}
