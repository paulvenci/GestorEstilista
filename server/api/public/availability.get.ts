import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const client = serverSupabaseServiceRole(event)
    const query = getQuery(event)

    const { tenant_slug, stylist_id, date } = query as { tenant_slug: string, stylist_id: string, date: string }

    if (!tenant_slug || !stylist_id || !date) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Faltan parámetros: tenant_slug, stylist_id, date'
        })
    }

    // 1. Get tenant
    const { data: tenant } = await client
        .from('tenants')
        .select('id')
        .eq('slug', tenant_slug)
        .single()

    if (!tenant) {
        throw createError({ statusCode: 404, statusMessage: 'Negocio no encontrado.' })
    }

    // 2. Get booking settings
    const { data: settings } = await client
        .from('booking_settings')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single()

    const workStart = settings?.work_start_time || '09:00'
    const workEnd = settings?.work_end_time || '19:00'
    const slotInterval = settings?.slot_interval_min || 30

    // Check if the day of the week is a work day
    const dateObj = new Date(date + 'T12:00:00')
    const dayOfWeek = dateObj.getDay() // 0=Sun, 1=Mon...
    const dayMap: Record<number, string> = {
        0: 'work_sunday', 1: 'work_monday', 2: 'work_tuesday',
        3: 'work_wednesday', 4: 'work_thursday', 5: 'work_friday', 6: 'work_saturday'
    }

    const dayField = dayMap[dayOfWeek]
    if (settings && settings[dayField] === false) {
        return { slots: [], closed: true, message: 'Cerrado este día.' }
    }

    // 3. Get existing appointments for that stylist on that date
    const dayStart = `${date}T00:00:00`
    const dayEnd = `${date}T23:59:59`

    const { data: appointments } = await client
        .from('appointments')
        .select('start_time, end_time')
        .eq('stylist_id', stylist_id)
        .eq('tenant_id', tenant.id)
        .neq('status', 'cancelled')
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)

    // 4. Generate available time slots
    const [startH, startM] = workStart.split(':').map(Number)
    const [endH, endM] = workEnd.split(':').map(Number)

    const slots: { time: string, available: boolean }[] = []
    let currentMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    while (currentMinutes < endMinutes) {
        const hours = Math.floor(currentMinutes / 60)
        const mins = currentMinutes % 60
        const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
        const slotStart = new Date(`${date}T${timeStr}:00`)
        const slotEnd = new Date(slotStart.getTime() + slotInterval * 60000)

        // Check if slot overlaps with any existing appointment
        const isOccupied = (appointments || []).some((appt: any) => {
            const apptStart = new Date(appt.start_time)
            const apptEnd = new Date(appt.end_time)
            return slotStart < apptEnd && slotEnd > apptStart
        })

        // Don't show past slots for today
        const now = new Date()
        const isPast = slotStart < now

        slots.push({
            time: timeStr,
            available: !isOccupied && !isPast
        })

        currentMinutes += slotInterval
    }

    return {
        slots,
        closed: false,
        work_start: workStart,
        work_end: workEnd
    }
})
