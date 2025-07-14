import React from 'react';
import { Platform } from 'react-native';

type Option = { label: string; value: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  style?: any;
};

export function Select({ value, onChange, options, placeholder, disabled, style }: Props) {
  if (Platform.OS === 'web') {
    return (
      <div className="select-container" style={{ position: 'relative', zIndex: 10, display: 'inline-block', width: 200, margin: 0 }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          style={{
            width: 200,
            height: 40,
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 8,
            border: '1.5px solid #a78bfa',
            color: '#fff',
            fontSize: 15,
            padding: 8,
            outline: 'none',
            zIndex: 11,
            boxShadow: '0 2px 8px 0 rgba(99,102,241,0.08)',
            transition: 'border 0.2s, box-shadow 0.2s',
          }}
          onFocus={e => e.target.style.boxShadow = '0 0 0 2px #a78bfa55'}
          onBlur={e => e.target.style.boxShadow = '0 2px 8px 0 rgba(99,102,241,0.08)'}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  } else {
    const { Picker } = require('@react-native-picker/picker');
    return (
      <Picker
        enabled={!disabled}
        selectedValue={value}
        style={[{
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: '#a78bfa',
          color: '#fff',
          fontSize: 15,
          marginBottom: 10,
          minHeight: 40,
          height: 40,
          justifyContent: 'center',
          paddingHorizontal: 8,
        }, style]}
        onValueChange={onChange}
        dropdownIconColor="#fff"
      >
        <Picker.Item label={placeholder} value="" color="#a5b4fc" />
        {options.map(opt => (
          <Picker.Item key={opt.value} label={opt.label} value={opt.value} color="#fff" />
        ))}
      </Picker>
    );
  }
} 