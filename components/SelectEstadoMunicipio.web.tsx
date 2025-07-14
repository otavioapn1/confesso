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
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          background: open ? '#ede9fe' : '#f3f4f6',
          borderRadius: 12,
          border: open ? '2px solid #7c3aed' : '1.5px solid #a78bfa',
          color: selected ? '#312e81' : '#a5b4fc',
          fontSize: 18,
          minHeight: 48,
          padding: '14px 44px 14px 18px',
          textAlign: 'left',
          outline: open ? '2px solid #a78bfa' : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          margin: 0,
          boxShadow: open ? '0 4px 24px #a78bfa33' : '0 2px 8px 0 rgba(99,102,241,0.08)',
          transition: 'border 0.2s, box-shadow 0.2s, background 0.2s',
          ...style,
        }}
      >
        {selected ? selected.label : <span style={{ color: '#a5b4fc' }}>{placeholder}</span>}
        <span style={{
          position: 'absolute',
          right: 18,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: open ? '#7c3aed' : '#a5b4fc',
          fontSize: 22,
          transition: 'color 0.2s',
        }}>▼</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            width: '100%',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px #a78bfa33',
            zIndex: 100,
            maxHeight: 240,
            overflowY: 'auto',
            border: '2px solid #a78bfa',
          }}
        >
          {options.length === 0 && (
            <div style={{ padding: 14, color: '#888', fontSize: 16 }}>Nenhuma opção</div>
          )}
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: '13px 18px',
                cursor: 'pointer',
                background: value === opt.value ? '#a78bfa' : 'transparent',
                color: value === opt.value ? '#fff' : '#312e81',
                fontWeight: value === opt.value ? 700 : 400,
                fontSize: 17,
                borderBottom: '1px solid #ede9fe',
                borderRadius: value === opt.value ? 8 : 0,
                transition: 'background 0.18s',
              }}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
              onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? '#a78bfa' : 'transparent'}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 