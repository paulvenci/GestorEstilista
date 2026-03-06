<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="w-12 h-12 mx-auto mb-4 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-500">Cargando datos de tu cita...</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="text-center py-20">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </div>
        <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-2">Enlace inválido</h2>
        <p class="text-gray-500">{{ errorMsg }}</p>
      </div>

      <!-- Appointment Data -->
      <div v-else-if="appointment" class="space-y-6">
        <!-- Header -->
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
               :class="confirmed ? 'bg-green-100 dark:bg-green-500/10' : 'bg-emerald-100 dark:bg-emerald-500/10'">
            <svg v-if="confirmed" class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <svg v-else class="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ confirmed ? (alreadyConfirmed ? '✅ Cita Confirmada' : '🎉 ¡Confirmada!') : 'Confirma tu Cita' }}
          </h1>
          <p class="text-gray-500 mt-1">{{ appointment.tenant_name }}</p>
        </div>

        <!-- Card de datos -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div class="divide-y divide-gray-100 dark:divide-slate-700">
            <div class="flex items-center gap-4 p-4">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">Cliente</p>
                <p class="font-semibold text-gray-800 dark:text-white">{{ appointment.client_name }}</p>
              </div>
            </div>

            <div class="flex items-center gap-4 p-4">
              <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">Servicio</p>
                <p class="font-semibold text-gray-800 dark:text-white">{{ appointment.service_name }}</p>
              </div>
            </div>

            <div class="flex items-center gap-4 p-4">
              <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">Profesional</p>
                <p class="font-semibold text-gray-800 dark:text-white">{{ appointment.stylist_name }}</p>
              </div>
            </div>

            <div class="flex items-center gap-4 p-4">
              <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">Fecha y Hora</p>
                <p class="font-semibold text-gray-800 dark:text-white">{{ formatDateTime(appointment.start_time) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Botón confirmar -->
        <div v-if="!confirmed">
          <button
            @click="doConfirm"
            :disabled="confirming"
            class="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="confirming" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span>{{ confirming ? 'Confirmando...' : '✅ Confirmar Asistencia' }}</span>
          </button>
        </div>

        <!-- Ya confirmada -->
        <div v-else class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ alreadyConfirmed ? 'Ya habías confirmado esta cita anteriormente.' : '¡Gracias por confirmar! Te esperamos.' }}
          </p>
          <p v-if="appointment.confirmed_at" class="text-xs text-gray-400 mt-2">
            Confirmada el {{ formatDateTime(appointment.confirmed_at) }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-xs text-slate-400">Powered by <span class="text-emerald-500 font-medium">GestorEstilista</span></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ layout: false })

const route = useRoute()
const client = useSupabaseClient()

const loading = ref(true)
const errorMsg = ref('')
const appointment = ref<any>(null)
const confirmed = ref(false)
const alreadyConfirmed = ref(false)
const confirming = ref(false)

const token = computed(() => route.query.token as string)

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cargar datos de la cita SIN confirmarla
const loadAppointmentData = async () => {
  if (!token.value) {
    errorMsg.value = 'No se proporcionó un token de confirmación válido.'
    loading.value = false
    return
  }

  try {
    const { data, error } = await client.rpc('get_appointment_by_token', {
      p_token: token.value
    })

    if (error) throw error

    if (!data?.success) {
      errorMsg.value = data?.message || 'Cita no encontrada.'
      return
    }

    appointment.value = data.appointment

    if (data.already_confirmed) {
      confirmed.value = true
      alreadyConfirmed.value = true
    }
  } catch (e: any) {
    errorMsg.value = e.message || 'Error al cargar la cita.'
  } finally {
    loading.value = false
  }
}

// Confirmar la cita via RPC
const doConfirm = async () => {
  confirming.value = true
  try {
    const { data, error } = await client.rpc('confirm_appointment', {
      p_token: token.value
    })

    if (error) throw error

    if (data?.success) {
      confirmed.value = true
      if (data.appointment) {
        appointment.value = { ...appointment.value, ...data.appointment, confirmed_at: data.appointment.confirmed_at }
      }
    } else {
      errorMsg.value = data?.message || 'Error al confirmar.'
    }
  } catch (e: any) {
    console.error('Error confirmando:', e)
    errorMsg.value = 'Error al confirmar la cita.'
  } finally {
    confirming.value = false
  }
}

useHead({
  title: 'Confirmar Cita | GestorEstilista',
  meta: [{ name: 'description', content: 'Confirma tu cita online.' }]
})

onMounted(() => {
  loadAppointmentData()
})
</script>
