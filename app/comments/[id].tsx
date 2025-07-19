import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import useTailwind from 'tailwind-rn';
import useAuth from '../../src/hooks/useAuth';

type Comment = {
  id: string;
  text: string;
  createdAt: any;
  uid: string;
};

export default function CommentsScreen() {
  const { id } = useLocalSearchParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const tailwind = useTailwind();
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, 'posts', String(id), 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      setComments(snapshot.docs.map((doc: DocumentData) => ({ id: doc.id, ...doc.data() } as Comment)));
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  const handlePost = async () => {
    if (!text.trim()) {
      Alert.alert('Erro', 'Digite um comentário.');
      return;
    }
    setPosting(true);
    try {
      await addDoc(collection(db, 'posts', String(id), 'comments'), {
        text,
        createdAt: serverTimestamp(),
        // @ts-ignore
        uid: user?.uid ?? '',
      });
      setText('');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível comentar.');
    }
    setPosting(false);
  };

  if (loading) {
    return <ActivityIndicator style={tailwind('mt-10')} size="large" color="#000" />;
  }

  return (
    <View style={tailwind('flex-1 bg-white p-4')}> 
      <Text style={tailwind('text-lg font-bold mb-2')}>Comentários</Text>
      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={tailwind('bg-gray-100 rounded-lg p-3 mb-2')}>
            <Text style={tailwind('text-base text-gray-800')}>{item.text}</Text>
            <Text style={tailwind('text-xs text-gray-400 mt-1')}>{new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={tailwind('text-center text-gray-400 mt-10')}>Nenhum comentário ainda.</Text>}
      />
      <View style={tailwind('flex-row items-center mt-4')}> 
        <TextInput
          style={tailwind('flex-1 border border-gray-300 rounded-lg p-3 text-base mr-2')}
          placeholder="Comente anonimamente..."
          value={text}
          onChangeText={setText}
          editable={!posting}
        />
        <TouchableOpacity
          style={tailwind('bg-blue-500 rounded-lg px-4 py-3')}
          onPress={handlePost}
          disabled={posting}
        >
          <Text style={tailwind('text-white font-bold')}>{posting ? '...' : 'Enviar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 