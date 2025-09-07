import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Game Constants - FIXED AND BALANCED
const RABBIT_SPEED = 0.12;
const TURN_SPEED = 0.08;
const DECELERATION = 0.88;
const MIN_VELOCITY = 0.001;

// Ultra-realistic Moon environment based on NASA data
const MOON_RADIUS = 50; // Larger for more exploration
const CRATER_COUNT = 40; // More craters like real moon
const MOON_GRAVITY = -0.008;
const JUMP_POWER = 0.25;

// Camera settings - OPTIMIZED FOR THIRD-PERSON
const CAMERA_HEIGHT_BEHIND = 5;
const CAMERA_DISTANCE_BEHIND = 10;
const CAMERA_HEIGHT_TOP = 25;
const CAMERA_FOLLOW_SPEED = 0.06;

const UltraMoonExplorer = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const [loadingStatus, setLoadingStatus] = useState('Loading ultra-realistic lunar surface...');
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
  
  // Animation references for custom rabbit
  const animationState = useRef({
    time: 0,
    legPhase: 0,
    earBob: 0,
    tailWag: 0,
    bodyBounce: 0,
    isRunning: false
  });

  // Create clean, NASA-accurate moon texture like the reference image
  const createNASAMoonTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Base lunar regolith - clean, uniform gray like NASA photos
    ctx.fillStyle = '#B8B8B8'; // Exact lunar regolith color from NASA images
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Add very subtle brightness variation (like real regolith)
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 8 + 4;
      const brightness = Math.random() * 30 + 170;
      
      ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.1)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add small scattered rocks/debris (like in NASA photo)
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 3 + 1;
      
      ctx.fillStyle = `rgba(80, 80, 80, 0.8)`; // Dark rocks
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add very few, subtle craters (most lunar surface is smooth)
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const radius = Math.random() * 20 + 15;
      
      // Very subtle crater depression
      const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      craterGradient.addColorStop(0, 'rgba(150, 150, 150, 0.3)');
      craterGradient.addColorStop(1, 'rgba(200, 200, 200, 0.1)');
      
      ctx.fillStyle = craterGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  };

  // Create simple, clean normal map like real lunar surface
  const createAdvancedNormalMap = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base normal map - mostly flat like real lunar surface
    ctx.fillStyle = '#8080FF'; // Neutral normal (128, 128, 255)
    ctx.fillRect(0, 0, 512, 512);
    
    // Add very subtle surface variation
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 4 + 2;
      const variation = Math.random() * 20 + 118;
      
      ctx.fillStyle = `rgb(${variation}, ${variation}, 255)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  };

  // Create roughness map for realistic surface scattering
  const createRoughnessMap = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base roughness for lunar regolith
    ctx.fillStyle = '#E0E0E0'; // High roughness
    ctx.fillRect(0, 0, 512, 512);
    
    // Add variation
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 5 + 2;
      const roughness = Math.random() * 100 + 150;
      
      ctx.fillStyle = `rgb(${roughness}, ${roughness}, ${roughness})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  };

  // NASA-inspired clean moon surface like the reference photo - NO BOUNDARY SQUARE
  const createUltraRealisticMoonSurface = () => {
    // Create smooth, clean geometry like real lunar surface - much larger to eliminate boundary
    const geometry = new THREE.PlaneGeometry(MOON_RADIUS * 4, MOON_RADIUS * 4, 256, 256);
    
    // Add subtle, realistic terrain features matching NASA lunar photography
    const vertices = geometry.attributes.position.array;
    
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 1];
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      
      // Gentle, rolling lunar terrain - not too dramatic
      let height = 0;
      
      // Large gentle undulations (like real lunar surface)
      height += Math.sin(x * 0.03) * Math.cos(z * 0.03) * 0.8;
      height += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.4;
      
      // Very subtle surface variation
      height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.2;
      
      // Small random surface roughness (lunar regolith)
      height += (Math.random() - 0.5) * 0.1;
      
      // Add only a few larger craters (most lunar surface is smooth)
      for (let j = 0; j < 12; j++) {
        const craterX = (Math.random() - 0.5) * MOON_RADIUS * 2;
        const craterZ = (Math.random() - 0.5) * MOON_RADIUS * 2;
        const craterRadius = Math.random() * 6 + 4;
        const distance = Math.sqrt((x - craterX) ** 2 + (z - craterZ) ** 2);
        
        if (distance < craterRadius) {
          // Gentle crater profile - not too dramatic
          const normalizedDist = distance / craterRadius;
          const craterDepth = (1 - normalizedDist) * 1.2;
          height -= craterDepth;
        }
      }
      
      // Gentle falloff at far edges to prevent sharp cutoff
      if (distanceFromCenter > MOON_RADIUS * 1.8) {
        const falloffFactor = Math.max(0, (MOON_RADIUS * 2 - distanceFromCenter) / (MOON_RADIUS * 0.2));
        height *= falloffFactor;
      }
      
      vertices[i + 2] = height;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Clean, simple lunar material matching NASA photos
    const moonTexture = createNASAMoonTexture();
    moonTexture.wrapS = THREE.RepeatWrapping;
    moonTexture.wrapT = THREE.RepeatWrapping;
    moonTexture.repeat.set(6, 6); // More texture repetition for larger surface
    
    const normalMap = createAdvancedNormalMap();
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(8, 8);
    
    // Simple, clean material like real lunar surface
    const material = new THREE.MeshStandardMaterial({
      map: moonTexture,
      normalMap: normalMap,
      roughness: 0.9, // High roughness for regolith
      metalness: 0.0, // No metallic properties
      color: 0xB8B8B8, // Exact NASA lunar color
      normalScale: new THREE.Vector2(0.3, 0.3), // Subtle surface detail
    });
    
    const moonSurface = new THREE.Mesh(geometry, material);
    moonSurface.rotation.x = -Math.PI / 2;
    moonSurface.receiveShadow = true;
    moonSurface.castShadow = false;
    
    // NO BOUNDARY RING - just return the clean surface
    return moonSurface;
  };

  // ONLY ENHANCED: Subtle, realistic starfield that looks natural
  const createSubtleRealisticStarfield = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 3000; // Fewer stars for subtle effect
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Position stars naturally in space
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(Math.random() * 0.9 + 0.1); // Keep most stars high in sky
      const radius = 400 + Math.random() * 200;
      
      positions[i3] = radius * Math.sin(theta) * Math.cos(phi);
      positions[i3 + 1] = Math.max(30, radius * Math.cos(theta)); // Keep above horizon
      positions[i3 + 2] = radius * Math.sin(theta) * Math.sin(phi);
      
      // Subtle, realistic star colors - not too bright
      const starType = Math.random();
      if (starType < 0.6) {
        // White stars - most common
        colors[i3] = 0.9; colors[i3 + 1] = 0.9; colors[i3 + 2] = 0.85;
      } else if (starType < 0.8) {
        // Slightly blue stars
        colors[i3] = 0.8; colors[i3 + 1] = 0.85; colors[i3 + 2] = 0.9;
      } else {
        // Slightly orange stars
        colors[i3] = 0.9; colors[i3 + 1] = 0.8; colors[i3 + 2] = 0.7;
      }
      
      // Small, subtle size variation
      sizes[i] = 1.5 + Math.random() * 1.5;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starsMaterial = new THREE.PointsMaterial({
      size: 2, // Small, subtle stars
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.7 // Subtle opacity
    });
    
    return new THREE.Points(starsGeometry, starsMaterial);
  };

  // Enhanced height calculation matching the cleaner surface generation
  const getHeightAtPosition = (x, z) => {
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    if (distanceFromCenter > MOON_RADIUS * 1.5) {
      return 100; // High barrier for far exploration
    }
    
    let height = 0;
    
    // Match the cleaner surface generation
    height += Math.sin(x * 0.03) * Math.cos(z * 0.03) * 0.8;
    height += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.4;
    height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.2;
    
    // Simple crater effects
    const craterEffect = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.1;
    height += craterEffect;
    
    // Gentle falloff at edges
    if (distanceFromCenter > MOON_RADIUS * 1.8) {
      const falloffFactor = Math.max(0, (MOON_RADIUS * 2 - distanceFromCenter) / (MOON_RADIUS * 0.2));
      height *= falloffFactor;
    }
    
    return height;
  };

  const isWithinMoonBoundaries = (x, z) => {
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    return distanceFromCenter <= MOON_RADIUS * 1.2; // Expanded exploration area
  };

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;

    // UNCHANGED: Your original scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000015); // Your original background color
    scene.fog = new THREE.Fog(0x000015, 150, 600); // Your original fog
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4; // Your original exposure
    renderer.physicallyCorrectLights = true;

    // UNCHANGED: Your original lighting
    const sunLight = new THREE.DirectionalLight(0xFFFFF5, 3.0);
    sunLight.position.set(60, 70, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 8192;
    sunLight.shadow.mapSize.height = 8192;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 700;
    sunLight.shadow.camera.left = -150;
    sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150;
    sunLight.shadow.camera.bottom = -150;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);
    
    // UNCHANGED: Your original Earth reflection light
    const earthLight = new THREE.DirectionalLight(0x4A90E2, 0.5);
    earthLight.position.set(-40, 30, -50);
    scene.add(earthLight);
    
    // UNCHANGED: Your original ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 0.15);
    scene.add(ambientLight);

    // UNCHANGED: Your original Earth
    const earthGeometry = new THREE.SphereGeometry(6, 128, 128);
    
    const earthTexture = new THREE.CanvasTexture((() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      // Your original Earth colors and design
      const earthGrad = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
      earthGrad.addColorStop(0, '#5AA5F0');
      earthGrad.addColorStop(0.6, '#3E7CB8');
      earthGrad.addColorStop(1, '#2A5587');
      
      ctx.fillStyle = earthGrad;
      ctx.fillRect(0, 0, 1024, 1024);
      
      // Your original continents
      ctx.fillStyle = '#A0926B';
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 80 + 30;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Your original clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 30 + 8;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      return canvas;
    })());
    
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      emissive: 0x003366,
      emissiveIntensity: 0.3
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(-100, 45, -150); // Your original position
    scene.add(earth);

    // UNCHANGED: Your original atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(6.8, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x88DDFF,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.position.copy(earth.position);
    scene.add(atmosphere);

    // UNCHANGED: Your original moon surface
    const moonSurface = createUltraRealisticMoonSurface();
    scene.add(moonSurface);
    
    // ONLY CHANGE: Add subtle, realistic stars
    const stars = createSubtleRealisticStarfield();
    scene.add(stars);

    // Store references
    sceneRef.current = { 
      scene, 
      renderer, 
      camera, 
      moonSurface,
      stars,
      earth,
      atmosphere,
      sunLight
    };

    // UNCHANGED: Your original rabbit creation
    const createRealisticSpaceRabbit = () => {
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
      sceneRef.current.rabbitParts = {
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
      sceneRef.current.model = rabbitGroup;
      
      setLoadingStatus('🐰 Realistic lunar rabbit ready for hopping!');
      setTimeout(() => setLoadingStatus(''), 3000);
      console.log('Realistic space rabbit created with proper ground contact');
    };

    // Load GLTF model with fallback to enhanced rabbit
    const loadModel = async () => {
      try {
        setLoadingStatus('Loading astronaut rabbit model...');
        
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
          createRealisticSpaceRabbit();
        });
        
      } catch (error) {
        console.log('Loading error, using realistic rabbit:', error);
        createRealisticSpaceRabbit();
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

    // UNCHANGED: Your original animation loop with only very subtle star rotation
    const animate = () => {
      if (!sceneRef.current) return;
      
      animationIdRef.current = requestAnimationFrame(animate);
      
      const delta = clockRef.current.getDelta();
      
      // Update animation time
      animationState.current.time += delta;
      
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }
      
      // ONLY CHANGE: Very subtle star rotation to make them feel alive
      if (sceneRef.current.stars) {
        sceneRef.current.stars.rotation.y += 0.00005; // Very slow, subtle rotation
      }
      
      // UNCHANGED: Your original Earth rotation
      if (sceneRef.current.earth) {
        sceneRef.current.earth.rotation.y += 0.001;
      }
      
      // UNCHANGED: Your original sun light changes
      if (sceneRef.current.sunLight) {
        const time = Date.now() * 0.0002;
        sceneRef.current.sunLight.position.x = Math.cos(time) * 60;
        sceneRef.current.sunLight.position.z = Math.sin(time) * 60;
        sceneRef.current.sunLight.position.y = 70;
      }
      
      // UNCHANGED: Your original rabbit movement and animation
      if (sceneRef.current.model) {
        const model = sceneRef.current.model;
        
        const isPressingMovementKey = keysPressed.current.has('ArrowUp') || keysPressed.current.has('ArrowDown');
        let isMovingNow = false;
        
        animationState.current.isRunning = isPressingMovementKey;
        
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
          
          if (isWithinMoonBoundaries(newX, newZ)) {
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
          
          if (isWithinMoonBoundaries(newX, newZ)) {
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
        
        if (isWithinMoonBoundaries(newX, newZ)) {
          rabbitPosition.current.x = newX;
          rabbitPosition.current.z = newZ;
        } else {
          velocity.current.x = 0;
          velocity.current.z = 0;
        }
        
        rabbitPosition.current.y += velocity.current.y;
        
        // Ground collision with precise surface matching
        const groundHeight = getHeightAtPosition(rabbitPosition.current.x, rabbitPosition.current.z);
        
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
          
          sceneRef.current.camera.position.lerp(targetCameraPosition, CAMERA_FOLLOW_SPEED);
          sceneRef.current.camera.lookAt(lookAtTarget);
          
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
          
          sceneRef.current.camera.position.lerp(targetPosition, CAMERA_FOLLOW_SPEED);
          sceneRef.current.camera.lookAt(lookAtTarget);
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
      <div className="absolute top-4 right-4 z-10 text-white text-sm bg-black bg-opacity-95 p-4 rounded-lg border border-blue-500 backdrop-blur-sm">
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
          {gameState.keysPressed && gameState.keysPressed.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-white text-xs">{gameState.keysPressed.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced NASA Mission Control Guide */}
      <div className="absolute bottom-4 left-4 z-10 text-white text-xs bg-black bg-opacity-95 p-4 rounded-lg border border-blue-500 backdrop-blur-sm max-w-sm">
        <div className="space-y-1">
          <hr className="border-blue-600 my-2"/>
          <hr className="border-blue-600 my-2"/>
          <hr className="border-blue-600 my-2"/>
        </div>
      </div>
      
      {/* Enhanced Mission Boundary Alert */}
      {gameState.position && parseFloat(gameState.position.distanceFromCenter) > MOON_RADIUS * 1.1 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
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
      
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default UltraMoonExplorer;