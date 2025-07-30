import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

const RocketLaunchSequence = ({ onLaunchComplete }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black space background

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Create rocket
    const rocketGeometry = new THREE.CylinderGeometry(0.2, 0.1, 2, 32);
    const rocketMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      metalness: 0.7,
      roughness: 0.3
    });
    const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
    rocket.rotation.x = Math.PI / 2; // Rotate rocket to point upwards
    scene.add(rocket);

    // Exhaust flame
    const flameGeometry = new THREE.ConeGeometry(0.15, 1, 32);
    const flameMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600,
      transparent: true,
      opacity: 0.8
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.y = -1.5; // Position below rocket
    scene.add(flame);

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1000;
    const posArray = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starsMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 0.005 
    });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // Initial positioning
    camera.position.z = 5;
    rocket.position.y = -2;
    flame.position.y = -1.5;

    // Launch animation
    let animationFrameId;
    const launchAnimation = () => {
      // Rocket ascent
      rocket.position.y += 0.05;
      flame.position.y += 0.05;
      
      // Camera follows rocket with smooth interpolation
      camera.position.y += 0.05;
      camera.lookAt(rocket.position);

      // Rotate rocket slightly for dynamic effect
      rocket.rotation.z += 0.001;

      // Move stars
      starField.rotation.x += 0.0005;
      starField.rotation.y += 0.0005;

      renderer.render(scene, camera);

      // Stop condition
      if (rocket.position.y > 10) {
        cancelAnimationFrame(animationFrameId);
        onLaunchComplete();
        return;
      }

      // Continue animation
      animationFrameId = requestAnimationFrame(launchAnimation);
    };

    // Start launch animation
    launchAnimation();

    // Responsive handling
        // Responsive handling
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Audio for launch (optional)
    const launchAudio = new Audio('/launch-sound.mp3'); // Add your launch sound
    launchAudio.play().catch(error => console.log('Audio play failed', error));

    // Cleanup function
    return () => {
      // Cancel animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Remove event listener
      window.removeEventListener('resize', handleResize);

      // Dispose geometries and materials
      rocketGeometry.dispose();
      rocketMaterial.dispose();
      flameGeometry.dispose();
      flameMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();

      // Stop audio
      if (launchAudio) {
        launchAudio.pause();
        launchAudio.currentTime = 0;
      }

      // Dispose renderer
      renderer.dispose();
    };
  }, [onLaunchComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-50 bg-black"
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Optional Overlay Text */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center"
      >
        <h2 className="text-3xl font-bold mb-4">Launching to the Moon</h2>
        <p className="text-xl opacity-70">Prepare for an extraordinary journey</p>
      </motion.div>
    </motion.div>
  );
};

export default RocketLaunchSequence;
  
