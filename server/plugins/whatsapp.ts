import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

// Límite de tenants simultáneos (0.5GB RAM => ~3 sesiones)
const MAX_TENANTS = 3

// Buscar Chromium en todas las ubicaciones posibles
function findChromiumPath(): string | undefined {
    if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
        return process.env.PUPPETEER_EXECUTABLE_PATH
    }

    try {
        const found = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null', { encoding: 'utf-8' }).trim()
        if (found && existsSync(found)) return found
    } catch { }

    try {
        const esmRequire = createRequire(process.cwd() + '/package.json')
        const puppeteer = esmRequire('puppeteer')
        const browserPath = puppeteer.executablePath?.()
        if (browserPath && existsSync(browserPath)) return browserPath
    } catch { }

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

    return undefined
}

// Cachear módulos y chromePath para no buscarlos cada vez
let _modules: { Client: any, LocalAuth: any, qrcode: any } | null = null
let _chromePath: string | undefined

function getModules() {
    if (!_modules) {
        const esmRequire = createRequire(process.cwd() + '/package.json')
        const { Client, LocalAuth } = esmRequire('whatsapp-web.js')
        const qrcode = esmRequire('qrcode-terminal')
        _modules = { Client, LocalAuth, qrcode }
    }
    return _modules
}

function getChromePath() {
    if (_chromePath === undefined) {
        _chromePath = findChromiumPath() || ''
    }
    return _chromePath || undefined
}

/**
 * Inicializa un cliente de WhatsApp para un tenant específico.
 * Cada tenant tiene su propia sesión separada.
 */
export function initWhatsappForTenant(tenantId: string): { success: boolean, message: string } {
    if (process.env.ENABLE_WHATSAPP !== 'true') {
        return { success: false, message: 'WhatsApp no está habilitado en este servidor (ENABLE_WHATSAPP != true)' }
    }

    // Verificar si ya tiene sesión activa
    const existing = globalThis.whatsappClients.get(tenantId)
    if (existing) {
        return { success: true, message: existing.ready ? 'Ya conectado' : 'Ya inicializado, esperando QR...' }
    }

    // Verificar límite de tenants
    const activeCount = globalThis.whatsappClients.size
    if (activeCount >= MAX_TENANTS) {
        return {
            success: false,
            message: `Límite alcanzado: máximo ${MAX_TENANTS} sesiones WhatsApp simultáneas. Desconecta otra peluquería primero.`
        }
    }

    try {
        const { Client, LocalAuth, qrcode } = getModules()
        const chromePath = getChromePath()

        console.log(`--- Iniciando WhatsApp para tenant ${tenantId} ---`)
        console.log('--- Chromium path:', chromePath || 'AUTO', '---')

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

        if (chromePath) {
            puppeteerOptions.executablePath = chromePath
        }

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: `tenant_${tenantId}`,
                dataPath: './.wwebjs_auth'
            }),
            puppeteer: puppeteerOptions
        })

        // Estado inicial
        const state = { client, ready: false, qr: null as string | null }
        globalThis.whatsappClients.set(tenantId, state)

        client.on('qr', (qr: string) => {
            console.log(`--- QR recibido para tenant ${tenantId} ---`)
            qrcode.generate(qr, { small: true })
            const s = globalThis.whatsappClients.get(tenantId)
            if (s) s.qr = qr
        })

        client.on('ready', () => {
            console.log(`--- WhatsApp LISTO para tenant ${tenantId} ---`)
            const s = globalThis.whatsappClients.get(tenantId)
            if (s) { s.ready = true; s.qr = null }
        })

        client.on('authenticated', () => {
            console.log(`--- WhatsApp autenticado para tenant ${tenantId} ---`)
        })

        client.on('auth_failure', (msg: string) => {
            console.error(`--- Auth failure para tenant ${tenantId} ---`, msg)
        })

        client.on('disconnected', (reason: string) => {
            console.log(`--- WhatsApp desconectado para tenant ${tenantId}: ${reason} ---`)
            globalThis.whatsappClients.delete(tenantId)
        })

        client.initialize().catch((err: any) => {
            console.error(`--- Fallo al inicializar WhatsApp para tenant ${tenantId} ---`, err)
            globalThis.whatsappClients.delete(tenantId)
        })

        return { success: true, message: 'Inicializando WhatsApp... Espera el código QR.' }
    } catch (err: any) {
        console.error(`--- Error cargando módulos WhatsApp ---`, err)
        return { success: false, message: 'Error al cargar módulos: ' + err.message }
    }
}

/**
 * Desconecta el cliente de WhatsApp de un tenant.
 */
export async function disconnectWhatsappForTenant(tenantId: string): Promise<{ success: boolean, message: string }> {
    const state = globalThis.whatsappClients.get(tenantId)
    if (!state) {
        return { success: false, message: 'No hay sesión de WhatsApp activa para este negocio' }
    }

    try {
        await state.client.destroy()
    } catch (err: any) {
        console.error(`--- Error al destruir cliente de tenant ${tenantId} ---`, err)
    }

    globalThis.whatsappClients.delete(tenantId)
    console.log(`--- WhatsApp desconectado para tenant ${tenantId} ---`)
    return { success: true, message: 'WhatsApp desconectado correctamente' }
}

// Plugin de inicialización: solo prepara el Map global
export default defineNitroPlugin(async (_nitroApp) => {
    // Inicializar el Map global de clientes
    if (!globalThis.whatsappClients) {
        globalThis.whatsappClients = new Map()
    }
    globalThis.MAX_WHATSAPP_TENANTS = MAX_TENANTS

    console.log(`--- WhatsApp Multi-Tenant Plugin cargado (máx: ${MAX_TENANTS} sesiones) ---`)
})
