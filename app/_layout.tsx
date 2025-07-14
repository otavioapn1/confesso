import React from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { TailwindProvider } from 'tailwind-rn';
import utilities from '../tailwind.json';

export default function RootLayout() {
  return (
    <TailwindProvider utilities={utilities}>
      <Stack
        screenOptions={{
          headerShown: false, // Remover header global
          headerTitle: '',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontFamily: Platform.select({ ios: 'MarkerFelt-Wide', android: 'sans-serif', default: 'fantasy' }),
            fontSize: 28,
            fontWeight: 'bold',
            color: '#fff',
          },
          headerStyle: {
            backgroundColor: '#0f0c29',
          },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen
          name="feed"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="post"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </TailwindProvider>
  );
}
