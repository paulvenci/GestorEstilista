<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
        <div class="hidden md:block">
            <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Equipo</h1>
            <p class="text-slate-500 dark:text-slate-400 mt-1">Administra los usuarios y sus permisos.</p>
        </div>
        <UButton label="Nuevo Usuario" icon="i-heroicons-user-plus" color="emerald" size="lg" @click="openCreateMemberModal" class="shadow-lg shadow-emerald-500/20" />
    </div>

    <UCard :ui="{ body: { padding: 'p-0' } }">
        <UTable 
            :rows="team" 
            :columns="columns"
            :ui="{ 
                thead: 'bg-slate-50 dark:bg-slate-800/50',
                th: { color: 'text-slate-900 dark:text-white' },
                td: { color: 'text-slate-600 dark:text-slate-400' }
            }"
        >
            <template #role-data="{ row }">
                <UBadge :color="row.role === 'admin' ? 'purple' : 'blue'" variant="subtle">
                    {{ row.role === 'admin' ? 'Administrador' : 'Estilista' }}
                </UBadge>
            </template>
            
            <template #branch_id-data="{ row }">
                <span v-if="branches.length > 0">
                    {{ branches.find(b => b.id === row.branch_id)?.name || 'Sin Asignar' }}
                </span>
                <span v-else class="text-xs text-slate-400">Cargando...</span>
            </template>

            <template #actions-data="{ row }">
                <UButton icon="i-heroicons-pencil-square" color="gray" variant="ghost" size="xs" @click="editMember(row)" />
            </template>

            <template #commission_rate-data="{ row }">
                <span class="font-medium text-slate-700 dark:text-slate-200">{{ row.commission_rate }}%</span>
            </template>
            
            <template #product_commission_rate-data="{ row }">
                <span class="font-medium text-slate-700 dark:text-slate-200">{{ row.product_commission_rate || 0 }}%</span>
            </template>
        </UTable>
    </UCard>

    <!-- Create/Edit Member Modal -->
    <UModal v-model="isOpen">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                        {{ editingMember ? 'Editar Miembro' : 'Nuevo Miembro' }}
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
                </div>
            </template>
            
            <form @submit.prevent="saveMember" class="space-y-4 py-2">
                <div v-if="editingMember" class="text-sm text-slate-500 mb-2">
                    Editando a: <span class="font-bold text-slate-900 dark:text-white">{{ editingMember.full_name || 'Usuario' }}</span>
                </div>

                <div v-else class="space-y-4">
                    <UFormGroup label="Nombre Completo" name="fullname" required>
                        <UInput v-model="form.full_name" icon="i-heroicons-user" />
                    </UFormGroup>
                    <UFormGroup label="Correo Electrónico" name="email" required>
                        <UInput v-model="form.email" type="email" icon="i-heroicons-envelope" />
                    </UFormGroup>
                    <UFormGroup label="Contraseña" name="password" required>
                        <UInput v-model="form.password" type="password" icon="i-heroicons-lock-closed" />
                    </UFormGroup>
                </div>

                <UFormGroup label="Rol" name="role">
                    <USelect v-model="form.role" :options="[{ label: 'Administrador', value: 'admin' }, { label: 'Estilista', value: 'stylist' }]" />
                    <p class="text-xs text-slate-500 mt-1" v-if="form.role === 'admin'">
                        Nota: Los administradores tienen acceso completo a la configuración del negocio.
                    </p>
                </UFormGroup>
                
                <div v-if="form.role === 'stylist'" class="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <UFormGroup label="% Comisión Servicios" name="commission_rate" help="Por defecto para servicios">
                        <UInput v-model="form.commission_rate" type="number" icon="i-heroicons-scissors" placeholder="40" />
                    </UFormGroup>
                    <UFormGroup label="% Comisión Productos" name="product_commission_rate" help="Por venta de productos">
                        <UInput v-model="form.product_commission_rate" type="number" icon="i-heroicons-shopping-bag" placeholder="10" />
                    </UFormGroup>
                </div>

                <UFormGroup label="Sucursal Asignada" name="branch">
                    <USelect 
                        v-model="form.branch_id" 
                        :options="branches" 
                        option-attribute="name" 
                        value-attribute="id"
                        placeholder="Selecciona una sucursal"
                    />
                </UFormGroup>

                <div class="flex justify-end gap-3 mt-6">
                    <UButton color="gray" variant="ghost" label="Cancelar" @click="isOpen = false" />
                    <UButton type="submit" color="emerald" :label="editingMember ? 'Guardar Cambios' : 'Crear Usuario'" :loading="saving" />
                </div>
            </form>
        </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, reactive, onMounted } from 'vue'

