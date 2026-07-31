import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useTrackCurve } from './TrackContext'

const _pos = new THREE.Vector3()
const _target = new THREE.Vector3()

// Five cinematic positions evenly spaced around the track
const CINEMATIC_T = [0.1, 0.28, 0.46, 0.64, 0.82]
const CINEMATIC_INTERVAL = 8 // seconds per angle

export default function CameraController({ mode, selectedDriver, sessionData, currentLap, progress }) {
    const ctx = useTrackCurve()
    const { camera } = useThree()
    const orbitRef = useRef()

    // Disable orbit controls when not in OVERVIEW mode
    useEffect(() => {
        if (orbitRef.current) {
            orbitRef.current.enabled = mode === 'OVERVIEW'
        }
    }, [mode])

    useFrame(({ clock }) => {
        if (!ctx?.curve) return

        if (mode === 'FOLLOW' && selectedDriver && sessionData?.results) {
            const driverResult = sessionData.results.find(r => r.driver === selectedDriver)
            const idx = sessionData.results.indexOf(driverResult)
            if (idx === -1 || !driverResult) return

            const driverLaps = sessionData.laps?.filter(l => l.driver === selectedDriver) || []
            const currentLapData = driverLaps.find(l => l.lap_number === currentLap)
            const prevLapData = driverLaps.find(l => l.lap_number === currentLap - 1)
            const position = currentLapData?.position || prevLapData?.position || (idx + 1)

            const effectiveLap = currentLap - 1 + progress
            const totalLaps = sessionData.total_laps || 50
            const t = ((effectiveLap / totalLaps) + (position - 1) * 0.015) % 1

            const carPos = ctx.curve.getPoint(t)
            const tangent = ctx.curve.getTangent(t)

            // Chase cam: behind and above car
            _pos.copy(carPos).addScaledVector(tangent, -4).setY(2.5)
            camera.position.lerp(_pos, 0.06)
            _target.copy(carPos).setY(0.5)
            camera.lookAt(_target)

        } else if (mode === 'CINEMATIC') {
            const elapsed = clock.getElapsedTime()
            const cycleIndex = Math.floor(elapsed / CINEMATIC_INTERVAL) % CINEMATIC_T.length
            const nextIndex = (cycleIndex + 1) % CINEMATIC_T.length
            const cycleFrac = (elapsed % CINEMATIC_INTERVAL) / CINEMATIC_INTERVAL
            // Ease in/out with smoothstep
            const eased = cycleFrac * cycleFrac * (3 - 2 * cycleFrac)

            const fromT = CINEMATIC_T[cycleIndex]
            const toT = CINEMATIC_T[nextIndex]

            const from = ctx.curve.getPoint(fromT)
            const to = ctx.curve.getPoint(toT)

            // Offset cameras outward and up from the track
            const fromTangent = ctx.curve.getTangent(fromT)
            const toTangent = ctx.curve.getTangent(toT)
            const fromOrtho = new THREE.Vector3(-fromTangent.z, 0, fromTangent.x)
            const toOrtho = new THREE.Vector3(-toTangent.z, 0, toTangent.x)

            const camFrom = from.clone().addScaledVector(fromOrtho, 10).setY(6)
            const camTo = to.clone().addScaledVector(toOrtho, 10).setY(6)

            _pos.lerpVectors(camFrom, camTo, eased)
            camera.position.lerp(_pos, 0.04)

            // Always look at track center
            const trackCenter = ctx.curve.getPoint(0.5)
            camera.lookAt(trackCenter)
        }
    })

    // Center for OrbitControls target
    const trackCenter = ctx?.curve?.getPoint(0.5) ?? new THREE.Vector3(0, 0, 0)

    return (
        <OrbitControls
            ref={orbitRef}
            enabled={mode === 'OVERVIEW'}
            target={[trackCenter.x, trackCenter.y, trackCenter.z]}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={10}
            maxDistance={90}
            enableDamping
            dampingFactor={0.08}
        />
    )
}
