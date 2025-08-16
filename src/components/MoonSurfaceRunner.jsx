import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Constants
const RABBIT_SPEED = 0.05;
const DECELERATION = 0.92;
const MIN_VELOCITY = 0.001;
const ANIMATION_FADE_SPEED = 0.05;
const MOVEMENT_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const CAMERA_INITIAL_POSITION = { x: 0, y: 3, z: 8 };
const MOON_SIZE = 50;
const CRATER_COUNT = 20;

// Moon gravity effect (lower than Earth)
const MOON_GRAVITY = -0.008;
const JUMP_POWER = 0.15;

const MoonSurfaceRunner = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const [loadingStatus, setLoadingStatus] = useState('Loading lunar surface...');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const keysPressed = useRef(new Set());
  const isMoving = useRef(false);
  
  // Physics system for moon surface
  const velocity = useRef({ x: 0, z: 0, y: 0 });
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);
  const isDecelerating = useRef(false);
  const isGrounded = useRef(true);

  // Create moon surface terrain
  const createMoonSurface = () => {
    const geometry = new THREE.PlaneGeometry(MOON_SIZE, MOON_SIZE, 64, 64);
    
    // Create height variations for moon surface
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 1];
      
      // Base noise for general terrain
      let height = (Math.sin(x * 0.1) * Math.cos(z * 0.1)) * 0.3;
      
      // Add crater-like depressions
      for (let j = 0; j < CRATER_COUNT; j++) {
        const craterX = (Math.random() - 0.5) * MOON_SIZE;
        const craterZ = (Math.random() - 0.5) * MOON_SIZE;
        const craterRadius = Math.random() * 3 + 1;
        const distance = Math.sqrt((x - craterX) ** 2 + (z - craterZ) ** 2);
        
        if (distance < craterRadius) {
          const craterDepth = (1 - distance / craterRadius) * 0.8;
          height -= craterDepth;
        }
      }
      
      // Add small random variations
      height += (Math.random() - 0.5) * 0.2;
      
      vertices[i + 2] = height; // Y coordinate
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Moon surface material - gray, dusty appearance
    const material = new THREE.MeshLambertMaterial({
      color: 0x8B8680,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const moonSurface = new THREE.Mesh(geometry, material);
    moonSurface.rotation.x = -Math.PI / 2;
    moonSurface.receiveShadow = true;
    
    return moonSurface;
  };

  // Create starfield background
  const createStarfield = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;     // x
      positions[i + 1] = Math.random() * 100 + 20;    // y (above surface)
      positions[i + 2] = (Math.random() - 0.5) * 200; // z
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.5,
      sizeAttenuation: false
    });
    
    return new THREE.Points(starsGeometry, starsMaterial);
  };

  // Get height at position on moon surface
  const getHeightAtPosition = (x, z) => {
    if (!sceneRef.current?.moonSurface) return 0;
    
    // Simple height calculation based on distance from center and noise
    const centerDistance = Math.sqrt(x * x + z * z);
    let height = (Math.sin(x * 0.1) * Math.cos(z * 0.1)) * 0.3;
    
    // Add some randomness for surface variations
    height += (Math.sin(x * 0.5) * Math.cos(z * 0.5)) * 0.1;
    
    return Math.max(height, -0.5); // Prevent going too deep
  };

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;

    // Scene setup with space-like environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011); // Very dark blue space
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true,
      alpha: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lighting setup for moon (harsh shadows, no atmosphere)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3); // Very dim ambient
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    sunLight.position.set(10, 10, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    scene.add(sunLight);

    // Add Earth in the background
    const earthGeometry = new THREE.SphereGeometry(2, 32, 32);
    const earthMaterial = new THREE.MeshBasicMaterial({
      color: 0x4A90E2,
      transparent: true,
      opacity: 0.8
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(-15, 8, -30);
    scene.add(earth);

    // Create moon surface
    const moonSurface = createMoonSurface();
    scene.add(moonSurface);
    
    // Create starfield
    const stars = createStarfield();
    scene.add(stars);

    // Store scene references
    sceneRef.current = { 
      scene, 
      renderer, 
      camera, 
      animationWeight: 0,
      moonSurface,
      stars
    };

    // Model loading function (same as original but with moon adaptations)
    const loadModel = async () => {
      try {
        setLoadingStatus('Loading space rabbit...');
        
        const GLTFModule = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const GLTFLoader = GLTFModule.GLTFLoader;
        const loader = new GLTFLoader();
        
        loader.load('./scene.gltf', (gltf) => {
          const model = gltf.scene;
          
          // Setup animation mixer
          if (gltf.animations && gltf.animations.length > 0) {
            mixerRef.current = new THREE.AnimationMixer(model);
            
            let runAnimation = gltf.animations.find(anim => 
              anim.name.toLowerCase().includes('run') || 
              anim.name.toLowerCase().includes('walk') ||
              anim.name.toLowerCase().includes('move') ||
              anim.name.toLowerCase().includes('loop')
            );
            
            if (!runAnimation) {
              runAnimation = gltf.animations[0];
            }
            
            if (runAnimation) {
              sceneRef.current.runAction = mixerRef.current.clipAction(runAnimation);
              sceneRef.current.runAction.setLoop(THREE.LoopRepeat);
              sceneRef.current.runAction.clampWhenFinished = false;
              sceneRef.current.runAction.enabled = true;
              sceneRef.current.runAction.setEffectiveWeight(0);
              sceneRef.current.runAction.play();
              
              let idleAnimation = gltf.animations.find(anim => 
                anim.name.toLowerCase().includes('idle') || 
                anim.name.toLowerCase().includes('sit') ||
                anim.name.toLowerCase().includes('rest')
              );
              
              if (idleAnimation && idleAnimation !== runAnimation) {
                sceneRef.current.idleAction = mixerRef.current.clipAction(idleAnimation);
                sceneRef.current.idleAction.setLoop(THREE.LoopRepeat);
                sceneRef.current.idleAction.enabled = true;
                sceneRef.current.idleAction.setEffectiveWeight(1);
                sceneRef.current.idleAction.play();
                sceneRef.current.hasIdleAnimation = true;
              } else {
                sceneRef.current.hasIdleAnimation = false;
                sceneRef.current.runAction.paused = true;
                sceneRef.current.runAction.time = 0;
              }
            }
          }
          
          // Optimize model materials for space environment
          model.traverse((child) => {
            if (child.isMesh) {
              child.frustumCulled = false;
              child.castShadow = true;
              child.receiveShadow = true;
              
              if (child.material) {
                const childName = child.name.toLowerCase();
                const materialName = child.material.name?.toLowerCase() || '';
                
                // Apply space suit-like materials
                if (childName.includes('body') || materialName.includes('body')) {
                  child.material = child.material.clone();
                  child.material.color = new THREE.Color(0xE8E8E8); // Space suit white
                  child.material.metalness = 0.1;
                  child.material.roughness = 0.8;
                }
                
                // Keep eye colors
                if (childName.includes('eye') || materialName.includes('eye')) {
                  child.material = child.material.clone();
                  child.material.color = new THREE.Color(0x000000);
                  child.material.emissive = new THREE.Color(0x000000);
                  child.material.metalness = 0;
                  child.material.roughness = 0.8;
                }
                
                // Pink inner ears
                if ((childName.includes('ear') && childName.includes('inner')) ||
                    (materialName.includes('ear') && materialName.includes('inner'))) {
                  child.material = child.material.clone();
                  child.material.color = new THREE.Color(0xffb6c1);
                  child.material.metalness = 0;
                  child.material.roughness = 0.6;
                }
                
                child.material.needsUpdate = true;
              }
            }
          });
          
          scene.add(model);
          
          // Position model on moon surface
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          model.position.set(-center.x, -center.y + 0.1, -center.z);
          
          const maxDimension = Math.max(size.x, size.y, size.z);
          if (maxDimension > 0) {
            const scale = 2.5 / maxDimension;
            model.scale.setScalar(scale);
          }
          
          sceneRef.current.model = model;
          setLoadingStatus('Ready for lunar exploration!');
          setError('');
          
          setTimeout(() => setLoadingStatus(''), 2000);
        }, undefined, (error) => {
          setError(`Failed to load rabbit model: ${error.message}`);
          setLoadingStatus('Failed to load');
        });
        
      } catch (error) {
        setError(error.message);
        setLoadingStatus('Failed to load');
      }
    };

    loadModel();

    // Set initial camera position - overhead view
    camera.position.set(0, 5, 6); // Above and behind the rabbit
    camera.lookAt(0, 0, 0);

    // Movement functions
    const startMovement = () => {
      if (!isMoving.current) {
        isMoving.current = true;
        isDecelerating.current = false;
        setIsRunning(true);
      }
    };

    const stopMovement = () => {
      if (isMoving.current && !isDecelerating.current) {
        isDecelerating.current = true;
      }
    };

    // Keyboard handlers with space jump
    const handleKeyDown = (event) => {
      if (!MOVEMENT_KEYS.includes(event.key) && event.key !== ' ') return;
      
      // Handle jump (spacebar)
      if (event.key === ' ' && isGrounded.current) {
        velocity.current.y = JUMP_POWER;
        isGrounded.current = false;
        return;
      }
      
      if (keysPressed.current.has(event.key)) return;
      
      const wasEmpty = keysPressed.current.size === 0;
      keysPressed.current.add(event.key);

      if (wasEmpty) {
        startMovement();
      }
    };

    const handleKeyUp = (event) => {
      if (!MOVEMENT_KEYS.includes(event.key)) return;
      
      keysPressed.current.delete(event.key);

      if (keysPressed.current.size === 0) {
        stopMovement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation loop with moon physics
    const animate = () => {
      if (!sceneRef.current) return;
      
      animationIdRef.current = requestAnimationFrame(animate);
      
      const delta = clockRef.current.getDelta();
      
      // Update animation mixer
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }
      
      // Animate stars (slow rotation)
      if (sceneRef.current.stars) {
        sceneRef.current.stars.rotation.y += 0.0001;
      }
      
      // Handle rabbit movement with moon physics
      if (sceneRef.current.model) {
        const model = sceneRef.current.model;
        
        // Calculate target velocity - FIXED DIRECTIONS
        let targetVelX = 0;
        let targetVelZ = 0;
        let newTargetRotation = targetRotation.current;
        
        if (keysPressed.current.size > 0) {
          // CORRECTED MOVEMENT DIRECTIONS
          if (keysPressed.current.has('ArrowUp')) {
            targetVelZ += RABBIT_SPEED; // Forward (away from camera)
            newTargetRotation = 0;
          }
          if (keysPressed.current.has('ArrowDown')) {
            targetVelZ -= RABBIT_SPEED; // Backward (toward camera)
            newTargetRotation = Math.PI;
          }
          if (keysPressed.current.has('ArrowLeft')) {
            targetVelX += RABBIT_SPEED; // Left
            newTargetRotation = Math.PI / 2;
          }
          if (keysPressed.current.has('ArrowRight')) {
            targetVelX -= RABBIT_SPEED; // Right
            newTargetRotation = -Math.PI / 2;
          }

          // Diagonal movements - CORRECTED
          if (keysPressed.current.has('ArrowUp') && keysPressed.current.has('ArrowLeft')) {
            newTargetRotation = Math.PI / 4;
          }
          if (keysPressed.current.has('ArrowUp') && keysPressed.current.has('ArrowRight')) {
            newTargetRotation = -Math.PI / 4;
          }
          if (keysPressed.current.has('ArrowDown') && keysPressed.current.has('ArrowLeft')) {
            newTargetRotation = 3 * Math.PI / 4;
          }
          if (keysPressed.current.has('ArrowDown') && keysPressed.current.has('ArrowRight')) {
            newTargetRotation = -3 * Math.PI / 4;
          }
          
          targetRotation.current = newTargetRotation;
        }
        
        // Apply horizontal movement
        if (keysPressed.current.size > 0 && !isDecelerating.current) {
          velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, targetVelX, 0.1);
          velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, targetVelZ, 0.1);
        } else {
          velocity.current.x *= DECELERATION;
          velocity.current.z *= DECELERATION;
          
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
        
        // Apply gravity and vertical movement
        if (!isGrounded.current) {
          velocity.current.y += MOON_GRAVITY;
        }
        
        // Update position
        const newX = model.position.x + velocity.current.x;
        const newZ = model.position.z + velocity.current.z;
        const newY = model.position.y + velocity.current.y;
        
        // Get ground height at new position
        const groundHeight = getHeightAtPosition(newX, newZ);
        
        // Check ground collision
        if (newY <= groundHeight + 0.1) {
          model.position.y = groundHeight + 0.1;
          velocity.current.y = 0;
          isGrounded.current = true;
        } else {
          model.position.y = newY;
          isGrounded.current = false;
        }
        
        model.position.x = newX;
        model.position.z = newZ;
        
        // Smooth rotation
        currentRotation.current = THREE.MathUtils.lerp(currentRotation.current, targetRotation.current, 0.1);
        model.rotation.y = currentRotation.current;
        
        // FIXED Animation blending - Make rabbit run when moving
        const speedMagnitude = Math.sqrt(velocity.current.x * velocity.current.x + velocity.current.z * velocity.current.z);
        const isMovingNow = speedMagnitude > 0.001; // Check if rabbit is actually moving
        
        if (sceneRef.current.hasIdleAnimation && sceneRef.current.idleAction && sceneRef.current.runAction) {
          // Dual animation system (idle + run)
          if (isMovingNow) {
            // Moving - show run animation
            sceneRef.current.runAction.setEffectiveWeight(1);
            sceneRef.current.idleAction.setEffectiveWeight(0);
            sceneRef.current.runAction.paused = false;
          } else {
            // Not moving - show idle animation
            sceneRef.current.runAction.setEffectiveWeight(0);
            sceneRef.current.idleAction.setEffectiveWeight(1);
            sceneRef.current.runAction.paused = true;
          }
        } else if (sceneRef.current.runAction) {
          // Single animation system (run only)
          if (isMovingNow) {
            // Moving - play run animation
            sceneRef.current.runAction.setEffectiveWeight(1);
            sceneRef.current.runAction.paused = false;
          } else {
            // Not moving - pause at first frame (sitting)
            sceneRef.current.runAction.setEffectiveWeight(0);
            sceneRef.current.runAction.paused = true;
            sceneRef.current.runAction.time = 0;
          }
        }
        
        // SMART CAMERA POSITIONING - Only repositions when rabbit faces toward camera
        const cameraDistance = 6;
        const cameraHeight = 3;
        const cameraFollowSpeed = 0.05;
        
        // Get rabbit's facing direction (forward vector based on rotation)
        const rabbitForward = new THREE.Vector3(
          -Math.sin(model.rotation.y), // Negative because of coordinate system
          0,
          -Math.cos(model.rotation.y)
        );
        
        // Current camera direction from rabbit (normalized)
        const currentCameraDirection = new THREE.Vector3(0, 0, 1); // Camera is positioned at +Z from rabbit
        
        // Check if rabbit is facing towards camera (dot product check)
        // When rabbit faces camera, rabbitForward should align with currentCameraDirection
        const dotProduct = rabbitForward.dot(currentCameraDirection);
        const isRabbitFacingCamera = dotProduct > 0.7; // High threshold for precise facing
        
        let targetCameraPos;
        
        if (isRabbitFacingCamera) {
          // Rabbit is facing camera - move camera behind rabbit
          const behindOffset = new THREE.Vector3(
            -rabbitForward.x * cameraDistance,
            cameraHeight,
            -rabbitForward.z * cameraDistance
          );
          
          targetCameraPos = new THREE.Vector3().addVectors(model.position, behindOffset);
        } else {
          // Default camera position - above and behind (unchanged for other angles)
          targetCameraPos = new THREE.Vector3(
            model.position.x,
            model.position.y + cameraHeight,
            model.position.z + cameraDistance
          );
        }
        
        // Smoothly move camera to target position
        camera.position.lerp(targetCameraPos, cameraFollowSpeed);
        
        // Always look at the rabbit
        camera.lookAt(model.position);
      }
      
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!sceneRef.current) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup - NO MOUSE EVENT LISTENERS
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
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
    <div className="relative w-full h-screen bg-black">
      {(loadingStatus || error) && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg border border-gray-600">
            {error ? (
              <div className="text-red-400">
                <p className="font-bold">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <p className="text-blue-400">{loadingStatus}</p>
            )}
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 z-10 text-white text-xs bg-black bg-opacity-80 p-4 rounded border border-gray-600">
        <div className="space-y-1">
          <p><span className="text-yellow-400">🌙</span> Location: Moon Surface</p>
          <p><span className="text-green-400">🐰</span> Status: {isRunning ? 'Exploring!' : (isGrounded.current ? '🌌 Resting' : '🚀 Floating')}</p>
          <p><span className="text-blue-400">⬆️⬇️⬅️➡️</span> Move around</p>
          <p><span className="text-white">⚡ SPACE</span> Jump (low gravity!)</p>
          <p><span className="text-green-400">📷</span> Camera: Smart positioning</p>
          <p><span className="text-cyan-400">🎯</span> Auto-moves behind when facing camera</p>
          <p><span className="text-purple-400">✨</span> Moon gravity: {MOON_GRAVITY}</p>
          <p><span className="text-cyan-400">🌍</span> Earth visible in distance</p>
          <p><span className="text-orange-400">⭐</span> Grounded: {isGrounded.current ? 'Yes' : 'Floating'}</p>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default MoonSurfaceRunner;