const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Equipo')
headerTitle.value = 'Equipo'
const user = useSupabaseUser()
const team = ref<any[]>([])
const branches = ref<any[]>([])
const isOpen = ref(false)
const saving = ref(false)
const editingMember = ref<any>(null)
const currentTenantId = ref<string | null>(null)

const form = reactive({
    full_name: '',
    email: '',
    password: '',
    role: 'stylist',
    branch_id: '',
    commission_rate: 40,
    product_commission_rate: 10
})

const columns = [
    { key: 'full_name', label: 'Nombre' },
    { key: 'role', label: 'Rol' },
    { key: 'commission_rate', label: '% Servicios' },
    { key: 'product_commission_rate', label: '% Productos' },
    { key: 'branch_id', label: 'Sucursal' },
    { key: 'actions', label: '' }
]

const fetchTeam = async () => {
    let userId = user.value?.id
    if (!userId) {
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) userId = session.user.id
    }
    if (!userId) return

    // 1. Get current user's tenant_id
    // Simple cache check
    if (!currentTenantId.value) {
        const { data: myProfile } = await client.from('profiles').select('tenant_id').eq('id', userId).single()
        if (myProfile) currentTenantId.value = myProfile.tenant_id
    }
    
    if (currentTenantId.value) {
         const { data, error: teamError } = await client
            .from('profiles')
            .select('*')
            .eq('tenant_id', currentTenantId.value)
        
        if (teamError) console.error('Error fetching team:', teamError)
        if (data) team.value = data

        // Also fetch branches for this tenant
        const { data: branchData } = await client
            .from('branches')
            .select('id, name')
            .eq('tenant_id', currentTenantId.value)
            .eq('active', true)
        
        if (branchData) branches.value = branchData
    }
}

watch(user, () => {
    fetchTeam()
}, { immediate: true })

const openCreateMemberModal = () => {
    editingMember.value = null
    form.full_name = ''
    form.email = ''
    form.password = ''
    form.role = 'stylist'
    form.branch_id = ''
    form.commission_rate = 40
    form.product_commission_rate = 10
    isOpen.value = true
}

const editMember = (member: any) => {
    editingMember.value = member
    form.full_name = member.full_name
    form.role = member.role
    form.branch_id = member.branch_id
    form.commission_rate = member.commission_rate || 0
    form.product_commission_rate = member.product_commission_rate || 0
    isOpen.value = true
}

const saveMember = async () => {
    if (!currentTenantId.value) {
        alert('Error: No se ha identificado tu negocio.')
        return
    }

    saving.value = true
    try {
        if (editingMember.value) {
            // Update Existing (Profile Only via RLS)
            const { error } = await client
                .from('profiles')
                .update({
                    role: form.role,
                    branch_id: form.branch_id,
                    commission_rate: form.commission_rate,
                    product_commission_rate: form.product_commission_rate
                })
                .eq('id', editingMember.value.id)

            if (error) throw error
            alert('Miembro actualizado correctamente')
        } else {
            // Create New (Via API)
            const response = await $fetch('/api/admin/users', {
                method: 'POST',
                body: {
                    email: form.email,
                    password: form.password,
                    full_name: form.full_name,
                    role: form.role,
                    branch_id: form.branch_id || null,
                    tenant_id: currentTenantId.value,
                    commission_rate: form.commission_rate,
                    product_commission_rate: form.product_commission_rate
                }
            })
            alert('Usuario creado correctamente')
        }
        
        isOpen.value = false
        await fetchTeam()
    } catch (e: any) {
        alert('Error: ' + (e.statusMessage || e.message))
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    fetchTeam()
})
</script>
