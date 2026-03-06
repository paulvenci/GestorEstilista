<template>
  <div class="p-4 max-w-4xl mx-auto items-start gap-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p class="text-gray-500 dark:text-gray-400">Administra las preferencias de tu negocio.</p>
      </div>

      <UCard v-if="isAdmin">
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

      <!-- WhatsApp Connection Status -->
      <UCard v-if="isAdmin" class="mt-6">
        <template #header>
            <h2 class="font-semibold text-lg flex items-center gap-2">
                <svg class="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.344 0-4.52-.81-6.238-2.163l-.435-.346-3.042 1.02 1.02-3.042-.346-.435A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Conexión WhatsApp
            </h2>
        </template>

        <div class="space-y-4">
          <!-- Estado -->
          <div class="flex items-center gap-3 p-4 rounded-xl" :class="waStatus.connected ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20' : 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20'">
            <div class="w-3 h-3 rounded-full" :class="waStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'"></div>
            <div>
              <p class="font-medium" :class="waStatus.connected ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'">
                {{ waStatus.connected ? '✅ Conectado' : waStatus.qr ? '📱 Escanea el QR' : '⏳ ' + waStatus.message }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ waStatus.message }}</p>
            </div>
            <div class="flex gap-2 ml-auto">
              <UButton @click="checkWaStatus" :loading="waLoading" variant="soft" color="gray" size="xs" icon="i-heroicons-arrow-path">
                Verificar
              </UButton>
              <UButton v-if="!waStatus.connected && !waStatus.hasClient" @click="initWa" :loading="waLoading" color="green" size="xs" icon="i-heroicons-play">
                Conectar
              </UButton>
              <UButton v-if="waStatus.connected || waStatus.hasClient" @click="disconnectWa" :loading="waLoading" variant="soft" color="red" size="xs" icon="i-heroicons-power">
                Desconectar
              </UButton>
            </div>
          </div>

          <!-- QR Code -->
          <div v-if="waStatus.qr && !waStatus.connected" class="flex flex-col items-center gap-4 py-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">Abre WhatsApp → <strong>Dispositivos vinculados</strong> → <strong>Vincular dispositivo</strong></p>
            <div class="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
              <img :src="qrImageUrl" alt="QR WhatsApp" class="w-64 h-64" />
            </div>
            <p class="text-xs text-gray-400">El QR se actualiza automáticamente cada 30 segundos</p>
          </div>

          <!-- Conectado -->
          <div v-if="waStatus.connected" class="text-center py-4">
            <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <p class="font-semibold text-green-600 dark:text-green-400">WhatsApp vinculado correctamente</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Los mensajes se enviarán automáticamente desde este número</p>
          </div>
        </div>
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

            <template v-if="isAdmin">
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
            </template>
        </form>
      </UCard>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const userRole = ref('')
const isAdmin = computed(() => ['admin', 'superadmin'].includes(userRole.value))
const saving = ref(false)
const testing = ref(false)
const tenantId = ref('')
const settings = ref({
    whatsapp_template: '',
    enable_reminders: false,
    reminder_hours_before: 24
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

// --- WhatsApp Connection ---
const waStatus = ref<any>({ connected: false, qr: null, hasClient: false, message: 'Verificando...' })
const waLoading = ref(false)
let waPollingInterval: any = null

const qrImageUrl = computed(() => {
  if (!waStatus.value.qr) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(waStatus.value.qr)}`
})

const checkWaStatus = async () => {
  waLoading.value = true
  try {
    const config = useRuntimeConfig()
    const waBaseUrl = config.public.whatsappApiUrl as string
    if (!waBaseUrl) {
      waStatus.value = { connected: false, qr: null, hasClient: false, message: 'URL de WhatsApp API no configurada' }
      return
    }
    const res = await $fetch<any>(`${waBaseUrl}/api/whatsapp/status`, {
      params: { tenant_id: tenantId.value }
    })
    waStatus.value = res
    
    // Polling: si tiene QR y no está conectado, verificar cada 5s
    if (res.qr && !res.connected) {
      if (!waPollingInterval) {
        waPollingInterval = setInterval(checkWaStatus, 5000)
      }
    } else {
      if (waPollingInterval) {
        clearInterval(waPollingInterval)
        waPollingInterval = null
      }
    }
  } catch (e: any) {
    waStatus.value = { connected: false, qr: null, hasClient: false, message: 'No se pudo conectar al servicio' }
  } finally {
    waLoading.value = false
  }
}

const initWa = async () => {
  waLoading.value = true
  try {
    const config = useRuntimeConfig()
    const waBaseUrl = config.public.whatsappApiUrl as string
    await $fetch<any>(`${waBaseUrl}/api/whatsapp/init`, {
      method: 'POST',
      body: { tenant_id: tenantId.value }
    })
    // Esperar un poco y luego verificar estado (para obtener QR)
    setTimeout(() => checkWaStatus(), 3000)
  } catch (e: any) {
    const msg = e?.data?.statusMessage || e.message || 'Error al iniciar WhatsApp'
    useToast().add({ title: msg, color: 'red', icon: 'i-heroicons-x-circle' })
    waLoading.value = false
  }
}

const disconnectWa = async () => {
  waLoading.value = true
  try {
    const config = useRuntimeConfig()
    const waBaseUrl = config.public.whatsappApiUrl as string
    const res = await $fetch<any>(`${waBaseUrl}/api/whatsapp/disconnect`, {
      method: 'POST',
      body: { tenant_id: tenantId.value }
    })
    waStatus.value = { connected: false, qr: null, hasClient: false, message: res.message || 'Desconectado' }
    if (waPollingInterval) { clearInterval(waPollingInterval); waPollingInterval = null }
    useToast().add({ title: 'WhatsApp desconectado', color: 'green' })
  } catch (e: any) {
    useToast().add({ title: 'Error al desconectar', description: e.message, color: 'red' })
  } finally {
    waLoading.value = false
  }
}
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

        // Get user role
        const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).single()
        if (profile) userRole.value = profile.role || ''

        // Fetch tenant settings
        // Since we can't select * from tenants directly safely without proper RLS or exposing too much, 
        // we might rely on the profile -> tenant relation or just try fetching the single tenant row enabled by RLS
        // The policy "Users can view their own tenant" should allow this:
        const { data, error } = await client.from('tenants').select('id, slug, settings').single()
        if (data?.id) tenantId.value = data.id
        
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
    if (!waStatus.value.connected) {
        return useToast().add({ 
            title: 'WhatsApp no vinculado', 
            description: 'Escanea el código QR primero para poder enviar mensajes.',
            color: 'amber',
            icon: 'i-heroicons-exclamation-triangle'
        })
    }

    const phone = prompt('Ingresa el número de destino (con código de país, ej: 56912345678):')
    if (!phone) return

    testing.value = true
    try {
        const config = useRuntimeConfig()
        const waBaseUrl = config.public.whatsappApiUrl as string
        const message = previewMessage.value

        const res = await $fetch<any>(`${waBaseUrl}/api/whatsapp/send`, {
            params: { phone, message, tenant_id: tenantId.value }
        })

        if (res.success) {
            useToast().add({ title: 'Mensaje de prueba enviado', description: 'Revisa tu WhatsApp', color: 'green' })
        } else {
            throw new Error(res.message || 'Error desconocido')
        }
    } catch (e: any) {
        useToast().add({ title: 'Error al enviar', description: e.message, color: 'red', icon: 'i-heroicons-x-circle' })
    } finally {
        testing.value = false
    }
}

onMounted(() => {
    fetchSettings()
    checkWaStatus()
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
