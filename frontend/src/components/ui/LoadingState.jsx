import React from 'react';

export default function LoadingState({
    message = 'Yukleniyor...',
    height = 220,
    compact = false
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
            <span className="spinner" />
            <span style={{ fontSize: compact ? '12px' : '14px' }}>{message}</span>
        </div>
    );
}
