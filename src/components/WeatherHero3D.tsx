import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Sphere, Cloud as DreiCloud, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { WeatherData } from '@/lib/weather';

/**
 * Premium 3D weather scene rendered with React Three Fiber.
 * Adapts to current condition and time-of-day (day / dusk / night) with
 * smoothly interpolated lighting + materials. Lightweight on mobile.
 */

type Props = {
  weather: WeatherData;
  parallax?: { x: number; y: number };
  /** 0 = full day, 1 = full night. Smooth transitions between scenes. */
  nightness?: number;
};

function lerpColor(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t).getStyle();
}

function Sun({ nightness }: { nightness: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15;
  });
  // Sun fades to a deep amber at dusk, near-invisible at full night
  const opacity = 1 - nightness;
  if (opacity < 0.05) return null;
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={ref} position={[0.6, 0.2, 0]}>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshStandardMaterial
          color={lerpColor('#e8b75a', '#a8553a', nightness)}
          emissive={lerpColor('#d49533', '#7a3a26', nightness)}
          emissiveIntensity={0.55 * opacity + 0.1}
          roughness={0.35}
          metalness={0.85}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.6, 0.2, -0.1]}>
        <ringGeometry args={[1.25, 1.45, 64]} />
        <meshBasicMaterial color="#f3d488" transparent opacity={0.25 * opacity} side={THREE.DoubleSide} />
      </mesh>
    </Float>
  );
}

function Moon({ nightness }: { nightness: number }) {
  const opacity = nightness;
  if (opacity < 0.05) return null;
  return (
    <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.5}>
      <Sphere args={[1, 32, 32]} position={[0.6, 0.2, 0]}>
        <meshStandardMaterial
          color="#f3e4c4"
          emissive="#c0a36b"
          emissiveIntensity={0.35 * opacity}
          roughness={0.6}
          transparent
          opacity={opacity}
        />
      </Sphere>
      {/* Soft moon halo */}
      <mesh position={[0.6, 0.2, -0.05]}>
        <ringGeometry args={[1.2, 1.55, 64]} />
        <meshBasicMaterial color="#e9d8aa" transparent opacity={0.18 * opacity} side={THREE.DoubleSide} />
      </mesh>
    </Float>
  );
}

function Clouds({ heavy = false, nightness = 0 }: { heavy?: boolean; nightness?: number }) {
  // Clouds go from warm cream by day to a dusky violet-grey at night
  const dayColor = '#fdf6ea';
  const nightColor = '#7d6f8c';
  const altDay = '#f8ecd4';
  const altNight = '#6a5e7a';
  const heavyDay = '#efe2c4';
  const heavyNight = '#574c66';

  const opacityShift = nightness * 0.15;
  return (
    <group>
      <Float speed={0.6} floatIntensity={0.4}>
        <DreiCloud position={[-1.4, 0.4, 0]} speed={0.2} opacity={(heavy ? 0.85 : 0.55) - opacityShift} segments={20} bounds={[2, 1, 1]} color={lerpColor(dayColor, nightColor, nightness)} />
      </Float>
      <Float speed={0.4} floatIntensity={0.5}>
        <DreiCloud position={[1.2, -0.4, -0.5]} speed={0.15} opacity={(heavy ? 0.75 : 0.45) - opacityShift} segments={18} bounds={[2.2, 0.9, 1]} color={lerpColor(altDay, altNight, nightness)} />
      </Float>
      {heavy && (
        <Float speed={0.3} floatIntensity={0.3}>
          <DreiCloud position={[0, 0.6, -1]} speed={0.1} opacity={0.7 - opacityShift} segments={16} bounds={[2.5, 1, 1]} color={lerpColor(heavyDay, heavyNight, nightness)} />
        </Float>
      )}
    </group>
  );
}

function Rain({ count = 80, nightness = 0 }: { count?: number; nightness?: number }) {
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
      <pointsMaterial color={lerpColor('#c9b88a', '#7c8aa8', nightness)} size={0.04} transparent opacity={0.7} />
    </points>
  );
}

function Snow({ count = 60, nightness = 0 }: { count?: number; nightness?: number }) {
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
      <pointsMaterial color={lerpColor('#fdf6ea', '#dce6ff', nightness)} size={0.06} transparent opacity={0.9} />
    </points>
  );
}

function Scene({ weather, nightness }: { weather: WeatherData; nightness: number }) {
  const c = weather.condition.toLowerCase();

  // Lights crossfade between warm gold (day) and cool moonlight (night)
  const dirColor = lerpColor('#f3d488', '#9bb8e8', nightness);
  const dirIntensity = 1.1 - nightness * 0.55; // dimmer at night
  const rimColor = lerpColor('#a83b52', '#3a2d5e', nightness);
  const ambientIntensity = 0.65 - nightness * 0.25;
  const isClear = c === 'clear' || c.includes('clear');
  const showCelestial = isClear || c.includes('partly');

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight position={[3, 4, 2]} intensity={dirIntensity} color={dirColor} />
      <pointLight position={[-2, -1, 2]} intensity={0.6} color={rimColor} />

      {/* Stars only meaningfully visible at night */}
      {nightness > 0.2 && (
        <Stars
          radius={20}
          depth={20}
          count={Math.round(120 * nightness)}
          factor={2.5}
          saturation={0}
          fade
          speed={0.4}
        />
      )}

      {c.includes('thunder') && (
        <>
          <Clouds heavy nightness={nightness} />
          <Rain count={110} nightness={nightness} />
          <pointLight position={[0, 1, 1]} intensity={2.2} color="#ffe9a8" distance={5} />
        </>
      )}
      {(c.includes('rain') || c.includes('drizzle')) && (
        <>
          <Clouds heavy nightness={nightness} />
          <Rain count={80} nightness={nightness} />
        </>
      )}
      {c.includes('snow') && (
        <>
          <Clouds nightness={nightness} />
          <Snow nightness={nightness} />
        </>
      )}
      {c.includes('fog') && <Clouds heavy nightness={nightness} />}
      {(c.includes('cloud') && !c.includes('partly')) && <Clouds heavy nightness={nightness} />}
      {showCelestial && (
        <>
          <Sun nightness={nightness} />
          <Moon nightness={nightness} />
          {c.includes('partly') && <Clouds nightness={nightness} />}
        </>
      )}

      {/* Environment shifts from sunset (warm) to night (cool) */}
      <Environment preset={nightness > 0.5 ? 'night' : 'sunset'} />
    </>
  );
}

export default function WeatherHero3D({ weather, parallax = { x: 0, y: 0 }, nightness = 0 }: Props) {
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
          <Scene weather={weather} nightness={nightness} />
        </Suspense>
      </Canvas>
    </div>
  );
}
