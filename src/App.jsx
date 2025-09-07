import React, { useState } from 'react';
import BackgroundCanvas from './components/BackgroundCanvas';
import Navbar from './components/Navbar';
import Button from './components/Button';
import Hero from './sections/Hero';
// Import both parts of the moon game
import MoonExplorerPart1 from './components/MoonExplorerPart1';
import MoonExplorerPart2 from './components/MoonExplorerPart2';

function App() {
  const [currentView, setCurrentView] = useState('hero'); // 'hero', 'moon', 'launch', 'landing'

  // Handle hero completion when user clicks launch button
  const handleHeroComplete = () => {
    setCurrentView('moon');
  };

  // Handle button click to start moon surface exploration
  const handleJourneyBegin = () => {
    setCurrentView('landing');
  };

  // Handle when user wants to return or continue
  const handleExplorationComplete = () => {
    console.log('Moon exploration complete!');
    // You could add logic to return to moon view or show completion screen
    // setCurrentView('moon');
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
        <div className="w-full h-screen overflow-hidden transition-opacity duration-500 ease-in-out">
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
        <div className="w-full h-screen overflow-hidden relative">
          {/* Part 1: Environment and Scene */}
          <MoonExplorerPart1 />
          
          {/* Part 2: Rabbit Controller overlaid on top */}
          <div className="absolute inset-0">
            <MoonExplorerPart2 onComplete={handleExplorationComplete} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;