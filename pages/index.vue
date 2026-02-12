<template>
  <div class="h-full flex flex-col p-4">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 md:mb-4 gap-2">
      <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Agenda</h1>
      <div class="flex gap-2 w-full md:w-auto">
         <USelect v-model="selectedStylist" :options="stylistOptions" placeholder="Filtrar..." class="flex-1 md:w-48" clearable />
         <UButton icon="i-heroicons-plus" label="Nueva" color="emerald" @click="openNew" class="shrink-0" />
      </div>
    </div>

    <div class="flex-1 bg-white dark:bg-slate-900 rounded-lg shadow border border-slate-200 dark:border-slate-800 p-1 md:p-2 overflow-hidden">
      <ClientOnly>
        <FullCalendar ref="calendarRef" :options="calendarOptions" class="h-full" />
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
const calendarRef = ref(null)
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

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
const stylistOptions = computed(() => {
    return stylists.value.map(s => ({ label: s.full_name, value: s.id }))
})

// Calendar Configuration
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: isMobile.value ? 'listDay' : 'timeGridWeek',
  headerToolbar: {
    left: isMobile.value ? 'prev,next' : 'prev,next today',
    center: 'title',
    right: isMobile.value ? 'timeGridDay,listDay' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
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
        
        const isCompleted = apt.status === 'completed'
        const isCancelled = apt.status === 'cancelled' // Though usually filtered out
        
        return {
            id: apt.id,
            title: `${clientName} - ${serviceName} (${stylistName})`,
            start: apt.start_time,
            end: apt.end_time,
            backgroundColor: isCompleted ? '#10b981' : color, // Emerald if completed
            borderColor: isCompleted ? '#059669' : color,
            textColor: '#fff',
            extendedProps: { ...apt }
        }
    })
})

const fetchData = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

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

  // Load Appointments (Range: +/- 1 month from current view ideally, but load all for now or optimize later)
  // For MVP, loading 'future' and 'recent past' is enough. 
  // FullCalendar fetches on demand if configured as function, but simple array binding is easier for now.
  
  // Let's load current month +/- 1
  const { data } = await client.from('appointments').select('*').neq('status', 'cancelled')
  appointments.value = data || []
}

// Handlers
const handleDateSelect = (selectInfo) => {
    selectedAppointment.value = {
        start_time: selectInfo.startStr,
        end_time: selectInfo.endStr,
        stylist_id: selectedStylist.value || undefined // Pre-select if filtered
    }
    isModalOpen.value = true
    selectInfo.view.calendar.unselect()
}

const handleEventClick = (clickInfo) => {
    selectedAppointment.value = { ...clickInfo.event.extendedProps }
    isModalOpen.value = true
}

const handleEventDrop = async (info) => {
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
        // Update local state implicitly or refresh?
        // Let's just update local object to avoid flicker
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
const getStylistColor = (id: string) => {
    // Simple hash to color
    if (!id) return '#64748b'
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
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
    height: 3rem !important; /* Taller slots */
}
</style>
