export default defineNitroPlugin(async (nitroApp) => {
    // Solo inicializar si estamos en producción y la flag está activa
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_WHATSAPP === 'true') {
        console.log('--- Iniciando WhatsApp Client (Hack mode) ---')

        try {
            // Usar eval require para que Nitro no intente analizar el paquete durante el build
            // Esto solo funciona si node_modules está presente en el servidor de destino
            const pkg = eval('require("whatsapp-web.js")')
            const { Client, LocalAuth } = pkg
            const qrcode = eval('require("qrcode-terminal")')

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

            client.on('qr', (qr) => {
                console.log('--- NUEVO CÓDIGO QR RECIBIDO ---')
                qrcode.generate(qr, { small: true })
                globalThis.lastWhatsappQR = qr
            })

            client.on('ready', () => {
                console.log('--- WhatsApp Client está LISTO! ---')
                globalThis.whatsappReady = true
                globalThis.lastWhatsappQR = null
            })

            client.initialize().catch(err => {
                console.error('--- Fallo al inicializar WhatsApp ---', err)
            })

            globalThis.whatsappClient = client
        } catch (err) {
            console.error('--- Error al cargar módulos de WhatsApp ---', err)
        }
    }
})
