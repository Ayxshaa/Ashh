import React from "react";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
  <nav className="w-full fixed top-0 z-50 backdrop-blur-md border-b border-[var(--color-black)]">
  <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-center">
    <motion.div
      className="text-[var( --color-light-gray)] font-bold text-[72px] font-['Nippo']"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      Moonfolio 
    </motion.div>
    
  </div>
</nav>


  );
};

export default Navbar;
