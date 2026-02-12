<template>
  <div>
    <h1 class="text-xl md:text-3xl font-bold mb-6">Dashboard Super Admin</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <UCard>
        <template #header>
          <div class="text-gray-400 text-sm">Total Peluquerías</div>
        </template>
        <div class="text-3xl font-bold">{{ tenantsCount }}</div>
      </UCard>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Peluquerías Activas</h2>
      <UButton icon="i-heroicons-plus" label="Nueva Peluquería" @click="isOpen = true" />
    </div>

    <UCard>
      <UTable :rows="tenants" :columns="columns" />
    </UCard>

    <!-- Modal Nueva Peluquería -->
    <UModal v-model="isOpen">
      <UCard>
        <template #header>
          <div class="font-bold">Registrar Nueva Peluquería</div>
        </template>
        
        <form @submit.prevent="createTenant" class="space-y-4">
          <UFormGroup label="Nombre del Negocio" name="name">
            <UInput v-model="newTenant.name" />
          </UFormGroup>

          <UFormGroup label="Slug (URL)" name="slug">
            <UInput v-model="newTenant.slug" />
          </UFormGroup>

          <div class="flex justify-end gap-2 mt-4">
            <UButton color="gray" variant="ghost" label="Cancelar" @click="isOpen = false" />
            <UButton type="submit" label="Crear" :loading="creating" />
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
const isOpen = ref(false)
const creating = ref(false)
const tenants = ref([])
const tenantsCount = computed(() => tenants.value.length)

const newTenant = ref({
  name: '',
  slug: ''
})

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'slug', label: 'Slug' },
  { key: 'created_at', label: 'Fecha Registro' }
]

const fetchTenants = async () => {
  const { data } = await client.from('tenants').select('*').order('created_at', { ascending: false })
  if (data) tenants.value = data
}

const createTenant = async () => {
  creating.value = true
  try {
    const { error } = await client.from('tenants').insert(newTenant.value)
    if (error) throw error
    
    isOpen.value = false
    newTenant.value = { name: '', slug: '' }
    await fetchTenants()
    alert('Peluquería creada exitosamente')
  } catch (e: any) {
    alert('Error al crear: ' + e.message)
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  fetchTenants()
})
</script>
