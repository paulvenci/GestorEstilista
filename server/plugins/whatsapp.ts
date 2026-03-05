import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'

// Buscar el ejecutable de Chromium en las rutas típicas de Nix/Railway/Docker
function findChromiumPath(): string {
    const paths = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/nix/var/nix/profiles/default/bin/chromium',
        '/root/.nix-profile/bin/chromium',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
    ]
    for (const p of paths) {
        if (p && existsSync(p)) return p
    }
    return paths[1]! // Fallback a la ruta Nix por defecto
}

export default defineNitroPlugin(async (nitroApp) => {
    if (process.env.ENABLE_WHATSAPP === 'true') {
        console.log('--- Iniciando WhatsApp Client ---')

        try {
            const esmRequire = createRequire(process.cwd() + '/package.json')
            const { Client, LocalAuth } = esmRequire('whatsapp-web.js')
            const qrcode = esmRequire('qrcode-terminal')

            const chromePath = findChromiumPath()
            console.log('--- Usando navegador en:', chromePath, '---')

            const client = new Client({
                authStrategy: new LocalAuth({
                    clientId: 'default',
                    dataPath: './.wwebjs_auth'
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--no-zygote',
                        '--single-process'
                    ],
                    executablePath: chromePath
                }
            })

            client.on('qr', (qr: string) => {
                console.log('--- NUEVO CÓDIGO QR RECIBIDO ---')
                qrcode.generate(qr, { small: true })
                globalThis.lastWhatsappQR = qr
            })

            client.on('ready', () => {
                console.log('--- WhatsApp Client está LISTO! ---')
                globalThis.whatsappReady = true
                globalThis.lastWhatsappQR = null
            })

            client.on('authenticated', () => {
                console.log('--- WhatsApp Autenticado correctamente ---')
            })

            client.on('auth_failure', (msg: string) => {
                console.error('--- Error de autenticación WhatsApp ---', msg)
            })

            client.initialize().catch((err: any) => {
                console.error('--- Fallo al inicializar WhatsApp ---', err)
            })

            globalThis.whatsappClient = client
        } catch (err) {
            console.error('--- Error al cargar módulos de WhatsApp ---', err)
        }
    }
})
