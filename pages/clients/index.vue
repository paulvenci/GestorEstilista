<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center px-4">
      <h1 class="hidden md:block text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Clientes</h1>
      <UButton icon="i-heroicons-plus" label="Nuevo" color="emerald" @click="openModal()" />
    </div>

    <UCard shadow="md" :ui="{ body: { padding: 'p-0' }, background: 'bg-white dark:bg-slate-900', ring: 'ring-1 ring-slate-200 dark:ring-slate-800' }">
      <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Buscar por nombre, teléfono o email..." size="lg" shadow class="max-w-md" @input="fetchClients" />
      </div>

      <UTable :rows="clients" :columns="columns" :loading="loading" :ui="{ divide: 'divide-y divide-slate-200 dark:divide-slate-800', th: { color: 'text-slate-900 dark:text-white' }, td: { color: 'text-slate-500 dark:text-slate-400' } }">
        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton icon="i-heroicons-pencil" color="gray" variant="ghost" size="xs" @click="openModal(row)" />
            <UButton icon="i-heroicons-trash" color="red" variant="ghost" size="xs" @click="deleteClient(row.id)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Modal Client -->
    <UModal v-model="isOpen">
      <UCard>
        <template #header>
          <div class="font-bold">{{ isEdit ? 'Editar Cliente' : 'Nuevo Cliente' }}</div>
        </template>
        
        <form @submit.prevent="saveClient" class="space-y-4">
          <UFormGroup label="Nombre Completo" name="full_name" required>
            <UInput v-model="form.full_name" />
          </UFormGroup>

          <UFormGroup label="Teléfono" name="phone">
            <UInput v-model="form.phone" />
          </UFormGroup>

          <UFormGroup label="Email" name="email">
            <UInput v-model="form.email" type="email" />
          </UFormGroup>

          <UFormGroup label="Notas" name="notes">
            <UTextarea v-model="form.notes" placeholder="Preferencias, alergias, etc." />
          </UFormGroup>

          <div class="flex justify-end gap-2 mt-4">
            <UButton color="gray" variant="ghost" label="Cancelar" @click="isOpen = false" />
            <UButton type="submit" label="Guardar" :loading="saving" />
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Clientes')
headerTitle.value = 'Clientes'
const user = useSupabaseUser()
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const clients = ref([])
const isOpen = ref(false)

const form = ref({
  id: undefined,
  full_name: '',
  phone: '',
  email: '',
  notes: ''
})

const isEdit = computed(() => !!form.value.id)

const columns = [
  { key: 'full_name', label: 'Nombre' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'email', label: 'Email' },
  { key: 'notes', label: 'Notas' },
  { key: 'actions', label: '' }
]

const fetchClients = async () => {
  loading.value = true
  let query = client.from('clients').select('*').order('created_at', { ascending: false })

  if (search.value) {
    query = query.or(`full_name.ilike.%${search.value}%,phone.ilike.%${search.value}%,email.ilike.%${search.value}%`)
  }

  const { data } = await query.limit(50)
  clients.value = data || []
  loading.value = false
}

const openModal = (row?: any) => {
  if (row) {
    form.value = { ...row }
  } else {
    form.value = { id: undefined, full_name: '', phone: '', email: '', notes: '' }
  }
  isOpen.value = true
}

const saveClient = async () => {
  if (!form.value.full_name) return
  saving.value = true
  
  try {
    const { data: { user } } = await client.auth.getUser()

    if (!user) {
        alert('Usuario no autenticado. Por favor, recarga la página.')
        throw new Error('User not authenticated')
    }
    
    const payload = { ...form.value }
    delete payload.id

    let error
    if (isEdit.value) {
        const { error: err } = await client.from('clients').update(payload).eq('id', form.value.id)
        error = err
    } else {
        // Fetch tenant_id for new records
        // console.log('User ID:', user.id)
        const { data: profile, error: profileError } = await client.from('profiles').select('tenant_id').eq('id', user.id).single()
        
        if (profileError) {
             console.error('Profile Fetch Error:', profileError)
             throw new Error(`Error al obtener perfil: ${profileError.message} (User: ${user.id})`)
        }
        
        if (!profile) throw new Error('No se pudo identificar el salón (tenant) del usuario. Perfil no encontrado.')
        
        payload.tenant_id = profile.tenant_id
        
        const { error: err } = await client.from('clients').insert(payload)
        error = err
    }

    if (error) throw error
    
    isOpen.value = false
    await fetchClients()
  } catch (e: any) {
    if (e.message !== 'User not authenticated') {
        alert('Error: ' + e.message)
    }
  } finally {
    saving.value = false
  }
}

const deleteClient = async (id: string) => {
  if (!confirm('¿Estás seguro? Esto podría afectar citas históricas.')) return
  await client.from('clients').delete().eq('id', id)
  fetchClients()
}

onMounted(() => {
  fetchClients()
})
</script>
