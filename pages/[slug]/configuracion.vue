<template>
  <div class="p-4 max-w-4xl mx-auto items-start gap-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p class="text-gray-500 dark:text-gray-400">Administra las preferencias de tu negocio.</p>
      </div>

      <UCard>
        <template #header>
            <h2 class="font-semibold text-lg flex items-center gap-2">
                <UIcon name="i-heroicons-chat-bubble-left-right" class="text-green-500" />
                Notificaciones WhatsApp
            </h2>
        </template>

        <form @submit.prevent="saveSettings" class="space-y-6">
             <UFormGroup label="Plantilla de Mensaje (Citas)" help="Variables: {cliente}, {fecha}, {hora}, {estilista}">
                <UTextarea 
                    v-model="settings.whatsapp_template" 
                    :rows="4" 
                    placeholder="Hola {cliente}, te recordamos tu cita el {fecha} a las {hora} con {estilista}."
                />
            </UFormGroup>

            <UDivider />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormGroup label="Habilitar Recordatorios Automáticos" help="Enviar mensajes automáticamente a los clientes">
                    <UToggle v-model="settings.enable_reminders" />
                </UFormGroup>

                <UFormGroup label="Anticipación (Horas)" help="Cuántas horas antes de la cita enviar el mensaje">
                    <UInput v-model="settings.reminder_hours_before" type="number" min="1" max="72" placeholder="24" icon="i-heroicons-clock" />
                </UFormGroup>

                <UFormGroup label="WhatsApp Phone Number ID" help="ID del número de teléfono en Meta for Developers">
                    <UInput v-model="settings.whatsapp_phone_number_id" icon="i-heroicons-hashtag" placeholder="Ej: 100609346..." />
                </UFormGroup>

                <UFormGroup label="WhatsApp Access Token" help="Token de acceso (Permanente o de Sistema)">
                    <UInput v-model="settings.whatsapp_access_token" type="password" icon="i-heroicons-key" placeholder="Ej: EAAG..." />
                </UFormGroup>
            </div>
            
            <UDivider />
            
            <div class="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg text-sm">
                <p class="font-medium mb-2 text-gray-700 dark:text-gray-300">Vista Previa:</p>
                <div class="p-3 bg-white dark:bg-slate-900 border rounded border-gray-200 dark:border-slate-700 italic text-gray-600 dark:text-gray-400">
                    {{ previewMessage }}
                </div>
            </div>

            <div class="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                <div class="flex items-center gap-2">
                    <UButton 
                        @click="testWhatsapp" 
                        :loading="testing" 
                        color="green" 
                        variant="soft" 
                        icon="i-heroicons-paper-airplane"
                    >
                        Probar Configuración
                    </UButton>
                    <p class="text-[10px] text-gray-500 max-w-[200px]">Se enviará un mensaje de prueba al número que indiques.</p>
                </div>
                <UButton 
                    type="submit" 
                    :loading="saving" 
                    color="primary" 
                    class="px-8"
                    icon="i-heroicons-check"
                >
                    Guardar Cambios
                </UButton>
            </div>
        </form>
      </UCard>

      <!-- Booking Settings Section -->
      <UCard class="mt-6">
        <template #header>
            <h2 class="font-semibold text-lg flex items-center gap-2">
                <UIcon name="i-heroicons-calendar-days" class="text-emerald-500" />
                Agendamiento Online
            </h2>
        </template>

        <form @submit.prevent="saveBookingSettings" class="space-y-6">
            <!-- Public Link -->
            <div v-if="tenantSlug" class="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p class="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Link público de agendamiento:</p>
                <div class="flex items-center gap-2">
                    <code class="text-sm bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-emerald-200 dark:border-slate-600 flex-1 truncate text-emerald-600 dark:text-emerald-400">{{ bookingUrl }}</code>
                    <UButton icon="i-heroicons-clipboard" color="emerald" variant="soft" size="xs" @click="copyLink" />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormGroup label="Activar Agendamiento Online" help="Los clientes podrán agendar citas desde el link público">
                    <UToggle v-model="bookingSettings.booking_enabled" />
                </UFormGroup>

                <UFormGroup label="Requerir Confirmación" help="Las citas quedarán como 'pendientes' hasta que las confirmes">
                    <UToggle v-model="bookingSettings.confirmation_required" />
                </UFormGroup>
            </div>

            <UDivider label="Horario de Trabajo" />

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <UFormGroup label="Hora de Apertura">
                    <UInput v-model="bookingSettings.work_start_time" type="time" icon="i-heroicons-clock" />
                </UFormGroup>
                <UFormGroup label="Hora de Cierre">
                    <UInput v-model="bookingSettings.work_end_time" type="time" icon="i-heroicons-clock" />
                </UFormGroup>
                <UFormGroup label="Intervalo (min)" help="Duración de cada slot de tiempo">
                    <UInput v-model="bookingSettings.slot_interval_min" type="number" min="15" max="120" step="15" icon="i-heroicons-arrows-right-left" />
                </UFormGroup>
            </div>

            <UDivider label="Días Laborales" />

            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                <div v-for="day in workDays" :key="day.key" class="flex flex-col items-center gap-2 p-3 rounded-lg border" :class="bookingSettings[day.key] ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-slate-700'">
                    <span class="text-xs font-medium" :class="bookingSettings[day.key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'">{{ day.label }}</span>
                    <UToggle v-model="bookingSettings[day.key]" />
                </div>
            </div>

            <UFormGroup label="Mensaje de Confirmación" help="Se mostrará al cliente al finalizar la reserva">
                <UTextarea v-model="bookingSettings.confirmation_message" :rows="2" placeholder="Su cita ha sido agendada y está pendiente de confirmación." />
            </UFormGroup>

            <div class="flex justify-end">
                <UButton type="submit" :loading="savingBooking" color="emerald" icon="i-heroicons-check">
                    Guardar Configuración de Agendamiento
                </UButton>
            </div>
        </form>
      </UCard>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const saving = ref(false)
