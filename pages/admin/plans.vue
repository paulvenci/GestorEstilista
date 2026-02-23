<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div class="hidden md:block">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Planes de Suscripción</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Gestiona los niveles de servicio y precios.</p>
      </div>
      <UButton icon="i-heroicons-plus" label="Nuevo Plan" color="emerald" @click="openModal()" />
    </div>

    <!-- Plans Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard 
        v-for="plan in plans" 
        :key="plan.id" 
        class="border-2 transition-all hover:border-emerald-500 dark:hover:border-emerald-500"
        :class="plan.active ? 'border-transparent' : 'border-slate-200 dark:border-slate-700 opacity-75'"
      >
        <template #header>
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">{{ plan.name }}</h3>
              <div class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ${{ plan.price.toLocaleString() }}
                <span class="text-sm font-normal text-slate-500">/mes</span>
              </div>
            </div>
            <UBadge :color="plan.active ? 'emerald' : 'gray'" variant="subtle">
              {{ plan.active ? 'Activo' : 'Inactivo' }}
            </UBadge>
          </div>
        </template>

        <ul class="space-y-3 text-sm text-slate-600 dark:text-slate-300 mb-6">
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-users" class="text-emerald-500 w-5 h-5" />
            <span v-if="plan.max_users >= 9999">Usuarios Ilimitados</span>
            <span v-else>Hasta {{ plan.max_users }} Usuarios</span>
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-building-storefront" class="text-emerald-500 w-5 h-5" />
            <span v-if="plan.max_branches >= 9999">Sucursales Ilimitadas</span>
            <span v-else>Hasta {{ plan.max_branches }} Sucursales</span>
          </li>
          <li v-if="plan.features?.whatsapp" class="flex items-center gap-2">
            <UIcon name="i-heroicons-chat-bubble-left-right" class="text-emerald-500 w-5 h-5" />
            <span>Notificaciones WhatsApp</span>
          </li>
          <li v-if="plan.features?.dominio_personalizado" class="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
            <span>Dominio Personalizado (.cl)</span>
          </li>
        </ul>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton size="sm" color="gray" variant="ghost" icon="i-heroicons-pencil-square" @click="openModal(plan)" />
          </div>
        </template>
      </UCard>
    </div>

    <!-- Create/Edit Modal -->
    <UModal v-model="isOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ editingPlan ? 'Editar Plan' : 'Nuevo Plan' }}
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
          </div>
        </template>

        <form @submit.prevent="savePlan" class="space-y-4 py-2">
          <UFormGroup label="Nombre del Plan" name="name">
            <UInput v-model="form.name" placeholder="Ej: Enterprise" />
          </UFormGroup>

          <UFormGroup label="Precio Mensual (CLP)" name="price">
            <UInput v-model="form.price" type="number" placeholder="0" />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Máx. Usuarios" name="max_users">
              <UInput v-model="form.max_users" type="number" />
            </UFormGroup>
            <UFormGroup label="Máx. Sucursales" name="max_branches">
              <UInput v-model="form.max_branches" type="number" />
            </UFormGroup>
          </div>

          <div class="space-y-2 border-t pt-4 border-gray-100 dark:border-gray-800">
            <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Características Base</p>
            <div class="grid grid-cols-2 gap-2">
              <UCheckbox v-model="form.features.whatsapp" label="WhatsApp" />
              <UCheckbox v-model="form.features.dominio_personalizado" label="Dominio Propio" />
            </div>
          </div>

          <UFormGroup label="Estado" name="active">
             <UToggle v-model="form.active" />
             <span class="ml-2 text-sm text-slate-500">{{ form.active ? 'Activo' : 'Inactivo' }}</span>
          </UFormGroup>

          <div class="flex justify-end gap-3 mt-6">
            <UButton color="gray" variant="ghost" label="Cancelar" @click="isOpen = false" />
            <UButton type="submit" color="emerald" :label="editingPlan ? 'Guardar Cambios' : 'Crear Plan'" :loading="saving" />
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Planes')
headerTitle.value = 'Planes'
const plans = ref([])
const isOpen = ref(false)
const saving = ref(false)
const editingPlan = ref(null)

const form = reactive({
  name: '',
  price: 0,
  max_users: 1,
  max_branches: 1,
  active: true,
  features: {}
})

const resetForm = () => {
    form.name = ''
    form.price = 0
    form.max_users = 1
    form.max_branches = 1
    form.active = true
    form.features = {
        whatsapp: false,
        dominio_personalizado: false
    }
    editingPlan.value = null
}

const openModal = (plan = null) => {
    resetForm()
    if (plan) {
        editingPlan.value = plan
        form.name = plan.name
        form.price = plan.price
        form.max_users = plan.max_users
        form.max_branches = plan.max_branches
        form.active = plan.active
        form.features = { 
            whatsapp: plan.features?.whatsapp || false,
            dominio_personalizado: plan.features?.dominio_personalizado || false
        }
    }
    isOpen.value = true
}

const fetchPlans = async () => {
    const { data } = await client.from('plans').select('*').order('price', { ascending: true })
    if (data) plans.value = data
}

const savePlan = async () => {
    saving.value = true
    try {
        if (editingPlan.value) {
            const { error } = await client.from('plans').update({...form}).eq('id', editingPlan.value.id)
            if (error) throw error
        } else {
            const { error } = await client.from('plans').insert({...form})
            if (error) throw error
        }
        isOpen.value = false
        await fetchPlans()
    } catch (e: any) {
        alert('Error: ' + e.message)
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    fetchPlans()
})
</script>
