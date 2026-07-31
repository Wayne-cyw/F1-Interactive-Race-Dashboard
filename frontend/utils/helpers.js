export const API_URL = '/api'

export function formatLapTime(seconds) {
    if (!seconds || isNaN(seconds)) return '--:--.---'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toFixed(3).padStart(6, '0')}`
}

export function formatPosition(pos) {
    if (!pos) return '-'
    const suffixes = ['th', 'st', 'nd', 'rd']
    const v = pos % 100
    return pos + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}

export function generateId() {
    return Math.random().toString(36).substr(2, 9)
}

export function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

export function getDriverStatus(status) {
    if (!status) return 'unknown'
    const statusLower = status.toLowerCase()
    if (statusLower.includes('finished') || statusLower.includes('+')) return 'finished'
    if (statusLower.includes('dnf') || statusLower.includes('accident') ||
        statusLower.includes('retired') || statusLower.includes('collision')) return 'dnf'
    return 'running'
}

export function getStatusLabel(status) {
    const driverStatus = getDriverStatus(status)
    switch (driverStatus) {
        case 'finished': return 'Finished'
        case 'dnf':      return 'DNF'
        case 'running':  return 'Running'
        default:         return ''
    }
}

export function formatTemp(temp) {
    if (!temp || isNaN(temp)) return '--°C'
    return `${Math.round(temp)}°C`
}

export function formatSpeed(speed) {
    if (!speed || isNaN(speed)) return '-- km/h'
    return `${Math.round(speed)} km/h`
}

export async function getSessionTypes(year, round) {
    try {
        const response = await fetch(`${API_URL}/session-types/${year}/${round}`)
        const data = await response.json()
        return data.status === 'success' ? data.sessions : []
    } catch {
        return []
    }
}
