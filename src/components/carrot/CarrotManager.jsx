import React, { useEffect, useState, useRef } from 'react';
import { createCarrot3D, updateCarrotAnimation } from './Carrot3D';
import CarrotModal from './CarrotModal';

const CarrotManager = () => {
  const [openCarrot, setOpenCarrot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const carrotsRef = useRef([]);
  const lastCollisionRef = useRef(null);
  const collisionCooldownRef = useRef(0);

  // Define carrot positions on moon surface - Closer to spawn point for testing
  const carrotPositions = [
    { x: 3, y: 1.5, z: 3, type: 'projects', name: 'Projects' },
    { x: -5, y: 1.5, z: 4, type: 'about', name: 'About' },
    { x: 2, y: 1.5, z: -6, type: 'contact', name: 'Contact' }
  ];

  useEffect(() => {
    // Wait a bit for scene to be ready
    const initTimeout = setTimeout(() => {
      const sceneRef = window.sceneRef;
      if (!sceneRef || !sceneRef.current || !sceneRef.current.scene) {
        console.warn('Scene not ready for carrots');
        return;
      }

      const scene = sceneRef.current.scene;
      console.log('Creating carrots in scene');

      // Create and add carrots to scene
      carrotsRef.current = carrotPositions.map(pos => {
        const carrot = createCarrot3D(pos, pos.type);
        scene.add(carrot);
        console.log(`Added carrot: ${pos.type} at position (${pos.x}, ${pos.y}, ${pos.z})`);
        return carrot;
      });

      // Animation loop for carrots
      let animationId;
      const animateCarrots = () => {
        const time = Date.now();
        carrotsRef.current.forEach(carrot => {
          updateCarrotAnimation(carrot, time);
        });
        animationId = requestAnimationFrame(animateCarrots);
      };
      animateCarrots();

      // Collision detection loop
      const detectCollisions = setInterval(() => {
        const rabbitPos = window.rabbitPosition;
        if (!rabbitPos) {
          return;
        }

        collisionCooldownRef.current--;

        carrotsRef.current.forEach(carrot => {
          const distance = Math.sqrt(
            Math.pow(rabbitPos.x - carrot.position.x, 2) +
            Math.pow(rabbitPos.y - carrot.position.y, 2) +
            Math.pow(rabbitPos.z - carrot.position.z, 2)
          );

          // Collision detection with cooldown to prevent multiple triggers
          if (distance < carrot.userData.collisionRadius && collisionCooldownRef.current <= 0) {
            console.log(`Collision detected with ${carrot.userData.type} carrot! Distance: ${distance}`);
            setOpenCarrot(carrot.userData.type);
            setIsModalOpen(true);
            collisionCooldownRef.current = 60; // Cooldown in frames
            lastCollisionRef.current = carrot.userData.type;
          }
        });
      }, 50);

      return () => {
        clearInterval(detectCollisions);
        cancelAnimationFrame(animationId);
        // Cleanup carrots
        carrotsRef.current.forEach(carrot => {
          scene.remove(carrot);
          carrot.traverse(child => {
            if (child.isMesh) {
              if (child.geometry) child.geometry.dispose();
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.dispose());
                } else {
                  child.material.dispose();
                }
              }
            }
          });
        });
        carrotsRef.current = [];
      };
    }, 500); // Wait 500ms for scene to initialize

    return () => clearTimeout(initTimeout);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOpenCarrot(null);
    collisionCooldownRef.current = 120; // Extended cooldown after closing
  };

  return (
    <>
      {/* Carrot indicator UI */}
      <div className="fixed top-4 right-4 z-40 pointer-events-none">
        <div className="bg-black/70 text-white p-4 rounded-lg border border-orange-400/50 backdrop-blur-sm text-sm">
          <p className="font-bold text-orange-400 mb-2">🥕 Carrots Found: {carrotsRef.current.length}</p>
          <div className="space-y-1 text-xs">
            {carrotPositions.map((pos, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-orange-400">▸</span>
                <span>{pos.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-gray-400 italic">Move rabbit to carrots to open files!</p>
          {carrotsRef.current.length === 0 && (
            <div className="mt-3 p-2 bg-red-900/50 border border-red-500 rounded text-red-300 text-xs">
              ⚠️ Carrots not loaded yet. Scene may not be ready.
            </div>
          )}
        </div>
      </div>

      {/* Carrot Modal */}
      <CarrotModal
        isOpen={isModalOpen}
        carrotType={openCarrot}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default CarrotManager;