const testing = ref(false)
const settings = ref({
    whatsapp_template: '',
    enable_reminders: false,
    reminder_hours_before: 24,
    whatsapp_phone_number_id: '',
    whatsapp_access_token: ''
})

// --- Booking Settings ---
const savingBooking = ref(false)
const tenantSlug = ref('')
const bookingSettings = ref<any>({
    booking_enabled: true,
    work_start_time: '09:00',
    work_end_time: '19:00',
    slot_interval_min: 30,
    work_monday: true,
    work_tuesday: true,
    work_wednesday: true,
    work_thursday: true,
    work_friday: true,
    work_saturday: true,
    work_sunday: false,
    confirmation_required: true,
    confirmation_message: 'Su cita ha sido agendada y está pendiente de confirmación.'
})

const workDays = [
    { key: 'work_monday', label: 'Lun' },
    { key: 'work_tuesday', label: 'Mar' },
    { key: 'work_wednesday', label: 'Mié' },
    { key: 'work_thursday', label: 'Jue' },
    { key: 'work_friday', label: 'Vie' },
    { key: 'work_saturday', label: 'Sáb' },
    { key: 'work_sunday', label: 'Dom' },
]

const bookingUrl = computed(() => {
    if (!tenantSlug.value) return ''
    const config = useRuntimeConfig()
    const base = config.app.baseURL || '/'
    // Ensure base ends with slash and slug follows
    const normalizedBase = base.endsWith('/') ? base : base + '/'
    return `${window.location.origin}${normalizedBase}${tenantSlug.value}`
})

const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl.value)
    useToast().add({ title: 'Link copiado al portapapeles', icon: 'i-heroicons-clipboard-document-check', color: 'green' })
}

