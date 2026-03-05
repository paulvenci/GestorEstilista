export default defineEventHandler(async (event) => {
    const phone = getQuery(event).phone as string
    const message = getQuery(event).message as string

    if (!phone || !message) {
        throw createError({ statusCode: 400, statusMessage: 'Se requiere phone y message' })
    }

    if (!globalThis.whatsappReady || !globalThis.whatsappClient) {
        throw createError({ statusCode: 503, statusMessage: 'WhatsApp no está conectado' })
    }

    try {
        // Formatear número: eliminar +, espacios, guiones
        let cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '')
        // Agregar código de país si no lo tiene
        if (!cleanPhone.startsWith('56') && cleanPhone.length <= 9) {
            cleanPhone = '56' + cleanPhone
        }

        const chatId = cleanPhone + '@c.us'
        await globalThis.whatsappClient.sendMessage(chatId, message)

        return { success: true, message: 'Mensaje enviado correctamente' }
    } catch (err: any) {
        throw createError({ statusCode: 500, statusMessage: 'Error al enviar: ' + err.message })
    }
})
