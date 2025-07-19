import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable, Platform, ScrollView, FlatList, TextInput, StyleSheet, Dimensions, Animated, Easing, KeyboardAvoidingView } from 'react-native';
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
import { getAllStates, getStateCities } from 'easy-location-br';

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
const CARD_WIDTH = Math.min(Dimensions.get('window').width - 32, 320);

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

// Substituir o Select por react-select no web
let Select = require('../components/SelectEstadoMunicipio').Select;
let isWeb = Platform.OS === 'web';
let ReactSelect: any = null;
if (isWeb) {
  try {
    ReactSelect = require('react-select').default;
  } catch {}
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [liking, setLiking] = useState<string | null>(null);
  const [fabPressed, setFabPressed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
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
  const [visibleCount, setVisibleCount] = useState(9);

  const isWeb = Platform.OS === 'web';
  const [windowWidth, setWindowWidth] = useState(
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const { location, error: locationError, loading: locationLoading, refresh: refreshLocation } = useUserLocation();
  const [radius, setRadius] = useState(10);
  const [radiusLoading, setRadiusLoading] = useState(true);
  const { secrets, loading, error, refresh } = useSecretsNearby(location, radius);
  const { granted: locationGranted, loading: permLoading, showModal, onTryAgain, onOpenSettings, deniedForever, requestPermission } = usePersistentLocationPermission();

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

  useEffect(() => {
    if (!modalVisible || !selectedPost) return;
    setComments([]);
    setCommentsLoading(true);
    const q = query(collection(db, 'posts', selectedPost.id, 'comments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(newComments);
      setCommentsLoading(false); // Garante que o loading sempre termina, mesmo sem comentários
    }, (err) => {
      setCommentsLoading(false);
      alert('Erro ao buscar comentários: ' + (err?.message || err));
    });
    return () => unsubscribe();
  }, [modalVisible, selectedPost]);

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

  const sortedComments = React.useMemo(() => {
    if (commentSortBy === 'likes') {
      return [...comments || []].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    return [...comments || []];
  }, [comments, commentSortBy]);

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

  useEffect(() => {
    setEstados(getAllStates());
  }, []);
  useEffect(() => {
    if (estado) {
      const cidades = getStateCities(estado);
      setMunicipios(Array.isArray(cidades) ? cidades.map((c: any) => (typeof c === 'string' ? c : c.name)) : []);
      setMunicipio(prev => prev && municipios.includes(prev) ? prev : '');
    } else {
      setMunicipios([]);
      setMunicipio('');
    }
  }, [estado]);
  useEffect(() => {
    if (estado !== originalEstado || municipio !== originalMunicipio) setDisableRadius(true);
    else setDisableRadius(false);
  }, [estado, municipio, originalEstado, originalMunicipio]);

  const filteredByLocation = React.useMemo(() => {
    if (!locationGranted) return [];
    if (disableRadius && estado && municipio) {
      return secrets.filter(s => s.estado === estado && s.municipio === municipio);
    }
    return secrets;
  }, [secrets, locationGranted, disableRadius, estado, municipio]);

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

  // Corrigir o useEffect para não causar loop infinito
  useEffect(() => {
    setVisibleCount(9);
  }, [estado, municipio, radius, sortBy, disableRadius]); // coloque aqui apenas os filtros reais

  // Função para carregar mais cards ao chegar no fim do scroll
  const handleLoadMore = () => {
    if (visibleCount < sortedFilteredPosts.length) {
      setVisibleCount(prev => Math.min(prev + 9, sortedFilteredPosts.length));
    }
  };

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

  const getNumColumns = () => {
    if (isMobile) return 1;
    const minCardWidth = 320;
    return Math.max(1, Math.floor(width / (minCardWidth + 24)));
  };

  const numColumns = React.useMemo(() => {
    if (Platform.OS !== 'web') return getNumColumns();
    const available = windowWidth - 80;
    return Math.max(1, Math.floor(available / 380));
  }, [windowWidth]);

  const shouldBlur = !locationGranted;

  const isLargeScreen = width > 700;

  const estadosOptions = [{ label: 'Selecione o estado', value: '' }, ...estados.map(uf => ({ label: uf.name, value: uf.id }))];
  const municipiosOptions = [{ label: 'Selecione o município', value: '' }, ...municipios.map(m => ({ label: m, value: m }))];

  // NOVO: Sempre ScrollView, centralização e padding
  const MainContainer = ScrollView;
  const mainContainerProps = {
    contentContainerStyle: {
      // alignItems: 'center', // Removido para evitar erro de tipagem
      padding: 32,
      flexGrow: 1,
      paddingBottom: 120,
    }
  };

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
      <SafeAreaView style={[styles.safe, { minHeight: '100%', flex: 1 }]}>
        <MainContainer {...mainContainerProps}>
          <FlatList
            key={`columns-${numColumns}`}
            data={sortedFilteredPosts.slice(0, visibleCount)}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            contentContainerStyle={{
              paddingBottom: 120,
              paddingHorizontal: 16,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: 1100,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
            {...(numColumns > 1 ? { columnWrapperStyle: { justifyContent: 'center', gap: 16 } } : {})}
            ListHeaderComponent={
              <>
                {/* Filtros centralizados */}
                <View style={{ width: '100%', maxWidth: 420, marginTop: 0, marginBottom: 32, alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative', zIndex: 9999 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginBottom: 4, textAlign: 'center' }}>Filtre por Raio de localização:</Text>
                  <View style={{ width: 260, maxWidth: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <RadiusSlider value={radius} onChange={disableRadius ? () => {} : setRadius} />
                    <Text style={{ color: '#a5b4fc', fontWeight: 'bold', fontSize: 13 }}>{`${radius} km`}</Text>
                  </View>
                  {/* Estado */}
                  {isWeb ? (
                    <div style={{ width: '100%', maxWidth: 420, zIndex: 9999 }}>
                      <ReactSelect
                        value={estadosOptions.find(opt => opt.value === estado)}
                        onChange={opt => setEstado(opt?.value || '')}
                        options={estadosOptions}
                        placeholder="Selecione o estado"
                        isDisabled={false}
                        menuPortalTarget={typeof window !== 'undefined' ? window.document.body : null}
                        styles={{
                          control: (base: any) => ({
                            ...base,
                            background: 'rgba(40,40,70,0.95)',
                            borderColor: '#a78bfa',
                            color: '#fff',
                            minHeight: 44,
                            borderRadius: 10,
                            fontSize: 18,
                          }),
                          menu: (base: any) => ({
                            ...base,
                            background: '#232142',
                            color: '#fff',
                            zIndex: 99999,
                          }),
                          menuPortal: (base: any) => ({
                            ...base,
                            zIndex: 99999,
                          }),
                          option: (base: any, state: any) => ({
                            ...base,
                            background: state.isSelected
                              ? '#a78bfa'
                              : state.isFocused
                              ? '#312e81'
                              : 'transparent',
                            color: '#fff',
                            fontWeight: state.isSelected ? 700 : 400,
                            fontSize: 17,
                            padding: 12,
                            cursor: 'pointer',
                          }),
                          singleValue: (base: any) => ({
                            ...base,
                            color: '#fff',
                          }),
                        }}
                        theme={theme => ({
                          ...theme,
                          borderRadius: 10,
                          colors: {
                            ...theme.colors,
                            primary25: '#312e81',
                            primary: '#a78bfa',
                            neutral0: '#232142',
                            neutral80: '#fff',
                          },
                        })}
                      />
                    </div>
                  ) : (
                    <Select value={estado} onChange={setEstado} options={estadosOptions} placeholder="Estado" />
                  )}
                  {/* Município */}
                  {isWeb ? (
                    <div style={{ width: '100%', maxWidth: 420, marginTop: 12, zIndex: 9999 }}>
                      <ReactSelect
                        value={municipiosOptions.find(opt => opt.value === municipio)}
                        onChange={opt => setMunicipio(opt?.value || '')}
                        options={municipiosOptions}
                        placeholder="Selecione o município"
                        isDisabled={false}
                        menuPortalTarget={typeof window !== 'undefined' ? window.document.body : null}
                        styles={{
                          control: (base: any) => ({
                            ...base,
                            background: 'rgba(40,40,70,0.95)',
                            borderColor: '#a78bfa',
                            color: '#fff',
                            minHeight: 44,
                            borderRadius: 10,
                            fontSize: 18,
                          }),
                          menu: (base: any) => ({
                            ...base,
                            background: '#232142',
                            color: '#fff',
                            zIndex: 99999,
                          }),
                          menuPortal: (base: any) => ({
                            ...base,
                            zIndex: 99999,
                          }),
                          option: (base: any, state: any) => ({
                            ...base,
                            background: state.isSelected
                              ? '#a78bfa'
                              : state.isFocused
                              ? '#312e81'
                              : 'transparent',
                            color: '#fff',
                            fontWeight: state.isSelected ? 700 : 400,
                            fontSize: 17,
                            padding: 12,
                            cursor: 'pointer',
                          }),
                          singleValue: (base: any) => ({
                            ...base,
                            color: '#fff',
                          }),
                        }}
                        theme={theme => ({
                          ...theme,
                          borderRadius: 10,
                          colors: {
                            ...theme.colors,
                            primary25: '#312e81',
                            primary: '#a78bfa',
                            neutral0: '#232142',
                            neutral80: '#fff',
                          },
                        })}
                      />
                    </div>
                  ) : (
                    <Select value={municipio} onChange={setMunicipio} options={municipiosOptions} placeholder="Município" />
                  )}
                  <View style={{ marginTop: 12, width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setEstado(originalEstado || '');
                        setMunicipio(originalMunicipio || '');
                        setRadius(10);
                      }}
                      style={{ backgroundColor: '#a5b4fc', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Limpar filtros</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Botão Contar Segredo */}
                <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', marginBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={{ backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #6366f155', width: '100%' }}
                    onPress={() => router.push('/post')}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>Contar Segredo</Text>
                  </TouchableOpacity>
                </View>

                {/* Tabs de ordenação */}
                <View style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'row', justifyContent: 'center', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
                  <TouchableOpacity
                    onPress={() => setSortBy('recent')}
                    style={{ margin: 0, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16, backgroundColor: sortBy === 'recent' ? '#a78bfa' : 'rgba(255,255,255,0.10)', alignItems: 'center', minWidth: 110 }}
                  >
                    <Text style={{ color: sortBy === 'recent' ? '#fff' : '#a5b4fc', fontWeight: sortBy === 'recent' ? 'bold' : 'normal', fontSize: 15 }}>Mais recentes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSortBy('likes')}
                    style={{ margin: 0, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16, backgroundColor: sortBy === 'likes' ? '#a78bfa' : 'rgba(255,255,255,0.10)', alignItems: 'center', minWidth: 110 }}
                  >
                    <Text style={{ color: sortBy === 'likes' ? '#fff' : '#a5b4fc', fontWeight: sortBy === 'likes' ? 'bold' : 'normal', fontSize: 15 }}>Mais curtidos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSortBy('comments')}
                    style={{ margin: 0, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16, backgroundColor: sortBy === 'comments' ? '#a78bfa' : 'rgba(255,255,255,0.10)', alignItems: 'center', minWidth: 110 }}
                  >
                    <Text style={{ color: sortBy === 'comments' ? '#fff' : '#a5b4fc', fontWeight: sortBy === 'comments' ? 'bold' : 'normal', fontSize: 15 }}>Mais comentados</Text>
                  </TouchableOpacity>
                </View>
              </>
            }
            renderItem={({ item }) => (
              <Pressable
                key={item.id}
                onPress={() => openModal(item)}
                style={({ hovered, pressed }) => [
                  {
                    width: CARD_WIDTH,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255,255,255,0.13)',
                    borderWidth: 1,
                    borderColor: '#a78bfa',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginBottom: 12,
                    marginHorizontal: 4,
                    boxShadow: hovered ? '0 8px 32px 0 #a78bfa55' : '0 2px 12px #0002',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    transition: Platform.OS === 'web' ? 'all 0.18s cubic-bezier(.4,2,.6,1)' : undefined,
                    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
                    opacity: pressed ? 0.85 : 1,
                    zIndex: 1,
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
            ListFooterComponent={
              visibleCount < sortedFilteredPosts.length && (
                <TouchableOpacity onPress={handleLoadMore} style={{ padding: 18, alignItems: 'center' }}>
                  <Text style={{ color: '#a78bfa', fontSize: 18, fontWeight: 'bold' }}>Carregar mais</Text>
                </TouchableOpacity>
              )
            }
          />
          {/* Modal de detalhes do card */}
          <Modal
            isVisible={modalVisible}
            onBackdropPress={closeModal}
            onBackButtonPress={closeModal}
            useNativeDriver
            style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Segredo</Text>
                <Text style={styles.modalSecret}>{selectedPost?.text}</Text>
                <Text style={styles.modalDate}>{selectedPost ? formatDate(selectedPost.createdAt) : ''}</Text>

                {/* Comentários */}
                <Text style={{ color: '#312e81', fontWeight: 'bold', fontSize: 15, marginBottom: 8, marginTop: 10 }}>Comentários</Text>
                {commentsLoading ? (
                  <ActivityIndicator color="#6366f1" style={{ marginVertical: 16 }} />
                ) : comments && comments.length > 0 ? (
                  <ScrollView style={styles.commentList}>
                    {comments.map(comment => (
                      <View key={comment.id} style={styles.commentBox}>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'space-between' }}>
                          <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                          <TouchableOpacity onPress={() => handleLikeComment(comment.id)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: '#ec4899', fontSize: 16, marginRight: 4 }}>❤️</Text>
                            <Text style={{ color: '#ec4899', fontWeight: 'bold', fontSize: 14 }}>{comment.likes || 0}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.commentEmpty}>Nenhum comentário ainda.</Text>
                )}

                {/* Adicionar comentário */}
                <View style={styles.commentInputRow}>
                  <TextInput
                    style={styles.commentInput}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Digite um comentário..."
                    placeholderTextColor="#a5b4fc"
                    editable={!commentsLoading}
                  />
                  <TouchableOpacity onPress={handleAddComment} style={styles.commentSend} disabled={commentsLoading || !commentText.trim()}>
                    <Text style={styles.commentSendText}>Enviar</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={closeModal} style={{ marginTop: 18, alignSelf: 'center' }}>
                  <Text style={{ color: '#6366f1', fontWeight: 'bold', fontSize: 16 }}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>
          {shouldBlur && !permLoading && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(30, 27, 75, 0.72)' }}>
              {Platform.OS !== 'web' && (
                <BlurView intensity={40} tint="dark" style={{ ...StyleSheet.absoluteFillObject }} />
              )}
            </View>
          )}
        </MainContainer>
      </SafeAreaView>
    </ResponsiveLinearGradient>
  );
}