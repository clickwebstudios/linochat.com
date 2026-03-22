import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '@/lib/utils/colors';
import { getInitials } from '@/lib/utils/formatting';

interface AvatarProps {
  firstName: string;
  lastName?: string;
  imageUrl?: string;
  size?: number;
  color?: string;
}

export function Avatar({ firstName, lastName, imageUrl, size = 40, color }: AvatarProps) {
  const bgColor = color || Colors.primary;
  const fontSize = size * 0.4;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
      <Text style={[styles.text, { fontSize }]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  text: {
    color: Colors.white,
    fontWeight: '600',
  },
});
