import React from 'react';

export default function EmptyState({
    message = 'Gosterilecek veri bulunamadi.',
    height = 220,
    compact = false,
    icon = '📭'
}) {
    return (
        <div
            style={{
                minHeight: height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: compact ? '6px' : '10px',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                padding: compact ? '12px' : '20px'
            }}
        >
            <span style={{ fontSize: compact ? '16px' : '20px' }}>{icon}</span>
            <span style={{ fontSize: compact ? '12px' : '14px' }}>{message}</span>
        </div>
    );
}
