// src/components/Moon.jsx
import * as THREE from 'three';
import moonTexture from '../assets/moon.jpg';

// Function to load the moon texture
const loadMoonTexture = () => {
  const loader = new THREE.TextureLoader();
  return loader.load(
    moonTexture,
    // onLoad callback
    (texture) => {
      console.log('Moon texture loaded successfully');
    },
    // onProgress callback
    (progress) => {
      console.log('Loading progress:', progress);
    },
    // onError callback
    (error) => {
      console.error('Error loading moon texture:', error);
    }
  );
};

export default loadMoonTexture;