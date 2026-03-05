export default defineEventHandler((event) => {
    const origin = event.node.req.headers.origin || ''

    const allowed = [
        'https://paulvenci.github.io',
        'http://localhost:3000',
        'http://localhost:3001'
    ]

    if (allowed.includes(origin)) {
        event.node.res.setHeader('Access-Control-Allow-Origin', origin)
        event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        event.node.res.setHeader('Access-Control-Max-Age', '86400')
    }

    if (event.node.req.method === 'OPTIONS') {
        event.node.res.statusCode = 204
        event.node.res.end()
        return
    }
})
