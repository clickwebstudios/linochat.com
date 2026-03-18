import type { Transition, Variants } from 'motion/react';

export const transition = {
  spring: { type: 'spring', stiffness: 300, damping: 30 } satisfies Transition,
  ease: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } satisfies Transition,
  fast: { duration: 0.15, ease: 'easeOut' } satisfies Transition,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.ease },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transition.spring },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transition.spring },
};

export const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};
