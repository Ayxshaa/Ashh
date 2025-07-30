// src/components/Button.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Accept an onClick prop
const Button = ({ onClick }) => {
  return (
    <motion.button
      className="bg-[var(--color-primary)] text-[var(--color-white)] font-bold font-['Nippo'] px-8 py-3 rounded-full shadow-md hover:bg-[var(--color-highlight)] hover:text-[var(--color-bg)] hover:shadow-[0_0_20px_var(--color-primary)] transition duration-300 ease-in-out"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      onClick={onClick} 
    >
      Begin Your Journey
    </motion.button>
  );
};

export default Button;