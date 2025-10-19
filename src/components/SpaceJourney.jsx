import React, { useEffect, useRef, useState } from 'react';

const SpaceJourney = ({ onComplete }) => {
  const containerRef = useRef(null);
  const [phase, setPhase] = useState('acceleration');
  const [progress, setProgress] = useState(0);
  const timeRef = useRef(0);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (window.THREE) {
      initScene();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/88/three.min.js';
      script.async = true;
      script.onload = () => {
        setTimeout(initScene, 100);
      };
      document.head.appendChild(script);
    }

    const initScene = () => {
      const THREE = window.THREE;
      if (!THREE || !containerRef.current) return;

      const container = containerRef.current;
      container.innerHTML = '';

      let camera, scene, renderer, uniforms, rtTexture, rtTexture2;
      let newmouse = { x: 0, y: 0 };
      const divisor = 1 / 8;
      const textureFraction = 1 / 1;

      const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`;

      const fragmentShader = `
        uniform vec2 u_resolution;
        uniform vec4 u_mouse;
        uniform float u_time;
        uniform sampler2D u_noise;
        uniform sampler2D u_buffer;
        uniform bool u_renderpass;
        uniform int u_frame;
        
        #define PI 3.141592653589793
        #define TAU 6.283185307179586
        
        const float multiplier = 25.5;
        const float zoomSpeed = 3.;
        const int layers = 5;
        
        mat2 rotate2d(float _angle){
          return mat2(cos(_angle), sin(_angle), -sin(_angle), cos(_angle));
        }

        vec2 hash2(vec2 p) {
          vec2 o = texture2D(u_noise, (p+0.5)/256.0, -100.0).xy;
          return o;
        }
        
        vec3 hsb2rgb(in vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
          rgb = rgb*rgb*(3.0-2.0*rgb);
          return c.z * mix(vec3(1.0), rgb, c.y);
        }
        
        vec3 render(vec2 uv, float scale) {
          vec2 id = floor(uv);
          vec2 subuv = fract(uv);
          vec2 rand = hash2(id);
          float bokeh = abs(scale) * 1.;
          float particle = 0.;
          
          if(length(rand) > 1.3) {
            vec2 pos = subuv - .5;
            float field = length(pos);
            particle = smoothstep(.7, 0., field);
            particle += smoothstep(.2, 0.2 * bokeh, field);
          }
          return vec3(particle*2.);
        }
        
        vec3 renderLayer(int layer, int layers, vec2 uv, inout float opacity) {
          vec2 _uv = uv;
          float scale = mod((u_time + zoomSpeed / float(layers) * float(layer)) / zoomSpeed, -1.);
          uv *= 20.;
          uv *= scale*scale;
          uv = rotate2d(u_time / 10.) * uv;
          uv += vec2(25. + sin(u_time*.1)*.2) * float(layer);

          vec3 pass = render(uv * multiplier, scale) * .2;
          opacity = 1. + scale;
          float _opacity = opacity;
          float endOpacity = smoothstep(0., 0.4, scale * -1.);
          opacity += endOpacity;

          return pass * _opacity * endOpacity;
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
          vec2 sample = gl_FragCoord.xy / u_resolution.xy;
          vec4 fragcolour;
          
          if(u_renderpass == true) {
            if(u_frame > 5) {
              fragcolour = texture2D(u_buffer, sample) * 6.;
            }
            uv *= rotate2d(u_time*.5);
            float opacity = 1.;
            float opacity_sum = 1.;

            for(int i = 1; i <= layers; i++) {
              fragcolour += clamp(vec4(renderLayer(i, layers, uv, opacity), 1.) * 5., 0., 5.);
              opacity_sum += opacity;
            }

            fragcolour *= 1./opacity_sum;
          } else {
            fragcolour = texture2D(u_buffer, sample) * 5.;
          }
          
          gl_FragColor = fragcolour;
        }
      `;

      // Load noise texture
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        'https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/noise.png',
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.minFilter = THREE.LinearFilter;
          setupScene(texture);
        },
        undefined,
        () => {
          // Fallback if texture fails to load
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          const imageData = ctx.createImageData(256, 256);
          for (let i = 0; i < imageData.data.length; i++) {
            imageData.data[i] = Math.random() * 255;
          }
          ctx.putImageData(imageData, 0, 0);
          const fallbackTexture = new THREE.CanvasTexture(canvas);
          fallbackTexture.wrapS = THREE.RepeatWrapping;
          fallbackTexture.wrapT = THREE.RepeatWrapping;
          setupScene(fallbackTexture);
        }
      );

      const setupScene = (texture) => {
        camera = new THREE.Camera();
        camera.position.z = 1;

        scene = new THREE.Scene();

        const geometry = new THREE.PlaneGeometry(2, 2);

        const w = window.innerWidth;
        const h = window.innerHeight;

        rtTexture = new THREE.WebGLRenderTarget(w * textureFraction, h * textureFraction);
        rtTexture2 = new THREE.WebGLRenderTarget(w * textureFraction, h * textureFraction);

        uniforms = {
          u_time: { type: 'f', value: 1.0 },
          u_resolution: { type: 'v2', value: new THREE.Vector2() },
          u_noise: { type: 't', value: texture },
          u_buffer: { type: 't', value: rtTexture.texture },
          u_mouse: { type: 'v4', value: new THREE.Vector4() },
          u_frame: { type: 'i', value: -1 },
          u_renderpass: { type: 'b', value: false }
        };

        const material = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: vertexShader,
          fragmentShader: fragmentShader
        });
        material.extensions.derivatives = true;

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        container.appendChild(renderer.domElement);
        sceneRef.current = { scene, camera, renderer, uniforms, rtTexture, rtTexture2 };

        onWindowResize();
        window.addEventListener('resize', onWindowResize);

        document.addEventListener('pointermove', (e) => {
          const ratio = window.innerHeight / window.innerWidth;
          if (window.innerHeight > window.innerWidth) {
            newmouse.x = (e.pageX - window.innerWidth / 2) / window.innerWidth;
            newmouse.y = (e.pageY - window.innerHeight / 2) / window.innerHeight * -1 * ratio;
          } else {
            newmouse.x = (e.pageX - window.innerWidth / 2) / window.innerWidth / ratio;
            newmouse.y = (e.pageY - window.innerHeight / 2) / window.innerHeight * -1;
          }
        });

        animate();
      };

      const onWindowResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        renderer.setSize(w, h);
        uniforms.u_resolution.value.x = renderer.domElement.width;
        uniforms.u_resolution.value.y = renderer.domElement.height;
        uniforms.u_frame.value = 0;

        rtTexture = new THREE.WebGLRenderTarget(w * textureFraction, h * textureFraction);
        rtTexture2 = new THREE.WebGLRenderTarget(w * textureFraction, h * textureFraction);
        if (sceneRef.current) {
          sceneRef.current.rtTexture = rtTexture;
          sceneRef.current.rtTexture2 = rtTexture2;
        }
      };

      const renderTexture = () => {
        const odims = uniforms.u_resolution.value.clone();
        uniforms.u_resolution.value.x = window.innerWidth * textureFraction;
        uniforms.u_resolution.value.y = window.innerHeight * textureFraction;

        uniforms.u_buffer.value = rtTexture2.texture;
        uniforms.u_renderpass.value = true;

        renderer.setRenderTarget(rtTexture);
        renderer.render(scene, camera, rtTexture, true);

        const buffer = rtTexture;
        rtTexture = rtTexture2;
        rtTexture2 = buffer;

        uniforms.u_buffer.value = rtTexture.texture;
        uniforms.u_resolution.value = odims;
        uniforms.u_renderpass.value = false;
      };

      const animate = () => {
        timeRef.current += 0.016;
        const t = timeRef.current;
        setProgress(Math.min(t / 8, 1));

        let shaderTime = 0;

        if (t < 2) {
          // Acceleration phase: stars start slow
          setPhase('acceleration');
          shaderTime = (t / 2) * 1.5; // Smooth start from 0
        } else if (t < 4.5) {
          // Warp phase: maximum speed
          setPhase('warp');
          shaderTime = 1.5 + ((t - 2) / 2.5) * 2.5; // Fast acceleration
        } else if (t < 6.5) {
          // Approach phase: maintain high speed
          setPhase('approach');
          shaderTime = 4 + ((t - 4.5) / 2) * 1.5; // Continue at high speed
        } else if (t < 8) {
          // Landing phase: gradual deceleration but still moving forward
          setPhase('landing');
          shaderTime = 5.5 + ((t - 6.5) / 1.5) * 0.8; // Slow but continuous motion
        } else {
          if (onComplete) onComplete();
          window.removeEventListener('resize', onWindowResize);
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
          return;
        }

        uniforms.u_frame.value++;
        uniforms.u_mouse.value.x += (newmouse.x - uniforms.u_mouse.value.x) * divisor;
        uniforms.u_mouse.value.y += (newmouse.y - uniforms.u_mouse.value.y) * divisor;
        uniforms.u_time.value = shaderTime;

        renderer.render(scene, camera);
        renderTexture();

        requestAnimationFrame(animate);
      };
    };

    return () => {
      if (sceneRef.current) {
        sceneRef.current.renderer.dispose();
      }
    };
  }, [onComplete]);

  const getPhaseText = () => {
    switch (phase) {
      case 'acceleration':
        return 'Initiating Launch Sequence...';
      case 'warp':
        return 'Entering Hyperspace...';
      case 'approach':
        return 'Approaching Lunar Orbit...';
      case 'landing':
        return 'Preparing for Landing...';
      default:
        return '';
    }
  };

  const getSpeedText = () => {
    const speedKmh = Math.floor(progress * 40000);
    return speedKmh > 0 ? `${speedKmh.toLocaleString()} km/h` : '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ position: 'fixed', top: 0, left: 0, touchAction: 'none' }}
      />

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top HUD */}
        <div className="absolute top-8 left-8 text-white font-mono">
          <div className="bg-black/50 p-4 rounded-lg border border-blue-400/30 backdrop-blur-sm">
            <div className="text-blue-300 text-sm mb-2">LUNAR MISSION CONTROL</div>
            <div className="text-lg font-bold">{getPhaseText()}</div>
            {getSpeedText() && (
              <div className="text-green-300 mt-2">Speed: {getSpeedText()}</div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="bg-black/50 p-4 rounded-lg border border-blue-400/30 backdrop-blur-sm">
            <div className="text-white text-sm mb-2">Mission Progress</div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 to-purple-500 h-full rounded-full transition-all duration-100 relative"
                style={{ width: `${progress * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
            <div className="text-right text-xs text-gray-300 mt-1">
              {Math.floor(progress * 100)}% Complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceJourney;