const SIZE_SCALE = 2.2

const BODY_LENGTH = 0.34
const BODY_WIDTH = 0.14
const BODY_HEIGHT = 0.06
const NOSE_LENGTH = 0.16
const NOSE_RADIUS = 0.045
const HALO_RADIUS = 0.05
const WING_WIDTH = 0.16
const FRONT_WING_WIDTH = 0.24
const ENDPLATE_HEIGHT = 0.06
const WHEEL_RADIUS = 0.045
const WHEEL_WIDTH = 0.05
const HIT_TARGET_RADIUS = 0.5

const WHEEL_POSITIONS = [
    [BODY_LENGTH / 2 - 0.05, -BODY_HEIGHT / 2, BODY_WIDTH / 2],
    [BODY_LENGTH / 2 - 0.05, -BODY_HEIGHT / 2, -BODY_WIDTH / 2],
    [-BODY_LENGTH / 2 + 0.05, -BODY_HEIGHT / 2, BODY_WIDTH / 2],
    [-BODY_LENGTH / 2 + 0.05, -BODY_HEIGHT / 2, -BODY_WIDTH / 2],
]

// A stylized, more detailed F1-car silhouette — not a licensed or
// team-accurate model — with a nose cone, halo, sidepods, front/rear
// wings with endplates, and four wheels. `heading` (radians, world Y
// rotation) points the car's nose along its direction of travel.
// Positioned with its wheels resting on `position` (the track surface
// height at this point), tinted with the driver's team color. A larger
// fully-transparent hit-target sits underneath so the car stays easy to
// click at any zoom level, without visually growing beyond the model.
export default function F1Car3D({ position, heading, color, selected, onClick }) {
    const scale = SIZE_SCALE * (selected ? 1.25 : 1)
    return (
        <group
            position={[position.x, position.y + (BODY_HEIGHT / 2) * scale, position.z]}
            rotation={[0, heading ?? 0, 0]}
            onClick={onClick}
        >
            <mesh>
                <sphereGeometry args={[HIT_TARGET_RADIUS, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <group scale={scale}>
                {selected && (
                    <mesh position={[0, -BODY_HEIGHT / 2 - 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[BODY_LENGTH * 0.6, BODY_LENGTH * 0.72, 32]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
                    </mesh>
                )}

                {/* main tub */}
                <mesh>
                    <boxGeometry args={[BODY_LENGTH, BODY_HEIGHT, BODY_WIDTH]} />
                    <meshStandardMaterial color={color} />
                </mesh>

                {/* nose cone, tapering forward along +X */}
                <mesh position={[BODY_LENGTH / 2 + NOSE_LENGTH / 2 - 0.03, -BODY_HEIGHT * 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <cylinderGeometry args={[0.006, NOSE_RADIUS, NOSE_LENGTH, 10]} />
                    <meshStandardMaterial color={color} />
                </mesh>

                {/* halo */}
                <mesh position={[0.01, BODY_HEIGHT * 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <torusGeometry args={[HALO_RADIUS, 0.007, 8, 16, Math.PI]} />
                    <meshStandardMaterial color="#1a1a1a" />
                </mesh>

                {/* sidepods */}
                <mesh position={[-0.02, -BODY_HEIGHT * 0.1, BODY_WIDTH * 0.62]}>
                    <boxGeometry args={[BODY_LENGTH * 0.42, BODY_HEIGHT * 0.7, BODY_WIDTH * 0.22]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[-0.02, -BODY_HEIGHT * 0.1, -BODY_WIDTH * 0.62]}>
                    <boxGeometry args={[BODY_LENGTH * 0.42, BODY_HEIGHT * 0.7, BODY_WIDTH * 0.22]} />
                    <meshStandardMaterial color={color} />
                </mesh>

                {/* front wing + endplates */}
                <mesh position={[BODY_LENGTH / 2 + 0.02, -BODY_HEIGHT * 0.35, 0]}>
                    <boxGeometry args={[0.03, BODY_HEIGHT * 0.25, FRONT_WING_WIDTH]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[BODY_LENGTH / 2 + 0.02, -BODY_HEIGHT * 0.15, FRONT_WING_WIDTH / 2]}>
                    <boxGeometry args={[0.03, ENDPLATE_HEIGHT, 0.01]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[BODY_LENGTH / 2 + 0.02, -BODY_HEIGHT * 0.15, -FRONT_WING_WIDTH / 2]}>
                    <boxGeometry args={[0.03, ENDPLATE_HEIGHT, 0.01]} />
                    <meshStandardMaterial color={color} />
                </mesh>

                {/* rear wing + endplates */}
                <mesh position={[-BODY_LENGTH / 2 + 0.03, BODY_HEIGHT * 0.6, 0]}>
                    <boxGeometry args={[0.06, BODY_HEIGHT * 0.5, WING_WIDTH]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[-BODY_LENGTH / 2 + 0.03, BODY_HEIGHT * 0.35, WING_WIDTH / 2]}>
                    <boxGeometry args={[0.06, ENDPLATE_HEIGHT, 0.01]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[-BODY_LENGTH / 2 + 0.03, BODY_HEIGHT * 0.35, -WING_WIDTH / 2]}>
                    <boxGeometry args={[0.06, ENDPLATE_HEIGHT, 0.01]} />
                    <meshStandardMaterial color={color} />
                </mesh>

                {WHEEL_POSITIONS.map((pos, i) => (
                    <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 12]} />
                        <meshStandardMaterial color="#1a1a1a" />
                    </mesh>
                ))}
            </group>
        </group>
    )
}
