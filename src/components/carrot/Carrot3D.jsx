import * as THREE from 'three';

export const createCarrot3D = (position, type) => {
  const carrotGroup = new THREE.Group();
  
  // Carrot body (cone shape) - Larger and more visible
  const bodyGeometry = new THREE.ConeGeometry(0.4, 1.5, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xFF8C00, // Orange color
    roughness: 0.6,
    metalness: 0.2,
    emissive: 0xFF6B35,
    emissiveIntensity: 0.5
  });
  
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  body.rotation.x = Math.PI / 2; // Point upward
  carrotGroup.add(body);
  
  // Carrot leaves/greens at top - Larger and more visible
  const leafGeometry = new THREE.ConeGeometry(0.35, 0.8, 8);
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x228B22, // Forest green
    roughness: 0.7,
    metalness: 0.0,
    emissive: 0x114411,
    emissiveIntensity: 0.2
  });
  
  // Create multiple leaf clusters
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.castShadow = true;
    const angle = (i / 3) * Math.PI * 2;
    leaf.position.set(
      Math.cos(angle) * 0.2,
      0.9,
      Math.sin(angle) * 0.2
    );
    leaf.rotation.z = angle + Math.PI / 4;
    carrotGroup.add(leaf);
  }
  
  // Add glow effect using pointlight - Brighter
  const glowLight = new THREE.PointLight(0xFF8C00, 1.0, 5);
  glowLight.position.y = 0.5;
  carrotGroup.add(glowLight);
  
  // Position the carrot in 3D space
  carrotGroup.position.set(position.x, position.y, position.z);
  carrotGroup.userData = {
    type: type,
    isCarrot: true,
    collisionRadius: 2.5, // Larger collision radius for easier detection
    originalPosition: { x: position.x, y: position.y, z: position.z }
  };
  
  // Animation state
  carrotGroup.userData.rotation = 0;
  carrotGroup.userData.bob = 0;
  
  return carrotGroup;
};

export const updateCarrotAnimation = (carrot, time) => {
  if (!carrot.userData.isCarrot) return;
  
  // Rotate carrot
  carrot.userData.rotation += 0.02;
  carrot.rotation.y = carrot.userData.rotation;
  
  // Bob up and down
  carrot.userData.bob = Math.sin(time * 0.003) * 0.3;
  carrot.position.y = carrot.userData.originalPosition.y + carrot.userData.bob;
};