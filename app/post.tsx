import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ResponsiveLinearGradient } from '../components/ResponsiveLinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllStates, getStateCities } from 'easy-location-br';
import { Select } from '../components/SelectEstadoMunicipio';
import { useNavigation } from '@react-navigation/native';
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
    outline: 'none',
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

export default function PostScreen() {
  const [text, setText] = useState('');
  const [estado, setEstado] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState<{ id: string; name: string }[]>([]);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const router = useRouter();
  const navigation = useNavigation();
  const { location, error: locationError, loading: locationLoading, refresh: refreshLocation } = useUserLocation();

  // Forçar botão de voltar para /home e mostrar 'Segredos'
  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: 'Segredos',
      headerBackVisible: true,
      // Remover headerLeft customizado para não afetar outras telas
    });
  }, [navigation]);

  useEffect(() => {
    setEstados(getAllStates());
  }, []);

  useEffect(() => {
    if (estado) {
      const cidades = getStateCities(estado);
      setMunicipios(Array.isArray(cidades) ? cidades.map((c: any) => (typeof c === 'string' ? c : c.name)) : []);
      setMunicipio('');
    } else {
      setMunicipios([]);
      setMunicipio('');
    }
  }, [estado]);

  const handlePost = async () => {
    if (!text.trim()) {
      Alert.alert('Erro', 'Digite um segredo.');
      return;
    }
    if (!estado.trim() || !municipio.trim()) {
      Alert.alert('Erro', 'Informe o estado e município.');
      return;
    }
    if (!location) {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        text,
        estado,
        municipio,
        createdAt: new Date().toISOString(),
        likes: 0,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });
      setText('');
      setEstado('');
      setMunicipio('');
      router.replace('/'); // Redireciona para a página inicial (feed)
    } catch (e) {
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
            <Text style={styles.info}>Você pode informar seu estado e município para ver e compartilhar segredos de pessoas próximas. Isso ajuda a criar conexões locais!</Text>
            {/* Select de estado */}
            <Select
              value={estado}
              onChange={setEstado}
              options={estados.map(uf => ({ label: uf.name, value: uf.id }))}
              placeholder="Selecione o estado"
              disabled={loading}
              style={{
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 10,
                border: '1.5px solid #a78bfa',
                color: '#fff',
                fontSize: 18,
                minHeight: 48,
                marginBottom: 10,
              }}
            />
            {/* Select de município */}
            <Select
              value={municipio}
              onChange={setMunicipio}
              options={municipios.map(m => ({ label: m, value: m }))}
              placeholder="Selecione o município"
              disabled={loading || !estado}
              style={{
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 10,
                border: '1.5px solid #a78bfa',
                color: '#fff',
                fontSize: 18,
                minHeight: 48,
                marginBottom: 10,
              }}
            />
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