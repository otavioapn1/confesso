// src/screens/ReportScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTailwind } from 'tailwind-rn';
import useAuth from '../hooks/useAuth';

export default function ReportScreen() {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const { secretId } = route.params;
  const tailwind = useTailwind();
  const { user } = useAuth();

  const handleReport = async () => {
    if (!reason.trim()) {
      Alert.alert('Erro', 'Descreva o motivo da denúncia.');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'reports'), {
        secretId,
        reason,
        createdAt: serverTimestamp(),
        userId: user?.uid,
      });
      setReason('');
      Alert.alert('Denúncia enviada', 'Obrigado por ajudar a manter a comunidade segura.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar a denúncia.');
    }
    setLoading(false);
  };

  return (
    <View style={tailwind('flex-1 bg-white p-4')}> 
      <Text style={tailwind('text-lg font-bold mb-2')}>Denunciar segredo</Text>
      <TextInput
        style={tailwind('border border-gray-300 rounded-lg p-3 h-24 text-base mb-4')}
        placeholder="Descreva o motivo..."
        multiline
        value={reason}
        onChangeText={setReason}
        editable={!loading}
      />
      <TouchableOpacity
        style={tailwind('bg-red-500 rounded-lg py-3')}
        onPress={handleReport}
        disabled={loading}
      >
        <Text style={tailwind('text-white text-center text-base font-bold')}>{loading ? 'Enviando...' : 'Enviar denúncia'}</Text>
      </TouchableOpacity>
    </View>
  );
} 