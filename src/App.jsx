import React, { useState } from 'react';
import BackgroundCanvas from './components/BackgroundCanvas';
import Navbar from './components/Navbar';
import Button from './components/Button';
import Hero from './sections/Hero';
import RocketLaunchSequence from './components/AnimeGirlViewer';

function App() {
  const [currentView, setCurrentView] = useState('hero'); // 'hero', 'moon', 'launch', 'landing'

  // Handle hero completion when user clicks launch button
  const handleHeroComplete = () => {
    setCurrentView('moon');
  };

  // Handle button click to start rocket launch
  const handleJourneyBegin = () => {
    setCurrentView('launch');
  };

  // Handle rocket launch completion (landing on moon)
  const handleLaunchComplete = () => {
    setCurrentView('landing');
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

      {/* Rocket Launch Sequence */}
      {currentView === 'launch' && (
        <div className="w-full h-screen overflow-hidden">
          <RocketLaunchSequence onComplete={handleLaunchComplete} />
        </div>
      )}

      {/* Moon Landing View */}
      {currentView === 'landing' && (
        <div className="w-full h-screen overflow-hidden moon-surface-view">
          {/* Moon Surface Background */}
          <div className="moon-surface-bg"></div>
          
          {/* Welcome message or next content */}
          <div className="relative z-10 flex items-center justify-center h-full">
            <div className="text-center text-white">
              <h1 className="text-6xl font-bold mb-4 font-['Nippo'] glow-text">
                Welcome to the Moon
              </h1>
              <p className="text-xl opacity-80">
                Your lunar journey begins here...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;