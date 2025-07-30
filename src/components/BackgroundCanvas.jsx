// src/components/BackgroundCanvas.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BackgroundCanvas = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;

    const canvas = canvasRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 50); // Changed to pure black
    
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1); // Changed to pure black
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Create moon geometry
    const moonGeometry = new THREE.SphereGeometry(1.4, 64, 64);
    
    // Create initial moon material (without texture)
    const moonMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xcccccc, // Light gray color
      shininess: 1,
      specular: 0x222222,
    });
    
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.castShadow = true;
    moon.receiveShadow = true;
    scene.add(moon);
    
    // Try to load the moon texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      // Try different possible paths for the moon texture
      '/src/assets/moon.jpg', // First try this path
      // Success callback
      (texture) => {
        console.log('Moon texture loaded successfully');
        moonMaterial.map = texture;
        moonMaterial.needsUpdate = true;
      },
      // Progress callback
      (progress) => {
        console.log('Loading progress:', progress);
      },
      // Error callback - try alternative paths
      (error) => {
        console.log('First path failed, trying alternative paths...');
        
        // Try second path
        textureLoader.load(
          './assets/moon.jpg',
          (texture) => {
            console.log('Moon texture loaded from alternative path');
            moonMaterial.map = texture;
            moonMaterial.needsUpdate = true;
          },
          undefined,
          (error2) => {
            console.log('Second path failed, trying public folder...');
            
            // Try public folder
            textureLoader.load(
              '/moon.jpg',
              (texture) => {
                console.log('Moon texture loaded from public folder');
                moonMaterial.map = texture;
                moonMaterial.needsUpdate = true;
              },
              undefined,
              (error3) => {
                console.log('All texture loading attempts failed. Using default gray moon.');
                console.error('Texture loading errors:', { error, error2, error3 });
                // Moon will remain gray
              }
            );
          }
        );
      }
    );
    
    // Camera position - centered for better moon display
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);
    
    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const onMouseMove = (event) => {
      targetX = (event.clientX / window.innerWidth) * 2 - 1;
      targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', onMouseMove);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Smooth mouse following
      mouseX += (targetX - mouseX) * 0.01;
      mouseY += (targetY - mouseY) * 0.01;
      
      // Rotate moon
      moon.rotation.y += 0.002;
      
      // Subtle camera movement
      camera.position.x = mouseX * 0.2;
      camera.position.y = mouseY * 0.2;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', onResize);
    
    // Store scene reference
    sceneRef.current = { scene, renderer, camera, onResize, onMouseMove };
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      if (renderer) {
        renderer.dispose();
      }
      if (moonGeometry) {
        moonGeometry.dispose();
      }
      if (moonMaterial) {
        moonMaterial.dispose();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {/* Starfield Background */}
      <div className="starfield"></div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default BackgroundCanvas;