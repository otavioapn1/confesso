// src/screens/FeedScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigation } from '@react-navigation/native';
import { useTailwind } from 'tailwind-rn';

function SecretCard({ secret, onComment, onReport, onLike }) {
  const tailwind = useTailwind();
  return (
    <View style={tailwind('bg-white rounded-lg p-4 mb-3 shadow')}> 
      <Text style={tailwind('text-base text-gray-800 mb-2')}>{secret.text}</Text>
      <View style={tailwind('flex-row justify-between items-center')}> 
        <TouchableOpacity onPress={onComment} style={tailwind('px-2')}><Text style={tailwind('text-blue-500')}>Comentar</Text></TouchableOpacity>
        <TouchableOpacity onPress={onLike} style={tailwind('px-2')}><Text style={tailwind('text-green-500')}>Curtir ({secret.likes || 0})</Text></TouchableOpacity>
        <TouchableOpacity onPress={onReport} style={tailwind('px-2')}><Text style={tailwind('text-red-500')}>Denunciar</Text></TouchableOpacity>
      </View>
      <Text style={tailwind('text-xs text-gray-400 mt-2')}>{new Date(secret.createdAt?.toDate?.() || secret.createdAt).toLocaleString()}</Text>
    </View>
  );
}

export default function FeedScreen() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const tailwind = useTailwind();

  useEffect(() => {
    const q = query(collection(db, 'secrets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSecrets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleComment = (secret) => {
    navigation.navigate('Comments', { secretId: secret.id });
  };
  const handleReport = (secret) => {
    navigation.navigate('Report', { secretId: secret.id });
  };
  const handleLike = async (secret) => {
    // Implementar lógica de curtir (incrementar likes no Firestore)
  };

  if (loading) {
    return <ActivityIndicator style={tailwind('mt-10')} size="large" color="#000" />;
  }

  return (
    <View style={tailwind('flex-1 bg-gray-100 p-4')}>
      <FlatList
        data={secrets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SecretCard
            secret={item}
            onComment={() => handleComment(item)}
            onReport={() => handleReport(item)}
            onLike={() => handleLike(item)}
          />
        )}
        ListEmptyComponent={<Text style={tailwind('text-center text-gray-400 mt-10')}>Nenhum segredo ainda.</Text>}
      />
    </View>
  );
} 