import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const client = serverSupabaseServiceRole(event)
    const body = await readBody(event)

    const { tenant_slug, stylist_id, service_id, start_time, client_name, client_email, client_phone, notes } = body

    // Validaciones básicas
    if (!tenant_slug || !stylist_id || !service_id || !start_time || !client_name || !client_phone) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Faltan campos obligatorios: profesional, servicio, hora, nombre y teléfono.'
        })
    }

    // 1. Obtener tenant
    const { data: tenant, error: tenantError } = await client
        .from('tenants')
        .select('id, status')
        .eq('slug', tenant_slug)
        .single()

    if (tenantError || !tenant) {
        throw createError({ statusCode: 404, statusMessage: 'Negocio no encontrado.' })
    }

    if (tenant.status !== 'active') {
        throw createError({ statusCode: 403, statusMessage: 'Este negocio no está aceptando citas en este momento.' })
    }

    // 2. Verificar booking_settings
    const { data: settings } = await client
        .from('booking_settings')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single()

    if (settings && !settings.booking_enabled) {
        throw createError({ statusCode: 403, statusMessage: 'El agendamiento en línea está desactivado.' })
    }

    // 3. Obtener servicio para calcular end_time
    const { data: service, error: serviceError } = await client
        .from('services')
        .select('id, duration_min, name')
        .eq('id', service_id)
        .eq('tenant_id', tenant.id)
        .single()

    if (serviceError || !service) {
        throw createError({ statusCode: 404, statusMessage: 'Servicio no encontrado.' })
    }

    // Calcular end_time
    const startDate = new Date(start_time)
    const endDate = new Date(startDate.getTime() + service.duration_min * 60000)

    // 4. Verificar disponibilidad del profesional (sin solapamiento)
    const { data: conflicting } = await client
        .from('appointments')
        .select('id')
        .eq('stylist_id', stylist_id)
        .eq('tenant_id', tenant.id)
        .neq('status', 'cancelled')
        .lt('start_time', endDate.toISOString())
        .gt('end_time', startDate.toISOString())

    if (conflicting && conflicting.length > 0) {
        throw createError({
            statusCode: 409,
            statusMessage: 'El profesional ya tiene una cita en ese horario. Por favor, selecciona otro horario.'
        })
    }

    // 5. Buscar o crear cliente
    let clientId: string

    // Buscar por teléfono + tenant (más confiable que email)
    const { data: existingClient } = await client
        .from('clients')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('phone', client_phone)
        .single()

    if (existingClient) {
        clientId = existingClient.id
    } else {
        const { data: newClient, error: clientError } = await client
            .from('clients')
            .insert({
                tenant_id: tenant.id,
                full_name: client_name,
                email: client_email || null,
                phone: client_phone
            })
            .select('id')
            .single()

        if (clientError || !newClient) {
            throw createError({ statusCode: 500, statusMessage: 'Error al registrar el cliente: ' + (clientError?.message || '') })
        }
        clientId = newClient.id
    }

    // 6. Crear la cita
    const { data: appointment, error: appointmentError } = await client
        .from('appointments')
        .insert({
            tenant_id: tenant.id,
            client_id: clientId,
            stylist_id: stylist_id,
            service_id: service_id,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            status: 'pending',
            notes: notes || `Reserva online - ${client_name}`
        })
        .select('id, confirmation_token, start_time, end_time, status')
        .single()

    if (appointmentError) {
        throw createError({ statusCode: 500, statusMessage: 'Error al crear la cita: ' + appointmentError.message })
    }

    return {
        success: true,
        appointment: {
            id: appointment.id,
            start_time: appointment.start_time,
            end_time: appointment.end_time,
            status: appointment.status,
            service_name: service.name,
            client_name: client_name
        },
        message: settings?.confirmation_message || 'Su cita ha sido agendada exitosamente.'
    }
})
