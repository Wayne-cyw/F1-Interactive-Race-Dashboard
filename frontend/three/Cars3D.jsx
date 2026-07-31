import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useTrackCurve } from './TrackContext'

const FORWARD = new THREE.Vector3(0, 0, 1)
const _tangent = new THREE.Vector3()
const _quat = new THREE.Quaternion()

function computeT(driver, index, sessionData, currentLap, progress) {
    const driverLaps = sessionData.laps?.filter(l => l.driver === driver.driver) || []
    const currentLapData = driverLaps.find(l => l.lap_number === currentLap)
    const prevLapData = driverLaps.find(l => l.lap_number === currentLap - 1)
    const position = currentLapData?.position || prevLapData?.position || (index + 1)

    const effectiveLap = currentLap - 1 + progress
    const totalLaps = sessionData.total_laps || 50
    const baseProgress = effectiveLap / totalLaps
    const spread = (position - 1) * 0.015
    return { t: (baseProgress + spread) % 1, position }
}

function CarMesh({ driver, index, sessionData, currentLap, progress, prevPositions, onAlert, onSelect, isSelected }) {
    const ctx = useTrackCurve()
    const meshRef = useRef()
    const lightRef = useRef()

    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: driver.team_color || '#ffffff',
        emissive: driver.team_color || '#ffffff',
        emissiveIntensity: 1.6,
        roughness: 0.2,
        metalness: 0.8,
    }), [driver.team_color])

    useFrame(() => {
        if (!ctx?.curve || !meshRef.current) return
        const { t, position } = computeT(driver, index, sessionData, currentLap, progress)

        const pos = ctx.curve.getPoint(t)
        meshRef.current.position.copy(pos)
        if (lightRef.current) lightRef.current.position.copy(pos)

        // Orient car along track tangent
        ctx.curve.getTangentAt(t, _tangent)
        _quat.setFromUnitVectors(FORWARD, _tangent.normalize())
        meshRef.current.quaternion.copy(_quat)

        // Overtake detection
        const prev = prevPositions.current[driver.driver]
        if (prev !== undefined && prev !== position && position < prev && onAlert) {
            onAlert(`${driver.driver} overtakes for P${position}!`, 'overtake')
        }
        prevPositions.current[driver.driver] = position
    })

    const color = driver.team_color || '#ffffff'

    return (
        <group>
            {/* Car body */}
            <mesh
                ref={meshRef}
                material={material}
                onClick={(e) => { e.stopPropagation(); onSelect(driver.driver) }}
                onPointerEnter={() => (document.body.style.cursor = 'pointer')}
                onPointerLeave={() => (document.body.style.cursor = 'auto')}
            >
                <capsuleGeometry args={[0.12, 0.38, 4, 8]} />
            </mesh>

            {/* Glow light */}
            <pointLight ref={lightRef} color={color} intensity={1.2} distance={4} decay={2} />

            {/* Driver label — Billboard keeps it facing camera */}
            <Billboard position={[0, 0, 0]}>
                <Text
                    fontSize={0.22}
                    color={isSelected ? '#FFBA08' : color}
                    anchorX="center"
                    anchorY="bottom"
                    outlineWidth={0.015}
                    outlineColor="#000000"
                >
                    {driver.driver}
                </Text>
            </Billboard>
        </group>
    )
}

export default function Cars3D({ sessionData, currentLap, progress, selectedDriver, onDriverSelect, prevPositions, onAlert }) {
    if (!sessionData?.results) return null

    return (
        <>
            {sessionData.results.map((driver, index) => (
                <CarMesh
                    key={driver.driver}
                    driver={driver}
                    index={index}
                    sessionData={sessionData}
                    currentLap={currentLap}
                    progress={progress}
                    prevPositions={prevPositions}
                    onAlert={onAlert}
                    onSelect={onDriverSelect}
                    isSelected={selectedDriver === driver.driver}
                />
            ))}
        </>
    )
}
