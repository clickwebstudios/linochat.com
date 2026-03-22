import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/lib/utils/colors';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
}

const variantColors = {
  success: { bg: Colors.successLight, text: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  error: { bg: Colors.errorLight, text: Colors.error },
  info: { bg: Colors.infoLight, text: Colors.info },
  default: { bg: Colors.borderLight, text: Colors.textSecondary },
};

export function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
  const colors = variantColors[variant];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, paddingHorizontal: isSmall ? 8 : 12, paddingVertical: isSmall ? 2 : 4 }]}>
      <Text style={[styles.text, { color: colors.text, fontSize: isSmall ? 11 : 13 }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
