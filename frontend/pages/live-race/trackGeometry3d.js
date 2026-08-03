// Normalizes /api/track's GPS-derived {x, y, z} meter coordinates into
// Three.js scene-space, and builds the flat road-ribbon geometry the 3D
// track map renders. The 3D sibling of trackMap.js's old buildTrackPath —
// same centering/scaling idea, targeting a Three.js scene instead of an
// SVG viewBox.

const SCENE_SIZE = 16
const ELEVATION_EXAGGERATION = 3
const ROAD_WIDTH = 0.5

// Real F1 elevation change (a few meters) is invisible next to a track's
// multi-kilometer horizontal span, so only elevation gets the
// exaggeration multiplier — the ground-plane shape stays true-to-scale.
export function buildTrackScene(coordinates, { sceneSize = SCENE_SIZE, elevationExaggeration = ELEVATION_EXAGGERATION } = {}) {
    if (!coordinates || coordinates.length === 0) {
        return { points: [], toScenePoint: () => ({ x: 0, y: 0, z: 0 }) }
    }

    const xs = coordinates.map(p => p.x)
    const ys = coordinates.map(p => p.y)
    const zs = coordinates.map(p => p.z ?? 0)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const minZ = Math.min(...zs)
    const spanX = maxX - minX || 1
    const spanY = maxY - minY || 1
    const scale = sceneSize / Math.max(spanX, spanY)
    const centerX = minX + spanX / 2
    const centerY = minY + spanY / 2

    function toScenePoint(p) {
        return {
            x: (p.x - centerX) * scale,
            // Three.js is Y-up: the track's ground plane (x/y from
            // FastF1) maps to the scene's X/Z plane, elevation (z from
            // FastF1 — absolute altitude, not track-relative, so it's
            // zeroed against the track's own lowest point) maps to
            // scene Y. The z sign is flipped: an unflipped x/y -> x/z
            // mapping mirrors the circuit's real-world winding
            // direction when viewed from above.
            z: -(p.y - centerY) * scale,
            y: ((p.z ?? 0) - minZ) * scale * elevationExaggeration,
        }
    }

    return { points: coordinates.map(toScenePoint), toScenePoint }
}

// Builds a flat, fixed-width road ribbon as a triangle list (two
// triangles per segment) from a closed loop of scene-space {x, y, z}
// points, returned as a flat Float32Array ready for a Three.js
// BufferAttribute.
export function buildRibbonVertices(points, width = ROAD_WIDTH) {
    const n = points.length
    if (n < 2) return new Float32Array(0)

    const half = width / 2
    const left = new Array(n)
    const right = new Array(n)
    for (let i = 0; i < n; i++) {
        const curr = points[i]
        const next = points[(i + 1) % n]
        const dx = next.x - curr.x
        const dz = next.z - curr.z
        const len = Math.hypot(dx, dz) || 1
        const px = -dz / len
        const pz = dx / len
        left[i] = { x: curr.x - px * half, y: curr.y, z: curr.z - pz * half }
        right[i] = { x: curr.x + px * half, y: curr.y, z: curr.z + pz * half }
    }

    const vertices = []
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        const a = left[i], b = right[i], c = right[j], d = left[j]
        vertices.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
        vertices.push(a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z)
    }
    return new Float32Array(vertices)
}
