import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RabbitLoader } from '../utils/RabbitLoader'; // Import the utility

const RocketLaunchSequence = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rabbitLoaderRef = useRef(null); // Add ref for rabbit loader
  const [launchPhase, setLaunchPhase] = useState('countdown'); // 'countdown', 'launch', 'landing'
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown timer
    if (launchPhase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (launchPhase === 'countdown' && countdown === 0) {
      setTimeout(() => setLaunchPhase('launch'), 500);
    }
  }, [launchPhase, countdown]);

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;

    const canvas = canvasRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: false 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1); // Pure black space
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add lighting for rabbit shadows
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Create realistic starfield
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 0.8,
      sizeAttenuation: false
    });
    
    const starsVertices = [];
    const starsColors = [];
    for (let i = 0; i < 8000; i++) {
      // Position stars in hemisphere above moon surface
      const radius = 400 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.7; // Upper hemisphere only
      
      starsVertices.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi) + 20,
        radius * Math.sin(phi) * Math.sin(theta)
      );
      
      // Vary star colors slightly (white to pale blue/yellow)
      const intensity = 0.8 + Math.random() * 0.2;
      starsColors.push(intensity, intensity, intensity * (0.9 + Math.random() * 0.1));
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    // Create realistic moon surface using NASA texture
    const textureLoader = new THREE.TextureLoader();
    
    // Moon surface (large terrain)
    const moonSurfaceGeometry = new THREE.PlaneGeometry(300, 300, 100, 100);
    
    // Create moon surface material with realistic NASA-like texture
    const moonSurfaceMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xaaaaaa,
      roughness: 1,
      transparent: false
    });
    
    // Load moon texture
    textureLoader.load(
      'moon.jpg',
      (texture) => {
        console.log('Moon texture loaded');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        moonSurfaceMaterial.map = texture;
        moonSurfaceMaterial.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.log('Moon texture not found');
      }
    );
    
    // Add realistic height variation to moon surface
    const positions = moonSurfaceGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Create realistic lunar terrain with multiple noise layers
      const height = 
        Math.sin(x * 0.02) * Math.cos(z * 0.02) * 3 +
        Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5 +
        Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.8 +
        (Math.random() - 0.5) * 2;
      
      positions.setY(i, height);
    }
    positions.needsUpdate = true;
    moonSurfaceGeometry.computeVertexNormals();
    
    const moonSurface = new THREE.Mesh(moonSurfaceGeometry, moonSurfaceMaterial);
    moonSurface.rotation.x = -Math.PI / 2;
    moonSurface.position.y = -3;
    moonSurface.receiveShadow = true;
    scene.add(moonSurface);
    
    // Create realistic lunar hills/mountains
    for (let i = 0; i < 12; i++) {
      const hillGeometry = new THREE.SphereGeometry(
        Math.random() * 25 + 15, 
        16, 8, 0, Math.PI * 2, 0, Math.PI * 0.4
      );
      const hillMaterial = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(0, 0, 0.4 + Math.random() * 0.2)
      });
      const hill = new THREE.Mesh(hillGeometry, hillMaterial);
      
      hill.position.set(
        (Math.random() - 0.5) * 400,
        -8 + Math.random() * 5,
        -80 - Math.random() * 150
      );
      hill.receiveShadow = true;
      scene.add(hill);
    }
    
    // Create Earth in the sky (visible from moon)
    const earthGeometry = new THREE.SphereGeometry(8, 32, 32);
    const earthMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4a90e2,
      transparent: true,
      opacity: 0.9
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(-30, 40, -60);
    scene.add(earth);
    
    // Initialize and load your rabbit model using RabbitLoader
    const loadRabbit = async () => {
      rabbitLoaderRef.current = new RabbitLoader();
      await rabbitLoaderRef.current.initLoader();
      const rabbitGroup = await rabbitLoaderRef.current.loadRabbitModel(scene);
      rabbitGroup.position.set(2, 0, 5);
      scene.add(rabbitGroup);
      return rabbitGroup;
    };
    
    // Load the rabbit
    let rabbitGroup;
    loadRabbit().then((group) => {
      rabbitGroup = group;
    }).catch((error) => {
      console.error('Failed to load rabbit:', error);
    });
    
    // Animation variables
    let hopAnimation = 0;
    let cameraAngle = 0;
    let animationTime = 0;
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Handle launch phase transition
      if (launchPhase === 'launch') {
        setLaunchPhase('landing');
      }
      
      // Update animation time
      animationTime += 0.016; // ~60fps
      hopAnimation += 0.015;
      
      // Only animate if rabbit is loaded
      if (rabbitGroup) {
        // Realistic moon hop (slower, higher jumps due to low gravity)
        const hopHeight = Math.abs(Math.sin(hopAnimation)) * 2;
        rabbitGroup.position.y = hopHeight;
        
        // Subtle forward movement
        rabbitGroup.position.x = 2 + Math.sin(hopAnimation * 0.3) * 3;
        rabbitGroup.position.z = 5 + Math.cos(hopAnimation * 0.2) * 2;
        
        // Rabbit rotation during hops
        rabbitGroup.rotation.y += Math.sin(hopAnimation) * 0.005;
        
        // Use RabbitLoader utility to animate rabbit details
        if (rabbitLoaderRef.current) {
          rabbitLoaderRef.current.animateRabbit(animationTime, hopAnimation);
        }
      }
      
      // Cinematic camera movement
      cameraAngle += 0.002;
      camera.position.x = 8 + Math.cos(cameraAngle) * 4;
      camera.position.z = 12 + Math.sin(cameraAngle) * 4;
      camera.position.y = 4 + Math.sin(cameraAngle * 0.5) * 1;
      
      // Look at rabbit if it exists, otherwise look at origin
      if (rabbitGroup) {
        camera.lookAt(rabbitGroup.position);
      } else {
        camera.lookAt(new THREE.Vector3(2, 0, 5));
      }
      
      // Rotate Earth slowly
      earth.rotation.y += 0.01;
      
      // Subtle star twinkling
      stars.rotation.y += 0.0001;
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Auto-complete after moon exploration
    const completionTimer = setTimeout(() => {
      onComplete();
    }, 12000); // 12 seconds to enjoy the rabbit on moon
    
    // Handle resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', onResize);
    
    // Store scene reference
    sceneRef.current = { scene, renderer, camera, onResize };
    
    // Cleanup
    return () => {
      clearTimeout(completionTimer);
      window.removeEventListener('resize', onResize);
      if (renderer) {
        renderer.dispose();
      }
      // Dispose all geometries and materials
      starsGeometry?.dispose();
      starsMaterial?.dispose();
      moonSurfaceGeometry?.dispose();
      moonSurfaceMaterial?.dispose();
      
      // Clean up rabbit model
      if (rabbitGroup) {
        rabbitGroup.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [launchPhase, onComplete]);

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Countdown Overlay */}
      {launchPhase === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-8 font-['Nippo']">
              Lunar Landing in...
            </h2>
            <div className="text-9xl font-bold text-[var(--color-primary)] glow-text animate-pulse">
              {countdown > 0 ? countdown : 'TOUCHDOWN!'}
            </div>
          </div>
        </div>
      )}
      
      {/* Mission Status */}
      {launchPhase !== 'countdown' && (
        <div className="absolute top-10 left-10 z-40 text-white">
          <div className="bg-black bg-opacity-60 p-4 rounded-lg border border-gray-600">
            <h3 className="text-xl font-bold font-['Nippo'] mb-2 text-[var(--color-primary)]">
              🌙 Lunar Mission Status
            </h3>
            <p className="text-sm mb-1">
              {launchPhase === 'launch' && '🚀 Approaching lunar surface...'}
              {launchPhase === 'landing' && '🐰 Rabbit exploring moon surface'}
            </p>
            <p className="text-xs opacity-75">
              Location: Mare Tranquillitatis
            </p>
            <p className="text-xs opacity-75">
              Gravity: 1.62 m/s² (16.5% of Earth)
            </p>
          </div>
        </div>
      )}
      
      {/* NASA Mission Info */}
      {launchPhase === 'landing' && (
        <div className="absolute bottom-10 right-10 z-40 text-white">
          <div className="bg-black bg-opacity-60 p-4 rounded-lg border border-gray-600 max-w-sm">
            <h4 className="text-lg font-bold font-['Nippo'] mb-2 text-[var(--color-primary)]">
              Mission Notes
            </h4>
            <p className="text-xs opacity-90 mb-2">
              "The Moon's surface is covered with a fine powdery substance called regolith, 
              created by billions of years of meteorite impacts."
            </p>
            <p className="text-xs opacity-75">
              - NASA Lunar Reconnaissance Mission
            </p>
          </div>
        </div>
      )}
      
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default RocketLaunchSequence;