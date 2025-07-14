import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable, Platform, ScrollView, FlatList, TextInput, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, orderBy, onSnapshot, QuerySnapshot, DocumentData, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ResponsiveLinearGradient } from '../components/ResponsiveLinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserLocation } from '../hooks/useUserLocation';
import { useSecretsNearby } from '../hooks/useSecretsNearby';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import { usePersistentLocationPermission } from '../hooks/usePersistentLocationPermission';
import Modal from 'react-native-modal';
import { Modal as RNModal } from 'react-native';
import * as Location from 'expo-location';
import { Select } from '../components/SelectEstadoMunicipio';
import { getAllStates, getStateCities } from 'easy-location-br';

// Estilo para reticências multiline no web
const webEllipsisStyle = Platform.OS === 'web' ? {
  display: '-webkit-box',
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'normal',
  maxWidth: '100%',
  maxHeight: 88,
} : {};

function formatDate(date: any) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dia} às ${hora}`;
}

const { width } = Dimensions.get('window');
const isMobile = width < 500;
const CARD_WIDTH = isMobile ? width - 32 : Math.min(width * 0.95, 420);

const styles = StyleSheet.create({
  gradient: { flex: 1, minHeight: '100%' },
  safe: { flex: 1 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 32, marginBottom: 16, textAlign: 'center' },
  scroll: { flex: 1, paddingBottom: 120 },
  cardContainer: { flex: 1, alignItems: 'center', width: '100%' },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    marginHorizontal: 'auto',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    backdropFilter: Platform.OS === 'web' ? 'blur(8px)' : undefined,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'justify',
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    display: 'flex',
    flexWrap: 'wrap',
    overflow: 'hidden',
    lineHeight: 22,
  },
  cardDate: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 0, textAlign: 'center', width: '100%' },
  likeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  likeIcon: { color: '#ec4899', fontSize: 22 },
  likeCount: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  empty: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontStyle: 'italic', marginTop: 60, fontSize: 18 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8 },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    marginHorizontal: 16,
    alignSelf: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#312e81', textAlign: 'center', marginBottom: 8 },
  modalSecret: { fontSize: 16, color: '#312e81', textAlign: 'justify', marginBottom: 12, flexWrap: 'wrap' },
  modalDate: { fontSize: 12, color: '#6366f1', textAlign: 'center', marginBottom: 8 },
  commentList: { height: 180, marginBottom: 8 },
  commentBox: { marginBottom: 10, padding: 8, backgroundColor: '#eef2ff', borderRadius: 12 },
  commentText: { color: '#312e81', fontSize: 14 },
  commentDate: { color: '#6366f1', fontSize: 11, marginTop: 2 },
  commentEmpty: { color: '#a5b4fc', fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#a5b4fc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#312e81', backgroundColor: '#fff' },
  commentSend: { backgroundColor: '#ec4899', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, marginLeft: 8 },
  commentSendText: { color: '#fff', fontWeight: 'bold' },
});

type Post = {
  id: string;
  text: string;
  createdAt: any;
  uid: string;
  likes?: number;
  commentsCount?: number;
  estado?: string;
  municipio?: string;
  _distance?: number;
};

type Comment = {
  id: string;
  text: string;
  createdAt: any;
  likes?: number;
};

function RadiusSlider({ value, onChange }) {
  if (Platform.OS === 'web') {
    return (
      <input
        type="range"
        min={1}
        max={50}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 260, marginTop: 8 }}
      />
    );
  }
  return (
    <Slider
      style={{ width: 260, height: 36 }}
      minimumValue={1}
      maximumValue={50}
      step={1}
      minimumTrackTintColor="#a5b4fc"
      maximumTrackTintColor="#fff"
      thumbTintColor="#ec4899"
      value={value}
      onValueChange={onChange}
    />
  );
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [liking, setLiking] = useState<string | null>(null);
  const [fabPressed, setFabPressed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsPage, setCommentsPage] = useState<any>(null);
  const [commentsEnd, setCommentsEnd] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'likes' | 'comments'>('recent');
  const [likeAnim, setLikeAnim] = useState<{ [key: string]: Animated.Value }>({});
  const [likeColor, setLikeColor] = useState<{ [key: string]: string }>({});
  const [commentToast, setCommentToast] = useState(false);
  const [commentSortBy, setCommentSortBy] = useState<'recent' | 'likes'>('recent');
  const router = useRouter();
  const lastScrollY = useRef(0);

  const [estado, setEstado] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estados, setEstados] = useState<{ id: string; name: string }[]>([]);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [originalEstado, setOriginalEstado] = useState('');
  const [originalMunicipio, setOriginalMunicipio] = useState('');
  const [disableRadius, setDisableRadius] = useState(false);

  // Adicionar estados para sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false); // sempre começa fechado no mobile
  // Adicionar estado para exibir/ocultar sidebar no web
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Remover injeção de CSS global para header sticky e responsividade
  // Remover lógica de showHeader e qualquer referência ao header/topo

  const { location, error: locationError, loading: locationLoading, refresh: refreshLocation } = useUserLocation();
  const [radius, setRadius] = useState(10);
  const [radiusLoading, setRadiusLoading] = useState(true);
  const { secrets, loading, error, refresh } = useSecretsNearby(location, radius);
  const { granted: locationGranted, loading: permLoading, showModal, onTryAgain, onOpenSettings, deniedForever, requestPermission } = usePersistentLocationPermission();

  // Persistir raio em AsyncStorage
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('feed_radius_km');
      if (stored) setRadius(Number(stored));
      setRadiusLoading(false);
    })();
  }, []);
  useEffect(() => {
    if (!radiusLoading) AsyncStorage.setItem('feed_radius_km', String(radius));
  }, [radius, radiusLoading]);

  // Carregar posts para todos os usuários
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        setPosts(snapshot.docs.map((doc: DocumentData) => ({ id: doc.id, ...doc.data() } as Post)));
      },
      () => {}
    );
    const timeout = setTimeout(() => {}, 5000);
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Buscar quantidade de comentários de cada post
  useEffect(() => {
    if (posts.length === 0) return;
    const unsubscribes: (() => void)[] = [];
    posts.forEach(post => {
      const q = collection(db, 'posts', post.id, 'comments');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, commentsCount: snapshot.size } : p));
      });
      unsubscribes.push(unsubscribe);
    });
    return () => { unsubscribes.forEach(u => u()); };
  }, [posts.length]);

  // Listener em tempo real para comentários do post selecionado
  useEffect(() => {
    console.log('Modal:', modalVisible, 'SelectedPost:', selectedPost);
    if (!modalVisible || !selectedPost) return;
    setComments(null);
    setCommentsLoading(true);
    const q = query(collection(db, 'posts', selectedPost.id, 'comments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Snapshot size:', snapshot.size, 'docs:', snapshot.docs.map(d => d.data()));
      const newComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(newComments);
      setCommentsLoading(false);
      console.log('Listener de comentários disparado:', newComments);
    }, (err) => {
      setCommentsLoading(false);
      console.error('Erro ao buscar comentários:', err);
      alert('Erro ao buscar comentários: ' + (err?.message || err));
    });
    return () => unsubscribe();
  }, [modalVisible, selectedPost]);

  // Função para ordenar os posts
  const sortedPosts = React.useMemo(() => {
    let arr = [...posts];
    if (sortBy === 'likes') {
      arr.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sortBy === 'comments') {
      arr.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
    } else {
      arr.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }
    return arr;
  }, [posts, sortBy]);

  // Ordenar comentários conforme filtro selecionado
  const sortedComments = React.useMemo(() => {
    if (commentSortBy === 'likes') {
      return [...comments || []].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    // recent (default)
    return [...comments || []];
  }, [comments, commentSortBy]);

  // Obter estado e município via reverse geocoding
  useEffect(() => {
    async function fetchAddress() {
      if (location) {
        const res = await Location.reverseGeocodeAsync(location);
        if (res && res[0]) {
          const uf = res[0].region || '';
          const city = res[0].city || '';
          setEstado(uf);
          setMunicipio(city);
          setOriginalEstado(uf);
          setOriginalMunicipio(city);
        }
      }
    }
    fetchAddress();
  }, [location]);

  // Carregar lista de estados
  useEffect(() => {
    setEstados(getAllStates());
  }, []);
  // Carregar lista de municípios ao trocar estado
  useEffect(() => {
    if (estado) {
      const cidades = getStateCities(estado);
      setMunicipios(Array.isArray(cidades) ? cidades.map((c: any) => (typeof c === 'string' ? c : c.name)) : []);
      // Só limpar o município se ele não foi definido pelo reverse geocoding
      setMunicipio(prev => prev && municipios.includes(prev) ? prev : '');
    } else {
      setMunicipios([]);
      setMunicipio('');
    }
  }, [estado]);
  // Lógica de ativação/desativação do filtro de raio
  useEffect(() => {
    if (estado !== originalEstado || municipio !== originalMunicipio) setDisableRadius(true);
    else setDisableRadius(false);
  }, [estado, municipio, originalEstado, originalMunicipio]);

  // Atualizar a filtragem dos cards:
  const filteredByLocation = React.useMemo(() => {
    if (!locationGranted) return [];
    if (disableRadius && estado && municipio) {
      // Filtrar por estado e município
      return secrets.filter(s => s.estado === estado && s.municipio === municipio);
    }
    // Filtrar por raio normalmente
    return secrets;
  }, [secrets, locationGranted, disableRadius, estado, municipio]);

  // Atualizar a ordenação para usar filteredByLocation
  const sortedFilteredPosts = React.useMemo(() => {
    let arr = [...filteredByLocation];
    if (sortBy === 'likes') {
      arr.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sortBy === 'comments') {
      arr.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
    } else {
      arr.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }
    return arr;
  }, [filteredByLocation, sortBy]);

  // Função para animar o like
  const triggerLikeAnim = (id: string) => {
    if (!likeAnim[id]) {
      setLikeAnim(prev => ({ ...prev, [id]: new Animated.Value(1) }));
    }
    setLikeColor(prev => ({ ...prev, [id]: '#ff1744' }));
    Animated.sequence([
      Animated.timing(likeAnim[id] || new Animated.Value(1), {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(likeAnim[id] || new Animated.Value(1), {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => setLikeColor(prev => ({ ...prev, [id]: '#ec4899' })));
  };

  const handleLike = async (post: Post) => {
    setLiking(post.id);
    triggerLikeAnim(post.id);
    try {
      const ref = doc(db, 'posts', post.id);
      await updateDoc(ref, { likes: (post.likes || 0) + 1 });
    } catch (e) {}
    setLiking(null);
  };

  const openModal = (post: Post) => {
    setSelectedPost(post);
    setModalVisible(true);
    setComments([]);
    setCommentsPage(null);
    setCommentsEnd(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPost(null);
    setComments([]);
    setCommentsPage(null);
    setCommentsEnd(false);
  };

  // Atualizar handleAddPost para salvar estado e município
  const handleAddPost = async (text: string) => {
    await addDoc(collection(db, 'posts'), {
      text,
      createdAt: new Date().toISOString(),
      likes: 0,
      estado,
      municipio,
      location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
    });
  };

  // Ao criar comentário, registrar data e hora
  const handleAddComment = async () => {
    if (!selectedPost || !commentText.trim()) return;
    setCommentsLoading(true);
    try {
      await addDoc(collection(db, 'posts', selectedPost.id, 'comments'), {
        text: commentText,
        createdAt: new Date().toISOString(),
        likes: 0,
      });
      setCommentText('');
      setCommentToast(true);
      setTimeout(() => setCommentToast(false), 3000);
    } catch (e) {
      alert('Erro ao comentar: ' + (e?.message || e));
    }
    setCommentsLoading(false);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!selectedPost) return;
    const ref = doc(db, 'posts', selectedPost.id, 'comments', commentId);
    const comment = comments?.find(c => c.id === commentId);
    await updateDoc(ref, { likes: (comment?.likes || 0) + 1 });
  };

  // Substituir numColumns fixo por cálculo dinâmico de colunas
  const getNumColumns = () => {
    if (isMobile) return 1;
    const minCardWidth = 320;
    return Math.max(1, Math.floor(width / (minCardWidth + 24)));
  };

  // Calcular numColumns dinamicamente para o FlatList
  const numColumns = React.useMemo(() => {
    if (Platform.OS !== 'web') return getNumColumns();
    // Para web, calcula baseado na largura da janela e sidebar
    const sidebarW = sidebarVisible ? 240 : 0;
    const available = window.innerWidth - sidebarW - 80;
    return Math.max(1, Math.floor(available / 380));
  }, [sidebarVisible, typeof window !== 'undefined' ? window.innerWidth : 1200]);

  const shouldBlur = !locationGranted;

  // Responsividade para filtros
  const isLargeScreen = width > 700;

  // Remover opções de estados/municípios
  const estadosOptions = [{ label: 'Selecione o estado', value: '' }, ...estados.map(uf => ({ label: uf.name, value: uf.id }))];
  const municipiosOptions = [{ label: 'Selecione o município', value: '' }, ...municipios.map(m => ({ label: m, value: m }))];

  if (locationError || (!location && !locationLoading)) {
    return (
      <ResponsiveLinearGradient colors={["#0f0c29", "#302b63", "#24243e"]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 }}>
              Para visualizar os segredos próximos, é necessário permitir o acesso à sua localização.
            </Text>
            <Text style={{ color: '#a5b4fc', fontSize: 16, textAlign: 'center', marginBottom: 28 }}>
              Sua localização nunca será compartilhada com ninguém. Apenas a distância até cada segredo é registrada, mantendo seu anonimato total.
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

  return (
    <ResponsiveLinearGradient colors={["#0f0c29", "#302b63", "#24243e"]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* SIDEBAR WEB */}
        {Platform.OS === 'web' && sidebarVisible && (
          <div style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: 180,
            height: '100vh',
            background: 'rgba(24,24,48,0.92)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            padding: '16px 8px',
            alignItems: 'center',
            boxShadow: '2px 0 16px #0002',
            backdropFilter: 'blur(6px)',
          }}>
            <button onClick={() => setSidebarVisible(false)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: '#a5b4fc', fontSize: 20, cursor: 'pointer', marginBottom: 8, marginRight: 2 }}>×</button>
            <div style={{ marginBottom: 12, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginBottom: 4, textAlign: 'center' }}>Raio:</Text>
              <div style={{ width: 150, maxWidth: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <RadiusSlider value={radius} onChange={disableRadius ? () => {} : setRadius} />
                <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 13, minWidth: 28 }}>{radius}km</span>
              </div>
            </div>
            <div style={{ marginBottom: 10, width: '100%' }}>
              <Select value={estado} onChange={setEstado} options={estadosOptions} placeholder="Estado" />
            </div>
            <div style={{ width: '100%' }}>
              <Select value={municipio} onChange={setMunicipio} options={municipiosOptions} placeholder="Município" />
            </div>
            <div style={{ marginTop: 24, width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setEstado(originalEstado || '');
                  setMunicipio(originalMunicipio || '');
                  setRadius(10);
                }}
                style={{ background: '#a5b4fc', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 22px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px #a5b4fc33' }}
              >
                Limpar filtros
              </button>
            </div>
          </div>
        )}
        {Platform.OS === 'web' && !sidebarVisible && (
          <button onClick={() => setSidebarVisible(true)} style={{ position: 'fixed', top: 14, left: 14, zIndex: 101, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 18, cursor: 'pointer' }}>☰ Filtros</button>
        )}
        {/* SIDEBAR MOBILE (off-canvas) */}
        {Platform.OS !== 'web' && (
          <>
            <TouchableOpacity
              style={{ position: 'absolute', top: 18, left: 18, zIndex: 200, backgroundColor: '#6366f1', borderRadius: 8, padding: 10 }}
              onPress={() => setSidebarOpen(true)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>☰ Filtros</Text>
            </TouchableOpacity>
            {sidebarOpen && (
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#181830ee', zIndex: 300, paddingTop: 48, paddingHorizontal: 24 }}>
                <TouchableOpacity style={{ position: 'absolute', top: 24, right: 24, zIndex: 301 }} onPress={() => setSidebarOpen(false)}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 28 }}>×</Text>
                </TouchableOpacity>
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Filtrar segredos em até:</Text>
                  <RadiusSlider value={radius} onChange={disableRadius ? () => {} : setRadius} />
                  <Text style={{ color: '#a5b4fc', fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>{radius} km</Text>
                </View>
                <View style={{ marginBottom: 24 }}>
                  <Select value={estado} onChange={setEstado} options={estadosOptions} placeholder="Estado" />
                </View>
                <View>
                  <Select value={municipio} onChange={setMunicipio} options={municipiosOptions} placeholder="Município" />
                </View>
              </View>
            )}
          </>
        )}
        {/* MAIN CONTENT */}
        <View style={{
          flex: 1,
          width: '100%',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'flex-start',
          marginLeft: Platform.OS === 'web' && sidebarVisible ? 180 : 0,
          paddingTop: Platform.OS === 'web' ? 32 : 60,
          paddingLeft: 0,
          paddingRight: 0,
        }}>
          <View style={{ width: '100%', maxWidth: 1100, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Botão Contar Segredo e filtros centralizados */}
            <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>
              <div style={{ width: 320, marginBottom: 32 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #6366f155' }}
                  onPress={() => router.push('/post')}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>Contar Segredo</Text>
                </TouchableOpacity>
              </div>
              {/* Tabs de ordenação - centralizadas, SEM SCROLL, wrap se necessário */}
              <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'row', justifyContent: 'center', marginBottom: 18, gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSortBy('recent')}
                  style={{ margin: 0, padding: '5px 12px', borderRadius: 16, background: sortBy === 'recent' ? '#a78bfa' : 'rgba(255,255,255,0.10)', color: sortBy === 'recent' ? '#fff' : '#a5b4fc', fontWeight: sortBy === 'recent' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', fontSize: 15, minWidth: 110 }}
                >
                  Mais recentes
                </button>
                <button
                  onClick={() => setSortBy('likes')}
                  style={{ margin: 0, padding: '5px 12px', borderRadius: 16, background: sortBy === 'likes' ? '#a78bfa' : 'rgba(255,255,255,0.10)', color: sortBy === 'likes' ? '#fff' : '#a5b4fc', fontWeight: sortBy === 'likes' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', fontSize: 15, minWidth: 110 }}
                >
                  Mais curtidos
                </button>
                <button
                  onClick={() => setSortBy('comments')}
                  style={{ margin: 0, padding: '5px 12px', borderRadius: 16, background: sortBy === 'comments' ? '#a78bfa' : 'rgba(255,255,255,0.10)', color: sortBy === 'comments' ? '#fff' : '#a5b4fc', fontWeight: sortBy === 'comments' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', fontSize: 15, minWidth: 110 }}
                >
                  Mais comentados
                </button>
              </div>
            </div>
            {/* Feed de cards centralizado e responsivo */}
            <View style={{ flex: 1, width: '100%', maxWidth: 1100, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
              {!locationGranted ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={styles.empty}>Escolha e aplique um filtro para ver os segredos.</Text>
                </View>
              ) : (
                filteredByLocation.length === 0 ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={styles.empty}>🤫 Nenhum segredo postado nesse raio...</Text>
                  </View>
                ) : (
                  <FlatList
                    key={`columns-${numColumns}`}
                    data={sortedFilteredPosts}
                    keyExtractor={item => item.id}
                    numColumns={numColumns}
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 0, paddingTop: 8, alignItems: 'center', justifyContent: 'center', gap: 16 }}
                    {...(numColumns > 1 ? { columnWrapperStyle: { justifyContent: 'center', gap: 16 } } : {})}
                    renderItem={({ item }) => (
                      <Pressable
                        key={item.id}
                        onPress={() => openModal(item)}
                        style={({ hovered, pressed }) => [
                          {
                            width: 320,
                            borderRadius: 18,
                            backgroundColor: 'rgba(255,255,255,0.13)',
                            borderWidth: 1,
                            borderColor: '#a78bfa',
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            marginBottom: 12,
                            marginHorizontal: 8,
                            boxShadow: hovered ? '0 8px 32px 0 #a78bfa55' : '0 2px 12px #0002',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            transition: Platform.OS === 'web' ? 'all 0.18s cubic-bezier(.4,2,.6,1)' : undefined,
                            backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        {Platform.OS === 'web' ? (
                          <Text
                            style={{
                              ...styles.cardText,
                              ...webEllipsisStyle,
                              overflowWrap: 'break-word',
                              marginTop: 8,
                              textAlign: item.text.length < 40 ? 'center' : 'justify',
                            } as any}
                          >
                            {item.text}
                          </Text>
                        ) : (
                          <Text style={[styles.cardText, { marginTop: 8, textAlign: item.text.length < 40 ? 'center' : 'justify' }]} numberOfLines={4} ellipsizeMode="tail"> 
                            {item.text}
                          </Text>
                        )}
                        {/* Distância e data agrupados */}
                        <View style={{ alignItems: 'center', gap: 2 }}>
                          {item._distance !== undefined && item._distance !== null && (
                            <Text style={{ color: '#a5b4fc', fontSize: 13, textAlign: 'center', marginTop: 0 }}>{item._distance.toFixed(1)} km de você</Text>
                          )}
                          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                          {/* Like animado */}
                          <Pressable
                            style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center' }, pressed && { opacity: 0.7 }]}
                            onPress={() => handleLike(item)}
                            disabled={liking === item.id}
                          >
                            <Animated.Text style={[styles.likeIcon, { color: likeColor[item.id] || '#ec4899', transform: [{ scale: likeAnim[item.id] || 1 }], marginRight: 6 }]}>❤️</Animated.Text>
                            <Text style={styles.likeCount}>{item.likes || 0}</Text>
                          </Pressable>
                          {/* Comentários */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 18 }}>
                            <Text style={{ fontSize: 20, color: '#a5b4fc', marginRight: 6, marginLeft: 2, top: 1 }}>💬</Text>
                            <Text style={{ color: '#a5b4fc', fontWeight: 'bold', fontSize: 16 }}>{item.commentsCount || 0}</Text>
                          </View>
                        </View>
                      </Pressable>
                    )}
                  />
                )
              )}
              {shouldBlur && !permLoading && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(30, 27, 75, 0.72)' }}>
                  {Platform.OS !== 'web' && (
                    <BlurView intensity={40} tint="dark" style={{ ...StyleSheet.absoluteFillObject }} />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
        {/* Modal de comentários */}
        <RNModal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeModal}
        >
          {Platform.OS === 'web' ? (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div
                style={{
                  ...styles.modalBox,
                  minWidth: 320,
                  maxHeight: 600,
                  width: 420,
                  margin: '0 auto',
                  overflowY: 'auto',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'stretch',
                  position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Botão X no canto superior direito */}
                <button
                  onClick={closeModal}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: 24,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 10,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
                
                {/* Conteúdo do modal web */}
                <div style={{ maxHeight: 500, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: 8, alignItems: 'stretch', width: '100%' }}>
                  <style>{`
                    .modal-comments::-webkit-scrollbar:horizontal { height: 0 !important; }
                    .modal-comments { scrollbar-width: thin; scrollbar-color: #a5b4fc #f3f4f6; }
                    .modal-comments { overflow-x: hidden !important; }
                    .modal-comments { -ms-overflow-style: none; }
                    .modal-comments::-webkit-scrollbar { height: 0 !important; width: 8px; background: transparent; }
                  `}</style>
                  <Text style={[styles.modalTitle, { textAlign: 'center', width: '100%' }]}>Segredo</Text>
                  <Text style={[styles.modalSecret, { textAlign: 'justify', width: '100%', paddingHorizontal: 4 }]}> 
                    {selectedPost?.text}
                  </Text>
                  <Text style={[styles.modalDate, { textAlign: 'center', width: '100%' }]}>{selectedPost && formatDate(selectedPost.createdAt)}</Text>
                  <Text style={{ fontWeight: 'bold', color: '#312e81', fontSize: 16, marginTop: 12, marginBottom: 4, textAlign: 'center', width: '100%' }}>Comentários</Text>
                  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', marginBottom: 8, width: '100%' }}>
                    <button onClick={() => setCommentSortBy('recent')} style={{ margin: '0 8px', padding: '4px 12px', borderRadius: 16, background: commentSortBy === 'recent' ? '#a78bfa' : 'transparent', color: '#312e81', fontWeight: commentSortBy === 'recent' ? 'bold' : 'normal', border: 'none', cursor: 'pointer' }}>Mais recentes</button>
                    <button onClick={() => setCommentSortBy('likes')} style={{ margin: '0 8px', padding: '4px 12px', borderRadius: 16, background: commentSortBy === 'likes' ? '#a78bfa' : 'transparent', color: '#312e81', fontWeight: commentSortBy === 'likes' ? 'bold' : 'normal', border: 'none', cursor: 'pointer' }}>Mais curtidos</button>
                  </div>
                  <div className="modal-comments" style={{ minHeight: 120, maxHeight: 180, overflowY: 'auto', overflowX: 'hidden', marginBottom: 8, width: '100%' }}>
                    {comments === null ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}><ActivityIndicator color="#5B0FFF" /></div>
                    ) : (
                      comments.length === 0 ? <Text style={[styles.commentEmpty, { textAlign: 'center', width: '100%' }]}>Nenhum comentário ainda...</Text> :
                      sortedComments.map(item => (
                        <div key={item.id} style={{ marginBottom: 10, padding: 8, background: '#eef2ff', borderRadius: 12, width: '100%', boxSizing: 'border-box', paddingRight: 16 }}>
                          <Text style={[styles.commentText, { width: '100%' }]}>{item.text}</Text>
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 6, justifyContent: 'space-between', width: '100%' }}>
                            <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
                            <button onClick={() => handleLikeComment(item.id)} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', marginRight: 4 }}>
                              <span style={{ color: '#ec4899', fontSize: 18, marginRight: 4 }}>❤️</span>
                              <span style={{ color: '#ec4899', fontWeight: 'bold', fontSize: 15 }}>{item.likes || 0}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 8, width: '100%' }}>
                    <input
                      style={{ flex: 1, border: '1px solid #a5b4fc', borderRadius: 8, padding: '8px 12px', color: '#312e81', background: '#fff', marginRight: 8 }}
                      placeholder="Comente anonimamente..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      disabled={comments === null}
                    />
                    <button
                      style={{ background: '#ec4899', borderRadius: 20, padding: '8px 18px', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                      onClick={handleAddComment}
                      disabled={comments === null || !commentText.trim()}
                    >Enviar</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <View style={styles.modalOverlay}>
              <View
                style={[styles.modalBox, { minWidth: '90%', position: 'relative' }]}
                onStartShouldSetResponder={() => true}
              >
                {/* Botão X no canto superior direito - Mobile */}
                <TouchableOpacity
                  onPress={closeModal}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 10,
                    width: 32,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 16,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6366f1', fontSize: 24, fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>
                
                {/* Conteúdo do modal mobile */}
                <ScrollView style={{ maxHeight: '70%' }} contentContainerStyle={{ flexGrow: 1, flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 8, alignItems: 'stretch', width: '100%' }}>
                  <Text style={[styles.modalTitle, { textAlign: 'center', width: '100%' }]}>Segredo</Text>
                  <Text style={[styles.modalSecret, { textAlign: 'justify', width: '100%', paddingHorizontal: 4 }]}> 
                    {selectedPost?.text}
                  </Text>
                  <Text style={[styles.modalDate, { textAlign: 'center', width: '100%' }]}>{selectedPost && formatDate(selectedPost.createdAt)}</Text>
                  <Text style={{ fontWeight: 'bold', color: '#312e81', fontSize: 16, marginTop: 12, marginBottom: 4, textAlign: 'center', width: '100%' }}>Comentários</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8, width: '100%' }}>
                    <TouchableOpacity onPress={() => setCommentSortBy('recent')} style={{ marginHorizontal: 8, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 16, backgroundColor: commentSortBy === 'recent' ? '#a78bfa' : 'transparent' }}>
                      <Text style={{ color: '#312e81', fontWeight: commentSortBy === 'recent' ? 'bold' : 'normal' }}>Mais recentes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCommentSortBy('likes')} style={{ marginHorizontal: 8, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 16, backgroundColor: commentSortBy === 'likes' ? '#a78bfa' : 'transparent' }}>
                      <Text style={{ color: '#312e81', fontWeight: commentSortBy === 'likes' ? 'bold' : 'normal' }}>Mais curtidos</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.commentList, { width: '100%' }]}>
                    {commentsLoading && comments === null ? (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#5B0FFF" /></View>
                    ) : (
                      <FlatList
                        data={sortedComments}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                          <View style={[styles.commentBox, { width: '100%' }]}>
                            <Text style={[styles.commentText, { width: '100%' }]}>{item.text}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, justifyContent: 'space-between', width: '100%' }}>
                              <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
                              <Pressable
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => handleLikeComment(item.id)}
                              >
                                <Text style={{ color: '#ec4899', fontSize: 18, marginRight: 4 }}>❤️</Text>
                                <Text style={{ color: '#ec4899', fontWeight: 'bold', fontSize: 15 }}>{item.likes || 0}</Text>
                              </Pressable>
                            </View>
                          </View>
                        )}
                        ListEmptyComponent={<Text style={[styles.commentEmpty, { textAlign: 'center', width: '100%' }]}>Nenhum comentário ainda...</Text>}
                      />
                    )}
                  </View>
                  <View style={[styles.commentInputRow, { width: '100%' }]}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Comente anonimamente..."
                      placeholderTextColor="#a5b4fc"
                      value={commentText}
                      onChangeText={setCommentText}
                      editable={comments === null}
                    />
                    <TouchableOpacity
                      style={styles.commentSend}
                      onPress={handleAddComment}
                      disabled={comments === null || !commentText.trim()}
                    >
                      <Text style={styles.commentSendText}>Enviar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </RNModal>
        {/* Modal insistente de permissão */}
        <Modal isVisible={showModal} backdropOpacity={0.7} animationIn="fadeIn" animationOut="fadeOut" useNativeDriver>
          <View style={{ backgroundColor: '#312e81', borderRadius: 18, padding: 28, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 }}>
              O app Confesso precisa da sua localização para mostrar segredos próximos. Por favor, ative a localização para continuar.
            </Text>
            <Text style={{ color: '#a5b4fc', fontSize: 16, textAlign: 'center', marginBottom: 28 }}>
              Sua localização nunca será compartilhada. Apenas a distância é registrada, mantendo seu anonimato.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#ec4899', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              onPress={requestPermission}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Permitir localização</Text>
            </TouchableOpacity>
            {deniedForever && (
              <TouchableOpacity
                style={{ backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }}
                onPress={onOpenSettings}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Abrir configurações</Text>
              </TouchableOpacity>
            )}
          </View>
        </Modal>
        {/* Toast de comentário enviado */}
        {commentToast && (
          <View style={{ position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
            <View style={{ backgroundColor: '#22c55e', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Comentário enviado!</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ResponsiveLinearGradient>
  );
} 