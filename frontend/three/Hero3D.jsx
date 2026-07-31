import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// Hardcoded oval track points — no API call needed, purely decorative
const TRACK_POINTS = [
    [0, 0, 0], [4, 0, -6], [10, 0, -10], [18, 0, -12], [24, 0, -10],
    [28, 0, -4], [26, 0, 4], [20, 0, 8], [14, 0, 6], [8, 0, 2],
    [2, 0, 0], [-4, 0, 2], [-10, 0, 6], [-16, 0, 8], [-22, 0, 4],
    [-26, 0, -2], [-24, 0, -8], [-18, 0, -12], [-12, 0, -10], [-6, 0, -6],
]

function TrackLine() {
    const curve = useMemo(() => {
        const pts = TRACK_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z))
        return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5)
    }, [])

    const points = useMemo(() => curve.getPoints(200), [curve])

    const geometry = useMemo(() => {
        return new THREE.BufferGeometry().setFromPoints(points)
    }, [points])

    return (
        <line geometry={geometry}>
            <lineBasicMaterial color="#1e2535" linewidth={1} />
        </line>
    )
}

function GlowingCars({ count = 4 }) {
    const meshRefs = useRef([])
    const offsetsRef = useRef(
        Array.from({ length: count }, (_, i) => i / count)
    )

    const curve = useMemo(() => {
        const pts = TRACK_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z))
        return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5)
    }, [])

    const colors = ['#00D4FF', '#10B981', '#F59E0B', '#EF4444']

    useFrame((_, delta) => {
        for (let i = 0; i < count; i++) {
            offsetsRef.current[i] = (offsetsRef.current[i] + delta * 0.055) % 1
            const mesh = meshRefs.current[i]
            if (!mesh) continue
            const pos = curve.getPoint(offsetsRef.current[i])
            mesh.position.set(pos.x, pos.y + 0.35, pos.z)
        }
    })

    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <mesh key={i} ref={el => { meshRefs.current[i] = el }}>
                    <sphereGeometry args={[0.45, 8, 8]} />
                    <meshStandardMaterial
                        color={colors[i % colors.length]}
                        emissive={colors[i % colors.length]}
                        emissiveIntensity={3}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </>
    )
}

function Scene() {
    return (
        <>
            <ambientLight intensity={0.05} />
            <TrackLine />
            <GlowingCars count={4} />
            <EffectComposer>
                <Bloom
                    intensity={2.2}
                    luminanceThreshold={0.1}
                    luminanceSmoothing={0.6}
                    mipmapBlur
                />
            </EffectComposer>
        </>
    )
}

export default function Hero3D() {
    return (
        <div
            style={{
                width: '100%',
                height: '180px',
                pointerEvents: 'none',
                userSelect: 'none',
                marginBottom: '-20px',
            }}
        >
            <Canvas
                camera={{ position: [0, 28, 0], fov: 50, up: [0, 0, -1] }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    )
}
