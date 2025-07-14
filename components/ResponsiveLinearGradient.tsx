import React, { useMemo } from 'react';
import { Platform, View, ViewProps } from 'react-native';

export function ResponsiveLinearGradient(props: ViewProps & { colors: string[] }) {
  if (Platform.OS === 'web') {
    // Simula gradiente no web usando CSS
    return (
      <View
        {...props}
        style={
          {
            background: `linear-gradient(to bottom, ${props.colors.join(', ')})`,
            flex: 1,
            ...(props.style as object),
          } as any
        }
      >
        {props.children}
      </View>
    );
  }
  // Mobile: lazy load do LinearGradient para evitar require no web
  const LinearGradient = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('expo-linear-gradient').LinearGradient;
    } catch {
      return View;
    }
  }, []);
  return <LinearGradient {...props}>{props.children}</LinearGradient>;
} 