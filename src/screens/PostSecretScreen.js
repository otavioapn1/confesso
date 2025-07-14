// src/screens/PostSecretScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTailwind } from 'tailwind-rn';
import useAuth from '../hooks/useAuth';
import { containsBadWords } from '../utils/moderation';

export default function PostSecretScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const tailwind = useTailwind();
  const { user } = useAuth();

  const handlePost = async () => {
    if (!text.trim()) {
      Alert.alert('Erro', 'Digite um segredo.');
      return;
    }
    if (containsBadWords(text)) {
      Alert.alert('Conteúdo bloqueado', 'Seu segredo contém palavras ofensivas.');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'secrets'), {
        text,
        createdAt: serverTimestamp(),
        userId: user?.uid,
        likes: 0,
      });
      setText('');
      Alert.alert('Sucesso', 'Segredo postado!');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível postar.');
    }
    setLoading(false);
  };

  return (
    <View style={tailwind('flex-1 bg-white p-4')}> 
      <Text style={tailwind('text-lg font-bold mb-2')}>Conte seu segredo anonimamente</Text>
      <TextInput
        style={tailwind('border border-gray-300 rounded-lg p-3 h-32 text-base mb-4')}
        placeholder="Digite aqui..."
        multiline
        value={text}
        onChangeText={setText}
        editable={!loading}
      />
      <TouchableOpacity
        style={tailwind('bg-blue-500 rounded-lg py-3')}
        onPress={handlePost}
        disabled={loading}
      >
        <Text style={tailwind('text-white text-center text-base font-bold')}>{loading ? 'Enviando...' : 'Postar segredo'}</Text>
      </TouchableOpacity>
    </View>
  );
} 