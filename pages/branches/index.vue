<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div class="hidden md:block">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sucursales</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Gestiona las sedes de tu negocio.</p>
      </div>
      <UButton label="Nueva Sucursal" icon="i-heroicons-plus" color="emerald" size="lg" @click="isOpen = true" class="shadow-lg shadow-emerald-500/20" />
    </div>

    <!-- Branch List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard v-for="branch in branches" :key="branch.id" class="border-t-4 border-t-emerald-500 relative overflow-hidden group">
            <template #header>
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ branch.name }}</h3>
                        <p class="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
                            {{ branch.address || 'Sin dirección' }}
                        </p>
                    </div>
                    <UBadge v-if="branch.is_main" color="blue" variant="subtle">Matriz</UBadge>
                </div>
            </template>
            
            <div class="flex justify-between items-center mt-4">
                 <div class="flex flex-col">
                    <span class="text-xs text-slate-400 font-medium uppercase">Estado</span>
                    <span :class="branch.active ? 'text-emerald-500' : 'text-red-500'" class="font-bold">
                        {{ branch.active ? 'Operativa' : 'Cerrada' }}
                    </span>
                 </div>
                 
                 <div class="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <UButton icon="i-heroicons-pencil-square" color="gray" variant="ghost" size="xs" @click="editBranch(branch)" />
                    <!-- <UButton icon="i-heroicons-trash" color="red" variant="ghost" size="xs" /> -->
                 </div>
            </div>
        </UCard>
    </div>

    <!-- Modal -->
    <UModal v-model="isOpen">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                        {{ editingId ? 'Editar Sucursal' : 'Nueva Sucursal' }}
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="closeModal" />
                </div>
            </template>
            
            <form @submit.prevent="saveBranch" class="space-y-4 py-2">
                <UFormGroup label="Nombre" name="name" required>
                    <UInput v-model="form.name" placeholder="Ej: Centro, Norte, Plaza" icon="i-heroicons-building-storefront" />
                </UFormGroup>
                
                <UFormGroup label="Dirección" name="address">
                    <UInput v-model="form.address" icon="i-heroicons-map-pin" />
                </UFormGroup>

                <UFormGroup label="Teléfono" name="phone">
                     <UInput v-model="form.phone" icon="i-heroicons-phone" />
                </UFormGroup>
                
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 dark:text-gray-200">Sucursal Operativa</span>
                    <UToggle v-model="form.active" />
                </div>

                <div class="flex justify-end gap-3 mt-6">
                    <UButton color="gray" variant="ghost" label="Cancelar" @click="closeModal" />
                    <UButton type="submit" color="emerald" :label="editingId ? 'Actualizar' : 'Crear'" :loading="saving" />
                </div>
            </form>
        </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, reactive, onMounted } from 'vue'
// Middleware to ensure user is logged in
// Middleware auth is global now

const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Sucursales')
headerTitle.value = 'Sucursales'
const user = useSupabaseUser()
const branches = ref<any[]>([])
const isOpen = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
    name: '',
    address: '',
    phone: '',
    active: true
})

const fetchBranches = async () => {
    console.log('--- fetchBranches START ---')
    let userId = user.value?.id

    // Fallback: Try getting session directly if user ref is empty
    if (!userId) {
        console.log('User ref empty, trying session recovery...')
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
            userId = session.user.id
            console.log('User recovered from session:', userId)
        }
    }

    if (!userId) {
        console.log('Waiting for user... (UserId still null)')
        return
    }

    console.log('Fetching branches for user (via RLS):', userId)

    // Current user's tenant is handled by RLS, but we need to ensure we link it properly if RLS relies on profile
    // The policy "Users can view branches of their tenant" relies on public.profiles
    
    const { data, error } = await client
        .from('branches')
        .select('*')
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: true })
    
    if (error) {
        console.error('Error fetching branches:', error)
        return
    }
    
    if (data) {
        console.log('Branches loaded:', data.length)
        branches.value = data
    }
}

watch(user, () => {
    console.log('User watch triggered')
    fetchBranches()
}, { immediate: true })

const saveBranch = async () => {
    saving.value = true
    try {
        let userId = user.value?.id
        if (!userId) {
            const { data: { session } } = await client.auth.getSession()
            if (session?.user) userId = session.user.id
        }

        if (!userId) throw new Error('Usuario no autenticado')

        // We need the tenant_id. 
        // Best way is to fetch it from the profile if we insert, 
        // OR rely on a database trigger or RLS check? 
        // Simple way: Fetch user profile first to get tenant_id.
        
        const { data: profile } = await client.from('profiles').select('tenant_id').eq('id', userId).single()
        if (!profile) throw new Error('No se encontró perfil de usuario')

        const payload = {
            ...form,
            tenant_id: profile.tenant_id
        }

        if (editingId.value) {
            const { error } = await client.from('branches').update(payload).eq('id', editingId.value)
            if (error) throw error
        } else {
            const { error } = await client.from('branches').insert(payload)
            if (error) throw error
        }
        
        closeModal()
        await fetchBranches()
        alert(editingId.value ? 'Sucursal actualizada' : 'Sucursal creada')

    } catch (e: any) {
        alert('Error: ' + e.message)
    } finally {
        saving.value = false
    }
}

const editBranch = (branch: any) => {
    editingId.value = branch.id
    form.name = branch.name
    form.address = branch.address
    form.phone = branch.phone
    form.active = branch.active
    isOpen.value = true
}

const closeModal = () => {
    isOpen.value = false
    editingId.value = null
    form.name = ''
    form.address = ''
    form.phone = ''
    form.active = true
}

onMounted(() => {
    fetchBranches()
})
</script>
