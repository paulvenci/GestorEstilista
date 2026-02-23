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
        const { data, error } = await client.from('tenants').select('settings').single()
        
        if (error) {
            console.error('Error fetching settings:', error)
            return
        }

        if (data && data.settings) {
            settings.value = { ...settings.value, ...data.settings }
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
</script>
