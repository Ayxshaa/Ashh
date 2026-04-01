import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Projects from './Projects';
import About from './About';
import Contact from './Contact';

const CarrotModal = ({ isOpen, carrotType, onClose }) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      console.log('Modal opened with carrot type:', carrotType);
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, onClose, carrotType]);

  if (!isOpen) {
    return null;
  }

  if (!carrotType) {
    console.error('CarrotModal: carrotType is null or undefined');
    return null;
  }

  const getContent = () => {
    try {
      switch (carrotType) {
        case 'projects':
          return <Projects onClose={onClose} />;
        case 'about':
          return <About onClose={onClose} />;
        case 'contact':
          return <Contact onClose={onClose} />;
        default:
          console.warn('Unknown carrot type:', carrotType);
          return <div className="text-white p-4">Unknown content type: {carrotType}</div>;
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return <div className="text-red-400 p-4">Error loading content</div>;
    }
  };

  const getTitle = () => {
    switch (carrotType) {
      case 'projects':
        return '🥕 Projects';
      case 'about':
        return '🥕 About';
      case 'contact':
        return '🥕 Contact';
      default:
        return '🥕 Carrot File';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors hover:scale-110 duration-200"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          {getContent()}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/20 text-center text-sm text-gray-400">
          Press <span className="text-white font-semibold">ESC</span> to close | Continue exploring to find more carrots! 🌙
        </div>
      </div>
    </div>
  );
};

export default CarrotModal;