<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div class="hidden md:block">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sucursales</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Gestiona las sedes de tu negocio.</p>
      </div>
      <UButton v-if="userRole === 'superadmin'" label="Nueva Sucursal" icon="i-heroicons-plus" color="emerald" size="lg" @click="openCreateModal" class="shadow-lg shadow-emerald-500/20" />
    </div>

    <!-- Plan Limit Info -->
    <div v-if="planInfo" class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-4 py-2">
      <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-emerald-500" />
      <span>Sucursales activas: <strong class="text-slate-700 dark:text-white">{{ activeBranchCount }}</strong> / <strong class="text-slate-700 dark:text-white">{{ planInfo.max_branches }}</strong> ({{ planInfo.name }})</span>
    </div>

    <!-- Branch List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard 
          v-for="branch in branches" 
          :key="branch.id" 
          class="relative overflow-hidden group transition-all duration-300"
          :class="branch.active ? 'border-t-4 border-t-emerald-500' : 'border-t-4 border-t-red-400 opacity-60'"
        >
            <template #header>
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ branch.name }}</h3>
                        <p class="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
                            {{ branch.address || 'Sin dirección' }}
                        </p>
                    </div>
                    <div class="flex gap-1">
                        <UBadge v-if="branch.is_main" color="blue" variant="subtle">Matriz</UBadge>
                        <UBadge v-if="!branch.active" color="red" variant="subtle">Eliminada</UBadge>
                    </div>
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
                    <UButton v-if="userRole === 'superadmin'" icon="i-heroicons-pencil-square" color="gray" variant="ghost" size="xs" @click="editBranch(branch)" />
                    <UButton 
                      v-if="userRole === 'superadmin' && branch.active && !branch.is_main" 
                      icon="i-heroicons-trash" 
                      color="red" 
                      variant="ghost" 
                      size="xs" 
                      @click="confirmDelete(branch)" 
                    />
                    <UButton 
                      v-if="userRole === 'superadmin' && !branch.active" 
                      icon="i-heroicons-arrow-path" 
                      color="emerald" 
                      variant="ghost" 
                      size="xs"
                      title="Reactivar sucursal"
                      @click="reactivateBranch(branch)" 
                    />
                 </div>
            </div>
        </UCard>
    </div>

    <!-- Create/Edit Modal -->
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

    <!-- Delete Confirmation Modal -->
    <UModal v-model="isDeleteOpen">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Eliminar Sucursal</h3>
                </div>
            </template>
            
            <div class="py-2 space-y-3">
                <p class="text-sm text-slate-600 dark:text-slate-300">
                    ¿Estás seguro de que quieres eliminar la sucursal <strong>"{{ deletingBranch?.name }}"</strong>?
                </p>
                <p class="text-xs text-slate-400">
                    La sucursal será desactivada y no aparecerá para los usuarios. Podrás reactivarla más adelante si lo necesitas.
                </p>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <UButton color="gray" variant="ghost" label="Cancelar" @click="isDeleteOpen = false" />
                    <UButton color="red" label="Eliminar" icon="i-heroicons-trash" :loading="deleting" @click="softDeleteBranch" />
                </div>
            </template>
        </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, reactive, computed, onMounted } from 'vue'

const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Sucursales')
headerTitle.value = 'Sucursales'
const user = useSupabaseUser()
const userRole = useState<string | null>('userRole', () => null)
const branches = ref<any[]>([])
const isOpen = ref(false)
const isDeleteOpen = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingId = ref<string | null>(null)
const deletingBranch = ref<any>(null)
const planInfo = ref<any>(null)
const currentTenantId = ref<string | null>(null)

const form = reactive({
    name: '',
    address: '',
    phone: '',
    active: true
})

const activeBranchCount = computed(() => {
    return branches.value.filter(b => b.active).length
})

const fetchBranches = async () => {
    let userId = user.value?.id
    if (!userId) {
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) userId = session.user.id
    }
    if (!userId) return

    // Get tenant_id and plan info
    if (!currentTenantId.value) {
        const { data: profile } = await client.from('profiles').select('tenant_id').eq('id', userId).single()
        if (profile) currentTenantId.value = profile.tenant_id
    }

    if (currentTenantId.value && !planInfo.value) {
        const { data: tenant } = await client
            .from('tenants')
            .select('plan_id, plans ( name, max_users, max_branches )')
            .eq('id', currentTenantId.value)
            .single()
        if (tenant?.plans) {
            planInfo.value = tenant.plans
        }
    }

    const { data, error } = await client
        .from('branches')
        .select('*')
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: true })
    
    if (error) {
        console.error('Error fetching branches:', error)
        return
    }
    
    if (data) branches.value = data
}

watch(user, () => {
    fetchBranches()
}, { immediate: true })

const openCreateModal = () => {
    // Validate plan limits
    if (planInfo.value && activeBranchCount.value >= planInfo.value.max_branches) {
        alert(`Has alcanzado el límite de ${planInfo.value.max_branches} sucursal(es) activa(s) de tu plan "${planInfo.value.name}". Mejora tu plan para agregar más sucursales.`)
        return
    }
    editingId.value = null
    form.name = ''
    form.address = ''
    form.phone = ''
    form.active = true
    isOpen.value = true
}

const saveBranch = async () => {
    saving.value = true
    try {
        let userId = user.value?.id
        if (!userId) {
            const { data: { session } } = await client.auth.getSession()
            if (session?.user) userId = session.user.id
        }
        if (!userId) throw new Error('Usuario no autenticado')

        if (!currentTenantId.value) {
            const { data: profile } = await client.from('profiles').select('tenant_id').eq('id', userId).single()
            if (profile) currentTenantId.value = profile.tenant_id
        }
        if (!currentTenantId.value) throw new Error('No se encontró perfil de usuario')

        // If creating, re-check plan limits
        if (!editingId.value && planInfo.value && activeBranchCount.value >= planInfo.value.max_branches) {
            throw new Error(`Límite de sucursales alcanzado (${planInfo.value.max_branches}) para tu plan "${planInfo.value.name}".`)
        }

        const payload = {
            ...form,
            tenant_id: currentTenantId.value
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

const confirmDelete = (branch: any) => {
    deletingBranch.value = branch
    isDeleteOpen.value = true
}

const softDeleteBranch = async () => {
    if (!deletingBranch.value) return
    deleting.value = true
    try {
        const { error } = await client
            .from('branches')
            .update({ active: false })
            .eq('id', deletingBranch.value.id)
        
        if (error) throw error
        
        isDeleteOpen.value = false
        deletingBranch.value = null
        await fetchBranches()
        alert('Sucursal eliminada correctamente.')
    } catch (e: any) {
        alert('Error: ' + e.message)
    } finally {
        deleting.value = false
    }
}

const reactivateBranch = async (branch: any) => {
    // Check plan limits before reactivating
    if (planInfo.value && activeBranchCount.value >= planInfo.value.max_branches) {
        alert(`No puedes reactivar esta sucursal. Has alcanzado el límite de ${planInfo.value.max_branches} sucursal(es) activa(s) de tu plan "${planInfo.value.name}".`)
        return
    }
    try {
        const { error } = await client
            .from('branches')
            .update({ active: true })
            .eq('id', branch.id)
        
        if (error) throw error
        await fetchBranches()
        alert('Sucursal reactivada correctamente.')
    } catch (e: any) {
        alert('Error: ' + e.message)
    }
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
