import React from 'react';
import { Picker } from '@react-native-picker/picker';

type Option = { label: string; value: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
};

export function Select({ value, onChange, options, placeholder, disabled }: Props) {
  return (
    <Picker
      enabled={!disabled}
      selectedValue={value}
      style={{
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
      }}
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