export default defineEventHandler(async (event) => {
    const qr = globalThis.lastWhatsappQR || null
    const ready = globalThis.whatsappReady || false
    const clientExists = !!globalThis.whatsappClient

    return {
        connected: ready,
        qr: qr,
        hasClient: clientExists,
        message: ready
            ? 'WhatsApp conectado y listo'
            : qr
                ? 'Escanea el código QR con tu teléfono'
                : clientExists
                    ? 'Esperando código QR...'
                    : 'Cliente WhatsApp no inicializado'
    }
})
