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
    // Importa o Select customizado para web
    const WebSelect = require('./SelectEstadoMunicipio.web').Select;
    return <WebSelect value={value} onChange={onChange} options={options} placeholder={placeholder} disabled={disabled} style={style} />;
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