import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Sphere, Cloud as DreiCloud } from '@react-three/drei';
import * as THREE from 'three';
import type { WeatherData } from '@/lib/weather';

/**
 * Premium 3D weather scene rendered with React Three Fiber.
 * Adapts visuals to current condition (Clear / Cloudy / Rain / Snow / Thunder).
 * Designed to be lightweight on mobile — single Canvas, low-poly geometry,
 * dpr capped, no shadows, no postprocessing.
 */

type Props = {
  weather: WeatherData;
  /** Pointer parallax 0..1 from parent for depth effect */
  parallax?: { x: number; y: number };
};

function Sun() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={ref} position={[0.6, 0.2, 0]}>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshStandardMaterial
          color="#e8b75a"
          emissive="#d49533"
          emissiveIntensity={0.55}
          roughness={0.35}
          metalness={0.85}
        />
      </mesh>
      {/* Halo */}
      <mesh position={[0.6, 0.2, -0.1]}>
        <ringGeometry args={[1.25, 1.45, 64]} />
        <meshBasicMaterial color="#f3d488" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </Float>
  );
}

function Clouds({ heavy = false }: { heavy?: boolean }) {
  return (
    <group>
      <Float speed={0.6} floatIntensity={0.4}>
        <DreiCloud position={[-1.4, 0.4, 0]} speed={0.2} opacity={heavy ? 0.85 : 0.55} segments={20} bounds={[2, 1, 1]} color="#fdf6ea" />
      </Float>
      <Float speed={0.4} floatIntensity={0.5}>
        <DreiCloud position={[1.2, -0.4, -0.5]} speed={0.15} opacity={heavy ? 0.75 : 0.45} segments={18} bounds={[2.2, 0.9, 1]} color="#f8ecd4" />
      </Float>
      {heavy && (
        <Float speed={0.3} floatIntensity={0.3}>
          <DreiCloud position={[0, 0.6, -1]} speed={0.1} opacity={0.7} segments={16} bounds={[2.5, 1, 1]} color="#efe2c4" />
        </Float>
      )}
    </group>
  );
}

function Rain({ count = 80 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 5;
      arr[i * 3 + 1] = Math.random() * 3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return arr;
  }, [count]);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const a = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] -= 0.04;
      if (a[i * 3 + 1] < -1.5) a[i * 3 + 1] = 2.5;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#c9b88a" size={0.04} transparent opacity={0.7} />
    </points>
  );
}

function Snow({ count = 60 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 5;
      arr[i * 3 + 1] = Math.random() * 3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const a = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] -= 0.008;
      a[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.002;
      if (a[i * 3 + 1] < -1.5) a[i * 3 + 1] = 2.5;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#fdf6ea" size={0.06} transparent opacity={0.9} />
    </points>
  );
}

function Moon() {
  return (
    <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.5}>
      <Sphere args={[1, 32, 32]} position={[0.6, 0.2, 0]}>
        <meshStandardMaterial color="#f3e4c4" emissive="#9c8757" emissiveIntensity={0.25} roughness={0.6} />
      </Sphere>
    </Float>
  );
}

function Scene({ weather }: { weather: WeatherData }) {
  const c = weather.condition.toLowerCase();
  const isNight = (() => {
    const h = new Date().getHours();
    return h < 6 || h >= 19;
  })();

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 4, 2]} intensity={1.1} color="#f3d488" />
      <pointLight position={[-2, -1, 2]} intensity={0.6} color="#a83b52" />

      {c.includes('thunder') && (
        <>
          <Clouds heavy />
          <Rain count={110} />
          <pointLight position={[0, 1, 1]} intensity={2.2} color="#ffe9a8" distance={5} />
        </>
      )}
      {(c.includes('rain') || c.includes('drizzle')) && (
        <>
          <Clouds heavy />
          <Rain count={80} />
        </>
      )}
      {c.includes('snow') && (
        <>
          <Clouds />
          <Snow />
        </>
      )}
      {c.includes('fog') && <Clouds heavy />}
      {(c.includes('cloud') && !c.includes('partly')) && <Clouds heavy />}
      {c.includes('partly') && (
        <>
          {isNight ? <Moon /> : <Sun />}
          <Clouds />
        </>
      )}
      {(c === 'clear' || c.includes('clear')) && (isNight ? <Moon /> : <Sun />)}

      <Environment preset="sunset" />
    </>
  );
}

export default function WeatherHero3D({ weather, parallax = { x: 0, y: 0 } }: Props) {
  return (
    <div
      className="absolute inset-0 transition-transform duration-300 ease-out"
      style={{
        transform: `translate3d(${parallax.x * 12}px, ${parallax.y * 8}px, 0)`,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene weather={weather} />
        </Suspense>
      </Canvas>
    </div>
  );
}
