// App.js
import React from 'react';
import AppNavigator from './src/navigation';
import useAuth from './src/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { TailwindProvider } from 'tailwind-rn';
import utilities from './tailwind.json';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <TailwindProvider utilities={utilities}>
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#000" />
        </View>
      </TailwindProvider>
    );
  }

  return (
    <TailwindProvider utilities={utilities}>
      <AppNavigator />
    </TailwindProvider>
  );
} 