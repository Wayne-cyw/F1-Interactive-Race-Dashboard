import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = '/models/mcl35m.glb'
useGLTF.preload(MODEL_URL)

// The source model is ~5.68m long (real-world meters, Z-forward, Y-up).
// Scaled up well past true-to-track scale for visibility, same rationale
// as the rest of the 3D map (see trackGeometry3d.js's elevation
// exaggeration).
const MODEL_SCALE = 0.13
// The model's length runs along local +Z; our heading convention treats
// local +X as "forward" (see OverviewTab.jsx's heading calculation), so
// the nose is rotated onto +X once, independent of the live heading spin.
const MODEL_FORWARD_OFFSET = Math.PI / 2
const HIT_TARGET_RADIUS = 0.2
// The model's own origin isn't at wheel-height — its lowest vertex (the
// wheels) sits below the origin. Without compensating for that gap the car
// visually sinks into the track. GROUND_CLEARANCE is the extra lift on top
// of that compensation, so the wheels rest slightly above the ribbon
// surface rather than exactly on it (avoids z-fighting). The gap itself
// (modelMinY, below) is measured from the loaded model's actual bounding
// box at runtime rather than hardcoded, so it stays correct if the model
// asset is ever swapped or re-exported at a different scale.
const GROUND_CLEARANCE = 0.15

// How quickly the car's rendered heading eases toward its target heading,
// in units of "fraction of the gap closed per second" — higher is
// snappier, lower is smoother. Framerate-independent via delta time.
const ROTATION_SMOOTHING_RATE = 10

// Materials named here are the car's body/livery — recolored to the
// driver's team color. Everything else (wheels, tires, steering wheel)
// keeps the source model's own textured material.
const BODY_MATERIAL_NAMES = new Set(['mcl35m_m_png', 'mcl35m_png', 'mcl35m_c_png', 'mcl35m_h_png'])

// A real (heavily decimated, ~4k triangle) F1 car model, recolored per
// team by cloning and tinting only its body materials — wheels/tires keep
// their own textures. `heading` (radians, world Y rotation) is the car's
// target direction of travel; the rendered rotation eases toward it every
// frame rather than snapping, so turns look smooth. Positioned with its
// wheels resting on `position` (the track surface height at this point).
export default function F1Car3D({ position, heading, color, selected, onClick }) {
    const { scene } = useGLTF(MODEL_URL)

    const modelMinY = useMemo(() => new THREE.Box3().setFromObject(scene).min.y, [scene])
    const groundLift = -modelMinY + GROUND_CLEARANCE

    const carScene = useMemo(() => {
        const clone = scene.clone(true)
        let recoloredCount = 0
        clone.traverse(child => {
            if (child.isMesh && BODY_MATERIAL_NAMES.has(child.material.name)) {
                child.material = child.material.clone()
                child.material.color.set(color)
                recoloredCount++
            }
        })
        if (recoloredCount === 0 && import.meta.env.DEV) {
            console.warn(`F1Car3D: no body materials matched BODY_MATERIAL_NAMES — cars will render in the model's default color, not team colors. Check ${MODEL_URL}'s material names still match.`)
        }
        return clone
    }, [scene, color])

    // Only the body materials above were actually cloned (scene.clone(true)
    // deep-clones the Object3D graph but reference-shares materials by
    // default) — the same BODY_MATERIAL_NAMES check identifies exactly
    // those clones, so disposal here doesn't touch the wheel/tire materials
    // still shared with the cached source model. Without this, repeatedly
    // mounting/unmounting a car (e.g. scrubbing across a DNF reveal point)
    // leaks a tinted material/GPU program per cycle.
    useEffect(() => {
        return () => {
            carScene.traverse(child => {
                if (child.isMesh && BODY_MATERIAL_NAMES.has(child.material.name)) {
                    child.material.dispose()
                }
            })
        }
    }, [carScene])

    const groupRef = useRef()
    const headingRef = useRef(heading ?? 0)

    useFrame((_, delta) => {
        if (!groupRef.current) return
        const current = headingRef.current
        const target = heading ?? 0
        const diff = ((target - current + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI
        const next = current + diff * (1 - Math.exp(-ROTATION_SMOOTHING_RATE * delta))
        headingRef.current = next
        groupRef.current.rotation.y = next
    })

    const scale = MODEL_SCALE * (selected ? 1.25 : 1)

    return (
        <group
            ref={groupRef}
            position={[position.x, position.y + groundLift * scale, position.z]}
            onClick={onClick}
        >
            <mesh>
                <sphereGeometry args={[HIT_TARGET_RADIUS, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {selected && (
                <mesh position={[0, (modelMinY - 0.02) * scale, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[scale * 3, scale * 3.6, 32]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
                </mesh>
            )}

            <primitive object={carScene} scale={scale} rotation={[0, MODEL_FORWARD_OFFSET, 0]} />
        </group>
    )
}
