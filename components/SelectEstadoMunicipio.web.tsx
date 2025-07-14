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
          background: 'rgba(255,255,255,0.18)',
          borderRadius: 10,
          border: '1px solid #a78bfa',
          color: selected ? '#fff' : '#c7bfff',
          fontSize: 20,
          minHeight: 44,
          padding: '10px 40px 10px 16px',
          textAlign: 'left',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          margin: 0,
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
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 8px 32px #0002',
            zIndex: 100,
            maxHeight: 220,
            overflowY: 'auto',
            border: '1px solid #a78bfa',
          }}
        >
          {options.length === 0 && (
            <div style={{ padding: 12, color: '#888', fontSize: 16 }}>Nenhuma opção</div>
          )}
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: value === opt.value ? '#a78bfa' : 'transparent',
                color: value === opt.value ? '#fff' : '#222',
                fontWeight: value === opt.value ? 700 : 400,
                fontSize: 17,
                borderBottom: '1px solid #ede9fe',
                borderRadius: value === opt.value ? 8 : 0,
              }}
              onMouseDown={e => e.preventDefault()}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 