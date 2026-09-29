import { Component, Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import F1Car3D from './F1Car3D'
import { buildRibbonVertices } from './trackGeometry3d'

// Suspense only catches pending promises, not the error useGLTF throws when
// a model fails to load (404/CORS/corrupt asset) — without this boundary
// that error propagates past Suspense and unmounts the whole app, not just
// the track map. Scoped to just the cars so a bad model load only costs the
// car markers, not the ribbon or the rest of the Overview tab.
class CarModelErrorBoundary extends Component {
    state = { hasError: false }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error) {
        console.error('F1Car3D failed to render (model load likely failed):', error)
    }

    render() {
        return this.state.hasError ? null : this.props.children
    }
}

function TrackRibbon({ points }) {
    const geometry = useMemo(() => {
        const vertices = buildRibbonVertices(points)
        if (vertices.length === 0) return null
        const geom = new THREE.BufferGeometry()
        geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
        geom.computeVertexNormals()
        return geom
    }, [points])

    if (!geometry) return null
    return (
        <mesh geometry={geometry}>
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
            <CarModelErrorBoundary>
                <Suspense fallback={null}>
                    {carPositions.map(d => (
                        <F1Car3D
                            key={d.id}
                            position={d.scenePosition}
                            heading={d.heading}
                            pitch={d.pitch}
                            color={d.color}
                            selected={d.selected}
                            onClick={() => onSelectDriver(d.id)}
                        />
                    ))}
                </Suspense>
            </CarModelErrorBoundary>
            <OrbitControls enablePan minDistance={4} maxDistance={32} maxPolarAngle={Math.PI / 2 - 0.05} />
        </Canvas>
    )
}
