import { createRequire } from 'node:module'

export default defineNitroPlugin(async (nitroApp) => {
    // Solo inicializar si estamos en producción y la flag está activa
    if (process.env.ENABLE_WHATSAPP === 'true') {
        console.log('--- Iniciando WhatsApp Client ---')

        try {
            // Usar createRequire para cargar módulos CommonJS desde un contexto ESM
            // Esto evita que Nitro intente empaquetar whatsapp-web.js durante el build
            // Resolver desde la raíz del proyecto donde están los node_modules
            const esmRequire = createRequire(process.cwd() + '/package.json')
            const { Client, LocalAuth } = esmRequire('whatsapp-web.js')
            const qrcode = esmRequire('qrcode-terminal')

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
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome'
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
