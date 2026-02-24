<template>
  <div class="h-full flex flex-col p-4">
    <div class="flex items-center justify-between mb-2 md:mb-4 gap-2">
      <div class="flex items-center gap-2">
        <h1 class="hidden md:block text-2xl font-bold text-slate-900 dark:text-white shrink-0">Agenda</h1>
        <USelectMenu 
            v-model="selectedStylist" 
            :options="stylistOptions" 
            placeholder="Filtrar por estilista..." 
            class="w-40 md:w-64" 
            size="sm"
            option-attribute="label"
            value-attribute="value"
        >
            <template #label>
                <div v-if="selectedStylist" class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getStylistColor(selectedStylist) }"></span>
                    <span class="truncate">{{ stylists.find(s => s.id === selectedStylist)?.full_name }}</span>
                </div>
                <span v-else class="text-gray-400">Todos los estilistas</span>
            </template>

            <template #option="{ option }">
                <div class="flex items-center gap-2">
                    <span v-if="option.value" class="w-2 h-2 rounded-full" :style="{ backgroundColor: option.color }"></span>
                    <span class="truncate">{{ option.label }}</span>
                </div>
            </template>
        </USelectMenu>
      </div>
      <UButton icon="i-heroicons-plus" label="Nueva" color="emerald" size="sm" @click="openNew" class="shrink-0" />
      <div class="flex items-center gap-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-0.5 ml-2">
          <UButton icon="i-heroicons-minus-circle" variant="ghost" color="gray" size="xs" @click="zoomOut" :disabled="zoomLevel <= 1" />
          <span class="text-xs font-medium w-8 text-center">{{ Math.round(zoomLevel * 100 / 3) }}%</span>
          <UButton icon="i-heroicons-plus-circle" variant="ghost" color="gray" size="xs" @click="zoomIn" :disabled="zoomLevel >= 6" />
      </div>
    </div>

    <div class="flex-1 bg-white dark:bg-slate-900 rounded-lg shadow border border-slate-200 dark:border-slate-800 p-1 md:p-2 overflow-hidden flex flex-col">
      <!-- Custom Mobile Header -->
      <div v-if="isMobile" class="flex flex-col p-2 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <UButton icon="i-heroicons-chevron-left" variant="ghost" color="gray" size="sm" @click="prevDay" />
                <div class="relative">
                    <UButton 
                        variant="ghost" 
                        color="gray" 
                        class="font-bold text-slate-900 dark:text-white px-1 text-xs text-left leading-tight"
                        :label="currentDateTitle"
                        icon="i-heroicons-calendar-days"
                        @click="showDatePicker = true"
                    />
                    <input 
                        type="date" 
                        ref="dateInput" 
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        @change="handleDateChange"
                        :value="currentDateISO"
                    />
                </div>
                <UButton icon="i-heroicons-chevron-right" variant="ghost" color="gray" size="sm" @click="nextDay" />
            </div>
            <UButton 
                variant="solid" 
                size="xs" 
                color="emerald"
                label="Hoy" 
                @click="goToday" 
            />
        </div>
        
        <div class="flex justify-center">
            <UButtonGroup size="xs" orientation="horizontal" class="w-full">
                <UButton 
                    :color="calendarView === (isMobile ? 'listDay' : 'timeGridDay') ? 'emerald' : 'gray'" 
                    variant="soft" 
                    label="Día" 
                    class="flex-1"
                    @click="changeView(isMobile ? 'listDay' : 'timeGridDay')" 
                />
                <UButton 
                    :color="calendarView === 'timeGridWeek' ? 'emerald' : 'gray'" 
                    variant="soft" 
                    label="Semana" 
                    class="flex-1"
                    @click="changeView('timeGridWeek')" 
                />
                <UButton 
                    :color="calendarView === 'dayGridMonth' ? 'emerald' : 'gray'" 
                    variant="soft" 
                    label="Mes" 
                    class="flex-1"
                    @click="changeView('dayGridMonth')" 
                />
            </UButtonGroup>
        </div>
      </div>

      <ClientOnly>
        <FullCalendar ref="calendarRef" :options="calendarOptions" class="flex-1" :style="{ '--slot-height': `${zoomLevel}rem` }">
            <template #eventContent="{ event, timeText, view }">
                <div class="w-full h-full overflow-visible relative cursor-pointer">
                    <UPopover mode="hover" :popper="{ placement: 'auto', strategy: 'fixed' }" :ui="{ width: 'max-w-xs' }" class="pointer-events-none">
                        <div class="w-full h-full overflow-hidden flex flex-col leading-tight cursor-pointer" :class="view.type.includes('list') ? 'flex-row items-center gap-2' : ''">
                            <!-- Time -->
                            <div v-if="!view.type.includes('list')" class="flex justify-between items-center mb-0.5">
                                <span class="text-[10px] font-bold opacity-90">{{ timeText }}</span>
                                <!-- Status Badge -->
                                <div class="flex items-center bg-black/20 rounded-full px-1">
                                    <UIcon v-if="event.extendedProps.status === 'completed'" name="i-heroicons-check-circle" class="w-3 h-3 text-white" />
                                    <UIcon v-else-if="event.extendedProps.status === 'cancelled'" name="i-heroicons-x-circle" class="w-3 h-3 text-white" />
                                    <UIcon v-else-if="event.extendedProps.status === 'confirmed'" name="i-heroicons-check" class="w-3 h-3 text-white" />
                                    <UIcon v-else name="i-heroicons-clock" class="w-3 h-3 text-white/80" />
                                </div>
                            </div>
                            
                            <div class="font-semibold truncate text-[11px] flex-1">
                                {{ event.title }}
                                <span v-if="view.type.includes('list')" class="inline-flex items-center ml-2">
                                    <UBadge v-if="event.extendedProps.status === 'completed'" color="green" size="xs">Completada</UBadge>
                                    <UBadge v-else-if="event.extendedProps.status === 'cancelled'" color="red" size="xs">Cancelada</UBadge>
                                </span>
                            </div>
                        </div>

                        <template #panel>
                            <div class="p-3 text-sm max-w-xs space-y-2 relative z-50 bg-white dark:bg-slate-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div class="flex items-center justify-between border-b pb-1 mb-1 border-gray-200 dark:border-gray-700">
                                    <span class="font-bold text-gray-900 dark:text-white">{{ event.extendedProps.client_name }}</span>
                                    <UBadge :color="event.extendedProps.status === 'completed' ? 'green' : event.extendedProps.status === 'cancelled' ? 'red' : 'gray'" size="xs">
                                        {{ event.extendedProps.status === 'completed' ? 'Completada' : event.extendedProps.status === 'cancelled' ? 'Cancelada' : event.extendedProps.status === 'confirmed' ? 'Confirmada' : 'Pendiente' }}
                                    </UBadge>
                                </div>
                                <div class="space-y-1 text-gray-600 dark:text-gray-300">
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-heroicons-scissors" class="w-4 h-4" />
                                        <span>{{ event.extendedProps.service_name }}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-heroicons-user" class="w-4 h-4" />
                                        <span>{{ event.extendedProps.stylist_name }}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                                        <span>{{ new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }} - {{ new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                                    </div>
                                    <div v-if="event.extendedProps.notes" class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs italic">
                                        "{{ event.extendedProps.notes }}"
                                    </div>
                                </div>
                            </div>
                        </template>
                    </UPopover>
                </div>
            </template>
        </FullCalendar>
        <template #fallback>
          <div class="flex items-center justify-center h-full">
             <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-gray-400" />
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Modal -->
    <AppointmentModal
      v-model="isModalOpen"
      :stylists="stylists"
      :services="services"
      :products="products"
      :clients="clients"
      :initial-data="selectedAppointment"
      @refresh="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import esLocale from '@fullcalendar/core/locales/es'
import { useWindowSize } from '@vueuse/core'

const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Agenda')
// Force update on client-side navigation
headerTitle.value = 'Agenda'
const calendarRef = ref(null)
const dateInput = ref(null)
const showDatePicker = ref(false)
const calendarView = ref('listDay')
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

// Zoom
const zoomLevel = ref(3) // Default 3rem
const zoomIn = () => {
    if (zoomLevel.value < 6) zoomLevel.value += 0.5
}
const zoomOut = () => {
    if (zoomLevel.value > 1.5) zoomLevel.value -= 0.5
}

watch(zoomLevel, () => {
    // Allow CSS to update first
    setTimeout(() => {
        calendarRef.value?.getApi().updateSize()
    }, 100)
})

// Dynamic Title and Date for Custom Header
const currentDateTitle = ref('')
const currentDateISO = ref(new Date().toISOString().split('T')[0])

const updateTitle = () => {
    if (calendarRef.value) {
        const api = calendarRef.value.getApi()
        currentDateTitle.value = api.view.title
        currentDateISO.value = api.getDate().toISOString().split('T')[0]
    }
}

const changeView = (view: string) => {
    calendarView.value = view
    calendarRef.value?.getApi().changeView(view)
    updateTitle()
}

const prevDay = () => {
    calendarRef.value?.getApi().prev()
    updateTitle()
}
const nextDay = () => {
    calendarRef.value?.getApi().next()
    updateTitle()
}
const goToday = () => {
    calendarRef.value?.getApi().today()
    updateTitle()
}
const handleDateChange = (e: any) => {
    const date = e.target.value
    if (date) {
        calendarRef.value?.getApi().gotoDate(date)
        updateTitle()
    }
    showDatePicker.value = false
}

// Data
const stylists = ref([])
const services = ref([])
const products = ref([])
const clients = ref([])
const appointments = ref([])
const selectedStylist = ref(null)

// Modal
const isModalOpen = ref(false)
const selectedAppointment = ref(null)

// Computed Options for Select
// Computed Options for Select
const stylistOptions = computed(() => {
    const list = stylists.value.map(s => ({ 
        label: s.full_name, 
        value: s.id,
        color: getStylistColor(s.id) 
    }))
    return [{ label: 'Todos los estilistas', value: '', color: null }, ...list]
})

// Calendar Configuration
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: isMobile.value ? 'listDay' : 'timeGridWeek',
  headerToolbar: isMobile.value ? false : {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  },
  locale: esLocale,
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  allDaySlot: false,
  slotMinTime: '08:00:00',
  slotMaxTime: '21:00:00',
  height: '100%',
  events: filteredEvents.value,
  
  // Handlers
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventDrop,
  datesSet: updateTitle, 
  
  // Visuals
  titleFormat: isMobile.value ? { year: 'numeric', month: 'short', day: 'numeric' } : { year: 'numeric', month: 'long', day: 'numeric' }
}))

