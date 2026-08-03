const BODY_LENGTH = 0.34
const BODY_WIDTH = 0.14
const BODY_HEIGHT = 0.06
const WHEEL_RADIUS = 0.045
const WHEEL_WIDTH = 0.05
const WING_WIDTH = 0.16

const WHEEL_POSITIONS = [
    [BODY_LENGTH / 2 - 0.05, -BODY_HEIGHT / 2, BODY_WIDTH / 2],
    [BODY_LENGTH / 2 - 0.05, -BODY_HEIGHT / 2, -BODY_WIDTH / 2],
    [-BODY_LENGTH / 2 + 0.05, -BODY_HEIGHT / 2, BODY_WIDTH / 2],
    [-BODY_LENGTH / 2 + 0.05, -BODY_HEIGHT / 2, -BODY_WIDTH / 2],
]

// A simple, stylized low-poly F1-car silhouette — not a licensed or
// team-accurate model. Positioned with its wheels resting on `position`
// (the track surface height at this point), tinted with the driver's
// team color.
export default function F1Car3D({ position, color, selected, onClick }) {
    return (
        <group position={[position.x, position.y + BODY_HEIGHT / 2, position.z]} onClick={onClick}>
            {selected && (
                <mesh position={[0, -BODY_HEIGHT / 2 - 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[BODY_LENGTH * 0.55, BODY_LENGTH * 0.65, 32]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
                </mesh>
            )}
            <group scale={selected ? 1.4 : 1}>
                <mesh>
                    <boxGeometry args={[BODY_LENGTH, BODY_HEIGHT, BODY_WIDTH]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[-BODY_LENGTH / 2 + 0.03, BODY_HEIGHT * 0.6, 0]}>
                    <boxGeometry args={[0.06, BODY_HEIGHT * 0.5, WING_WIDTH]} />
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
