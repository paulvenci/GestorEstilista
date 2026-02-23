<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div class="hidden md:block">
        <h1 class="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Servicios</h1>
        <p class="text-slate-500 dark:text-slate-400">Administra el catálogo de servicios del salón</p>
      </div>
      <UButton v-if="userRole === 'admin'" label="Nuevo Servicio" icon="i-heroicons-plus" color="emerald" @click="openNew" />
    </div>

    <UCard :ui="{ background: 'bg-white dark:bg-slate-900', ring: 'ring-1 ring-slate-200 dark:ring-slate-800' }">
      <UTable 
        :rows="services" 
        :columns="columns" 
        :loading="loading"
        :ui="{ divide: 'divide-y divide-slate-200 dark:divide-slate-800', th: { color: 'text-slate-900 dark:text-white' }, td: { color: 'text-slate-500 dark:text-slate-400' } }"
      >
        <template #price-data="{ row }">
          <span class="font-medium text-slate-900 dark:text-white">{{ formatCurrency(row.price) }}</span>
        </template>
        
        <template #duration_min-data="{ row }">
          <span class="text-slate-500">{{ row.duration_min }} min</span>
        </template>

        <template #commission_rate-data="{ row }">
          <span class="font-medium text-slate-700 dark:text-slate-300">{{ row.commission_rate || 0 }}%</span>
        </template>

        <template #active-data="{ row }">
          <UBadge :color="row.active ? 'emerald' : 'gray'" variant="subtle" size="xs">{{ row.active ? 'Activo' : 'Inactivo' }}</UBadge>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton icon="i-heroicons-pencil-square" size="xs" color="blue" variant="ghost" @click="openEdit(row)" />
            <UButton icon="i-heroicons-trash" size="xs" color="red" variant="ghost" @click="deleteService(row)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <ServiceModal v-model="isModalOpen" :initial-data="selectedService" @saved="fetchServices" />
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Catálogo')
headerTitle.value = 'Catálogo'
const loading = ref(false)
const services = ref([])
const isModalOpen = ref(false)
const selectedService = ref(null)

const userRole = useState('userRole')

const columns = computed(() => {
  const cols = [
    { key: 'name', label: 'Nombre' },
    { key: 'duration_min', label: 'Duración' },
    { key: 'price', label: 'Precio' },
    { key: 'commission_rate', label: '% Ganancia' },
    { key: 'active', label: 'Estado' }
  ]
  if (userRole.value === 'admin') {
    cols.push({ key: 'actions', label: 'Acciones' })
  }
  return cols
})

const fetchServices = async () => {
    loading.value = true
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
        loading.value = false
        return
    }

    const { data, error } = await client
        .from('services')
        .select('*')
        .order('name')
    
    if (data) services.value = data
    loading.value = false
}

const openNew = () => {
    if (userRole.value !== 'admin') return
    selectedService.value = null
    isModalOpen.value = true
}

const openEdit = (service) => {
    if (userRole.value !== 'admin') return
    selectedService.value = { ...service }
    isModalOpen.value = true
}

const deleteService = async (service) => {
    if (userRole.value !== 'admin') return
    if (!confirm('¿Estás seguro de eliminar este servicio? Si ya tiene citas asociadas, es mejor desactivarlo.')) return

    const { error } = await client.from('services').delete().eq('id', service.id)
    if (error) {
        alert('Error al eliminar: ' + error.message)
    } else {
        fetchServices()
    }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val)
}

onMounted(() => {
    fetchServices()
})
</script>
