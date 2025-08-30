// API utility for consistent backend URL handling
export function getApiUrl(endpoint) {
  const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4000'
  const cleanBase = apiBase.toString().replace(/\/?$/, '')
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${cleanBase}${cleanEndpoint}`
}

export function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export async function apiRequest(endpoint, options = {}) {
  const url = getApiUrl(endpoint)
  const headers = { ...getAuthHeaders(), ...options.headers }
  
  const response = await fetch(url, {
    ...options,
    headers
  })
  
  // Handle rate limiting
  if (response.status === 429) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return fetch(url, { ...options, headers })
  }
  
  return response
}