// Event Mapping
const filteredEvents = computed(() => {
    let source = appointments.value
    
    if (selectedStylist.value) {
        source = source.filter(a => a.stylist_id === selectedStylist.value)
    }

    return source.map(apt => {
        // Find stylist color or generate distinct color?
        // Let's use a hashed color based on stylist_id for consistency
        const color = getStylistColor(apt.stylist_id)
        const clientName = clients.value.find(c => c.id === apt.client_id)?.full_name || 'Desconocido'
        const serviceName = services.value.find(s => s.id === apt.service_id)?.name || 'Servicio'
        const stylistName = stylists.value.find(s => s.id === apt.stylist_id)?.full_name || ''
        
        return {
            id: apt.id,
            title: `${clientName} - ${serviceName}`,
            start: apt.start_time,
            end: apt.end_time,
            backgroundColor: color, 
            borderColor: color,
            textColor: '#fff',
            extendedProps: { 
                ...apt, 
                stylist_name: stylistName,
                client_name: clientName,
                service_name: serviceName
            }
        }
    })
})

const currentUserProfile = ref(null)

const fetchData = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  // Load User Profile to check role
  const { data: profile } = await client.from('profiles').select('*').eq('id', user.id).single()
  currentUserProfile.value = profile

  // Load Catalogs
  const [pRes, sRes, cRes, prodRes] = await Promise.all([
      client.from('profiles').select('*'),
      client.from('services').select('*').eq('active', true),
      client.from('clients').select('*'),
      client.from('products').select('*').eq('active', true)
  ])
  
  stylists.value = pRes.data || []
  services.value = sRes.data || []
  clients.value = cRes.data || []
  products.value = prodRes.data || []

  // Load Appointments
  const { data } = await client.from('appointments').select('*, appointment_items(*)').neq('status', 'cancelled')
  appointments.value = data || []
}

