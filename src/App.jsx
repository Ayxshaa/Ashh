import React, { useState } from 'react';
import BackgroundCanvas from './components/BackgroundCanvas';
import Navbar from './components/Navbar';
import Button from './components/Button';
import Hero from './sections/Hero';


function App() {
  const [showBackground, setShowBackground] = useState(false);



  // Handle hero completion when user clicks launch button
  const handleHeroComplete = () => {
    setShowBackground(true);
  };

 
  return (
    <div className="relative w-full min-h-screen">
      {/* Hero Section - appears first and takes full screen */}
      {!showBackground && (
        <div className="w-full min-h-screen bg-black">
          <Hero onComplete={handleHeroComplete} />
        </div>
      )}
      
      {/* Main Site - appears after launch button is clicked */}
      {showBackground && (
        <div className="w-full h-screen overflow-hidden animate-fade-in">
          {/* 3D Background */}
          <BackgroundCanvas />
          
          {/* Navbar */}
          <div className="relative z-30">
            <Navbar />
          </div>
          
          {/* Button - positioned at the bottom of the moon */}
          <div className="fixed top-[90%] left-1/2 transform -translate-x-1/2 z-50">
            <Button />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;