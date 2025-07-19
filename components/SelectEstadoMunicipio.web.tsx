import React, { useState, useRef, useEffect } from 'react';

type Option = { label: string; value: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  style?: React.CSSProperties;
};

export function Select({ value, onChange, options, placeholder, disabled, style }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        margin: '0 auto 10px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          background: 'rgba(40,40,70,0.95)',
          borderRadius: 10,
          border: '1px solid #a78bfa',
          color: selected ? '#fff' : '#a5b4fc',
          fontSize: 20,
          minHeight: 44,
          padding: '12px 40px 12px 18px',
          textAlign: 'left',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          margin: 0,
          boxShadow: '0 2px 8px #312e8140',
          fontWeight: 600,
          letterSpacing: 0.2,
          transition: 'background 0.18s',
          ...style,
        }}
      >
        {selected ? selected.label : placeholder}
        <span style={{
          position: 'absolute',
          right: 18,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: '#fff',
          fontSize: 18,
        }}>▼</span>
      </button>
      {open && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            width: '100%',
            background: '#232142',
            borderRadius: 12,
            boxShadow: '0 8px 32px #0008',
            zIndex: 9999,
            maxHeight: 260,
            overflowY: 'auto',
            border: '1px solid #a78bfa',
            padding: 4,
          }}
        >
          {options.length === 0 && (
            <div style={{ padding: 14, color: '#a5b4fc', fontSize: 16 }}>Nenhuma opção</div>
          )}
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: '13px 20px',
                cursor: 'pointer',
                background: value === opt.value ? '#a78bfa' : 'transparent',
                color: value === opt.value ? '#fff' : '#e0e7ff',
                fontWeight: value === opt.value ? 700 : 400,
                fontSize: 17,
                borderBottom: '1px solid #312e81',
                borderRadius: value === opt.value ? 8 : 0,
                marginBottom: 2,
                transition: 'background 0.15s',
                textShadow: value === opt.value ? '0 1px 2px #312e81' : 'none',
              }}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={e => (e.currentTarget.style.background = '#312e81')}
              onMouseLeave={e => (e.currentTarget.style.background = value === opt.value ? '#a78bfa' : 'transparent')}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 