<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
    <!-- Header -->
    <header class="border-b border-slate-200 dark:border-white/10 backdrop-blur-sm bg-white/80 dark:bg-white/5">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-900 dark:text-white">{{ tenantName }}</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">Agenda tu cita online</p>
          </div>
        </div>
        <ColorModeButton />
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-lg mx-auto px-4 py-20 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
      </div>
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2">No encontrado</h2>
      <p class="text-slate-500 dark:text-slate-400">{{ error }}</p>
    </div>

    <!-- Main Content -->
    <main v-else class="max-w-3xl mx-auto px-4 py-8">
      <!-- Stepper -->
      <div class="flex items-center justify-center mb-10 gap-2">
        <template v-for="(label, idx) in stepLabels" :key="idx">
          <div 
            class="flex items-center gap-2 cursor-pointer transition-all"
            :class="idx <= step ? 'opacity-100' : 'opacity-40'"
            @click="idx < step ? step = idx : null"
          >
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              :class="idx < step ? 'bg-emerald-500 text-white' : idx === step ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'"
            >
              <svg v-if="idx < step" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <span class="text-sm font-medium hidden sm:inline" :class="idx <= step ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'">{{ label }}</span>
          </div>
          <div v-if="idx < stepLabels.length - 1" class="w-8 h-px" :class="idx < step ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'"></div>
        </template>
      </div>

      <!-- Step 1: Select Professional -->
      <div v-if="step === 0" class="space-y-4">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Elige tu profesional</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Selecciona con qui├®n deseas agendar tu cita.</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            v-for="stylist in stylists"
            :key="stylist.id"
            @click="selectStylist(stylist)"
            class="group relative p-5 rounded-2xl border-2 transition-all text-left"
            :class="selectedStylist?.id === stylist.id 
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
              : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm'"
          >
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {{ stylist.full_name?.charAt(0) || '?' }}
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-white text-lg">{{ stylist.full_name }}</h3>
                <p class="text-sm text-emerald-400" v-if="stylist.specialties?.name">{{ stylist.specialties.name }}</p>
                <p class="text-xs text-slate-500" v-if="stylist.branches?.name">­ƒôì {{ stylist.branches.name }}</p>
              </div>
            </div>
            <div v-if="selectedStylist?.id === stylist.id" class="absolute top-3 right-3">
              <div class="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Step 2: Select Service -->
      <div v-if="step === 1" class="space-y-4">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Elige el servicio</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Servicios disponibles para {{ selectedStylist?.full_name }}.</p>
        
        <div class="space-y-3">
          <button
            v-for="svc in filteredServices"
            :key="svc.id"
            @click="selectService(svc)"
            class="w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between"
            :class="selectedService?.id === svc.id 
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
              : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm'"
          >
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">{{ svc.name }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                <span class="inline-flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {{ svc.duration_min }} min
                </span>
              </p>
            </div>
            <div class="text-right">
              <span class="text-xl font-bold text-emerald-400">${{ Number(svc.price).toLocaleString() }}</span>
            </div>
          </button>
        </div>

        <div v-if="filteredServices.length === 0" class="text-center py-10">
          <p class="text-slate-500 dark:text-slate-400">No hay servicios disponibles para este profesional.</p>
        </div>
      </div>

      <!-- Step 3: Select Date & Time -->
      <div v-if="step === 2" class="space-y-6">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Selecciona fecha y hora</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">{{ selectedService?.name }} con {{ selectedStylist?.full_name }} ({{ selectedService?.duration_min }} min)</p>
        
        <!-- Date Picker -->
        <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Fecha</label>
          <input 
            type="date" 
            v-model="selectedDate"
            :min="todayStr"
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <!-- Time Slots -->
        <div v-if="selectedDate" class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Hora disponible</label>
          
          <div v-if="loadingSlots" class="flex items-center justify-center py-8">
            <div class="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
            <span class="ml-3 text-slate-500 dark:text-slate-400 text-sm">Cargando horarios...</span>
          </div>

          <div v-else-if="dayClosed" class="text-center py-8">
            <p class="text-slate-500 dark:text-slate-400">­ƒÜ½ Cerrado este d├¡a. Selecciona otra fecha.</p>
          </div>
          
          <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            <button
              v-for="slot in timeSlots"
              :key="slot.time"
              @click="slot.available ? selectedTime = slot.time : null"
              :disabled="!slot.available"
              class="py-2.5 px-3 rounded-lg text-sm font-medium transition-all"
              :class="
                selectedTime === slot.time
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-500/30'
                  : slot.available
                    ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed line-through border border-slate-200 dark:border-white/5'
              "
            >
              {{ slot.time }}
            </button>
          </div>

          <div v-if="timeSlots.length === 0 && !loadingSlots && !dayClosed" class="text-center py-8">
            <p class="text-slate-500 dark:text-slate-400">No hay horarios configurados para este d├¡a.</p>
          </div>
        </div>
      </div>

      <!-- Step 4: Client Info -->
      <div v-if="step === 3" class="space-y-4">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tus datos</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Completa tus datos para confirmar la cita.</p>
        
        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre completo *</label>
            <input 
              v-model="clientForm.name" 
              type="text"
              placeholder="Ej: Mar├¡a L├│pez"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Correo electr├│nico</label>
            <input 
              v-model="clientForm.email" 
              type="email"
              placeholder="Ej: maria@gmail.com"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tel├®fono *</label>
            <input 
              v-model="clientForm.phone" 
              type="tel"
              placeholder="Ej: +56 9 1234 5678"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notas (opcional)</label>
            <textarea 
              v-model="clientForm.notes" 
              rows="2"
              placeholder="Algo que debamos saber..."
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Step 5: Confirmation -->
      <div v-if="step === 4" class="space-y-6">
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">┬íCita agendada!</h2>
          <p class="text-slate-500 dark:text-slate-400">{{ confirmationMessage }}</p>
        </div>

        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <h3 class="font-semibold text-slate-900 dark:text-white text-lg mb-3">Resumen de tu cita</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Profesional</span><span class="text-slate-900 dark:text-white font-medium">{{ selectedStylist?.full_name }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Servicio</span><span class="text-slate-900 dark:text-white font-medium">{{ selectedService?.name }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Fecha</span><span class="text-slate-900 dark:text-white font-medium">{{ formatDate(selectedDate) }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Hora</span><span class="text-slate-900 dark:text-white font-medium">{{ selectedTime }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Duraci├│n</span><span class="text-slate-900 dark:text-white font-medium">{{ selectedService?.duration_min }} min</span></div>
            <hr class="border-white/10">
            <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Cliente</span><span class="text-slate-900 dark:text-white font-medium">{{ clientForm.name }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Tel├®fono</span><span class="text-slate-900 dark:text-white font-medium">{{ clientForm.phone }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Estado</span><span class="text-amber-400 font-medium">ÔÅ│ Pendiente de confirmaci├│n</span></div>
          </div>
        </div>

        <button 
          @click="resetAll"
          class="w-full py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
        >
          Agendar otra cita
        </button>
      </div>

      <!-- Navigation Buttons -->
      <div v-if="step < 4" class="flex justify-between mt-10">
        <button 
          v-if="step > 0" 
          @click="step--"
          class="px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
        >
          ÔåÉ Atr├ís
        </button>
        <div v-else></div>

        <button
          v-if="step < 3"
          @click="nextStep"
          :disabled="!canProceed"
          class="px-8 py-3 rounded-xl font-semibold transition-all"
          :class="canProceed 
            ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' 
            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'"
        >
          Continuar ÔåÆ
        </button>

        <button
          v-if="step === 3"
          @click="submitBooking"
          :disabled="!canSubmit || submitting"
          class="px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
          :class="canSubmit && !submitting
            ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' 
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
        >
          <div v-if="submitting" class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          {{ submitting ? 'Agendando...' : 'Confirmar cita' }}
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="submitError" class="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <p class="text-red-400 text-sm">{{ submitError }}</p>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 dark:border-white/5 mt-20">
      <div class="max-w-3xl mx-auto px-4 py-6 text-center">
        <p class="text-xs text-slate-400 dark:text-slate-600">Powered by <span class="text-emerald-500 font-medium">GestorEstilista</span></p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

definePageMeta({ layout: false })

const route = useRoute()
const slug = route.params.slug as string

const loading = ref(true)
const error = ref('')
const tenantName = ref('')
const tenantId = ref('')
const step = ref(0)
const stepLabels = ['Profesional', 'Servicio', 'Fecha y Hora', 'Tus Datos']

// Data
const stylists = ref<any[]>([])
const services = ref<any[]>([])
const selectedStylist = ref<any>(null)
const selectedService = ref<any>(null)
const selectedDate = ref('')
const selectedTime = ref('')
const timeSlots = ref<{ time: string, available: boolean }[]>([])
const loadingSlots = ref(false)
const dayClosed = ref(false)
const submitting = ref(false)
const submitError = ref('')
const confirmationMessage = ref('')

const clientForm = reactive({
  name: '',
  email: '',
  phone: '',
  notes: ''
})

const todayStr = computed(() => {
  const d = new Date()
  return d.toISOString().split('T')[0]
})

// Filter services by stylist's specialty
const filteredServices = computed(() => {
  if (!selectedStylist.value) return []
  const specialtyId = selectedStylist.value.specialty_id
  if (specialtyId) {
    // Show services matching this specialty + services without specialty
    return services.value.filter((s: any) => s.specialty_id === specialtyId || !s.specialty_id)
  }
  // If stylist has no specialty, show all services
  return services.value
})

const canProceed = computed(() => {
  if (step.value === 0) return !!selectedStylist.value
  if (step.value === 1) return !!selectedService.value
  if (step.value === 2) return !!selectedDate.value && !!selectedTime.value
  return false
})

const canSubmit = computed(() => {
  return clientForm.name.trim() && clientForm.phone.trim()
})

// Fetch tenant + stylists + services on load
const fetchData = async () => {
  try {
    const client = useSupabaseClient()
    
    // Get tenant by slug
    const { data: tenant, error: tErr } = await client
      .from('tenants')
      .select('id, name, status')
      .eq('slug', slug)
      .single()

    if (tErr || !tenant) {
      error.value = 'Este negocio no fue encontrado.'
      return
    }

    if (tenant.status !== 'active') {
      error.value = 'Este negocio no est├í disponible en este momento.'
      return
    }

    tenantName.value = tenant.name
    tenantId.value = tenant.id

    // Get stylists for this tenant
    const { data: stylistData } = await client
      .from('profiles')
      .select('id, full_name, specialty_id, specialties ( name ), branch_id, branches ( name )')
      .eq('tenant_id', tenant.id)
      .in('role', ['stylist', 'admin'])

    if (stylistData) stylists.value = stylistData

    // Get active services for this tenant
    const { data: serviceData } = await client
      .from('services')
      .select('id, name, duration_min, price, specialty_id')
      .eq('tenant_id', tenant.id)
      .eq('active', true)

    if (serviceData) services.value = serviceData
  } catch (e: any) {
    error.value = 'Error al cargar los datos.'
  } finally {
    loading.value = false
  }
}

const selectStylist = (stylist: any) => {
  selectedStylist.value = stylist
  // Reset downstream selections
  selectedService.value = null
  selectedDate.value = ''
  selectedTime.value = ''
  step.value = 1
}

const selectService = (svc: any) => {
  selectedService.value = svc
  selectedDate.value = ''
  selectedTime.value = ''
  step.value = 2
}

const nextStep = () => {
  if (canProceed.value) step.value++
}

// Fetch availability when date changes
watch(() => selectedDate.value, async (newDate) => {
  if (!newDate || !selectedStylist.value) return
  selectedTime.value = ''
  loadingSlots.value = true
  dayClosed.value = false
  timeSlots.value = []

  try {
    const data: any = await $fetch('/api/public/availability', {
      params: {
        tenant_slug: slug,
        stylist_id: selectedStylist.value.id,
        date: newDate
      }
    })

    if (data.closed) {
      dayClosed.value = true
    } else {
      timeSlots.value = data.slots || []
    }
  } catch (e: any) {
    timeSlots.value = []
  } finally {
    loadingSlots.value = false
  }
})

const submitBooking = async () => {
  submitting.value = true
  submitError.value = ''

  try {
    const startTime = `${selectedDate.value}T${selectedTime.value}:00`

    const data: any = await $fetch('/api/public/book', {
      method: 'POST',
      body: {
        tenant_slug: slug,
        stylist_id: selectedStylist.value.id,
        service_id: selectedService.value.id,
        start_time: startTime,
        client_name: clientForm.name,
        client_email: clientForm.email || null,
        client_phone: clientForm.phone,
        notes: clientForm.notes || null
      }
    })

    confirmationMessage.value = data.message || 'Su cita ha sido agendada exitosamente.'
    step.value = 4
  } catch (e: any) {
    submitError.value = e.data?.statusMessage || e.message || 'Error al agendar la cita. Intenta nuevamente.'
  } finally {
    submitting.value = false
  }
}

const resetAll = () => {
  step.value = 0
  selectedStylist.value = null
  selectedService.value = null
  selectedDate.value = ''
  selectedTime.value = ''
  clientForm.name = ''
  clientForm.email = ''
  clientForm.phone = ''
  clientForm.notes = ''
  submitError.value = ''
  confirmationMessage.value = ''
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// Head meta
useHead({
  title: `Agendar Cita | ${tenantName.value || 'Reserva Online'}`,
  meta: [
    { name: 'description', content: 'Agenda tu cita online de forma r├ípida y sencilla.' }
  ]
})

// Fetch on mount
fetchData()
</script>