// Variables for preview
const previewData = {
    cliente: 'Juan Pérez',
    fecha: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
    hora: '14:30',
    estilista: 'Ana Gómez'
}

const previewMessage = computed(() => {
    let msg = settings.value.whatsapp_template || "Hola {cliente}, recordamos tu cita en GestorEstilista el {fecha} a las {hora}."
    
    // Replace logic
    msg = msg.replace(/{cliente}/g, previewData.cliente)
    msg = msg.replace(/{fecha}/g, previewData.fecha)
    msg = msg.replace(/{hora}/g, previewData.hora)
    msg = msg.replace(/{estilista}/g, previewData.estilista)
    
    return msg
})

const fetchSettings = async () => {
    try {
        const { data: { user } } = await client.auth.getUser()
        if (!user) return

        // Fetch tenant settings
        // Since we can't select * from tenants directly safely without proper RLS or exposing too much, 
        // we might rely on the profile -> tenant relation or just try fetching the single tenant row enabled by RLS
        // The policy "Users can view their own tenant" should allow this:
        const { data, error } = await client.from('tenants').select('id, slug, settings').single()
        
        if (error) {
            console.error('Error fetching settings:', error)
            return
        }

        if (data && data.settings) {
            settings.value = { ...settings.value, ...data.settings }
        }

        // Get tenant slug for booking link
        tenantSlug.value = data?.slug || ''

        // Fetch booking settings
        if (data?.id) {
            const { data: bSettings } = await client
                .from('booking_settings')
                .select('*')
                .eq('tenant_id', data.id)
                .single()
            if (bSettings) {
                bookingSettings.value = { ...bookingSettings.value, ...bSettings }
            }
        }
    } catch (e) {
        console.error(e)
    }
}

const saveSettings = async () => {
    saving.value = true
    try {
        const { error } = await client.rpc('update_tenant_settings', {
            p_settings: settings.value
        })
        
        if (error) throw error
        
        useToast().add({ title: 'Configuración guardada', icon: 'i-heroicons-check-circle', color: 'green' })
    } catch (e: any) {
        useToast().add({ title: 'Error al guardar', description: e.message, icon: 'i-heroicons-x-circle', color: 'red' })
    } finally {
        saving.value = false
    }
}

const testWhatsapp = async () => {
    if (!settings.value.whatsapp_phone_number_id || !settings.value.whatsapp_access_token) {
        return useToast().add({ title: 'Faltan credenciales', color: 'red' })
    }

    const phone = prompt('Ingresa un número de celular para la prueba (con código de país, ej: 56912345678):')
    if (!phone) return

    testing.value = true
    try {
        const { data, error } = await client.functions.invoke('send-reminders', {
            body: {
                action: 'test',
                to: phone,
                test_settings: settings.value
            }
        })

        if (error) throw error
        
        useToast().add({ title: 'Mensaje enviado', description: 'Revisa tu WhatsApp', color: 'green' })
    } catch (e: any) {
        useToast().add({ title: 'Error en la prueba', description: e.message, color: 'red' })
    } finally {
        testing.value = false
    }
}

onMounted(() => {
    fetchSettings()
})

const saveBookingSettings = async () => {
    savingBooking.value = true
    try {
        // Get tenant ID from tenants table
        const { data: tenantData } = await client.from('tenants').select('id').single()
        if (!tenantData) throw new Error('Tenant no encontrado')

        const { id, created_at, updated_at, tenant_id, ...settingsToSave } = bookingSettings.value

        const { error } = await client
            .from('booking_settings')
            .upsert({
                ...settingsToSave,
                tenant_id: tenantData.id,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' })

        if (error) throw error

        useToast().add({ title: 'Configuración de agendamiento guardada', icon: 'i-heroicons-check-circle', color: 'green' })
    } catch (e: any) {
        useToast().add({ title: 'Error al guardar', description: e.message, icon: 'i-heroicons-x-circle', color: 'red' })
    } finally {
        savingBooking.value = false
    }
}
</script>
