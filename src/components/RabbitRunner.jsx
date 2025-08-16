import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Constants
const RABBIT_SPEED = 0.05;
const DECELERATION = 0.92; // How quickly the rabbit slows down (0.9 = fast, 0.99 = slow)
const MIN_VELOCITY = 0.001; // Minimum velocity before stopping completely
const ANIMATION_FADE_SPEED = 0.05; // How quickly animation fades in/out
const MOVEMENT_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const CAMERA_INITIAL_POSITION = { x: 0, y: 2, z: 5 };
const LIGHTING_CONFIG = {
  ambient: { color: 0xffffff, intensity: 0.8 },
  directional: { color: 0xffffff, intensity: 1.2, position: { x: 2, y: 5, z: 3 } }
};

const AnimeGirlViewer = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const [loadingStatus, setLoadingStatus] = useState('Loading...');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const keysPressed = useRef(new Set());
  const isMoving = useRef(false);
  
  // Velocity system for smooth movement
  const velocity = useRef({ x: 0, z: 0 });
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);
  const isDecelerating = useRef(false);

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
    const ambientLight = new THREE.AmbientLight(LIGHTING_CONFIG.ambient.color, LIGHTING_CONFIG.ambient.intensity);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(LIGHTING_CONFIG.directional.color, LIGHTING_CONFIG.directional.intensity);
    directionalLight.position.set(LIGHTING_CONFIG.directional.position.x, LIGHTING_CONFIG.directional.position.y, LIGHTING_CONFIG.directional.position.z);
    scene.add(directionalLight);

    // Store scene reference
    sceneRef.current = { scene, renderer, camera, animationWeight: 0 };

    // Model loading function
    const loadModel = async () => {
      try {
        setLoadingStatus('Loading rabbit from GLTF...');
        
        // Dynamic import of GLTFLoader
        const GLTFModule = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const GLTFLoader = GLTFModule.GLTFLoader;
        const loader = new GLTFLoader();
        
        // Load GLTF file
        loader.load('./scene.gltf', (gltf) => {
          const model = gltf.scene;
          
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
            }
            
            if (runAnimation) {
              sceneRef.current.runAction = mixerRef.current.clipAction(runAnimation);
              sceneRef.current.runAction.setLoop(THREE.LoopRepeat);
              sceneRef.current.runAction.clampWhenFinished = false;
              sceneRef.current.runAction.enabled = true;
              sceneRef.current.runAction.setEffectiveWeight(0); // Start with no weight
              sceneRef.current.runAction.play();
              
              // Try to find a separate idle/sitting animation
              let idleAnimation = gltf.animations.find(anim => 
                anim.name.toLowerCase().includes('idle') || 
                anim.name.toLowerCase().includes('sit') ||
                anim.name.toLowerCase().includes('rest') ||
                anim.name.toLowerCase().includes('breathing')
              );
              
              if (idleAnimation && idleAnimation !== runAnimation) {
                // Found separate idle animation - use it for sitting
                sceneRef.current.idleAction = mixerRef.current.clipAction(idleAnimation);
                sceneRef.current.idleAction.setLoop(THREE.LoopRepeat);
                sceneRef.current.idleAction.enabled = true;
                sceneRef.current.idleAction.setEffectiveWeight(1); // Start with full idle weight
                sceneRef.current.idleAction.play();
                sceneRef.current.hasIdleAnimation = true;
              } else {
                // No separate idle - rabbit sits at first frame of run animation
                sceneRef.current.hasIdleAnimation = false;
                sceneRef.current.runAction.paused = true;
                sceneRef.current.runAction.time = 0;
              }
              
              // Store all animations for potential use
              sceneRef.current.allAnimations = gltf.animations.map(anim => ({
                name: anim.name,
                action: mixerRef.current.clipAction(anim)
              }));
            }
          } else {
            setError('No animations found in scene.gltf. Make sure the file contains animations.');
          }
          
          // Optimize model and apply colors
          model.traverse((child) => {
            if (child.isMesh) {
              child.frustumCulled = false;
              
              if (child.material) {
                const childName = child.name.toLowerCase();
                const materialName = child.material.name?.toLowerCase() || '';
                
                // Color the eyes black (multiple possible naming conventions)
                if (childName.includes('eye') || 
                    materialName.includes('eye') ||
                    childName.includes('pupil') ||
                    materialName.includes('pupil') ||
                    childName.includes('eyeball') ||
                    materialName.includes('eyeball')) {
                  child.material = child.material.clone(); // Clone to avoid affecting other meshes
                  child.material.color = new THREE.Color(0x000000); // Pure black
                  child.material.emissive = new THREE.Color(0x000000);
                  child.material.metalness = 0;
                  child.material.roughness = 0.8;
                }
                
                // Color the inside of ears pink (multiple possible naming conventions)
                else if ((childName.includes('ear') && 
                         (childName.includes('inner') || 
                          childName.includes('inside') ||
                          childName.includes('interior'))) ||
                        (materialName.includes('ear') && 
                         (materialName.includes('inner') || 
                          materialName.includes('inside') ||
                          materialName.includes('interior'))) ||
                        childName.includes('earinner') ||
                        materialName.includes('earinner') ||
                        childName.includes('ear_inner') ||
                        materialName.includes('ear_inner')) {
                  child.material = child.material.clone(); // Clone to avoid affecting other meshes
                  child.material.color = new THREE.Color(0xffb6c1); // Light pink
                  child.material.emissive = new THREE.Color(0x000000);
                  child.material.metalness = 0;
                  child.material.roughness = 0.6;
                }
                
                // Also check for generic pink parts that might be ears
                else if (childName.includes('pink') || materialName.includes('pink')) {
                  child.material = child.material.clone();
                  child.material.color = new THREE.Color(0xffb6c1); // Light pink
                  child.material.emissive = new THREE.Color(0x000000);
                  child.material.metalness = 0;
                  child.material.roughness = 0.6;
                }
                
                // Optimize other materials
                if (child.material.isMeshStandardMaterial) {
                  child.material.roughness = Math.max(child.material.roughness || 0, 0.7);
                  child.material.metalness = Math.min(child.material.metalness || 0, 0.1);
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
          // Loading progress can be shown here if needed
        }, (error) => {
          setError(`Failed to load scene.gltf: ${error.message}`);
          setLoadingStatus('Failed to load');
        });
        
      } catch (error) {
        setError(error.message);
        setLoadingStatus('Failed to load');
      }
    };

    loadModel();

    // Set camera position
    camera.position.set(CAMERA_INITIAL_POSITION.x, CAMERA_INITIAL_POSITION.y, CAMERA_INITIAL_POSITION.z);
    camera.lookAt(0, 0, 0);

    // Function to start movement (graceful acceleration)
    const startMovement = () => {
      if (!isMoving.current) {
        isMoving.current = true;
        isDecelerating.current = false;
        setIsRunning(true);
      }
    };

    // Function to stop movement (graceful deceleration)
    const stopMovement = () => {
      if (isMoving.current && !isDecelerating.current) {
        isDecelerating.current = true;
        // Don't immediately set isMoving to false - let deceleration handle it
      }
    };

    // Keyboard event handlers (prevent key repeat)
    const handleKeyDown = (event) => {
      if (!MOVEMENT_KEYS.includes(event.key)) return;
      
      // Prevent key repeat issues
      if (keysPressed.current.has(event.key)) return;
      
      const wasEmpty = keysPressed.current.size === 0;
      keysPressed.current.add(event.key);

      // Start movement only when first movement key is pressed
      if (wasEmpty) {
        startMovement();
      }
    };

    const handleKeyUp = (event) => {
      if (!MOVEMENT_KEYS.includes(event.key)) return;
      
      keysPressed.current.delete(event.key);

      // Start deceleration when no movement keys are pressed
      if (keysPressed.current.size === 0) {
        stopMovement();
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
      }
      
      // Handle rabbit movement with smooth velocity system
      if (sceneRef.current.model) {
        const model = sceneRef.current.model;
        
        // Calculate target velocity based on pressed keys
        let targetVelX = 0;
        let targetVelZ = 0;
        let newTargetRotation = targetRotation.current;
        
        if (keysPressed.current.size > 0) {
          // FIXED MOVEMENT DIRECTIONS - Now matches typical game controls
          if (keysPressed.current.has('ArrowUp')) {
            targetVelZ -= RABBIT_SPEED; // Forward (into screen, towards camera)
            newTargetRotation = 0; // Face forward
          }
          if (keysPressed.current.has('ArrowDown')) {
            targetVelZ += RABBIT_SPEED; // Backward (away from camera)
            newTargetRotation = Math.PI; // Face backward
          }
          if (keysPressed.current.has('ArrowLeft')) {
            targetVelX -= RABBIT_SPEED; // Left
            newTargetRotation = Math.PI / 2; // Face left
          }
          if (keysPressed.current.has('ArrowRight')) {
            targetVelX += RABBIT_SPEED; // Right
            newTargetRotation = -Math.PI / 2; // Face right
          }

          // Handle diagonal movement with correct directions
          if (keysPressed.current.has('ArrowUp') && keysPressed.current.has('ArrowLeft')) {
            newTargetRotation = Math.PI / 4; // Forward-left
          }
          if (keysPressed.current.has('ArrowUp') && keysPressed.current.has('ArrowRight')) {
            newTargetRotation = -Math.PI / 4; // Forward-right
          }
          if (keysPressed.current.has('ArrowDown') && keysPressed.current.has('ArrowLeft')) {
            newTargetRotation = 3 * Math.PI / 4; // Backward-left
          }
          if (keysPressed.current.has('ArrowDown') && keysPressed.current.has('ArrowRight')) {
            newTargetRotation = -3 * Math.PI / 4; // Backward-right
          }
          
          targetRotation.current = newTargetRotation;
        }
        
        // Apply velocity or decelerate
        if (keysPressed.current.size > 0 && !isDecelerating.current) {
          // Accelerate towards target velocity
          velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, targetVelX, 0.1);
          velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, targetVelZ, 0.1);
        } else {
          // Decelerate
          velocity.current.x *= DECELERATION;
          velocity.current.z *= DECELERATION;
          
          // Stop completely when velocity is very small
          if (Math.abs(velocity.current.x) < MIN_VELOCITY && Math.abs(velocity.current.z) < MIN_VELOCITY) {
            velocity.current.x = 0;
            velocity.current.z = 0;
            
            if (isDecelerating.current) {
              isDecelerating.current = false;
              isMoving.current = false;
              setIsRunning(false);
            }
          }
        }
        
        // Apply movement
        model.position.x += velocity.current.x;
        model.position.z += velocity.current.z;
        
        // Smooth rotation
        currentRotation.current = THREE.MathUtils.lerp(currentRotation.current, targetRotation.current, 0.1);
        model.rotation.y = currentRotation.current;
        
        // Smooth animation blending
        const speedMagnitude = Math.sqrt(velocity.current.x * velocity.current.x + velocity.current.z * velocity.current.z);
        const targetWeight = Math.min(1, speedMagnitude / (RABBIT_SPEED * 0.7)); // Normalize speed to weight
        
        if (sceneRef.current.hasIdleAnimation && sceneRef.current.idleAction && sceneRef.current.runAction) {
          // Smooth blend between idle and run animations
          const currentRunWeight = sceneRef.current.runAction.getEffectiveWeight();
          const newRunWeight = THREE.MathUtils.lerp(currentRunWeight, targetWeight, ANIMATION_FADE_SPEED);
          const newIdleWeight = 1 - newRunWeight;
          
          sceneRef.current.runAction.setEffectiveWeight(newRunWeight);
          sceneRef.current.idleAction.setEffectiveWeight(newIdleWeight);
          
          if (newRunWeight > 0.01) {
            sceneRef.current.runAction.paused = false;
          }
        } else if (sceneRef.current.runAction) {
          // Single animation - fade in/out
          const currentWeight = sceneRef.current.runAction.getEffectiveWeight();
          const newWeight = THREE.MathUtils.lerp(currentWeight, targetWeight, ANIMATION_FADE_SPEED);
          sceneRef.current.runAction.setEffectiveWeight(newWeight);
          
          if (newWeight > 0.01) {
            sceneRef.current.runAction.paused = false;
          } else {
            sceneRef.current.runAction.paused = true;
            sceneRef.current.runAction.time = 0; // Reset to sitting position
          }
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
      
      <div className="absolute bottom-4 left-4 z-10 text-white text-xs bg-black bg-opacity-60 p-3 rounded">
        <div className="space-y-1">
          <p><span className="text-yellow-400">🔥</span> Status: {isRunning ? (isDecelerating.current ? 'Slowing down...' : 'Running!') : '🐰 Sitting'}</p>
          <p><span className="text-green-400">🎭</span> Animation: {sceneRef.current?.hasIdleAnimation ? 'Dual (Idle+Run)' : 'Single (Run only)'}</p>
          <p><span className="text-blue-400">⬆️⬇️⬅️➡️</span> Arrow keys to move</p>
          <p><span className="text-gray-400">🖱️</span> Mouse drag to rotate camera</p>
          <p><span className="text-gray-400">🖱️</span> Scroll to zoom</p>
          <p><span className="text-orange-400">🎯</span> Keys pressed: {keysPressed.current.size}</p>
          <p><span className="text-purple-400">✨</span> Graceful deceleration system!</p>
          <p><span className="text-cyan-400">🌟</span> Smooth animation blending!</p>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default AnimeGirlViewer;