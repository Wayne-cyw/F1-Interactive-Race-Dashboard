import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

function DriftingCamera() {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime()
    camera.position.x = Math.sin(t * 0.033) * 12
    camera.position.y = Math.cos(t * 0.021) * 5 + 3
    camera.position.z = 30
    camera.lookAt(0, 0, 0)
  })
  return null
}

function FloatingParticles() {
  const ref = useRef()
  const count = 80

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60
      velocities[i * 3]     = (Math.random() - 0.5) * 0.008
      velocities[i * 3 + 1] = Math.random() * 0.004 + 0.002
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.008
    }
    return { positions, velocities }
  }, [])

  useFrame(() => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i * 3]     += velocities[i * 3]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]
      // wrap particles back when they drift too far
      if (pos[i * 3 + 1] > 20) pos[i * 3 + 1] = -15
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#FF6600"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}

export default function Background3D() {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      camera={{ position: [0, 3, 30], fov: 60 }}
      gl={{ antialias: false, alpha: false }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={['#000005']} />
      <ambientLight intensity={0.1} />
      <Stars
        radius={120}
        depth={60}
        count={6000}
        factor={4}
        saturation={0.3}
        fade
      />
      <FloatingParticles />
      <DriftingCamera />
    </Canvas>
  )
}
