import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Game Constants - FIXED AND BALANCED
const RABBIT_SPEED = 0.12;
const TURN_SPEED = 0.08;
const DECELERATION = 0.88;
const MIN_VELOCITY = 0.001;

// Moon environment - ENHANCED FOR REALISTIC SURFACE
const MOON_RADIUS = 30; // Circular moon surface
const CRATER_COUNT = 20;
const MOON_GRAVITY = -0.008;
const JUMP_POWER = 0.25;

// Camera settings - OPTIMIZED FOR THIRD-PERSON
const CAMERA_HEIGHT_BEHIND = 5;
const CAMERA_DISTANCE_BEHIND = 10;
const CAMERA_HEIGHT_TOP = 20;
const CAMERA_FOLLOW_SPEED = 0.06;

const MoonRabbitExplorer = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const [loadingStatus, setLoadingStatus] = useState('Loading lunar surface...');
  const [error, setError] = useState('');
  const [cameraMode, setCameraMode] = useState('behind');
  const [gameState, setGameState] = useState({
    isMoving: false,
    position: { x: 0, z: 0 },
    rotation: 0,
    isGrounded: true,
    keysPressed: []
  });
  
  // Game physics - FIXED REFERENCES
  const keysPressed = useRef(new Set());
  const velocity = useRef({ x: 0, z: 0, y: 0 });
  const rabbitRotation = useRef(0);
  const isGrounded = useRef(true);
  const rabbitPosition = useRef({ x: 0, y: 0.1, z: 0 });

  // Create realistic moon texture
  const createMoonTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Create base moon color gradient
    const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
    gradient.addColorStop(0, '#D3D3D3'); // Light gray center
    gradient.addColorStop(0.7, '#A9A9A9'); // Medium gray
    gradient.addColorStop(1, '#696969'); // Dark gray edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Add realistic moon surface details
    ctx.globalCompositeOperation = 'overlay';
    
    // Add craters
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const radius = Math.random() * 30 + 10;
      
      const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      craterGradient.addColorStop(0, 'rgba(50, 50, 50, 0.8)');
      craterGradient.addColorStop(0.6, 'rgba(100, 100, 100, 0.4)');
      craterGradient.addColorStop(1, 'rgba(150, 150, 150, 0.1)');
      
      ctx.fillStyle = craterGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add surface roughness
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, 0.1)`;
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }
    
    return new THREE.CanvasTexture(canvas);
  };

  // Create normal map for surface detail
  const createNormalMap = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create noise pattern for normal mapping
    const imageData = ctx.createImageData(512, 512);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random();
      data[i] = noise * 255;     // R
      data[i + 1] = noise * 255; // G
      data[i + 2] = 128 + noise * 127; // B (normal map blue channel)
      data[i + 3] = 255;         // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  };

  // Enhanced moon surface creation - CIRCULAR WITH BOUNDARIES
  const createRealisticMoonSurface = () => {
    // Create circular geometry with higher detail
    const geometry = new THREE.CircleGeometry(MOON_RADIUS, 128, 0, Math.PI * 2);
    
    // Add height variation for realistic terrain
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 1];
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      
      // Base terrain with multiple octaves of noise
      let height = 0;
      height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
      height += Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.2;
      height += Math.sin(x * 0.7) * Math.cos(z * 0.7) * 0.1;
      
      // Add craters
      for (let j = 0; j < CRATER_COUNT; j++) {
        const craterX = (Math.random() - 0.5) * MOON_RADIUS * 1.5;
        const craterZ = (Math.random() - 0.5) * MOON_RADIUS * 1.5;
        const craterRadius = Math.random() * 4 + 2;
        const distance = Math.sqrt((x - craterX) ** 2 + (z - craterZ) ** 2);
        
        if (distance < craterRadius) {
          const craterDepth = (1 - distance / craterRadius) * 1.2;
          height -= craterDepth;
        }
      }
      
      // Add random surface variation
      height += (Math.random() - 0.5) * 0.3;
      
      // Raise edges slightly to create a bowl effect (prevents falling off)
      if (distanceFromCenter > MOON_RADIUS * 0.8) {
        const edgeFactor = (distanceFromCenter - MOON_RADIUS * 0.8) / (MOON_RADIUS * 0.2);
        height += edgeFactor * 2; // Raise the edges
      }
      
      vertices[i + 2] = height;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Create realistic moon material
    const moonTexture = createMoonTexture();
    moonTexture.wrapS = THREE.RepeatWrapping;
    moonTexture.wrapT = THREE.RepeatWrapping;
    moonTexture.repeat.set(2, 2);
    
    const normalMap = createNormalMap();
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(4, 4);
    
    const material = new THREE.MeshStandardMaterial({
      map: moonTexture,
      normalMap: normalMap,
      roughness: 0.95,
      metalness: 0.05,
      color: 0xCCCCCC,
      normalScale: new THREE.Vector2(0.5, 0.5)
    });
    
    const moonSurface = new THREE.Mesh(geometry, material);
    moonSurface.rotation.x = -Math.PI / 2;
    moonSurface.receiveShadow = true;
    moonSurface.castShadow = false;
    
    // Add moon boundary visualization (subtle rim)
    const rimGeometry = new THREE.RingGeometry(MOON_RADIUS - 0.2, MOON_RADIUS + 0.2, 64);
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const moonRim = new THREE.Mesh(rimGeometry, rimMaterial);
    moonRim.rotation.x = -Math.PI / 2;
    moonRim.position.y = 0.01;
    
    const moonGroup = new THREE.Group();
    moonGroup.add(moonSurface);
    moonGroup.add(moonRim);
    
    return moonGroup;
  };

  // Enhanced starfield with more realistic appearance
  const createEnhancedStarfield = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Positions
      positions[i3] = (Math.random() - 0.5) * 400;
      positions[i3 + 1] = Math.random() * 150 + 30;
      positions[i3 + 2] = (Math.random() - 0.5) * 400;
      
      // Colors (different star colors)
      const starType = Math.random();
      if (starType < 0.7) {
        colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 1; // White
      } else if (starType < 0.85) {
        colors[i3] = 1; colors[i3 + 1] = 0.8; colors[i3 + 2] = 0.6; // Yellow
      } else {
        colors[i3] = 0.8; colors[i3 + 1] = 0.9; colors[i3 + 2] = 1; // Blue
      }
      
      // Sizes
      sizes[i] = Math.random() * 2 + 0.5;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starsMaterial = new THREE.PointsMaterial({
      size: 1,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    return new THREE.Points(starsGeometry, starsMaterial);
  };

  // Enhanced height calculation for circular surface
  const getHeightAtPosition = (x, z) => {
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    // If outside moon radius, return very high value to prevent access
    if (distanceFromCenter > MOON_RADIUS) {
      return 100; // High wall
    }
    
    // Calculate terrain height (similar to surface generation)
    let height = 0;
    height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
    height += Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.2;
    height += Math.sin(x * 0.7) * Math.cos(z * 0.7) * 0.1;
    height += (Math.sin(x * 2) * Math.cos(z * 2)) * 0.05;
    
    // Add edge raising
    if (distanceFromCenter > MOON_RADIUS * 0.8) {
      const edgeFactor = (distanceFromCenter - MOON_RADIUS * 0.8) / (MOON_RADIUS * 0.2);
      height += edgeFactor * 2;
    }
    
    return height;
  };

  // Check if position is within moon boundaries
  const isWithinMoonBoundaries = (x, z) => {
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    return distanceFromCenter <= MOON_RADIUS * 0.95; // Small buffer
  };

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.Fog(0x000011, 50, 200);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;

    // Enhanced lighting for better moon appearance
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    sunLight.position.set(20, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);

    // Add rim lighting for atmosphere
    const rimLight = new THREE.DirectionalLight(0x4488FF, 0.3);
    rimLight.position.set(-20, 5, -10);
    scene.add(rimLight);

    // Enhanced Earth
    const earthGeometry = new THREE.SphereGeometry(3, 32, 32);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A90E2,
      transparent: true,
      opacity: 0.9,
      emissive: 0x001144,
      emissiveIntensity: 0.1
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(-25, 15, -50);
    scene.add(earth);

    // Add Earth atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(3.2, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x4A90E2,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.position.copy(earth.position);
    scene.add(atmosphere);

    // Create enhanced environment
    const moonSurface = createRealisticMoonSurface();
    scene.add(moonSurface);
    
    const stars = createEnhancedStarfield();
    scene.add(stars);

    // Store references
    sceneRef.current = { 
      scene, 
      renderer, 
      camera, 
      moonSurface,
      stars,
      earth,
      atmosphere
    };

    // Create enhanced rabbit
    const createEnhancedRabbit = () => {
      console.log('Creating enhanced space rabbit...');
      const rabbitGroup = new THREE.Group();
      
      // Body - more detailed
      const bodyGeometry = new THREE.CapsuleGeometry(0.4, 0.8, 8, 16);
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFF8,
        roughness: 0.7,
        metalness: 0.0,
        emissive: 0x111111,
        emissiveIntensity: 0.02
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 0.5, 0);
      body.castShadow = true;
      rabbitGroup.add(body);
      
      // Head
      const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
      const head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.set(0, 0.8, 0.6);
      head.castShadow = true;
      rabbitGroup.add(head);
      
      // Ears with inner detail
      const earGeometry = new THREE.CapsuleGeometry(0.15, 0.6, 8, 16);
      const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
      leftEar.position.set(-0.25, 1.3, 0.6);
      leftEar.rotation.z = -0.2;
      leftEar.castShadow = true;
      rabbitGroup.add(leftEar);
      
      const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
      rightEar.position.set(0.25, 1.3, 0.6);
      rightEar.rotation.z = 0.2;
      rightEar.castShadow = true;
      rabbitGroup.add(rightEar);
      
      // Eyes with shine
      const eyeGeometry = new THREE.SphereGeometry(0.08, 12, 12);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.15, 0.9, 0.9);
      rabbitGroup.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.15, 0.9, 0.9);
      rabbitGroup.add(rightEye);
      
      // Eye shine
      const shineGeometry = new THREE.SphereGeometry(0.02, 8, 8);
      const shineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const leftShine = new THREE.Mesh(shineGeometry, shineMaterial);
      leftShine.position.set(-0.13, 0.92, 0.95);
      rabbitGroup.add(leftShine);
      
      const rightShine = new THREE.Mesh(shineGeometry, shineMaterial);
      rightShine.position.set(0.17, 0.92, 0.95);
      rabbitGroup.add(rightShine);
      
      // Enhanced nose
      const noseGeometry = new THREE.SphereGeometry(0.03, 8, 8);
      const noseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFF69B4,
        emissive: 0x441122,
        emissiveIntensity: 0.1 
      });
      const nose = new THREE.Mesh(noseGeometry, noseMaterial);
      nose.position.set(0, 0.8, 1.0);
      rabbitGroup.add(nose);
      
      // Fluffy tail
      const tailGeometry = new THREE.SphereGeometry(0.2, 12, 12);
      const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
      tail.position.set(0, 0.4, -0.8);
      tail.castShadow = true;
      rabbitGroup.add(tail);
      
      // Enhanced legs with paws
      const legGeometry = new THREE.CapsuleGeometry(0.1, 0.3, 8, 16);
      const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xF8F8F8,
        roughness: 0.8,
        metalness: 0.0
      });
      
      // Paw geometry
      const pawGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      
      // Front legs with paws
      const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
      frontLeftLeg.position.set(-0.2, 0.15, 0.4);
      frontLeftLeg.castShadow = true;
      rabbitGroup.add(frontLeftLeg);
      
      const frontLeftPaw = new THREE.Mesh(pawGeometry, legMaterial);
      frontLeftPaw.position.set(-0.2, 0.05, 0.4);
      frontLeftPaw.castShadow = true;
      rabbitGroup.add(frontLeftPaw);
      
      const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
      frontRightLeg.position.set(0.2, 0.15, 0.4);
      frontRightLeg.castShadow = true;
      rabbitGroup.add(frontRightLeg);
      
      const frontRightPaw = new THREE.Mesh(pawGeometry, legMaterial);
      frontRightPaw.position.set(0.2, 0.05, 0.4);
      frontRightPaw.castShadow = true;
      rabbitGroup.add(frontRightPaw);
      
      // Back legs (bigger) with paws
      const backLegGeometry = new THREE.CapsuleGeometry(0.12, 0.4, 8, 16);
      const backLeftLeg = new THREE.Mesh(backLegGeometry, legMaterial);
      backLeftLeg.position.set(-0.2, 0.2, -0.2);
      backLeftLeg.castShadow = true;
      rabbitGroup.add(backLeftLeg);
      
      const backLeftPaw = new THREE.Mesh(pawGeometry, legMaterial);
      backLeftPaw.position.set(-0.2, 0.05, -0.2);
      backLeftPaw.castShadow = true;
      rabbitGroup.add(backLeftPaw);
      
      const backRightLeg = new THREE.Mesh(backLegGeometry, legMaterial);
      backRightLeg.position.set(0.2, 0.2, -0.2);
      backRightLeg.castShadow = true;
      rabbitGroup.add(backRightLeg);
      
      const backRightPaw = new THREE.Mesh(pawGeometry, legMaterial);
      backRightPaw.position.set(0.2, 0.05, -0.2);
      backRightPaw.castShadow = true;
      rabbitGroup.add(backRightPaw);
      
      // Position the rabbit at moon center
      rabbitGroup.position.copy(rabbitPosition.current);
      scene.add(rabbitGroup);
      sceneRef.current.model = rabbitGroup;
      
      setLoadingStatus('🌙 Enhanced space rabbit ready for lunar exploration!');
      setTimeout(() => setLoadingStatus(''), 3000);
      console.log('Enhanced rabbit created successfully');
    };

    // Try to load GLTF with enhanced fallback
    const loadModel = async () => {
      try {
        setLoadingStatus('Loading space rabbit model...');
        
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
          
          // Enhanced material setup
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
                  emissive: 0x111111,
                  emissiveIntensity: 0.02
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
          setLoadingStatus('🚀 GLTF space rabbit loaded successfully!');
          setTimeout(() => setLoadingStatus(''), 2000);
          
        }, (progress) => {
          console.log('Loading progress:', progress);
        }, (error) => {
          console.log('GLTF failed, using enhanced rabbit:', error);
          createEnhancedRabbit();
        });
        
      } catch (error) {
        console.log('Loading error, using enhanced rabbit:', error);
        createEnhancedRabbit();
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

    // Enhanced animation loop with moon boundary enforcement
    const animate = () => {
      if (!sceneRef.current) return;
      
      animationIdRef.current = requestAnimationFrame(animate);
      
      const delta = clockRef.current.getDelta();
      
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }
      
      // Animate environment
      if (sceneRef.current.stars) {
        sceneRef.current.stars.rotation.y += 0.0001;
      }
      
      if (sceneRef.current.earth) {
        sceneRef.current.earth.rotation.y += 0.001;
      }
      
      // Enhanced rabbit movement with boundary checking
      if (sceneRef.current.model) {
        const model = sceneRef.current.model;
        
        let isMovingNow = false;
        
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
          
          // Check if new position would be within moon boundaries
          const newX = rabbitPosition.current.x + forwardX * RABBIT_SPEED;
          const newZ = rabbitPosition.current.z + forwardZ * RABBIT_SPEED;
          
          if (isWithinMoonBoundaries(newX, newZ)) {
            velocity.current.x = forwardX * RABBIT_SPEED;
            velocity.current.z = forwardZ * RABBIT_SPEED;
            isMovingNow = true;
          } else {
            // Stop movement if hitting boundary
            velocity.current.x *= 0.5;
            velocity.current.z *= 0.5;
          }
        }
        
        if (keysPressed.current.has('ArrowDown')) {
          const backwardX = Math.sin(rabbitRotation.current);
          const backwardZ = Math.cos(rabbitRotation.current);
          
          // Check if new position would be within moon boundaries
          const newX = rabbitPosition.current.x + backwardX * RABBIT_SPEED;
          const newZ = rabbitPosition.current.z + backwardZ * RABBIT_SPEED;
          
          if (isWithinMoonBoundaries(newX, newZ)) {
            velocity.current.x = backwardX * RABBIT_SPEED;
            velocity.current.z = backwardZ * RABBIT_SPEED;
            isMovingNow = true;
          } else {
            // Stop movement if hitting boundary
            velocity.current.x *= 0.5;
            velocity.current.z *= 0.5;
          }
        }
        
        // Apply deceleration when not moving
        if (!isMovingNow) {
          velocity.current.x *= DECELERATION;
          velocity.current.z *= DECELERATION;
          
          if (Math.abs(velocity.current.x) < MIN_VELOCITY) velocity.current.x = 0;
          if (Math.abs(velocity.current.z) < MIN_VELOCITY) velocity.current.z = 0;
        }
        
        // Apply gravity
        if (!isGrounded.current) {
          velocity.current.y += MOON_GRAVITY;
        }
        
        // Update position with boundary enforcement
        const newX = rabbitPosition.current.x + velocity.current.x;
        const newZ = rabbitPosition.current.z + velocity.current.z;
        
        // Only update position if within boundaries
        if (isWithinMoonBoundaries(newX, newZ)) {
          rabbitPosition.current.x = newX;
          rabbitPosition.current.z = newZ;
        } else {
          // Stop velocity if hitting boundary
          velocity.current.x = 0;
          velocity.current.z = 0;
        }
        
        rabbitPosition.current.y += velocity.current.y;
        
        // Ground collision
        const groundHeight = getHeightAtPosition(rabbitPosition.current.x, rabbitPosition.current.z);
        
        if (rabbitPosition.current.y <= groundHeight + 0.1) {
          rabbitPosition.current.y = groundHeight + 0.1;
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
          
          sceneRef.current.camera.position.lerp(targetCameraPosition, CAMERA_FOLLOW_SPEED);
          sceneRef.current.camera.lookAt(lookAtTarget);
          
        } else {
          const targetPosition = new THREE.Vector3(
            rabbitPosition.current.x, 
            CAMERA_HEIGHT_TOP, 
            rabbitPosition.current.z + 3
          );
          const lookAtTarget = new THREE.Vector3(
            rabbitPosition.current.x, 
            0, 
            rabbitPosition.current.z
          );
          
          sceneRef.current.camera.position.lerp(targetPosition, CAMERA_FOLLOW_SPEED);
          sceneRef.current.camera.lookAt(lookAtTarget);
        }
        
        // Update game state with distance from center
        const distanceFromCenter = Math.sqrt(rabbitPosition.current.x ** 2 + rabbitPosition.current.z ** 2);
        const speedMagnitude = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2);
        const actuallyMoving = speedMagnitude > MIN_VELOCITY;
        
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
          onMoonSurface: distanceFromCenter <= MOON_RADIUS
        });
        
        // Control animation
        if (sceneRef.current.runAction) {
          if (actuallyMoving) {
            sceneRef.current.runAction.paused = false;
            sceneRef.current.runAction.setEffectiveWeight(1);
          } else {
            sceneRef.current.runAction.paused = true;
            sceneRef.current.runAction.time = 0;
          }
        }
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

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
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
  }, [cameraMode]);

  return (
    <div className="relative w-full h-screen bg-black">
      {(loadingStatus || error) && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black bg-opacity-95 text-white p-4 rounded-lg border border-gray-500 backdrop-blur-sm">
            {error ? (
              <div className="text-red-400">
                <p className="font-bold">❌ Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <p className="text-blue-400 font-medium">🚀 {loadingStatus}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Enhanced Game Status */}
      <div className="absolute top-4 right-4 z-10 text-white text-sm bg-black bg-opacity-95 p-4 rounded-lg border border-gray-500 backdrop-blur-sm">
        <div className="space-y-2">
          <div className="text-center text-yellow-400 font-bold text-base mb-2">🌙 LUNAR STATUS</div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🐰</span> 
            <span>Status:</span> 
            <span className={gameState.isMoving ? 'text-green-400 font-bold' : 'text-gray-400'}>
              {gameState.isMoving ? '🏃‍♂️ EXPLORING' : '🛑 RESTING'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">📍</span> 
            <span>Position:</span> 
            <span className="font-mono">({gameState.position?.x || '0'}, {gameState.position?.z || '0'})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">🎯</span> 
            <span>Distance from Center:</span> 
            <span className="font-mono text-cyan-400">{gameState.position?.distanceFromCenter || '0'}m</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🧭</span> 
            <span>Facing:</span> 
            <span className="font-mono">{gameState.rotation}°</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">⬇️</span> 
            <span>Ground:</span> 
            <span className={gameState.isGrounded ? 'text-green-400' : 'text-orange-400'}>
              {gameState.isGrounded ? '✅ Landed' : '🚀 Airborne'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400">📷</span> 
            <span>Camera:</span> 
            <span className="text-orange-400">
              {cameraMode === 'behind' ? '🎮 Third-Person' : '🔭 Orbital'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-pink-400">🌙</span> 
            <span>Surface:</span> 
            <span className={gameState.onMoonSurface ? 'text-green-400' : 'text-red-400'}>
              {gameState.onMoonSurface ? '✅ On Moon' : '❌ Off Moon'}
            </span>
          </div>
          {gameState.keysPressed && gameState.keysPressed.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-pink-400">⌨️</span> 
              <span>Active:</span> 
              <span className="font-mono text-pink-400 text-xs">{gameState.keysPressed.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Controls Guide */}
      <div className="absolute bottom-4 left-4 z-10 text-white text-xs bg-black bg-opacity-95 p-4 rounded-lg border border-gray-500 backdrop-blur-sm max-w-sm">
        <div className="space-y-1">
          <div className="text-center">
            <p><span className="text-yellow-400">🌙</span> <strong className="text-lg">MOON RABBIT EXPLORER</strong></p>
            <p><span className="text-green-400">✨</span> <strong className="text-green-400">ENHANCED LUNAR EDITION</strong></p>
          </div>
          <hr className="border-gray-600 my-2"/>
          
          <div className="grid grid-cols-2 gap-1 text-xs">
            <p><span className="text-cyan-400 font-bold">⬆️ UP</span> Forward</p>
            <p><span className="text-orange-400 font-bold">⬇️ DOWN</span> Backward</p>
            <p><span className="text-purple-400 font-bold">⬅️ LEFT</span> Turn Left</p>
            <p><span className="text-pink-400 font-bold">➡️ RIGHT</span> Turn Right</p>
            <p><span className="text-white font-bold">⚡ SPACE</span> Jump</p>
            <p><span className="text-red-400 font-bold">📷 C</span> Camera</p>
          </div>
          
          <hr className="border-gray-600 my-2"/>
          
          <div className="space-y-1">
            <p><span className="text-yellow-400">🌙</span> <strong>REALISTIC MOON SURFACE</strong></p>
            <p><span className="text-green-400">🛡️</span> Boundary system prevents falling off</p>
            <p><span className="text-cyan-400">🎨</span> Procedural moon texture with craters</p>
            <p><span className="text-blue-400">🌍</span> Earth visible in lunar sky</p>
            <p><span className="text-purple-400">⭐</span> Enhanced starfield with colors</p>
            <p><span className="text-orange-400">💫</span> Atmospheric lighting effects</p>
            <p><span className="text-pink-400">🐰</span> Detailed space rabbit model</p>
          </div>
          
          <hr className="border-gray-600 my-2"/>
          
          <div className="text-center">
            <p><span className="text-red-400">🚀</span> <strong>PORTFOLIO PROJECT</strong></p>
            <p className="text-gray-300">Explore the moon and learn about me!</p>
          </div>
        </div>
      </div>
      
      {/* Moon Boundary Warning */}
      {gameState.position && parseFloat(gameState.position.distanceFromCenter) > MOON_RADIUS * 0.8 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-red-900 bg-opacity-90 text-white p-4 rounded-lg border-2 border-red-500 animate-pulse">
            <div className="text-center">
              <p className="text-2xl mb-2">⚠️</p>
              <p className="font-bold text-red-300">APPROACHING MOON EDGE!</p>
              <p className="text-sm">Turn around to stay on the lunar surface</p>
            </div>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default MoonRabbitExplorer