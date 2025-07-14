import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';

export function useUserLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão de localização negada');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (e: any) {
      setError(e.message || 'Erro ao obter localização');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return { location, error, loading, refresh: getLocation };
} 