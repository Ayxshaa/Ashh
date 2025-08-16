import React, { useState } from 'react';
import BackgroundCanvas from './components/BackgroundCanvas';
import Navbar from './components/Navbar';
import Button from './components/Button';
import Hero from './sections/Hero';
import MoonSurfaceRunner from './components/MoonSurfaceRunner'; // Fixed import

function App() {
  const [currentView, setCurrentView] = useState('hero'); // 'hero', 'moon', 'launch', 'landing'

  // Handle hero completion when user clicks launch button
  const handleHeroComplete = () => {
    setCurrentView('moon');
  };

  // Handle button click to start moon surface exploration
  const handleJourneyBegin = () => {
    setCurrentView('landing'); // Skip launch, go straight to moon surface
  };

  // Handle when user wants to return or continue
  const handleExplorationComplete = () => {
    // You can add logic here for what happens after moon exploration
    console.log('Moon exploration complete!');
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Hero Section - appears first and takes full screen */}
      {currentView === 'hero' && (
        <div className="w-full min-h-screen bg-black">
          <Hero onComplete={handleHeroComplete} />
        </div>
      )}

      {/* Moon View - appears after hero completion */}
      {currentView === 'moon' && (
        <div className="w-full h-screen overflow-hidden animate-fade-in">
          {/* 3D Background */}
          <BackgroundCanvas />
          
          {/* Navbar */}
          <div className="relative z-30">
            <Navbar />
          </div>
          
          {/* Button - positioned at the bottom of the moon */}
          <div className="fixed top-[85%] left-1/2 transform -translate-x-1/2 z-50">
            <Button onClick={handleJourneyBegin} />
          </div>
        </div>
      )}

      {/* Moon Surface Exploration - The rabbit runner on moon surface */}
      {currentView === 'landing' && (
        <div className="w-full h-screen overflow-hidden">
          <MoonSurfaceRunner onComplete={handleExplorationComplete} />
        </div>
      )}
    </div>
  );
}

export default App;