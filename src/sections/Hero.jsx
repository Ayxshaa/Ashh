import React, { useState, useEffect, useRef } from 'react';

const Hero = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const textSequence = [
    { text: "🌕 Welcome to Ash Space", delay: 60, pause: 800 },
    { text: "Buckle up, explorer — your journey to the Moon begins now.", delay: 50, pause: 900 },
    { text: "Step into a universe where design orbits innovation, and code fuels creativity.", delay: 40, pause: 900 },
    { text: "Every pixel has a purpose.", delay: 60, pause: 1000 },
    { text: "Are you ready to launch?", delay: 80, pause: 600 }
  ];

  // Initialize component and start typing
  useEffect(() => {
    const initializeComponent = () => {
      // Start typing animation immediately
      setIsTyping(true);
      
      // Prepare audio element
      if (audioRef.current) {
        audioRef.current.volume = 0.3;
        console.log('Audio element prepared');
      }

      // Set up listeners for first user interaction to enable audio
      const handleFirstInteraction = async () => {
        if (!userInteracted) {
          setUserInteracted(true);
          console.log('First user interaction detected');
          
          // Try to play audio if not muted and typing is active
          if (audioRef.current && !isMuted && isTyping) {
            try {
              await audioRef.current.play();
              setAudioInitialized(true);
              console.log('Audio started after user interaction');
            } catch (err) {
              console.log('Audio play failed:', err);
            }
          }
        }
        
        // Remove listeners after first interaction
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('mousedown', handleFirstInteraction);
      };
      
      // Add listeners for various user interactions
      document.addEventListener('click', handleFirstInteraction);
      document.addEventListener('keydown', handleFirstInteraction);
      document.addEventListener('touchstart', handleFirstInteraction);
      document.addEventListener('mousedown', handleFirstInteraction);
    };

    // Small delay to ensure DOM is ready
    setTimeout(initializeComponent, 300);
  }, []);

  // Handle audio playback based on state changes
  useEffect(() => {
    const handleAudioPlayback = async () => {
      if (!audioRef.current || !userInteracted) return;

      try {
        if (isTyping && !isMuted) {
          // Should be playing
          if (audioRef.current.paused) {
            await audioRef.current.play();
            console.log('Audio started/resumed');
          }
        } else {
          // Should be paused
          if (!audioRef.current.paused) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            console.log('Audio paused');
          }
        }
      } catch (error) {
        console.error('Audio playback error:', error);
      }
    };

    handleAudioPlayback();
  }, [isTyping, isMuted, userInteracted]);

  // Handle mute/unmute toggle
  const toggleMute = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (!audioRef.current) return;

    try {
      if (newMutedState) {
        // Muting - pause the audio
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        console.log('Audio muted');
      } else {
        // Unmuting - play if typing is active
        if (isTyping && userInteracted) {
          await audioRef.current.play();
          console.log('Audio unmuted and playing');
        }
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  };

  // Main typing effect
  useEffect(() => {
    if (!isTyping || currentStep >= textSequence.length) {
      if (currentStep >= textSequence.length) {
        setIsTyping(false);
      }
      return;
    }

    const currentSequence = textSequence[currentStep];
    const targetText = currentSequence.text;

    if (currentIndex < targetText.length) {
      const timer = setTimeout(() => {
        setCurrentText(targetText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, currentSequence.delay);

      return () => clearTimeout(timer);
    } else {
      // Text complete for this step
      const pauseTimer = setTimeout(() => {
        if (currentStep === textSequence.length - 1) {
          // Last step completed - stop typing (and audio)
          setIsTyping(false);
        }
        setCurrentStep(currentStep + 1);
        setCurrentIndex(0);
        setCurrentText('');
      }, currentSequence.pause);

      return () => clearTimeout(pauseTimer);
    }
  }, [currentIndex, currentStep, isTyping]);

  const getTextForStep = (stepIndex) => {
    if (stepIndex < currentStep) {
      return textSequence[stepIndex].text;
    } else if (stepIndex === currentStep) {
      return currentText;
    }
    return '';
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 relative bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse top-1/4 left-1/4" style={{ animationDelay: '0s' }} />
        <div className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse top-3/4 right-1/4" style={{ animationDelay: '2s' }} />
        <div className="absolute w-48 h-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse top-1/2 right-1/3" style={{ animationDelay: '4s' }} />
      </div>

      {/* Audio Element */}
      <audio 
        ref={audioRef}
        loop
        preload="auto"
        onLoadedData={() => console.log('Audio loaded successfully')}
        onError={(e) => console.error('Audio error:', e)}
      >
        <source src="./hero-audio.mp3" type="audio/mp3" />
        <source src="./hero-audio.wav" type="audio/wav" />
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvGglBjaOy/LJeywFJg==" type="audio/wav" />
        Your browser does not support the audio element.
      </audio>

      {/* Audio Control Button - Fixed positioning to ensure it stays on the right */}
      <div 
        className="fixed z-50"
        style={{
          top: '6rem',
          right: '2rem',
          position: 'fixed'
        }}
      >
        <button
          onClick={toggleMute}
          className="group relative backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl p-4 shadow-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(162,89,255,0.4)]"
          style={{
            width: '70px',
            height: '70px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Button glow effect */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(162, 89, 255, 0.5) 0%, transparent 70%)',
              filter: 'blur(8px)'
            }}
          />
          
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Icon container */}
          <div className="relative z-10 flex items-center justify-center h-full text-white">
            {isMuted ? (
              // Muted icon
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-lg">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.76v2.06c2.89.86 5 3.54 5 6.7zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              // Unmuted icon with animation
              <div className="relative">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-lg">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
                {/* Audio wave animation - show when audio should be playing */}
                {isTyping && !isMuted && userInteracted && (
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 flex space-x-0.5">
                    <div className="w-0.5 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ height: '4px', animationDelay: '0ms', animationDuration: '1s' }} />
                    <div className="w-0.5 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ height: '8px', animationDelay: '200ms', animationDuration: '1s' }} />
                    <div className="w-0.5 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ height: '6px', animationDelay: '400ms', animationDuration: '1s' }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </button>
        
        {/* Audio status indicator */}
        {!userInteracted && (
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <p className="text-xs text-white/70 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm animate-pulse">
              🎵 Click anywhere to enable audio
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Glassmorphic Container - Taller and Narrower */}
      <div 
        className="relative backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border border-white/20 rounded-3xl p-16 max-w-4xl w-full shadow-2xl"
        style={{
          minHeight: '80vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 60px rgba(162, 89, 255, 0.1)'
        }}
      >
        {/* Multiple glow layers for enhanced effect */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(162, 89, 255, 0.4) 0%, transparent 50%)',
            filter: 'blur(30px)'
          }}
        />
        <div 
          className="absolute inset-0 rounded-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            filter: 'blur(40px)'
          }}
        />
        
        {/* Shine effect overlay */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.1) 100%)'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 text-center space-y-12 flex flex-col justify-center" style={{ minHeight: '70vh' }}>
          {/* Welcome Text */}
          <div className="min-h-[100px] flex items-center justify-center">
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              style={{
                textShadow: '0 0 30px rgba(255,255,255,0.6), 0 0 60px rgba(162, 89, 255, 0.4)',
                fontFamily: 'Nippo, sans-serif'
              }}
            >
              {getTextForStep(0)}
              {currentStep === 0 && (
                <span className="animate-pulse text-[var(--color-primary)]">|</span>
              )}
            </h1>
          </div>

          {/* Subtitle 1 */}
          <div className="min-h-[80px] flex items-center justify-center">
            <p className="text-xl md:text-2xl text-gray-100 font-light leading-relaxed max-w-3xl"
               style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
              {getTextForStep(1)}
              {currentStep === 1 && (
                <span className="animate-pulse text-[var(--color-primary)]">|</span>
              )}
            </p>
          </div>

          {/* Subtitle 2 */}
          <div className="min-h-[80px] flex items-center justify-center">
            <p className="text-lg md:text-xl text-gray-200 font-light leading-relaxed max-w-3xl"
               style={{ textShadow: '0 0 15px rgba(255,255,255,0.2)' }}>
              {getTextForStep(2)}
              {currentStep === 2 && (
                <span className="animate-pulse text-[var(--color-primary)]">|</span>
              )}
            </p>
          </div>

          {/* Purpose Statement */}
          <div className="min-h-[60px] flex items-center justify-center">
            <p 
              className="text-lg md:text-xl text-white font-medium"
              style={{
                textShadow: '0 0 20px rgba(255,255,255,0.4)'
              }}
            >
              {getTextForStep(3)}
              {currentStep === 3 && (
                <span className="animate-pulse text-[var(--color-primary)]">|</span>
              )}
            </p>
          </div>

          {/* Call to Action */}
          <div className="min-h-[60px] flex items-center justify-center">
            <p 
              className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]"
              style={{
                textShadow: '0 0 30px rgba(162, 89, 255, 0.6)',
                fontFamily: 'Nippo, sans-serif'
              }}
            >
              {getTextForStep(4)}
              {currentStep === 4 && (
                <span className="animate-pulse">|</span>
              )}
            </p>
          </div>

          {/* Launch Button - appears after all text is complete */}
          {currentStep >= textSequence.length && (
            <div className="pt-12 animate-fade-in">
              <button 
                onClick={onComplete}
                className="group relative px-16 py-5 bg-gradient-to-r from-[var(--color-primary)] to-purple-600 text-white font-bold text-xl rounded-full overflow-hidden transition-all duration-300 hover:scale-105"
                style={{
                  boxShadow: '0 0 40px rgba(162, 89, 255, 0.5), 0 10px 30px rgba(0,0,0,0.3)',
                  fontFamily: 'Nippo, sans-serif'
                }}
              >
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                {/* Button content */}
                <span className="relative z-10 tracking-wider uppercase flex items-center gap-3">
                  🚀 Launch Journey
                </span>
                
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 group-hover:animate-ping" />
              </button>
            </div>
          )}
        </div>

        {/* Enhanced decorative elements */}
        <div className="absolute top-6 right-8 w-3 h-3 bg-white/40 rounded-full animate-pulse shadow-lg" style={{ boxShadow: '0 0 10px rgba(255,255,255,0.5)' }} />
        <div className="absolute bottom-8 left-8 w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse shadow-lg" style={{ animationDelay: '1s', boxShadow: '0 0 15px rgba(162,89,255,0.7)' }} />
        <div className="absolute top-1/3 left-6 w-2.5 h-2.5 bg-blue-400/60 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '2s', boxShadow: '0 0 12px rgba(59,130,246,0.6)' }} />
        <div className="absolute top-2/3 right-6 w-1.5 h-1.5 bg-pink-400/60 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '3s', boxShadow: '0 0 8px rgba(236,72,153,0.6)' }} />
      </div>

      {/* CSS Variables and Enhanced Styles */}
      <div>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-primary: #a259ff;
            }
            
            @keyframes fade-in {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .animate-fade-in {
              animation: fade-in 1s ease-out;
            }
            
            /* Enhanced glassmorphic effect */
            .backdrop-blur-2xl {
              backdrop-filter: blur(40px);
              -webkit-backdrop-filter: blur(40px);
            }
          `
        }} />
      </div>
    </div>
  );
};

export default Hero;








