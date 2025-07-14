// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAuth from '../hooks/useAuth';
import { useTailwind } from 'tailwind-rn';

export default function SplashScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const tailwind = useTailwind();

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }, 1000);
    }
  }, [user]);

  return (
    <View style={tailwind('flex-1 justify-center items-center bg-white')}>
      <Image source={require('../../assets/images/splash-icon.png')} style={{ width: 120, height: 120, marginBottom: 24 }} />
      <Text style={tailwind('text-2xl font-bold text-gray-800')}>Confesso</Text>
      <Text style={tailwind('text-base text-gray-500 mt-2')}>Segredos anônimos, confesse sem medo.</Text>
    </View>
  );
} 