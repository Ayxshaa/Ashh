import React, { useState } from 'react';
import BackgroundCanvas from './components/BackgroundCanvas';
import Navbar from './components/Navbar';
import Button from './components/Button';
import Hero from './sections/Hero';
import SpaceJourney from './components/SpaceJourney';
// Import both parts of the moon game
import MoonExplorerPart1 from './components/MoonExplorerPart1';
import MoonExplorerPart2 from './components/MoonExplorerPart2';

function App() {
  const [currentView, setCurrentView] = useState('hero'); // 'hero', 'moon', 'moonZoom', 'journey', 'landing'
  const [isZooming, setIsZooming] = useState(false);

  // Handle hero completion when user clicks launch button
  const handleHeroComplete = () => {
    setCurrentView('moon');
  };

  // Handle button click to start moon zoom then journey
  const handleJourneyBegin = () => {
    setCurrentView('moonZoom');
    setIsZooming(true);
    
    // Trigger moon zoom animation
    window.dispatchEvent(new CustomEvent('startMoonZoom'));
    
    // After zoom completes, start space journey
    setTimeout(() => {
      setCurrentView('journey');
      setIsZooming(false);
    }, 3000); // 3 second zoom duration
  };

  // Handle journey completion to show moon surface
  const handleJourneyComplete = () => {
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
      {(currentView === 'moon' || currentView === 'moonZoom') && (
        <div className="w-full h-screen overflow-hidden transition-opacity duration-500 ease-in-out">
          {/* 3D Background */}
          <BackgroundCanvas isZooming={isZooming} />
          
          {/* Navbar - hide during zoom */}
          {!isZooming && (
            <div className="relative z-30">
              <Navbar />
            </div>
          )}
          
          {/* Button - hide during zoom */}
          {!isZooming && (
            <div className="fixed top-[85%] left-1/2 transform -translate-x-1/2 z-50">
              <Button onClick={handleJourneyBegin} />
            </div>
          )}

          {/* Zoom overlay effect */}
          {isZooming && (
            <div className="absolute inset-0 z-40">
              <div className="absolute inset-0 bg-black opacity-0 animate-[fadeIn_3s_ease-in-out_forwards]" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xl font-bold">
                <div className="bg-black/50 p-6 rounded-lg border border-blue-400/30 backdrop-blur-sm">
                  <div className="animate-pulse">Approaching Lunar Surface...</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Space Journey Cinematic Effect */}
      {currentView === 'journey' && (
        <SpaceJourney onComplete={handleJourneyComplete} />
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

      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;