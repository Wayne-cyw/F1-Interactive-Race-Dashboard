import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import F1Car3D from './F1Car3D'
import { buildRibbonVertices } from './trackMap3d'

function TrackRibbon({ points }) {
    const vertices = useMemo(() => buildRibbonVertices(points), [points])
    if (vertices.length === 0) return null
    return (
        <mesh>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" array={vertices} count={vertices.length / 3} itemSize={3} />
            </bufferGeometry>
            <meshStandardMaterial color="#e3e0d8" side={THREE.DoubleSide} />
        </mesh>
    )
}

export default function TrackMap3D({ trackPoints, carPositions, onSelectDriver }) {
    return (
        <Canvas camera={{ position: [14, 12, 14], fov: 50 }} style={{ width: '100%', height: '100%', display: 'block' }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 15, 5]} intensity={0.9} />
            <TrackRibbon points={trackPoints} />
            {carPositions.map(d => (
                <F1Car3D
                    key={d.id}
                    position={d.scenePosition}
                    color={d.color}
                    selected={d.selected}
                    onClick={() => onSelectDriver(d.id)}
                />
            ))}
            <OrbitControls enablePan={false} minDistance={4} maxDistance={32} />
        </Canvas>
    )
}