// Handlers
const handleDateSelect = (selectInfo) => {
    // Check if user has permission to create appointments (usually yes, for themselves)
    // If stylist, pre-fill their own ID?
    // Let's allow creation for now, filtering usually happens on saving or via UI hints
    
    selectedAppointment.value = {
        start_time: selectInfo.startStr,
        end_time: selectInfo.endStr,
        stylist_id: selectedStylist.value || (currentUserProfile.value?.role === 'stylist' ? currentUserProfile.value.id : undefined)
    }
    isModalOpen.value = true
    selectInfo.view.calendar.unselect()
}

const handleEventClick = (clickInfo) => {
    const apt = clickInfo.event.extendedProps
    const user = currentUserProfile.value

    if (!user) return

    const isAdminOrReceptionist = ['admin', 'superadmin', 'receptionist'].includes(user.role)
    const isOwner = apt.stylist_id === user.id

    if (!isAdminOrReceptionist && !isOwner) {
        useToast().add({
            title: 'Acceso Denegado',
            description: 'Solo puedes modificar tus propias citas.',
            color: 'red',
            icon: 'i-heroicons-lock-closed'
        })
        return
    }

    selectedAppointment.value = { ...apt }
    isModalOpen.value = true
}

const handleEventDrop = async (info) => {
    const apt = info.event.extendedProps
    const user = currentUserProfile.value

    if (!user) {
        info.revert()
        return
    }

    const isAdminOrReceptionist = ['admin', 'superadmin', 'receptionist'].includes(user.role)
    const isOwner = apt.stylist_id === user.id

    if (!isAdminOrReceptionist && !isOwner) {
        useToast().add({
            title: 'Acceso Denegado',
            description: 'No tienes permiso para mover esta cita.',
            color: 'red',
            icon: 'i-heroicons-lock-closed'
        })
        info.revert()
        return
    }

    if (!confirm(`¿Mover cita a ${info.event.start.toLocaleString()}?`)) {
        info.revert()
        return
    }

    const { error } = await client.from('appointments').update({
        start_time: info.event.start.toISOString(),
        end_time: info.event.end.toISOString()
    }).eq('id', info.event.id)

    if (error) {
        alert('Error al mover cita: ' + error.message)
        info.revert()
    } else {
        // Update local object to avoid flicker
        const idx = appointments.value.findIndex(a => a.id === info.event.id)
        if (idx !== -1) {
            appointments.value[idx].start_time = info.event.start.toISOString()
            appointments.value[idx].end_time = info.event.end.toISOString()
        }
    }
}

