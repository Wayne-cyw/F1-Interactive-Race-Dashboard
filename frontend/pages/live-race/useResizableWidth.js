import { useCallback, useState } from 'react'

// Drives a column's pixel width from a drag handle on one of its edges.
// `edge: 'right'` means the handle sits on the column's right side (dragging
// right grows it) — used for columns anchored to the left of the layout.
// `edge: 'left'` means the handle sits on the column's left side (dragging
// left grows it) — used for columns anchored to the right of the layout.
export function useResizableWidth(initialWidth, { min = 200, max = 640, edge = 'right' } = {}) {
    const [width, setWidth] = useState(initialWidth)

    const onHandleMouseDown = useCallback((e) => {
        e.preventDefault()
        const startX = e.clientX
        const startWidth = width
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'

        function onMouseMove(moveEvent) {
            const delta = moveEvent.clientX - startX
            const signedDelta = edge === 'right' ? delta : -delta
            setWidth(Math.min(max, Math.max(min, startWidth + signedDelta)))
        }
        function onMouseUp() {
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }, [width, min, max, edge])

    return [width, onHandleMouseDown]
}
