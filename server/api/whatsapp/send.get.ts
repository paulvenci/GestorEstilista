export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const phone = query.phone as string
    const message = query.message as string
    const tenantId = query.tenant_id as string

    if (!phone || !message) {
        throw createError({ statusCode: 400, statusMessage: 'Se requiere phone y message' })
    }

    if (!tenantId) {
        throw createError({ statusCode: 400, statusMessage: 'Se requiere tenant_id' })
    }

    const state = globalThis.whatsappClients?.get(tenantId)

    if (!state || !state.ready) {
        throw createError({ statusCode: 503, statusMessage: 'WhatsApp no está conectado para este negocio' })
    }

    try {
        // Formatear número: eliminar +, espacios, guiones
        let cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '')
        // Agregar código de país si no lo tiene
        if (!cleanPhone.startsWith('56') && cleanPhone.length <= 9) {
            cleanPhone = '56' + cleanPhone
        }

        const chatId = cleanPhone + '@c.us'
        await state.client.sendMessage(chatId, message)

        return { success: true, message: 'Mensaje enviado correctamente' }
    } catch (err: any) {
        throw createError({ statusCode: 500, statusMessage: 'Error al enviar: ' + err.message })
    }
})
