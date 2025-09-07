import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Import constants from Part 1 (assuming they're available)
const RABBIT_SPEED = 0.12;
const TURN_SPEED = 0.08;
const DECELERATION = 0.88;
const MIN_VELOCITY = 0.001;
const MOON_RADIUS = 50;
const MOON_GRAVITY = -0.008;
const JUMP_POWER = 0.25;
const CAMERA_HEIGHT_BEHIND = 5;
const CAMERA_DISTANCE_BEHIND = 10;
const CAMERA_HEIGHT_TOP = 25;
const CAMERA_FOLLOW_SPEED = 0.06;

const MoonExplorerPart2 = () => {
  const animationIdRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState('');
  const [cameraMode, setCameraMode] = useState('behind');
  const [gameState, setGameState] = useState({
    isMoving: false,
    position: { x: 0, z: 0 },
    rotation: 0,
    isGrounded: true,
    keysPressed: []
  });
  
  // Game physics references
  const keysPressed = useRef(new Set());
  const velocity = useRef({ x: 0, z: 0, y: 0 });
  const rabbitRotation = useRef(0);
  const isGrounded = useRef(true);
  const rabbitPosition = useRef({ x: 0, y: 0.1, z: 0 });
  
  // Animation references for custom rabbit
  const animationState = useRef({
    time: 0,
    legPhase: 0,
    earBob: 0,
    tailWag: 0,
    bodyBounce: 0,
    isRunning: false
  });

  // Create realistic space rabbit
  const createRealisticSpaceRabbit = (scene) => {
    console.log('Creating realistic space rabbit with proper animations...');
    const rabbitGroup = new THREE.Group();
    
    // Enhanced materials for space environment
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFF8,
      roughness: 0.7,
      metalness: 0.0,
      emissive: 0x333333,
      emissiveIntensity: 0.08
    });
    
    // FIXED: Lower, more elongated body like a real rabbit
    const bodyGeometry = new THREE.CapsuleGeometry(0.35, 1.0, 8, 16);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2; // Horizontal orientation
    body.position.set(0, 0.4, 0); // Lower to ground
    body.castShadow = true;
    rabbitGroup.add(body);
    
    // FIXED: Head positioned properly on body
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.5, 0.5); // Attached to front of body
    head.castShadow = true;
    rabbitGroup.add(head);
    
    // FIXED: Long upright ears like real rabbit
    const earGeometry = new THREE.CapsuleGeometry(0.08, 0.8, 8, 16);
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(-0.2, 0.9, 0.5);
    leftEar.rotation.z = -0.1;
    leftEar.castShadow = true;
    rabbitGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
    rightEar.position.set(0.2, 0.9, 0.5);
    rightEar.rotation.z = 0.1;
    rightEar.castShadow = true;
    rabbitGroup.add(rightEar);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.06, 12, 12);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.6, 0.8);
    rabbitGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.6, 0.8);
    rabbitGroup.add(rightEye);
    
    // Eye shine
    const shineGeometry = new THREE.SphereGeometry(0.015, 8, 8);
    const shineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const leftShine = new THREE.Mesh(shineGeometry, shineMaterial);
    leftShine.position.set(-0.13, 0.62, 0.82);
    rabbitGroup.add(leftShine);
    
    const rightShine = new THREE.Mesh(shineGeometry, shineMaterial);
    rightShine.position.set(0.17, 0.62, 0.82);
    rabbitGroup.add(rightShine);
    
    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.025, 8, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFF69B4,
      emissive: 0x551133,
      emissiveIntensity: 0.15 
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.5, 0.85);
    rabbitGroup.add(nose);
    
    // FIXED: Fluffy round tail positioned correctly
    const tailGeometry = new THREE.SphereGeometry(0.15, 12, 12);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.5, -0.6); // Higher and back
    tail.castShadow = true;
    rabbitGroup.add(tail);
    
    // FIXED: Front legs - shorter, positioned on ground like real rabbit
    const frontLegGeometry = new THREE.CapsuleGeometry(0.06, 0.25, 8, 16);
    
    const frontLeftLeg = new THREE.Mesh(frontLegGeometry, bodyMaterial);
    frontLeftLeg.position.set(-0.2, 0.15, 0.3); // ON GROUND
    frontLeftLeg.castShadow = true;
    rabbitGroup.add(frontLeftLeg);
    
    const frontRightLeg = new THREE.Mesh(frontLegGeometry, bodyMaterial);
    frontRightLeg.position.set(0.2, 0.15, 0.3); // ON GROUND
    frontRightLeg.castShadow = true;
    rabbitGroup.add(frontRightLeg);
    
    // FIXED: Back legs - longer and powerful like real rabbit, ON GROUND
    const backLegGeometry = new THREE.CapsuleGeometry(0.08, 0.35, 8, 16);
    
    const backLeftLeg = new THREE.Mesh(backLegGeometry, bodyMaterial);
    backLeftLeg.position.set(-0.2, 0.18, -0.2); // ON GROUND
    backLeftLeg.castShadow = true;
    rabbitGroup.add(backLeftLeg);
    
    const backRightLeg = new THREE.Mesh(backLegGeometry, bodyMaterial);
    backRightLeg.position.set(0.2, 0.18, -0.2); // ON GROUND
    backRightLeg.castShadow = true;
    rabbitGroup.add(backRightLeg);
    
    // FIXED: Proper paws that touch the ground
    const pawGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    
    // Front paws - ON GROUND
    const frontLeftPaw = new THREE.Mesh(pawGeometry, bodyMaterial);
    frontLeftPaw.position.set(-0.2, 0.06, 0.3); // TOUCHING GROUND
    frontLeftPaw.castShadow = true;
    rabbitGroup.add(frontLeftPaw);
    
    const frontRightPaw = new THREE.Mesh(pawGeometry, bodyMaterial);
    frontRightPaw.position.set(0.2, 0.06, 0.3); // TOUCHING GROUND
    frontRightPaw.castShadow = true;
    rabbitGroup.add(frontRightPaw);
    
    // Back paws - ON GROUND, larger like real rabbit feet
    const backPawGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    
    const backLeftPaw = new THREE.Mesh(backPawGeometry, bodyMaterial);
    backLeftPaw.position.set(-0.2, 0.08, -0.2); // TOUCHING GROUND
    backLeftPaw.castShadow = true;
    rabbitGroup.add(backLeftPaw);
    
    const backRightPaw = new THREE.Mesh(backPawGeometry, bodyMaterial);
    backRightPaw.position.set(0.2, 0.08, -0.2); // TOUCHING GROUND
    backRightPaw.castShadow = true;
    rabbitGroup.add(backRightPaw);
    
    // Store references for animation
    const rabbitParts = {
      body,
      head,
      leftEar,
      rightEar,
      tail,
      frontLeftLeg,
      frontRightLeg,
      backLeftLeg,
      backRightLeg,
      frontLeftPaw,
      frontRightPaw,
      backLeftPaw,
      backRightPaw
    };
    
    rabbitGroup.position.copy(rabbitPosition.current);
    scene.add(rabbitGroup);
    
    setLoadingStatus('🐰 Realistic lunar rabbit ready for hopping!');
    setTimeout(() => setLoadingStatus(''), 3000);
    console.log('Realistic space rabbit created with proper ground contact');
    
    return { rabbitGroup, rabbitParts };
  };

  useEffect(() => {
    // Check if Part 1 is ready
    if (!window.sceneRef?.current) {
      setError('Part 1 (Scene) must be loaded first!');
      return;
    }

    const sceneRef = window.sceneRef;
    const scene = sceneRef.current.scene;
    const camera = sceneRef.current.camera;

    setLoadingStatus('Loading astronaut rabbit model...');

    // Load GLTF model with fallback to enhanced rabbit
    const loadModel = async () => {
      try {
        const GLTFModule = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const GLTFLoader = GLTFModule.GLTFLoader;
        const loader = new GLTFLoader();
        
        loader.load('./scene.gltf', (gltf) => {
          console.log('GLTF loaded successfully');
          const model = gltf.scene;
          
          // Setup animations
          if (gltf.animations && gltf.animations.length > 0) {
            mixerRef.current = new THREE.AnimationMixer(model);
            
            let runAnimation = gltf.animations[0];
            
            if (runAnimation) {
              sceneRef.current.runAction = mixerRef.current.clipAction(runAnimation);
              sceneRef.current.runAction.setLoop(THREE.LoopRepeat);
              sceneRef.current.runAction.play();
              console.log('Animation setup complete');
            }
          }
          
          // Enhanced material setup for space environment
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              if (child.material) {
                const oldMaterial = child.material;
                child.material = new THREE.MeshStandardMaterial({
                  color: oldMaterial.color || 0xFFFFF8,
                  map: oldMaterial.map,
                  roughness: 0.7,
                  metalness: 0.0,
                  emissive: 0x333333,
                  emissiveIntensity: 0.08
                });
              }
            }
          });
          
          scene.add(model);
          model.position.copy(rabbitPosition.current);
          
          // Scale model appropriately
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z);
          if (maxDimension > 0) {
            const scale = 2.5 / maxDimension;
            model.scale.setScalar(scale);
          }
          
          sceneRef.current.model = model;
          setLoadingStatus('🚀 Lunar explorer ready for mission!');
          setTimeout(() => setLoadingStatus(''), 2000);
          
        }, (progress) => {
          console.log('Loading progress:', progress);
        }, (error) => {
          console.log('GLTF failed, using realistic rabbit:', error);
          const { rabbitGroup, rabbitParts } = createRealisticSpaceRabbit(scene);
          sceneRef.current.model = rabbitGroup;
          sceneRef.current.rabbitParts = rabbitParts;
        });
        
      } catch (error) {
        console.log('Loading error, using realistic rabbit:', error);
        const { rabbitGroup, rabbitParts } = createRealisticSpaceRabbit(scene);
        sceneRef.current.model = rabbitGroup;
        sceneRef.current.rabbitParts = rabbitParts;
      }
    };

    loadModel();

    // Set initial camera position
    const setCameraPosition = () => {
      if (cameraMode === 'top') {
        camera.position.set(0, CAMERA_HEIGHT_TOP, 0);
        camera.lookAt(0, 0, 0);
      } else {
        camera.position.set(0, CAMERA_HEIGHT_BEHIND, CAMERA_DISTANCE_BEHIND);
        camera.lookAt(0, 1, 0);
      }
    };
    
    setCameraPosition();

    // Enhanced controls
    const handleKeyDown = (event) => {
      const keyCode = event.code;
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyC'].includes(keyCode)) {
        event.preventDefault();
      }
      
      if (keyCode === 'KeyC') {
        setCameraMode(prev => prev === 'behind' ? 'top' : 'behind');
        return;
      }
      
      keysPressed.current.add(keyCode);
      
      if (keyCode === 'Space' && isGrounded.current) {
        velocity.current.y = JUMP_POWER;
        isGrounded.current = false;
      }
    };

    const handleKeyUp = (event) => {
      const keyCode = event.code;
      keysPressed.current.delete(keyCode);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Main animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      
      animationIdRef.current = requestAnimationFrame(animate);
      
      const delta = clockRef.current.getDelta();
      
      // Update animation time
      animationState.current.time += delta;
      
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }
      
      // Rabbit movement and animation
      if (sceneRef.current.model) {
        const model = sceneRef.current.model;
        
        const isPressingMovementKey = keysPressed.current.has('ArrowUp') || keysPressed.current.has('ArrowDown');
        let isMovingNow = false;
        
        animationState.current.isRunning = isPressingMovementKey;
        
        // Custom rabbit animation
        if (sceneRef.current.rabbitParts && animationState.current.isRunning) {
          const parts = sceneRef.current.rabbitParts;
          const time = animationState.current.time;
          const runSpeed = 8;
          
          const legCycle = Math.sin(time * runSpeed) * 0.3;
          const legCycle2 = Math.sin(time * runSpeed + Math.PI) * 0.3;
          
          parts.frontLeftLeg.rotation.x = legCycle;
          parts.frontRightLeg.rotation.x = legCycle2;
          parts.frontLeftPaw.rotation.x = legCycle * 0.5;
          parts.frontRightPaw.rotation.x = legCycle2 * 0.5;
          
          const backLegCycle = Math.sin(time * runSpeed * 0.8) * 0.4;
          parts.backLeftLeg.rotation.x = backLegCycle;
          parts.backRightLeg.rotation.x = backLegCycle;
          parts.backLeftPaw.rotation.x = backLegCycle * 0.3;
          parts.backRightPaw.rotation.x = backLegCycle * 0.3;
          
          const bounce = Math.abs(Math.sin(time * runSpeed)) * 0.1;
          parts.body.position.y = 0.4 + bounce;
          parts.head.position.y = 0.5 + bounce;
          
          const earFlop = Math.sin(time * runSpeed * 1.5) * 0.2;
          parts.leftEar.rotation.x = earFlop;
          parts.rightEar.rotation.x = earFlop;
          
          const tailWag = Math.sin(time * runSpeed * 2) * 0.3;
          parts.tail.rotation.y = tailWag;
          
        } else if (sceneRef.current.rabbitParts) {
          const parts = sceneRef.current.rabbitParts;
          const idleTime = animationState.current.time;
          
          const breathe = Math.sin(idleTime * 2) * 0.02;
          parts.body.position.y = 0.4 + breathe;
          parts.head.position.y = 0.5 + breathe;
          
          const earTwitch = Math.sin(idleTime * 3) * 0.05;
          parts.leftEar.rotation.x = earTwitch;
          parts.rightEar.rotation.x = -earTwitch;
          
          parts.frontLeftLeg.rotation.x = 0;
          parts.frontRightLeg.rotation.x = 0;
          parts.backLeftLeg.rotation.x = 0;
          parts.backRightLeg.rotation.x = 0;
          parts.frontLeftPaw.rotation.x = 0;
          parts.frontRightPaw.rotation.x = 0;
          parts.backLeftPaw.rotation.x = 0;
          parts.backRightPaw.rotation.x = 0;
          
          parts.tail.rotation.y = Math.sin(idleTime * 1.5) * 0.1;
        }
        
        if (sceneRef.current.runAction) {
          if (isPressingMovementKey) {
            if (sceneRef.current.runAction.paused) {
              sceneRef.current.runAction.paused = false;
              sceneRef.current.runAction.reset();
              sceneRef.current.runAction.play();
            }
            sceneRef.current.runAction.setEffectiveWeight(1);
          } else {
            sceneRef.current.runAction.paused = true;
            sceneRef.current.runAction.time = 0;
          }
        }
        
        // Turning
        if (keysPressed.current.has('ArrowLeft')) {
          rabbitRotation.current += TURN_SPEED;
          model.rotation.y = rabbitRotation.current;
        }
        
        if (keysPressed.current.has('ArrowRight')) {
          rabbitRotation.current -= TURN_SPEED;
          model.rotation.y = rabbitRotation.current;
        }
        
        // Movement with boundary checking
        if (keysPressed.current.has('ArrowUp')) {
          const forwardX = -Math.sin(rabbitRotation.current);
          const forwardZ = -Math.cos(rabbitRotation.current);
          
          const newX = rabbitPosition.current.x + forwardX * RABBIT_SPEED;
          const newZ = rabbitPosition.current.z + forwardZ * RABBIT_SPEED;
          
          if (window.isWithinMoonBoundaries(newX, newZ)) {
            velocity.current.x = forwardX * RABBIT_SPEED;
            velocity.current.z = forwardZ * RABBIT_SPEED;
            isMovingNow = true;
          } else {
            velocity.current.x *= 0.3;
            velocity.current.z *= 0.3;
          }
        }
        
        if (keysPressed.current.has('ArrowDown')) {
          const backwardX = Math.sin(rabbitRotation.current);
          const backwardZ = Math.cos(rabbitRotation.current);
          
          const newX = rabbitPosition.current.x + backwardX * RABBIT_SPEED;
          const newZ = rabbitPosition.current.z + backwardZ * RABBIT_SPEED;
          
          if (window.isWithinMoonBoundaries(newX, newZ)) {
            velocity.current.x = backwardX * RABBIT_SPEED;
            velocity.current.z = backwardZ * RABBIT_SPEED;
            isMovingNow = true;
          } else {
            velocity.current.x *= 0.3;
            velocity.current.z *= 0.3;
          }
        }
        
        // Apply deceleration
        if (!isMovingNow) {
          velocity.current.x *= DECELERATION;
          velocity.current.z *= DECELERATION;
          
          if (Math.abs(velocity.current.x) < MIN_VELOCITY) velocity.current.x = 0;
          if (Math.abs(velocity.current.z) < MIN_VELOCITY) velocity.current.z = 0;
        }
        
        // Apply lunar gravity
        if (!isGrounded.current) {
          velocity.current.y += MOON_GRAVITY;
        }
        
        // Update position
        const newX = rabbitPosition.current.x + velocity.current.x;
        const newZ = rabbitPosition.current.z + velocity.current.z;
        
        if (window.isWithinMoonBoundaries(newX, newZ)) {
          rabbitPosition.current.x = newX;
          rabbitPosition.current.z = newZ;
        } else {
          velocity.current.x = 0;
          velocity.current.z = 0;
        }
        
        rabbitPosition.current.y += velocity.current.y;
        
        // Ground collision with precise surface matching
        const groundHeight = window.getHeightAtPosition(rabbitPosition.current.x, rabbitPosition.current.z);
        
        if (rabbitPosition.current.y <= groundHeight + 0.15) {
          rabbitPosition.current.y = groundHeight + 0.15;
          velocity.current.y = 0;
          isGrounded.current = true;
        } else {
          isGrounded.current = false;
        }
        
        // Apply position to model
        model.position.set(rabbitPosition.current.x, rabbitPosition.current.y, rabbitPosition.current.z);
        
        // Enhanced camera following
        if (cameraMode === 'behind') {
          const distance = CAMERA_DISTANCE_BEHIND;
          const height = CAMERA_HEIGHT_BEHIND;
          
          const behindX = rabbitPosition.current.x - Math.sin(rabbitRotation.current) * distance;
          const behindZ = rabbitPosition.current.z - Math.cos(rabbitRotation.current) * distance;
          const behindY = rabbitPosition.current.y + height;
          
          const targetCameraPosition = new THREE.Vector3(behindX, behindY, behindZ);
          const lookAtTarget = new THREE.Vector3(
            rabbitPosition.current.x, 
            rabbitPosition.current.y + 1.5, 
            rabbitPosition.current.z
          );
          
          camera.position.lerp(targetCameraPosition, CAMERA_FOLLOW_SPEED);
          camera.lookAt(lookAtTarget);
          
        } else {
          const targetPosition = new THREE.Vector3(
            rabbitPosition.current.x, 
            CAMERA_HEIGHT_TOP, 
            rabbitPosition.current.z + 5
          );
          const lookAtTarget = new THREE.Vector3(
            rabbitPosition.current.x, 
            0, 
            rabbitPosition.current.z
          );
          
          camera.position.lerp(targetPosition, CAMERA_FOLLOW_SPEED);
          camera.lookAt(lookAtTarget);
        }
        
        // Update game state
        const distanceFromCenter = Math.sqrt(rabbitPosition.current.x ** 2 + rabbitPosition.current.z ** 2);
        const speedMagnitude = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2);
        const actuallyMoving = isPressingMovementKey || speedMagnitude > MIN_VELOCITY;
        
        setGameState({
          isMoving: actuallyMoving,
          position: { 
            x: rabbitPosition.current.x.toFixed(1), 
            z: rabbitPosition.current.z.toFixed(1),
            distanceFromCenter: distanceFromCenter.toFixed(1)
          },
          rotation: Math.round((rabbitRotation.current * 180 / Math.PI) % 360),
          isGrounded: isGrounded.current,
          keysPressed: Array.from(keysPressed.current),
          onMoonSurface: distanceFromCenter <= MOON_RADIUS * 1.2,
          elevation: (rabbitPosition.current.y - 0.15).toFixed(2)
        });
      }
    };
    
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, [cameraMode]);

  return (
    <div className="relative w-full h-screen bg-transparent pointer-events-none">
      {(loadingStatus || error) && (
        <div className="absolute top-4 left-4 z-10 pointer-events-auto">
          <div className="bg-black bg-opacity-95 text-white p-4 rounded-lg border border-blue-500 backdrop-blur-sm">
            {error ? (
              <div className="text-red-400">
                <p className="font-bold">❌ Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <p className="text-cyan-400 font-medium">🚀 {loadingStatus}</p>
            )}
          </div>
        </div>
      )}
      
      {/* NASA-Style Mission Status */}
      <div className="absolute top-4 right-4 z-10 text-white text-sm bg-black bg-opacity-95 p-4 rounded-lg border border-blue-500 backdrop-blur-sm pointer-events-auto">
        <div className="space-y-2">
          <div className="text-center text-cyan-400 font-bold text-base mb-2">🌙 LUNAR MISSION STATUS</div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">🚀</span> 
            <span>Explorer:</span> 
            <span className={gameState.isMoving ? 'text-green-400 font-bold animate-pulse' : 'text-gray-400'}>
              {gameState.isMoving ? '🐰 HOPPING' : '🛑 RESTING'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">📍</span> 
            <span>Coordinates:</span> 
            <span className="font-mono text-yellow-300">({gameState.position?.x || '0'}, {gameState.position?.z || '0'})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400">📏</span> 
            <span>Distance from LZ:</span> 
            <span className="font-mono text-orange-300">{gameState.position?.distanceFromCenter || '0'}m</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">⬆️</span> 
            <span>Elevation:</span> 
            <span className="font-mono text-purple-300">{gameState.elevation || '0'}m</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🧭</span> 
            <span>Heading:</span> 
            <span className="font-mono text-blue-300">{gameState.rotation}°</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-pink-400">⬇️</span> 
            <span>Surface Contact:</span> 
            <span className={gameState.isGrounded ? 'text-green-400' : 'text-orange-400'}>
              {gameState.isGrounded ? '✅ CONFIRMED' : '🚀 AERIAL'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">📷</span> 
            <span>Camera Mode:</span> 
            <span className="text-red-300">
              {cameraMode === 'behind' ? '🎮 CHASE-CAM' : '🔭 ORBITAL'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">🌙</span> 
            <span>Mission Zone:</span> 
            <span className={gameState.onMoonSurface ? 'text-green-400' : 'text-red-400'}>
              {gameState.onMoonSurface ? '✅ LUNAR SURFACE' : '❌ OFF-WORLD'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Enhanced NASA Mission Control Guide */}
      <div className="absolute bottom-4 left-4 z-10 text-white text-xs bg-black bg-opacity-95 p-4 rounded-lg border border-blue-500 backdrop-blur-sm max-w-sm pointer-events-auto">
        <div className="text-cyan-400 font-bold mb-2">🎮 MISSION CONTROLS</div>
        <div className="space-y-1">
          <div>• ↑ Forward • ↓ Backward</div>
          <div>• ← Turn Left • → Turn Right</div>
          <div>• SPACE Jump • C Camera Mode</div>
        </div>
      </div>
      
      {/* Enhanced Mission Boundary Alert */}
      {gameState.position && parseFloat(gameState.position.distanceFromCenter) > MOON_RADIUS * 1.1 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
          <div className="bg-orange-900 bg-opacity-90 text-white p-4 rounded-lg border-2 border-orange-500 animate-pulse">
            <div className="text-center">
              <p className="text-3xl mb-2">🌌</p>
              <p className="font-bold text-orange-300">DEEP SPACE EXPLORATION!</p>
              <p className="text-sm">Your rabbit is venturing far from the landing zone</p>
              <p className="text-xs text-gray-300">Distance: {gameState.position.distanceFromCenter}m</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoonExplorerPart2;