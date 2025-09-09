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

const MoonExplorerPart1 = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing lunar environment...');
  const [isSceneReady, setIsSceneReady] = useState(false);

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
    
    return moonSurface;
  };

  // Subtle, realistic starfield that looks natural
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

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;

    setLoadingStatus('Creating lunar scene...');

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000015);
    scene.fog = new THREE.Fog(0x000015, 150, 600);
    
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
    renderer.toneMappingExposure = 1.4;
    renderer.physicallyCorrectLights = true;

    setLoadingStatus('Setting up lunar lighting...');

    // Sun lighting
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
    
    // Earth reflection light
    const earthLight = new THREE.DirectionalLight(0x4A90E2, 0.5);
    earthLight.position.set(-40, 30, -50);
    scene.add(earthLight);
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 0.15);
    scene.add(ambientLight);

    setLoadingStatus('Creating Earth in the distance...');

    // Earth creation
    const earthGeometry = new THREE.SphereGeometry(6, 128, 128);
    
    const earthTexture = new THREE.CanvasTexture((() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      // Earth colors and design
      const earthGrad = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
      earthGrad.addColorStop(0, '#5AA5F0');
      earthGrad.addColorStop(0.6, '#3E7CB8');
      earthGrad.addColorStop(1, '#2A5587');
      
      ctx.fillStyle = earthGrad;
      ctx.fillRect(0, 0, 1024, 1024);
      
      // Continents
      ctx.fillStyle = '#A0926B';
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 80 + 30;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Clouds
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
    earth.position.set(-100, 45, -150);
    scene.add(earth);

    // Earth atmosphere
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

    setLoadingStatus('Generating realistic lunar surface...');

    // Moon surface
    const moonSurface = createUltraRealisticMoonSurface();
    scene.add(moonSurface);
    
    setLoadingStatus('Adding starfield...');

    // Stars
    const stars = createSubtleRealisticStarfield();
    scene.add(stars);

    // Set initial camera position
    camera.position.set(0, CAMERA_HEIGHT_BEHIND, CAMERA_DISTANCE_BEHIND);
    camera.lookAt(0, 1, 0);

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

    setLoadingStatus('Scene ready! Ready for Part 2...');
    setIsSceneReady(true);
    
    setTimeout(() => setLoadingStatus(''), 2000);

    // Basic render loop for Part 1 (static scene)
    const render = () => {
      if (!sceneRef.current) return;
      
      // Subtle star rotation
      if (sceneRef.current.stars) {
        sceneRef.current.stars.rotation.y += 0.00005;
      }
      
      // Earth rotation
      if (sceneRef.current.earth) {
        sceneRef.current.earth.rotation.y += 0.001;
      }
      
      // Sun light movement
      if (sceneRef.current.sunLight) {
        const time = Date.now() * 0.0002;
        sceneRef.current.sunLight.position.x = Math.cos(time) * 60;
        sceneRef.current.sunLight.position.z = Math.sin(time) * 60;
        sceneRef.current.sunLight.position.y = 70;
      }
      
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      requestAnimationFrame(render);
    };
    
    render();

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
      window.removeEventListener('resize', handleResize);
      
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

  // Height calculation function (exported for Part 2)
  window.getHeightAtPosition = (x, z) => {
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    if (distanceFromCenter > MOON_RADIUS * 1.5) {
      return 100; // High barrier for far exploration
    }
    
    let height = 0;
    
    // Match the surface generation
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

  window.isWithinMoonBoundaries = (x, z) => {
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    return distanceFromCenter <= MOON_RADIUS * 1.2;
  };

  // Export scene reference for Part 2
  window.sceneRef = sceneRef;

  return (
    <div className="relative w-full h-screen bg-black">
      {loadingStatus && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black bg-opacity-95 text-white p-4 rounded-lg border border-blue-500 backdrop-blur-sm">
            <p className="text-cyan-400 font-medium">🚀 {loadingStatus}</p>
          </div>
        </div>
      )}
      
      {isSceneReady && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-green-900 bg-opacity-95 text-white p-4 rounded-lg border border-green-500">
            <p className="text-green-300 font-bold">✅ Part 1 Complete</p>
            <p className="text-sm">Environment ready for Part 2</p>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 z-10 text-white text-sm bg-black bg-opacity-95 p-4 rounded-lg border border-blue-500 max-w-md">
        {/* <div className="text-cyan-400 font-bold mb-2">🌙 PART 1: LUNAR ENVIRONMENT</div> */}
        {/* <div className="space-y-1 text-xs">
          <div>• NASA-accurate moon surface texture</div>
          <div>• Realistic lighting and shadows</div>
          <div>• Earth visible in distance</div>
          <div>• Subtle starfield background</div>
          <div>• Terrain height mapping ready</div>
        </div> */}
        <div className="mt-3 p-2 bg-blue-900 bg-opacity-50 rounded">
          {/* <p className="text-blue-300 text-xs font-bold">Ready for Part 2: Rabbit Controller</p> */}
        </div>
      </div>
      
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default MoonExplorerPart1;