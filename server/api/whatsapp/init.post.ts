import { initWhatsappForTenant } from '../../plugins/whatsapp'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const tenantId = body?.tenant_id as string

    if (!tenantId) {
        throw createError({ statusCode: 400, statusMessage: 'Se requiere tenant_id' })
    }

    const result = initWhatsappForTenant(tenantId)

    if (!result.success) {
        throw createError({ statusCode: 429, statusMessage: result.message })
    }

    return result
})
