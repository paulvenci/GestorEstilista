import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a Supabase client with the Auth context of the logged in user
        const supabaseClient = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Parse request body
        let body = {}
        try { body = await req.json() } catch { }
        const { action, to, test_settings } = body

        // 0. Test Mode
        if (action === 'test') {
            const settings = test_settings
            if (!settings?.whatsapp_access_token || !settings?.whatsapp_phone_number_id) {
                throw new Error('Faltan credenciales para el test')
            }

            const response = await fetch(
                `https://graph.facebook.com/v18.0/${settings.whatsapp_phone_number_id}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${settings.whatsapp_access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: to,
                        type: 'text',
                        text: { body: "Hola, este es un mensaje de prueba de GestorEstilista. Tu configuración es correcta. ✅" },
                    }),
                }
            )

            const data = await response.json()
            if (!response.ok) throw new Error(JSON.stringify(data))

            return new Response(JSON.stringify({ success: true, data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 1. Fetch appointments that need reminders
        // Logic: 
        // - Status is 'pending'
        // - Start time is between NOW and NOW + Reminder Hours
        // - reminder_sent_at is NULL
        // - Tenant has whatsapp enabled and configured

        // First get all tenants with whatsapp enabled
        // Note: In a real large scale app, we might want to query appointments first and filter, 
        // or use a more complex join. For now, let's look for appointments in the next 24h (default) 
        // and then check tenant config for each.

        // Actually, deeper efficiency: 
        // Get appointments in the next 72 hours (max anticipation) that haven't been sent.
        const now = new Date()
        const maxFuture = new Date(now.getTime() + 72 * 60 * 60 * 1000)

        const { data: appointments, error: apptError } = await supabaseClient
            .from('appointments')
            .select(`
            id,
            start_time,
            tenant_id,
            client_id,
            stylist_id,
            clients ( full_name, phone ),
            profiles ( full_name ),
            tenants ( settings )
        `)
            .is('reminder_sent_at', null)
            .eq('status', 'pending')
            .gt('start_time', now.toISOString())
            .lt('start_time', maxFuture.toISOString())

        if (apptError) throw apptError

        const results = []

        for (const appt of appointments || []) {
            const settings = appt.tenants?.settings

            // Skip if not enabled or missing config
            if (!settings?.enable_reminders || !settings.whatsapp_access_token || !settings.whatsapp_phone_number_id) {
                continue
            }

            const hoursBefore = Number(settings.reminder_hours_before) || 24
            const apptTime = new Date(appt.start_time)
            const timeDiff = apptTime.getTime() - now.getTime()
            const hoursDiff = timeDiff / (1000 * 60 * 60)

            // Only send if within the configured window (e.g. between 23 and 24 hours if we run hourly? 
            // Or just "less than hoursBefore"? 
            // To avoid double sending we check is('reminder_sent_at', null), so "less than hoursBefore" is safe 
            // as long as we don't send too early.
            if (hoursDiff > hoursBefore) continue

            // Prepare Message
            const phone = appt.clients?.phone?.replace(/\D/g, '')
            if (!phone) {
                results.push({ id: appt.id, status: 'skipped_no_phone' })
                continue
            }

            // Template Replacement
            let msgBody = settings.whatsapp_template || "Hola {cliente}, recordamos tu cita el {fecha} a las {hora}."
            const dateStr = apptTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
            const timeStr = apptTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

            msgBody = msgBody
                .replace(/{cliente}/g, appt.clients.full_name || 'Cliente')
                .replace(/{fecha}/g, dateStr)
                .replace(/{hora}/g, timeStr)
                .replace(/{estilista}/g, appt.profiles?.full_name || 'Nosotros')

            // Send via WhatsApp Cloud API
            const response = await fetch(
                `https://graph.facebook.com/v18.0/${settings.whatsapp_phone_number_id}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${settings.whatsapp_access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: phone,
                        type: 'text',
                        text: { body: msgBody },
                    }),
                }
            )

            const responseData = await response.json()

            if (response.ok) {
                // Update DB
                await supabaseClient
                    .from('appointments')
                    .update({ reminder_sent_at: new Date().toISOString() })
                    .eq('id', appt.id)

                results.push({ id: appt.id, status: 'sent', wa_id: responseData.messages?.[0]?.id })
            } else {
                console.error('WhatsApp Error:', responseData)
                results.push({ id: appt.id, status: 'failed', error: responseData })
            }
        }

        return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
