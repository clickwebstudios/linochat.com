import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Colors } from '@/lib/utils/colors';
import { Shadows } from '@/lib/utils/shadows';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({ children, onPress, style, noPadding }: CardProps) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[styles.card, noPadding ? {} : styles.padding, style]}
    >
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  padding: {
    padding: 16,
  },
});