const openNew = () => {
    selectedAppointment.value = null
    isModalOpen.value = true
}

// Color Utility
// Color Utility
const STYLIST_COLORS = [
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f43f5e', // Rose
    '#84cc16', // Lime
    '#6366f1', // Indigo
    '#14b8a6', // Teal
]

const getStylistColor = (id: string) => {
    if (!id) return '#64748b' // Slate-500 for "All" or unknown
    
    // Find index in the stylists array (sorted) to assign consistent color
    const index = stylists.value.findIndex(s => s.id === id)
    if (index === -1) {
         // Fallback to hash if not found in list yet
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return STYLIST_COLORS[Math.abs(hash) % STYLIST_COLORS.length]
    }
    
    return STYLIST_COLORS[index % STYLIST_COLORS.length]
}

onMounted(() => {
    fetchData()
})
</script>

<style>
/* FullCalendar Overrides for Dark Mode & Tailwind Match */
:root {
  --fc-border-color: #e2e8f0;
  --fc-page-bg-color: #ffffff;
  --fc-neutral-bg-color: #f8fafc;
  --fc-list-event-hover-bg-color: #f1f5f9;
}

.dark {
  --fc-border-color: #1e293b;
  --fc-page-bg-color: #0f172a;
  --fc-neutral-bg-color: #1e293b;
  --fc-list-event-hover-bg-color: #334155;
  --fc-today-bg-color: #1e293b !important;
}

.fc .fc-toolbar-title {
  font-size: 1.25rem;
  font-weight: 700;
}

/* Mobile Adjustments */
@media (max-width: 768px) {
    .fc .fc-toolbar-title {
        font-size: 1rem !important; /* Smaller title */
        font-weight: 600;
    }
    
    .fc .fc-toolbar {
        flex-direction: row !important; /* Force row */
        justify-content: space-between !important;
        gap: 0.5rem;
        margin-bottom: 0.5rem !important;
    }

    .fc .fc-button {
        padding: 0.25rem 0.5rem !important;
        font-size: 0.75rem !important; /* Smaller buttons */
    }
}

.fc .fc-col-header-cell-cushion {
    text-decoration: none;
    color: inherit;
    font-weight: 600;
}

.fc-timegrid-slot {
    height: var(--slot-height) !important; /* Dynamic height */
}
</style>
