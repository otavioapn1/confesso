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
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.18)',
          borderRadius: 10,
          border: '1px solid #a78bfa',
          color: '#fff',
          fontSize: 15,
          marginBottom: 10,
          minHeight: 44,
          padding: 10,
          outline: 'none',
          ...style,
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  } else {
    const { Picker } = require('@react-native-picker/picker');
    return (
      <Picker
        enabled={!disabled}
        selectedValue={value}
        style={[
          {
            backgroundColor: 'rgba(255,255,255,0.18)',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#a78bfa',
            color: '#fff',
            fontSize: 15,
            marginBottom: 10,
            minHeight: 44,
            justifyContent: 'center',
            paddingHorizontal: 8,
          },
          style,
        ]}
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