import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

// Buscar Chromium en todas las ubicaciones posibles
function findChromiumPath(): string | undefined {
    // 1. Variable de entorno explícita
    if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
        return process.env.PUPPETEER_EXECUTABLE_PATH
    }

    // 2. Buscar con 'which' en el PATH del sistema
    try {
        const found = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null', { encoding: 'utf-8' }).trim()
        if (found && existsSync(found)) return found
    } catch { }

    // 3. Buscar en carpeta cache de Puppeteer (descarga automática de npm install)
    try {
        const esmRequire = createRequire(process.cwd() + '/package.json')
        const puppeteer = esmRequire('puppeteer')
        const browserPath = puppeteer.executablePath?.()
        if (browserPath && existsSync(browserPath)) return browserPath
    } catch { }

    // 4. Rutas manuales comunes
    const paths = [
        '/nix/var/nix/profiles/default/bin/chromium',
        '/root/.nix-profile/bin/chromium',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome',
    ]
    for (const p of paths) {
        if (existsSync(p)) return p
    }

    // 5. undefined = dejar que puppeteer use su propio Chromium descargado
    return undefined
}

export default defineNitroPlugin(async (nitroApp) => {
    if (process.env.ENABLE_WHATSAPP === 'true') {
        console.log('--- Iniciando WhatsApp Client ---')

        try {
            const esmRequire = createRequire(process.cwd() + '/package.json')
            const { Client, LocalAuth } = esmRequire('whatsapp-web.js')
            const qrcode = esmRequire('qrcode-terminal')

            const chromePath = findChromiumPath()
            console.log('--- Chromium path:', chromePath || 'AUTO (puppeteer default)', '---')

            const puppeteerOptions: any = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--no-zygote',
                    '--single-process'
                ]
            }

            // Solo establecer executablePath si encontramos uno explícito
            if (chromePath) {
                puppeteerOptions.executablePath = chromePath
            }

            const client = new Client({
                authStrategy: new LocalAuth({
                    clientId: 'default',
                    dataPath: './.wwebjs_auth'
                }),
                puppeteer: puppeteerOptions
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
