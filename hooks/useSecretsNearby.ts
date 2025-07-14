import { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, DocumentData, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateDistance } from '../src/utils/calculateDistance';

export function useSecretsNearby(userLocation: { latitude: number; longitude: number } | null, radiusKm: number) {
  const [secrets, setSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecrets = useCallback(() => {
    setLoading(true);
    setError(null);
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let allSecrets = snapshot.docs.map((doc: DocumentData) => ({ id: doc.id, ...doc.data() }));
        if (userLocation) {
          allSecrets = allSecrets.map(secret => {
            if (secret.location && secret.location.latitude && secret.location.longitude) {
              secret._distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                secret.location.latitude,
                secret.location.longitude
              );
            } else {
              secret._distance = null;
            }
            return secret;
          });
          allSecrets = allSecrets.filter(secret => secret._distance !== null && secret._distance <= radiusKm);
        }
        setSecrets(allSecrets);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Erro ao buscar segredos');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [userLocation, radiusKm]);

  // Listener em tempo real para likes e comentários dos secrets
  useEffect(() => {
    if (!secrets || secrets.length === 0) return;
    
    const unsubscribes: (() => void)[] = [];
    
    secrets.forEach(secret => {
      // Listener para likes
      const postRef = doc(db, 'posts', secret.id);
      const likeUnsubscribe = onSnapshot(postRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSecrets(prev => prev.map(s => 
            s.id === secret.id ? { ...s, likes: data.likes || 0 } : s
          ));
        }
      });
      unsubscribes.push(likeUnsubscribe);
      
      // Listener para comentários
      const commentsRef = collection(db, 'posts', secret.id, 'comments');
      const commentsUnsubscribe = onSnapshot(commentsRef, (snapshot) => {
        setSecrets(prev => prev.map(s => 
          s.id === secret.id ? { ...s, commentsCount: snapshot.size } : s
        ));
      });
      unsubscribes.push(commentsUnsubscribe);
    });
    
    return () => { unsubscribes.forEach(u => u()); };
  }, [secrets]);

  useEffect(() => {
    const unsubscribe = fetchSecrets();
    return () => unsubscribe && unsubscribe();
  }, [fetchSecrets]);

  return { secrets, loading, error, refresh: fetchSecrets };
} 