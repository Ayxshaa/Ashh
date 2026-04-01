import React, { useState, useEffect } from 'react';
import BackgroundCanvas from './components/BackgroundCanvas';
import Navbar from './components/Navbar';
import Button from './components/Button';
import Hero from './sections/Hero';
import SpaceJourney from './components/SpaceJourney';
// Import both parts of the moon game
import MoonExplorerPart1 from './components/MoonExplorerPart1';
import MoonExplorerPart2 from './components/MoonExplorerPart2';
import CarrotManager from './components/carrot/CarrotManager';

function MobileBlock() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000005 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', color: '#fff', textAlign: 'center', padding: '2rem'
    }}>
      {/* Stars */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            background: '#fff',
            borderRadius: '50%',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            opacity: Math.random() * 0.7 + 0.3,
          }} />
        ))}
      </div>

      {/* Moon icon */}
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 20px #4488ff)' }}>
        🌕
      </div>

      <h1 style={{
        fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.15em',
        textTransform: 'uppercase', color: '#a0c4ff', marginBottom: '1rem',
        textShadow: '0 0 20px #4488ff'
      }}>
        Desktop Only
      </h1>

      <div style={{
        width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #4488ff, transparent)',
        margin: '0 auto 1.5rem'
      }} />

      <p style={{ fontSize: '0.95rem', color: '#8899bb', lineHeight: 1.8, maxWidth: '280px', marginBottom: '2rem' }}>
        This experience uses immersive 3D graphics and keyboard controls designed for desktop.
      </p>

      <p style={{
        fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase',
        color: '#334466', border: '1px solid #223355', padding: '0.6rem 1.2rem', borderRadius: '4px'
      }}>
        Open on a desktop to explore
      </p>
    </div>
  );
}

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [currentView, setCurrentView] = useState('hero'); // 'hero', 'moon', 'moonZoom', 'journey', 'landing'

  useEffect(() => {
    const check = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth < 768;
      setIsMobile(mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
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

  if (isMobile) return <MobileBlock />;

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
          
          {/* Carrot File Manager - Interactive portfolio files */}
          <CarrotManager />
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