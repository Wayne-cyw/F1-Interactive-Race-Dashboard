export const API_URL = '/api'

export async function fetchJSON(path) {
    const res = await fetch(`${API_URL}${path}`)
    let body
    try {
        body = await res.json()
    } catch {
        throw new Error(`Request to ${path} failed: invalid JSON response (status ${res.status})`)
    }
    if (!res.ok || body.status !== 'success') {
        throw new Error(body.message || `Request to ${path} failed with status ${res.status}`)
    }
    return body
}
