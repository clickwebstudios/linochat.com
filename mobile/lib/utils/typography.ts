import { TextStyle } from 'react-native';

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  } as TextStyle,

  h2: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.3,
  } as TextStyle,

  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
  } as TextStyle,

  h4: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,

  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,

  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  } as TextStyle,

  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.1,
  } as TextStyle,

  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.2,
  } as TextStyle,
} as const;
