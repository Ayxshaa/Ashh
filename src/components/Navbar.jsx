import React from "react";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-lg bg-black/20 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Nippo, sans-serif' }}>
            🌕 Ash Space
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#home" className="text-white/80 hover:text-white transition-colors duration-300">Home</a>
            <a href="#about" className="text-white/80 hover:text-white transition-colors duration-300">About</a>
            <a href="#projects" className="text-white/80 hover:text-white transition-colors duration-300">Projects</a>
            <a href="#contact" className="text-white/80 hover:text-white transition-colors duration-300">Contact</a>
          </div>
        </div>
      </div>
    </nav>
  );
};



export default Navbar;
