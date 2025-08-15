import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const AnimeGirlViewer = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const [loadingStatus, setLoadingStatus] = useState('Loading...');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const keysPressed = useRef({});
  const rabbitSpeed = 0.05;

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
        setLoadingStatus('Loading rabbit from GLTF...');
        
        // Dynamic import of GLTFLoader
        const GLTFModule = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const GLTFLoader = GLTFModule.GLTFLoader;
        const loader = new GLTFLoader();
        
        // Load GLTF file directly (not GLB)
        loader.load('./scene.gltf', (gltf) => {
          const model = gltf.scene;
          
          // Debug: Log all animations found
          console.log('Found animations:', gltf.animations.map(anim => anim.name));
          
          // Setup animation mixer if animations exist
          if (gltf.animations && gltf.animations.length > 0) {
            mixerRef.current = new THREE.AnimationMixer(model);
            
            // Try to find running/walking animation
            let runAnimation = gltf.animations.find(anim => 
              anim.name.toLowerCase().includes('run') || 
              anim.name.toLowerCase().includes('walk') ||
              anim.name.toLowerCase().includes('move') ||
              anim.name.toLowerCase().includes('loop')
            );
            
            // If no specific animation found, use the first one
            if (!runAnimation) {
              runAnimation = gltf.animations[0];
              console.log('Using first animation:', runAnimation.name);
            } else {
              console.log('Using animation:', runAnimation.name);
            }
            
            if (runAnimation) {
              sceneRef.current.runAction = mixerRef.current.clipAction(runAnimation);
              sceneRef.current.runAction.setLoop(THREE.LoopRepeat);
              sceneRef.current.runAction.clampWhenFinished = false;
              
              // Set animation speed (you can adjust this)
              sceneRef.current.runAction.setEffectiveTimeScale(1.0);
              
              // Enable the action and play it immediately to test
              sceneRef.current.runAction.enabled = true;
              sceneRef.current.runAction.setEffectiveWeight(1);
              sceneRef.current.runAction.play();
              
              console.log('Animation setup complete:', {
                name: runAnimation.name,
                duration: runAnimation.duration,
                tracks: runAnimation.tracks.length
              });
              
              // Store all animations for potential use
              sceneRef.current.allAnimations = gltf.animations.map(anim => ({
                name: anim.name,
                action: mixerRef.current.clipAction(anim)
              }));
            }
          } else {
            console.log('No animations found in the GLB file');
            setError('No animations found in rabbit_run.glb. Make sure the file contains animations.');
          }
          
          // Optimize model and apply colors
          model.traverse((child) => {
            if (child.isMesh) {
              child.frustumCulled = false;
              
              if (child.material) {
                // Color the eyes black
                if (child.name.toLowerCase().includes('eye') || 
                    child.material.name?.toLowerCase().includes('eye')) {
                  child.material.color = new THREE.Color(0x000000);
                }
                
                // Color the inside of ears pink
                if (child.name.toLowerCase().includes('ear') && 
                    (child.name.toLowerCase().includes('inner') || 
                     child.name.toLowerCase().includes('inside'))) {
                  child.material.color = new THREE.Color(0xffb6c1);
                }
                
                // Optimize materials
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
        }, (progress) => {
          console.log('Loading progress:', progress);
        }, (error) => {
          console.error('GLTF loading error:', error);
          setError(`Failed to load scene.gltf: ${error.message}`);
          setLoadingStatus('Failed to load');
        });
        
      } catch (error) {
        console.error('Loading error:', error);
        setError(error.message);
        setLoadingStatus('Failed to load');
      }
    };

    loadModel();

    // Set camera position
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    // Keyboard event handlers
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      keysPressed.current[key] = true;

      // Start running animation on movement keys
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(event.key)) {
        if (sceneRef.current.runAction) {
          if (!isRunning) {
            console.log('Resuming animation from key press');
            sceneRef.current.runAction.paused = false;
            setIsRunning(true);
          }
        } else {
          console.log('No run action available');
        }
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      keysPressed.current[key] = false;

      // Check if any movement keys are still pressed
      const movementKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
      const isAnyMovementKeyPressed = movementKeys.some(k => keysPressed.current[k]);

      // Stop running animation if no movement keys are pressed
      if (!isAnyMovementKeyPressed && sceneRef.current.runAction && isRunning) {
        console.log('Stopping animation - pausing instead of stopping');
        // Don't stop the animation, just pause it
        sceneRef.current.runAction.paused = true;
        setIsRunning(false);
      }
    };

    // Add keyboard listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      
      animationIdRef.current = requestAnimationFrame(animate);
      
      const delta = clockRef.current.getDelta();
      
      // Update animation mixer
      if (mixerRef.current) {
        mixerRef.current.update(delta);
        
        // Debug: Log mixer time occasionally
        if (Math.random() < 0.01) { // 1% chance per frame
          console.log('Mixer time:', mixerRef.current.time, 'Delta:', delta);
        }
      }
      
      // Handle rabbit movement based on keys
      if (sceneRef.current.model) {
        let moved = false;
        const model = sceneRef.current.model;
        
        if (keysPressed.current['arrowup']) {
          model.position.z -= rabbitSpeed;
          model.rotation.y = 0;
          moved = true;
        }
        if (keysPressed.current['arrowdown']) {
          model.position.z += rabbitSpeed;
          model.rotation.y = Math.PI;
          moved = true;
        }
        if (keysPressed.current['arrowleft']) {
          model.position.x -= rabbitSpeed;
          model.rotation.y = Math.PI / 2;
          moved = true;
        }
        if (keysPressed.current['arrowright']) {
          model.position.x += rabbitSpeed;
          model.rotation.y = -Math.PI / 2;
          moved = true;
        }

        // Handle diagonal movement
        if (keysPressed.current['arrowup'] && keysPressed.current['arrowleft']) {
          model.rotation.y = Math.PI / 4;
        }
        if (keysPressed.current['arrowup'] && keysPressed.current['arrowright']) {
          model.rotation.y = -Math.PI / 4;
        }
        if (keysPressed.current['arrowdown'] && keysPressed.current['arrowleft']) {
          model.rotation.y = 3 * Math.PI / 4;
        }
        if (keysPressed.current['arrowdown'] && keysPressed.current['arrowright']) {
          model.rotation.y = -3 * Math.PI / 4;
        }

        // Gentle idle rotation when not moving
        if (!moved) {
          model.rotation.y += 0.005;
        }
      }
      
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    };
    animate();

    // Mouse controls (for camera)
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
      sceneRef.current.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
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
      
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
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
  }, [isRunning]);

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
      
      <div className="absolute bottom-4 left-4 z-10 text-white text-xs bg-black bg-opacity-60 p-3 rounded">
        <div className="space-y-1">
          <p><span className="text-yellow-400">🔥</span> Status: {isRunning ? 'Running!' : 'Idle'}</p>
          <p><span className="text-green-400">🎭</span> Mixer: {mixerRef.current ? 'Ready' : 'Not loaded'}</p>
          <p><span className="text-blue-400">⬆️⬇️⬅️➡️</span> Arrow keys to move</p>
          <p><span className="text-gray-400">🖱️</span> Mouse drag to rotate camera</p>
          <p><span className="text-gray-400">🖱️</span> Scroll to zoom</p>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default AnimeGirlViewer;