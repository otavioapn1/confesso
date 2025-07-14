import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Feather } from '@expo/vector-icons';
import Modal from 'react-native-modal';

const { width } = Dimensions.get('window');

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    width: 300,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    width: 300,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDate: {
    fontSize: 12,
    color: '#64748b',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 12,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default function AdminScreen() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<any>(null);

  useEffect(() => {
    if (!loggedIn) return;
    setLoading(true);
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [loggedIn]);

  const handleLogin = () => {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setLoggedIn(true);
    } else {
      Alert.alert('Erro', 'Usuário ou senha incorretos.');
    }
  };

  const deleteComments = async (postId: string) => {
    try {
      const commentsRef = collection(db, 'posts', postId, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);
      const deletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Erro ao deletar comentários:', error);
    }
  };

  const testButton = () => {
    console.log('Test button pressed');
    Alert.alert('Teste', 'Botão funcionando!');
  };

  const handleDelete = (post: any) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setDeleting(postToDelete.id);
    setShowDeleteModal(false);
    try {
      await deleteComments(postToDelete.id);
      await deleteDoc(doc(db, 'posts', postToDelete.id));
      Alert.alert('Sucesso', 'Card excluído com sucesso!');
    } catch (e) {
      Alert.alert('Erro', `Não foi possível excluir o card: ${e.message}`);
    }
    setDeleting(null);
    setPostToDelete(null);
  };

  const formatDate = (date: any) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!loggedIn) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginTitle}>Admin Login</Text>
        <TextInput
          placeholder="Usuário"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
        <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredPosts = posts.filter(post => 
    post.text.toLowerCase().includes(search.toLowerCase())
  );

  const totalPosts = posts.length;
  const totalComments = posts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gerenciar Cards</Text>
          <TouchableOpacity onPress={testButton} style={{ backgroundColor: '#10b981', padding: 8, borderRadius: 6 }}>
            <Text style={{ color: '#fff', fontSize: 12 }}>Teste</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Buscar por texto..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalPosts}</Text>
            <Text style={styles.statLabel}>Cards</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalComments}</Text>
            <Text style={styles.statLabel}>Comentários</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalLikes}</Text>
            <Text style={styles.statLabel}>Curtidas</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <Text style={styles.cardText} numberOfLines={3}>
                  {item.text}
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardDate}>
                    {formatDate(item.createdAt)}
                  </Text>
                  <View style={styles.cardStats}>
                    <Feather name="heart" size={14} color="#64748b" style={styles.statIcon} />
                    <Text style={styles.statText}>{item.likes || 0}</Text>
                    <Feather name="message-circle" size={14} color="#64748b" style={styles.statIcon} />
                    <Text style={styles.statText}>{item.commentsCount || 0}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    console.log('Button pressed for item:', item.id);
                    handleDelete(item);
                  }}
                  style={styles.deleteButton}
                  disabled={deleting === item.id}
                >
                  {deleting === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Feather name="trash-2" size={16} color="#fff" />
                  )}
                  <Text style={styles.deleteButtonText}>
                    {deleting === item.id ? 'Excluindo...' : 'Excluir'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="search" size={48} color="#64748b" />
                <Text style={styles.emptyText}>
                  {search ? 'Nenhum card encontrado para esta busca.' : 'Nenhum card encontrado.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
      <Modal isVisible={showDeleteModal} backdropOpacity={0.7} animationIn="fadeIn" animationOut="fadeOut" useNativeDriver>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#dc2626', marginBottom: 12 }}>Confirmar Exclusão</Text>
          <Text style={{ fontSize: 15, color: '#1e293b', marginBottom: 18, textAlign: 'center' }}>
            Tem certeza que deseja excluir este card?
          </Text>
          <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 18, textAlign: 'center' }} numberOfLines={4}>
            "{postToDelete?.text?.substring(0, 120)}{postToDelete?.text?.length > 120 ? '...' : ''}"
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <TouchableOpacity onPress={() => { setShowDeleteModal(false); setPostToDelete(null); }} style={{ flex: 1, backgroundColor: '#e5e7eb', borderRadius: 8, paddingVertical: 12, marginRight: 8, alignItems: 'center' }}>
              <Text style={{ color: '#1e293b', fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete} style={{ flex: 1, backgroundColor: '#dc2626', borderRadius: 8, paddingVertical: 12, marginLeft: 8, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
} 