import { Transition, Variants } from "motion/react";

/**
 * Standard engineering-first motion presets.
 * Short, calm, and purposeful. Never distracting or prolonged.
 */

// Subtle fade-in and upward slide for cards & sections
export const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.12,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Stagger container for list items or table rows
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

// Modal / Dialog enter & exit transitions
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.16,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 6,
    transition: {
      duration: 0.12,
      ease: [0.7, 0, 0.84, 0],
    },
  },
};

// Backdrop fade
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

// Expandable accordion / drawer height
export const accordionVariants: Variants = {
  collapsed: { opacity: 0, height: 0, overflow: "hidden" },
  expanded: {
    opacity: 1,
    height: "auto",
    transition: {
      height: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
      opacity: { duration: 0.15, delay: 0.05 },
    },
  },
};

// Interactive button micro-interactions
export const buttonHoverSpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

export const hoverSubtle = {
  scale: 1.01,
  transition: { duration: 0.1 },
};

export const tapSubtle = {
  scale: 0.98,
  transition: { duration: 0.08 },
};
