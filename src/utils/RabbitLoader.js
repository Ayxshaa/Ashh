// RabbitLoader.js - Separate utility for loading your rabbit model
import * as THREE from 'three';

// You'll need to import GLTFLoader in your main project
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class RabbitLoader {
  constructor() {
    this.loader = null;
    this.rabbitModel = null;
    this.fallbackModel = null;
  }

  // Initialize the loader (call this in your main component)
  async initLoader() {
    try {
      // In your actual project, uncomment this:
      // this.loader = new GLTFLoader();
      console.log('GLTFLoader initialized');
      return true;
    } catch (error) {
      console.warn('GLTFLoader not available, will use fallback');
      return false;
    }
  }

  // Create fallback rabbit model
  createFallbackRabbit(scene) {
    const rabbitGroup = new THREE.Group();
    
    // Materials
    const whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const pinkMaterial = new THREE.MeshLambertMaterial({ color: 0xffaaaa });
    const blackMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const body = new THREE.Mesh(bodyGeometry, whiteMaterial);
    body.position.y = 0.5;
    body.scale.set(1, 1.2, 1);
    body.castShadow = true;
    rabbitGroup.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const head = new THREE.Mesh(headGeometry, whiteMaterial);
    head.position.set(0, 1.5, 0.3);
    head.castShadow = true;
    rabbitGroup.add(head);
    
    // Ears
    const earGeometry = new THREE.SphereGeometry(0.15, 8, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
    
    const leftEar = new THREE.Mesh(earGeometry, whiteMaterial);
    leftEar.position.set(-0.25, 2.1, 0.1);
    leftEar.rotation.z = -0.2;
    leftEar.scale.set(1, 2, 0.5);
    leftEar.castShadow = true;
    rabbitGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, whiteMaterial);
    rightEar.position.set(0.25, 2.1, 0.1);
    rightEar.rotation.z = 0.2;
    rightEar.scale.set(1, 2, 0.5);
    rightEar.castShadow = true;
    rabbitGroup.add(rightEar);
    
    // Inner ears
    const innerEarGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const leftInnerEar = new THREE.Mesh(innerEarGeometry, pinkMaterial);
    leftInnerEar.position.set(-0.25, 2.0, 0.2);
    leftInnerEar.scale.set(1, 1.5, 0.5);
    rabbitGroup.add(leftInnerEar);
    
    const rightInnerEar = new THREE.Mesh(innerEarGeometry, pinkMaterial);
    rightInnerEar.position.set(0.25, 2.0, 0.2);
    rightInnerEar.scale.set(1, 1.5, 0.5);
    rabbitGroup.add(rightInnerEar);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeometry, blackMaterial);
    leftEye.position.set(-0.2, 1.6, 0.8);
    rabbitGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, blackMaterial);
    rightEye.position.set(0.2, 1.6, 0.8);
    rabbitGroup.add(rightEye);
    
    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.03, 6, 6);
    const nose = new THREE.Mesh(noseGeometry, pinkMaterial);
    nose.position.set(0, 1.4, 0.9);
    rabbitGroup.add(nose);
    
    // Tail
    const tailGeometry = new THREE.SphereGeometry(0.18, 8, 8);
    const tail = new THREE.Mesh(tailGeometry, whiteMaterial);
    tail.position.set(0, 0.8, -0.8);
    tail.castShadow = true;
    rabbitGroup.add(tail);
    
    // Front paws
    const pawGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const leftPaw = new THREE.Mesh(pawGeometry, whiteMaterial);
    leftPaw.position.set(-0.4, 0.1, 0.6);
    leftPaw.scale.set(1, 0.6, 1.5);
    leftPaw.castShadow = true;
    rabbitGroup.add(leftPaw);
    
    const rightPaw = new THREE.Mesh(pawGeometry, whiteMaterial);
    rightPaw.position.set(0.4, 0.1, 0.6);
    rightPaw.scale.set(1, 0.6, 1.5);
    rightPaw.castShadow = true;
    rabbitGroup.add(rightPaw);
    
    // Back legs
    const legGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const leftLeg = new THREE.Mesh(legGeometry, whiteMaterial);
    leftLeg.position.set(-0.3, 0.15, -0.2);
    leftLeg.scale.set(0.8, 0.7, 2);
    leftLeg.castShadow = true;
    rabbitGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, whiteMaterial);
    rightLeg.position.set(0.3, 0.15, -0.2);
    rightLeg.scale.set(0.8, 0.7, 2);
    rightLeg.castShadow = true;
    rabbitGroup.add(rightLeg);
    
    // Store references for animation
    this.fallbackModel = {
      group: rabbitGroup,
      body,
      head,
      leftEar,
      rightEar,
      tail,
      leftPaw,
      rightPaw,
      leftLeg,
      rightLeg
    };
    
    return rabbitGroup;
  }

  // Load GLTF rabbit model
  async loadRabbitModel(scene) {
    const paths = [
      '/models/rabbit.gltf',
      '/models/rabbit.glb',
      '/assets/rabbit.gltf',
      '/assets/rabbit.glb',
      './rabbit.gltf',
      './rabbit.glb'
    ];

    if (this.loader) {
      for (const path of paths) {
        try {
          console.log(`Attempting to load rabbit from: ${path}`);
          
          const gltf = await new Promise((resolve, reject) => {
            this.loader.load(
              path,
              (gltf) => resolve(gltf),
              (progress) => console.log('Loading progress:', progress),
              (error) => reject(error)
            );
          });
          
          const rabbit = gltf.scene;
          rabbit.scale.set(2, 2, 2); // Adjust scale as needed
          rabbit.position.set(0, 0, 0);
          
          // Enable shadows
          rabbit.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              
              // Ensure materials are suitable for lunar environment
              if (node.material) {
                node.material.needsUpdate = true;
              }
            }
          });
          
          this.rabbitModel = {
            group: rabbit,
            gltf: gltf
          };
          
          console.log('GLTF rabbit loaded successfully!');
          return rabbit;
          
        } catch (error) {
          console.log(`Failed to load from ${path}:`, error.message);
          continue;
        }
      }
    }
    
    // Fallback to procedural rabbit
    console.log('Using fallback procedural rabbit');
    return this.createFallbackRabbit(scene);
  }

  // Animate the rabbit (works for both GLTF and fallback)
  animateRabbit(time, hopAnimation) {
    if (this.rabbitModel && this.rabbitModel.group) {
      // GLTF model animations
      const rabbit = this.rabbitModel.group;
      
      // Basic hopping animation for GLTF model
      rabbit.position.y = Math.abs(Math.sin(hopAnimation)) * 2;
      rabbit.rotation.y += Math.sin(hopAnimation) * 0.005;
      
    } else if (this.fallbackModel) {
      // Fallback model animations
      const { leftEar, rightEar, tail, body, head } = this.fallbackModel;
      
      // Ear wiggling
      const earWiggle = time * 0.1;
      leftEar.rotation.x = Math.sin(earWiggle) * 0.1;
      rightEar.rotation.x = Math.sin(earWiggle + 0.5) * 0.1;
      
      // Tail wagging
      tail.rotation.x = Math.sin(hopAnimation * 3) * 0.2;
      tail.rotation.y = Math.sin(hopAnimation * 2) * 0.1;
      
      // Body bobbing
      body.position.y = 0.5 + Math.sin(hopAnimation * 2) * 0.05;
      head.position.y = 1.5 + Math.sin(hopAnimation * 2) * 0.05;
      
      // Subtle breathing
      body.scale.x = 1 + Math.sin(time * 0.05) * 0.02;
      body.scale.z = 1 + Math.sin(time * 0.05) * 0.02;
    }
  }
}

// Usage example:
/*
// In your main component:
const rabbitLoader = new RabbitLoader();

// In useEffect:
const loadRabbit = async () => {
  await rabbitLoader.initLoader();
  const rabbitGroup = await rabbitLoader.loadRabbitModel(scene);
  rabbitGroup.position.set(2, 0, 5);
  scene.add(rabbitGroup);
};

// In animation loop:
rabbitLoader.animateRabbit(time, hopAnimation);
*/