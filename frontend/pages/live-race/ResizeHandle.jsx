import { useState } from 'react'

// A draggable divider between two columns. Wider invisible hit-area (10px)
// than the visible line (2px) so it's easy to grab without needing pixel
// precision, matching common split-panel resizers (e.g. VS Code).
export default function ResizeHandle({ onMouseDown }) {
    const [hover, setHover] = useState(false)

    return (
        <div
            onMouseDown={onMouseDown}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ cursor: 'col-resize', position: 'relative', zIndex: 1 }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 4,
                    width: 2,
                    borderRadius: 10,
                    background: hover ? '#a8a49b' : '#e6e3dc',
                    transition: 'background 0.15s',
                }}
            />
        </div>
    )
}
