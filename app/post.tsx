import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ResponsiveLinearGradient } from '../components/ResponsiveLinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllStates, getStateCities } from 'easy-location-br';
// import { Select } from '../components/SelectEstadoMunicipio';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

import { useUserLocation } from '../hooks/useUserLocation';

const styles = StyleSheet.create({
  gradient: { flex: 1, minHeight: '100%' },
  safe: { flex: 1 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 32, marginBottom: 16, textAlign: 'center' },
  card: {
    width: '96%',
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#fff', fontSize: 15, fontWeight: '500', marginBottom: 8, textAlign: 'center', width: '100%' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a78bfa',
    color: '#fff',
    fontSize: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
    width: '100%',
    textAlign: 'left',
    alignSelf: 'center',
    display: 'flex',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#ec4899',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#ec4899',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    justifyContent: 'center',
    display: 'flex',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 22, textAlign: 'center', width: '100%' },
  info: { color: '#a5b4fc', fontSize: 13, textAlign: 'center', marginBottom: 10, marginTop: -2, width: '100%' },
  picker: {
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
  selectWeb: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a78bfa',
    color: '#fff',
    fontSize: 15,
    marginBottom: 10,
    minHeight: 44,
    padding: 10,
  },
});

function SelectWeb({ value, onChange, options, placeholder, disabled }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; placeholder: string; disabled?: boolean }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={styles.selectWeb as any}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// Função utilitária para reverse geocoding no web
async function reverseGeocodeWeb({ latitude, longitude }: { latitude: number, longitude: number }) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erro ao buscar endereço');
  const data = await response.json();
  return {
    region: data.address.state || '',
    city: data.address.city || data.address.town || data.address.village || '',
  };
}

function estadoParaSigla(nomeEstado: string) {
  const estados = getAllStates();
  const found = estados.find(e => e.name.toLowerCase() === nomeEstado.toLowerCase());
  return found ? found.id : nomeEstado;
}

export default function PostScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();
  const { location, error: locationError, loading: locationLoading, refresh: refreshLocation } = useUserLocation();

  // Forçar botão de voltar para /home e mostrar 'Segredos'
  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: 'Segredos',
      headerBackVisible: true,
    });
  }, [navigation]);

  // Remover useEffect de estados/municipios

  // Remover preenchimento automático de estado/municipio

  const handlePost = async () => {
    console.log('Cliquei em postar');
    if (!text.trim()) {
      console.log('Texto vazio');
      Alert.alert('Erro', 'Digite um segredo.');
      return;
    }
    if (!location) {
      console.log('Localização não disponível');
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
      return;
    }
    setLoading(true);
    try {
      let atualEstado = '';
      let atualMunicipio = '';
      if (Platform.OS === 'web') {
        console.log('Fazendo reverse geocoding web', location);
        const geo = await reverseGeocodeWeb(location);
        console.log('Resultado reverse geocoding web', geo);
        atualEstado = estadoParaSigla(geo.region);
        atualMunicipio = geo.city;
      } else {
        console.log('Fazendo reverse geocoding mobile', location);
        const geo = await require('expo-location').reverseGeocodeAsync(location);
        console.log('Resultado reverse geocoding mobile', geo);
        atualEstado = estadoParaSigla(geo[0]?.region || '');
        atualMunicipio = geo[0]?.city || '';
      }
      await addDoc(collection(db, 'posts'), {
        text,
        estado: atualEstado,
        municipio: atualMunicipio,
        createdAt: new Date().toISOString(),
        likes: 0,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });
      console.log('Segredo enviado com sucesso!');
      setText('');
      router.replace('/'); // Redireciona para a página inicial (feed)
    } catch (e) {
      console.error('Erro ao postar:', e);
      Alert.alert('Erro', 'Não foi possível postar.');
    }
    setLoading(false);
  };

  if (locationError || (!location && !locationLoading)) {
    return (
      <ResponsiveLinearGradient colors={["#0f0c29", "#302b63", "#24243e"]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 }}>
              Para postar um segredo, é necessário permitir o acesso à sua localização.
            </Text>
            <Text style={{ color: '#a5b4fc', fontSize: 16, textAlign: 'center', marginBottom: 28 }}>
              Sua localização nunca será compartilhada com ninguém. Apenas a distância até outros usuários é registrada, mantendo seu anonimato total.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#ec4899', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#ec4899', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
              onPress={refreshLocation}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Permitir localização</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ResponsiveLinearGradient>
    );
  }

  const isWeb = Platform.OS === 'web';
  let Picker: any = null;
  if (!isWeb) {
    Picker = require('@react-native-picker/picker').Picker;
  }

  const MAX_CHARS = 600;

  return (
    <ResponsiveLinearGradient colors={["#0f0c29", "#302b63", "#24243e"]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Botão de voltar */}
          <TouchableOpacity onPress={() => router.replace('/')} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 8, marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginRight: 6 }}>{'←'}</Text>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Compartilhe seu segredo</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Escreva anonimamente aquilo que você sempre quis falar</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite aqui..."
              placeholderTextColor="#d1d5db"
              multiline
              value={text}
              onChangeText={setText}
              editable={!loading}
              maxLength={MAX_CHARS}
            />
            <Text style={{ color: '#a5b4fc', fontSize: 14, marginBottom: 8, alignSelf: 'flex-end', marginRight: 8 }}>
              {MAX_CHARS - text.length} caracteres restantes
            </Text>
            <Text style={styles.info}>Sua localização será usada automaticamente para associar o segredo à sua região. Nenhuma informação pessoal é salva.</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handlePost}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Postar segredo'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ResponsiveLinearGradient>
  );
} 