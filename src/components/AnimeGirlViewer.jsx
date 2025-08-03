import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const AnimeGirlViewer = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const [loadingStatus, setLoadingStatus] = useState('Loading...');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true,
      alpha: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x1a1a1a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Optimized lighting for anime characters
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(2, 5, 3);
    scene.add(directionalLight);

    // Store scene reference
    sceneRef.current = { scene, renderer, camera };

    // Fast GLB loading
    const loadModel = async () => {
      try {
        setLoadingStatus('Loading anime girl...');
        
        const module = await import('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        
        // Use fetch for faster loading
        const response = await fetch('./girl.glb');
        if (!response.ok) {
          throw new Error('GLB file not found. Make sure girl.glb is in the public folder.');
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        // Dynamic import of GLTFLoader
        const GLTFModule = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const GLTFLoader = GLTFModule.GLTFLoader;
        const loader = new GLTFLoader();
        
        // Parse the loaded data
        loader.parse(arrayBuffer, '', (gltf) => {
          const model = gltf.scene;
          
          // Optimize model for performance
          model.traverse((child) => {
            if (child.isMesh) {
              child.frustumCulled = false;
              
              if (child.material) {
                // Optimize materials for anime style
                if (child.material.isMeshStandardMaterial) {
                  child.material.roughness = 0.7;
                  child.material.metalness = 0.1;
                }
                child.material.needsUpdate = true;
              }
            }
          });
          
          scene.add(model);
          
          // Auto-fit and center the model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          model.position.set(-center.x, -center.y, -center.z);
          
          const maxDimension = Math.max(size.x, size.y, size.z);
          if (maxDimension > 0) {
            const scale = 2.5 / maxDimension;
            model.scale.setScalar(scale);
          }
          
          sceneRef.current.model = model;
          setLoadingStatus('Loaded successfully!');
          setError('');
          
          // Hide loading after a moment
          setTimeout(() => setLoadingStatus(''), 2000);
        });
        
      } catch (error) {
        console.error('Loading error:', error);
        setError(error.message);
        setLoadingStatus('Failed to load');
      }
    };

    loadModel();

    // Set camera position
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Gentle rotation
      if (sceneRef.current.model) {
        sceneRef.current.model.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Mouse controls
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    
    const onMouseDown = (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };
    
    const onMouseUp = () => {
      isMouseDown = false;
    };
    
    const onMouseMove = (event) => {
      if (!isMouseDown || !sceneRef.current) return;
      
      const deltaX = (event.clientX - mouseX) * 0.01;
      const deltaY = (event.clientY - mouseY) * 0.01;
      
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta -= deltaX;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaY));
      
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event) => {
      if (!sceneRef.current) return;
      
      const delta = event.deltaY * 0.001;
      const distance = camera.position.length();
      const newDistance = Math.max(1, Math.min(10, distance * (1 + delta)));
      
      camera.position.normalize().multiplyScalar(newDistance);
      camera.lookAt(0, 0, 0);
    };

    // Add event listeners
    const canvas = canvasRef.current;
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel);

    // Resize handler
    const handleResize = () => {
      if (!sceneRef.current) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('wheel', onWheel);
      }
      
      if (sceneRef.current) {
        const { scene, renderer } = sceneRef.current;
        
        scene.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
        
        renderer.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900">
      {(loadingStatus || error) && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg">
            {error ? (
              <div className="text-red-400">
                <p className="font-bold">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <p className="text-green-400">{loadingStatus}</p>
            )}
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 z-10 text-white text-xs bg-black bg-opacity-60 p-2 rounded">
        <p>🖱️ Drag to rotate • 🖱️ Scroll to zoom</p>
      </div>
      
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default AnimeGirlViewer;