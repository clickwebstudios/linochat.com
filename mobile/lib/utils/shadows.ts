import { Platform, ViewStyle } from 'react-native';

type ShadowPreset = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

function createShadow(
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number,
): ShadowPreset {
  return {
    shadowColor: '#2D2D2D',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: Platform.OS === 'ios' ? opacity : 1,
    shadowRadius: radius,
    elevation,
  };
}

export const Shadows = {
  sm: createShadow(1, 2, 0.06, 1),
  md: createShadow(2, 6, 0.1, 3),
  lg: createShadow(4, 12, 0.12, 6),
  xl: createShadow(8, 24, 0.16, 12),
} as const;

export function applyShadow(preset: keyof typeof Shadows): ViewStyle {
  return Shadows[preset];
}
