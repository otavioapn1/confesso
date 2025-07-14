import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform, Linking } from 'react-native';

export function usePersistentLocationPermission() {
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deniedForever, setDeniedForever] = useState(false);

  const checkPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setGranted(true);
        setShowModal(false);
        setDeniedForever(false);
      } else {
        setGranted(false);
        setShowModal(true);
        setDeniedForever(!canAskAgain);
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao verificar permissão de localização');
      setShowModal(true);
    }
    setLoading(false);
  }, []);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setGranted(true);
        setShowModal(false);
        setDeniedForever(false);
      } else {
        setGranted(false);
        setShowModal(true);
        setDeniedForever(!canAskAgain);
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao solicitar permissão de localização');
      setShowModal(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Tentar solicitar permissão sempre que o modal for exibido e não estiver granted
  useEffect(() => {
    if (showModal && !granted && !loading) {
      requestPermission();
    }
  }, [showModal, granted, loading, requestPermission]);

  const onTryAgain = requestPermission;
  const onOpenSettings = () => Linking.openSettings();

  return { granted, loading, showModal, onTryAgain, onOpenSettings, error, deniedForever, requestPermission };
} 