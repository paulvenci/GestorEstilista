export default defineEventHandler(async (event) => {
    const tenantId = getQuery(event).tenant_id as string

    if (!tenantId) {
        return { connected: false, qr: null, hasClient: false, message: 'Falta tenant_id' }
    }

    const state = globalThis.whatsappClients?.get(tenantId)

    if (!state) {
        return {
            connected: false,
            qr: null,
            hasClient: false,
            message: 'WhatsApp no inicializado para este negocio'
        }
    }

    return {
        connected: state.ready,
        qr: state.qr,
        hasClient: true,
        message: state.ready
            ? 'WhatsApp conectado y listo'
            : state.qr
                ? 'Escanea el código QR con tu teléfono'
                : 'Esperando código QR...'
    }
})
