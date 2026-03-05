// Middleware CORS para permitir llamadas desde GitHub Pages al servidor Railway
export default defineEventHandler((event) => {
    const origin = getRequestHeader(event, 'origin') || ''

    // Permitir GitHub Pages y localhost
    const allowed = [
        'https://paulvenci.github.io',
        'http://localhost:3000',
        'http://localhost:3001'
    ]

    if (allowed.includes(origin)) {
        setResponseHeaders(event, {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        })
    }

    // Responder a preflight OPTIONS
    if (getMethod(event) === 'OPTIONS') {
        event.node.res.statusCode = 204
        event.node.res.end()
        return
    }
})
