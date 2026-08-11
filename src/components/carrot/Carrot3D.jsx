import * as THREE from 'three';

export const createCarrot3D = (position, type) => {
  const carrotGroup = new THREE.Group();

  // Carrot body - a real carrot silhouette (pointed tip, swelling shoulder,
  // subtle growth-ring ridges) built by revolving a profile curve, instead
  // of a plain straight-sided cone.
  const profile = [
    [0.005, 0.00],
    [0.05, 0.05],
    [0.09, 0.10],
    [0.085, 0.15], // ridge dip
    [0.13, 0.20],
    [0.15, 0.28],
    [0.19, 0.35],
    [0.18, 0.42], // ridge dip
    [0.23, 0.50],
    [0.27, 0.60],
    [0.255, 0.68], // ridge dip
    [0.31, 0.78],
    [0.35, 0.90],
    [0.34, 1.00], // ridge dip
    [0.385, 1.10],
    [0.41, 1.22], // widest point - shoulder
    [0.39, 1.32],
    [0.33, 1.42],
    [0.27, 1.50]  // crown, where the greens emerge
  ].map(([r, y]) => new THREE.Vector2(r, y));

  const bodyGeometry = new THREE.LatheGeometry(profile, 14);
  bodyGeometry.translate(0, -0.75, 0); // center like the old cone (tip down, crown up)
  bodyGeometry.computeVertexNormals();

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
  // No extra rotation needed - the lathe already runs tip-down, crown-up.
  carrotGroup.add(body);

  // Carrot leaves/greens fanning out from the crown
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x228B22, // Forest green
    roughness: 0.7,
    metalness: 0.0,
    emissive: 0x114411,
    emissiveIntensity: 0.2
  });

  // Irregular fan of thin blade-like leaves instead of identical cones
  const leafCount = 6;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2 + (i % 2 === 0 ? 0.15 : -0.1);
    const length = 0.65 + (i % 3) * 0.12;
    const leafGeometry = new THREE.ConeGeometry(0.05, length, 6);
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.castShadow = true;
    leaf.position.set(
      Math.cos(angle) * 0.1,
      0.78 + length / 2 - 0.1,
      Math.sin(angle) * 0.1
    );
    const outwardTilt = 0.35 + (i % 2) * 0.15;
    leaf.rotation.set(
      Math.sin(angle) * outwardTilt,
      angle,
      Math.cos(angle) * outwardTilt
    );
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