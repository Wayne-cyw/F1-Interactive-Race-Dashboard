import { useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { API_URL } from '../utils/helpers'
import { TrackContext } from './TrackContext'

function buildCurve(coordinates) {
    // Normalize coordinates to ±20 scene units
    const xs = coordinates.map(c => c.x)
    const ys = coordinates.map(c => c.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    const scale = 40 / Math.max(rangeX, rangeY)

    const points = coordinates.map(c => new THREE.Vector3(
        (c.x - minX - rangeX / 2) * scale,
        0,
        (c.y - minY - rangeY / 2) * scale
    ))
    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5)
}

function TrackMesh({ curve, coordinateCount }) {
    const trackGeo = useMemo(() =>
        new THREE.TubeGeometry(curve, coordinateCount * 3, 0.55, 8, true),
        [curve, coordinateCount]
    )
    const centerLineGeo = useMemo(() =>
        new THREE.TubeGeometry(curve, coordinateCount * 3, 0.04, 6, true),
        [curve, coordinateCount]
    )

    // Start/Finish line
    const sfPos = curve.getPoint(0)
    const sfTangent = curve.getTangent(0)
    const sfAngle = Math.atan2(sfTangent.x, sfTangent.z)

    // Spotlight positions — 8 evenly spaced
    const spotlights = useMemo(() => (
        Array.from({ length: 8 }, (_, i) => curve.getPoint(i / 8))
    ), [curve])

    return (
        <>
            {/* Main track surface */}
            <mesh geometry={trackGeo}>
                <meshStandardMaterial color="#1c1c1c" roughness={0.95} metalness={0} />
            </mesh>

            {/* Asphalt sheen layer */}
            <mesh geometry={trackGeo}>
                <meshStandardMaterial
                    color="#2a2a2a"
                    roughness={0.7}
                    metalness={0.05}
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* White center line */}
            <mesh geometry={centerLineGeo}>
                <meshStandardMaterial
                    color="#e0e0e0"
                    emissive="#aaaaaa"
                    emissiveIntensity={0.25}
                    roughness={0.6}
                />
            </mesh>

            {/* Start/Finish stripe */}
            <mesh
                position={[sfPos.x, 0.02, sfPos.z]}
                rotation={[0, sfAngle, 0]}
            >
                <planeGeometry args={[1.4, 0.18]} />
                <meshStandardMaterial
                    color="#FFBA08"
                    emissive="#FFBA08"
                    emissiveIntensity={0.9}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Night-race spotlights */}
            {spotlights.map((pos, i) => (
                <spotLight
                    key={i}
                    position={[pos.x, 9, pos.z]}
                    target-position={[pos.x, 0, pos.z]}
                    intensity={80}
                    angle={Math.PI / 7}
                    penumbra={0.4}
                    distance={22}
                    color="#fff5e0"
                    castShadow={false}
                />
            ))}

            {/* Ambient fill */}
            <ambientLight intensity={0.08} />
            <hemisphereLight skyColor="#0a0a1a" groundColor="#000000" intensity={0.3} />
        </>
    )
}

export default function Track3D({ year, race, children }) {
    const [trackData, setTrackData] = useState(null)

    useEffect(() => {
        if (!year || !race) return
        fetch(`${API_URL}/track/${year}/${race}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.coordinates?.length > 2) {
                    setTrackData(data)
                }
            })
            .catch(err => console.error('Track fetch error:', err))
    }, [year, race])

    const curve = useMemo(() => {
        if (!trackData?.coordinates?.length) return null
        return buildCurve(trackData.coordinates)
    }, [trackData])

    if (!curve) return null

    return (
        <TrackContext.Provider value={{ curve, coordinateCount: trackData.coordinates.length }}>
            <TrackMesh curve={curve} coordinateCount={trackData.coordinates.length} />
            {children}
        </TrackContext.Provider>
    )
}
