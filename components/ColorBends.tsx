import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const fragmentShader = `
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_time;
  varying vec2 v_uv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // 2D Noise based on Morgan McGuire @morgan3d
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = v_uv;
    float time = u_time * 0.1;

    // Create a moving, warped coordinate system
    vec2 p = uv * 2.0 - 1.0;
    p.x *= 1.2; 
    
    // Animate the noise field
    float n = noise(p * 2.0 + time * 0.5);
    
    // Create flowing patterns
    float flow = sin(p.y * 4.0 + n * 2.0 + time) * 0.5 + 0.5;

    // Mix colors based on the flow pattern
    vec3 color = mix(u_color1, u_color2, smoothstep(0.3, 0.7, flow));
    color = mix(color, u_color3, noise(p * 3.0 - time * 0.3));

    gl_FragColor = vec4(color, 1.0);
  }
`;

const vertexShader = `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface ShaderBackgroundProps {
  isDarkMode: boolean;
}

const ShaderBackground: React.FC<ShaderBackgroundProps> = ({ isDarkMode }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Define colors based on theme
    const lightColors = {
      color1: new THREE.Color('#f3e8ff'), // Light Lavender
      color2: new THREE.Color('#dbeafe'), // Light Sky Blue
      color3: new THREE.Color('#ffedd5')  // Light Peach
    };
    const darkColors = {
      color1: new THREE.Color('#1e1b4b'), // Deep Indigo
      color2: new THREE.Color('#4a044e'), // Deep Magenta
      color3: new THREE.Color('#164e63')  // Deep Teal
    };
    
    const colors = isDarkMode ? darkColors : lightColors;

    // Shader material
    const uniforms = {
      u_time: { value: 0.0 },
      u_color1: { value: colors.color1 },
      u_color2: { value: colors.color2 },
      u_color3: { value: colors.color3 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Handle resize
    const handleResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [isDarkMode]);

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-full h-full" />;
};

export default ShaderBackground;
