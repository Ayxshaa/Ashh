import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const BackgroundCanvas = ({ isZooming, onZoomComplete }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const moonRef = useRef(null);
  const worldRef = useRef(null);
  const isJourneyStarted = useRef(false);
  const orbitControlsRef = useRef(null);
  const [isZoomingToMoon, setIsZoomingToMoon] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;

    const canvas = canvasRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 50, 2000);
    
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000011, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Enhanced texture URLs
    const textureURL = "/src/assets/moon.jpg";
    const displacementURL = "/src/assets/Mine.avif";
    const worldURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/hipp8_s.jpg";
    
    // Create ultra-detailed moon geometry
    const moonGeometry = new THREE.SphereGeometry(4, 256, 256);
    
    // Texture loader with better settings
    const textureLoader = new THREE.TextureLoader();
    
    // Load and configure textures
    const moonTexture = textureLoader.load(textureURL, (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
    });
    
    const moonDisplacement = textureLoader.load(displacementURL, (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    });
    
    const starfieldTexture = textureLoader.load(worldURL, (texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    });
    
    // Create ultra-realistic moon material
    const moonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: moonTexture,
      displacementMap: moonDisplacement,
      displacementScale: 0.2,
      normalMap: moonDisplacement,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.95,
      metalness: 0.02,
      clearcoat: 0.0,
      reflectivity: 0.01,
      ior: 1.45
    });
    
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.castShadow = true;
    moon.receiveShadow = true;
    moon.position.set(0, 0, 0);
    
    // Better initial rotation to show moon features like original
    moon.rotation.x = Math.PI * 0.02;
    moon.rotation.y = Math.PI * 1.54;
    
    scene.add(moon);
    moonRef.current = moon;
    
    // Enhanced starfield with better visibility
    const worldGeometry = new THREE.SphereGeometry(1500, 64, 64);
    const worldMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: starfieldTexture,
      side: THREE.BackSide,
      transparent: false,
      opacity: 1.0
    });
    
    const world = new THREE.Mesh(worldGeometry, worldMaterial);
    scene.add(world);
    worldRef.current = world;
    
    // Realistic lighting setup
    const ambientLight = new THREE.AmbientLight(0x0f0f23, 0.05);
    scene.add(ambientLight);
    
    // Main sun light (more realistic sun lighting)
    const sunLight = new THREE.DirectionalLight(0xffffff, 4);
    sunLight.position.set(25, 15, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 8192;
    sunLight.shadow.mapSize.height = 8192;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.bias = -0.00001;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);
    
    // Subtle blue fill light for space ambiance
    const spaceLight = new THREE.DirectionalLight(0x6699ff, 0.15);
    spaceLight.position.set(-15, -10, -15);
    scene.add(spaceLight);
    
    // Rim lighting for dramatic effect
    const rimLight = new THREE.PointLight(0x88aaff, 0.8, 100, 2);
    rimLight.position.set(8, 12, 15);
    scene.add(rimLight);
    
    // Enhanced Orbit Controls
    class OrbitControls {
      constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Settings
        this.enabled = true;
        this.target = new THREE.Vector3(0, 0, 0);
        
        // Limits
        this.minDistance = 6;
        this.maxDistance = 80;
        this.minPolarAngle = 0;
        this.maxPolarAngle = Math.PI;
        
        // Interaction
        this.enableDamping = true;
        this.dampingFactor = 0.05;
        this.enableZoom = true;
        this.zoomSpeed = 1.0;
        this.enableRotate = true;
        this.rotateSpeed = 1.0;
        this.enablePan = false;
        
        // Internal state
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();
        this.scale = 1;
        this.panOffset = new THREE.Vector3();
        
        // Mouse state
        this.rotateStart = new THREE.Vector2();
        this.rotateEnd = new THREE.Vector2();
        this.rotateDelta = new THREE.Vector2();
        
        this.zoomStart = new THREE.Vector2();
        this.zoomEnd = new THREE.Vector2();
        this.zoomDelta = new THREE.Vector2();
        
        this.state = 'NONE';
        this.STATES = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_PAN: 4, TOUCH_DOLLY_PAN: 5, TOUCH_DOLLY_ROTATE: 6 };
        
        // Initialize
        this.update();
        this.setupEventListeners();
      }
      
      setupEventListeners() {
        this.domElement.addEventListener('contextmenu', this.onContextMenu.bind(this));
        this.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.domElement.addEventListener('pointercancel', this.onPointerUp.bind(this));
        this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
      }
      
      onPointerDown(event) {
        if (!this.enabled) return;
        
        switch (event.pointerType) {
          case 'mouse':
          case 'pen':
            this.onMouseDown(event);
            break;
          default:
            this.onTouchStart(event);
            break;
        }
      }
      
      onMouseDown(event) {
        let mouseAction;
        
        switch (event.button) {
          case 0:
            mouseAction = this.STATES.ROTATE;
            break;
          case 1:
            mouseAction = this.STATES.DOLLY;
            break;
          case 2:
            mouseAction = this.STATES.PAN;
            break;
          default:
            mouseAction = this.STATES.NONE;
        }
        
        if (mouseAction !== this.STATES.NONE) {
          this.handleMouseDownRotate(event);
          this.state = mouseAction;
          this.domElement.style.cursor = 'grabbing';
          
          this.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
          this.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));
        }
      }
      
      onPointerMove(event) {
        if (!this.enabled) return;
        
        switch (event.pointerType) {
          case 'mouse':
          case 'pen':
            this.onMouseMove(event);
            break;
          default:
            this.onTouchMove(event);
            break;
        }
      }
      
      onMouseMove(event) {
        if (this.state === this.STATES.ROTATE) {
          this.handleMouseMoveRotate(event);
        }
      }
      
      onPointerUp() {
        this.domElement.removeEventListener('pointermove', this.onPointerMove.bind(this));
        this.domElement.removeEventListener('pointerup', this.onPointerUp.bind(this));
        
        this.domElement.style.cursor = 'grab';
        this.state = this.STATES.NONE;
      }
      
      onMouseWheel(event) {
        if (!this.enabled || !this.enableZoom) return;
        
        event.preventDefault();
        this.handleMouseWheel(event);
        this.update();
      }
      
      onTouchStart(event) {
        // Touch handling for mobile
        if (event.touches.length === 1) {
          this.handleMouseDownRotate(event.touches[0]);
          this.state = this.STATES.TOUCH_ROTATE;
        } else if (event.touches.length === 2) {
          this.handleTouchStartDolly(event);
          this.state = this.STATES.TOUCH_DOLLY_ROTATE;
        }
        
        this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
      }
      
      onTouchMove(event) {
        event.preventDefault();
        
        if (event.touches.length === 1 && this.state === this.STATES.TOUCH_ROTATE) {
          this.handleMouseMoveRotate(event.touches[0]);
        } else if (event.touches.length === 2 && this.state === this.STATES.TOUCH_DOLLY_ROTATE) {
          this.handleTouchMoveDolly(event);
        }
      }
      
      onTouchEnd() {
        this.domElement.removeEventListener('touchmove', this.onTouchMove.bind(this));
        this.domElement.removeEventListener('touchend', this.onTouchEnd.bind(this));
        this.state = this.STATES.NONE;
      }
      
      handleMouseDownRotate(event) {
        this.rotateStart.set(event.clientX, event.clientY);
      }
      
      handleMouseMoveRotate(event) {
        this.rotateEnd.set(event.clientX, event.clientY);
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);
        
        const element = this.domElement;
        
        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight);
        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);
        
        this.rotateStart.copy(this.rotateEnd);
        this.update();
      }
      
      handleMouseWheel(event) {
        if (event.deltaY < 0) {
          this.dollyOut(this.getZoomScale());
        } else if (event.deltaY > 0) {
          this.dollyIn(this.getZoomScale());
        }
      }
      
      handleTouchStartDolly(event) {
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.dollyStart.set(0, distance);
      }
      
      handleTouchMoveDolly(event) {
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.dollyEnd.set(0, distance);
        this.dollyDelta.set(0, Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed));
        
        this.dollyIn(this.dollyDelta.y);
        this.dollyStart.copy(this.dollyEnd);
        this.update();
      }
      
      rotateLeft(angle) {
        this.sphericalDelta.theta -= angle;
      }
      
      rotateUp(angle) {
        this.sphericalDelta.phi -= angle;
      }
      
      dollyOut(dollyScale) {
        this.scale /= dollyScale;
      }
      
      dollyIn(dollyScale) {
        this.scale *= dollyScale;
      }
      
      getZoomScale() {
        return Math.pow(0.95, this.zoomSpeed);
      }
      
      update() {
        const offset = new THREE.Vector3();
        const quat = new THREE.Quaternion().setFromUnitVectors(this.camera.up, new THREE.Vector3(0, 1, 0));
        const quatInverse = quat.clone().invert();
        
        const position = this.camera.position;
        
        offset.copy(position).sub(this.target);
        offset.applyQuaternion(quat);
        
        this.spherical.setFromVector3(offset);
        
        if (this.enableDamping) {
          this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
          this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
        } else {
          this.spherical.theta += this.sphericalDelta.theta;
          this.spherical.phi += this.sphericalDelta.phi;
        }
        
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
        this.spherical.makeSafe();
        this.spherical.radius *= this.scale;
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
        
        offset.setFromSpherical(this.spherical);
        offset.applyQuaternion(quatInverse);
        
        position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
        
        if (this.enableDamping) {
          this.sphericalDelta.theta *= (1 - this.dampingFactor);
          this.sphericalDelta.phi *= (1 - this.dampingFactor);
        } else {
          this.sphericalDelta.set(0, 0, 0);
        }
        
        this.scale = 1;
        this.panOffset.set(0, 0, 0);
        
        return false;
      }
      
      onContextMenu(event) {
        if (!this.enabled) return;
        event.preventDefault();
      }
      
      dispose() {
        this.domElement.removeEventListener('contextmenu', this.onContextMenu);
        this.domElement.removeEventListener('pointerdown', this.onPointerDown);
        this.domElement.removeEventListener('pointercancel', this.onPointerUp);
        this.domElement.removeEventListener('wheel', this.onMouseWheel);
      }
    }
    
    // Initialize camera and controls
    camera.position.set(0, 5, 20);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 60;
    orbitControlsRef.current = controls;
    
    // Set cursor
    canvas.style.cursor = 'grab';
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (!isJourneyStarted.current && orbitControlsRef.current) {
        orbitControlsRef.current.update();
      }
      
      // Realistic moon rotation (synchronized with Earth's moon)
      if (moonRef.current) {
        moonRef.current.rotation.y += 0.0005;
      }
      
      // Very subtle starfield rotation
      if (worldRef.current) {
        worldRef.current.rotation.y += 0.00002;
        worldRef.current.rotation.x += 0.00001;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    // NEW: Moon Zoom Journey Function
    const startMoonZoomJourney = () => {
      if (isJourneyStarted.current) return;
      
      isJourneyStarted.current = true;
      setIsZoomingToMoon(true);
      canvas.style.cursor = 'default';
      controls.enabled = false; // Disable controls during zoom
      
      const startPosition = camera.position.clone();
      const startRotation = camera.rotation.clone();
      
      // Target position - very close to moon surface
      const targetPosition = new THREE.Vector3(0, 0, 4.2); // Just above moon surface
      
      const duration = 4000; // 4 seconds zoom
      const startTime = Date.now();
      
      const animateZoom = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing with acceleration at the end (like diving into the moon)
        const easeProgress = progress < 0.7 
          ? 2 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // Interpolate camera position
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        camera.lookAt(0, 0, 0);
        
        // Add slight rotation effect during zoom for more dynamic feel
        const rotationIntensity = Math.sin(progress * Math.PI * 2) * 0.02;
        camera.rotation.z = startRotation.z + rotationIntensity;
        
        // Add screen shake effect in the last 20% of zoom
        if (progress > 0.8) {
          const shakeIntensity = (progress - 0.8) * 5;
          const shakeX = (Math.random() - 0.5) * shakeIntensity * 0.001;
          const shakeY = (Math.random() - 0.5) * shakeIntensity * 0.001;
          camera.position.x += shakeX;
          camera.position.y += shakeY;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateZoom);
        } else {
          // Zoom complete - trigger SpaceJourney
          setTimeout(() => {
            setIsZoomingToMoon(false);
            if (onZoomComplete) {
              onZoomComplete(); // This will start SpaceJourney
            }
          }, 500); // Small delay before starting SpaceJourney
        }
      };
      
      animateZoom();
    };
    
    // Enhanced journey animation (keeping the original for reference)
    const startJourney = () => {
      isJourneyStarted.current = true;
      canvas.style.cursor = 'default';
      
      const startPosition = camera.position.clone();
      const targetPosition = new THREE.Vector3(0, 2, 8);
      const duration = 5000;
      const startTime = Date.now();
      
      const animateJourney = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing with anticipation
        const easeProgress = progress < 0.5 
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        camera.lookAt(0, 0, 0);
        
        if (progress < 1) {
          requestAnimationFrame(animateJourney);
        } else {
          setTimeout(() => {
            // Return journey
            const returnDuration = 4000;
            const returnStartTime = Date.now();
            const returnStartPos = camera.position.clone();
            
            const animateReturn = () => {
              const returnElapsed = Date.now() - returnStartTime;
              const returnProgress = Math.min(returnElapsed / returnDuration, 1);
              const returnEase = 1 - Math.pow(1 - returnProgress, 2);
              
              camera.position.lerpVectors(returnStartPos, startPosition, returnEase);
              camera.lookAt(0, 0, 0);
              
              if (returnProgress < 1) {
                requestAnimationFrame(animateReturn);
              } else {
                isJourneyStarted.current = false;
                canvas.style.cursor = 'grab';
                controls.enabled = true;
                controls.update();
              }
            };
            
            animateReturn();
          }, 2500);
        }
      };
      
      animateJourney();
    };
    
    window.addEventListener('resize', onResize);
    
    // Store scene reference with new zoom function
    sceneRef.current = { 
      scene, 
      renderer, 
      camera, 
      controls,
      startJourney,
      startMoonZoomJourney, // NEW: Add zoom journey function
      moon,
      world
    };
    
    // Journey event listeners
    const handleJourneyStart = () => {
      if (sceneRef.current) {
        sceneRef.current.startJourney();
      }
    };

    const handleMoonZoomStart = () => {
      if (sceneRef.current) {
        sceneRef.current.startMoonZoomJourney();
      }
    };
    
    window.addEventListener('startMoonJourney', handleJourneyStart);
    window.addEventListener('startMoonZoom', handleMoonZoomStart);
    
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('startMoonJourney', handleJourneyStart);
      window.removeEventListener('startMoonZoom', handleMoonZoomStart);
      
      if (controls) {
        controls.dispose();
      }
      if (renderer) {
        renderer.dispose();
      }
      if (moonGeometry) {
        moonGeometry.dispose();
      }
      if (moonMaterial) {
        moonMaterial.dispose();
      }
      if (worldGeometry) {
        worldGeometry.dispose();
      }
      if (worldMaterial) {
        worldMaterial.dispose();
      }
    };
  }, [onZoomComplete]);

  return (
    <div className="fixed inset-0 z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Enhanced UI - Hide during zoom */}
      {!isZooming && !isZoomingToMoon && (
        <div className="absolute top-6 left-6 text-white z-10 bg-black/40 rounded-xl p-4 backdrop-blur-md border border-white/10">
          <div className="text-sm font-medium space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🖱️</span>
              <span>Drag to orbit around moon</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">🔄</span>
              <span>Scroll to zoom in/out</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">📱</span>
              <span>Touch controls supported</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Journey Button - Hide during zoom */}
      {!isZooming && !isZoomingToMoon && (
        <button
          onClick={() => {
            // Changed to trigger moon zoom instead of regular journey
            window.dispatchEvent(new CustomEvent('startMoonZoom'));
          }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 group"
        >
          <div className="px-10 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white font-bold text-lg rounded-full shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-blue-500/30 backdrop-blur-sm border border-blue-400/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative flex items-center gap-3">
              🚀 <span>Begin Your Journey</span> 🌙
            </span>
          </div>
        </button>
      )}

      {/* Zoom Status Overlay */}
      {isZoomingToMoon && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-black/70 text-white px-8 py-4 rounded-xl backdrop-blur-md border border-blue-400/30 text-center">
              <div className="text-xl font-bold mb-2">🚀 Approaching Moon Surface...</div>
              <div className="text-sm text-blue-300">Preparing for lunar descent</div>
            </div>
          </div>
          
          {/* Zoom effect overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20"></div>
        </div>
      )}
      
      {/* Atmospheric Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-blue-900/5 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-purple-900/5 to-transparent"></div>
        <div className="absolute top-1/2 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

export default BackgroundCanvas;