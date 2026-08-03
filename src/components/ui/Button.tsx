import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'gold';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  gold: 'btn-gold',
};

export default function Button({ variant = 'primary', children, fullWidth, className = '', ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={`${variantClass[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
