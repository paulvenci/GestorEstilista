<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
        <div class="hidden md:block">
            <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Gestión Rol</h1>
            <p class="text-slate-500 dark:text-slate-400 mt-1">Configura roles, permisos y esquemas de comisiones.</p>
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
                    {{ row.role === 'admin' ? 'Administrador' : 'Usuario' }}
                </UBadge>
            </template>
            
            <template #branch_id-data="{ row }">
                <span v-if="branches.length > 0">
                    {{ branches.find(b => b.id === row.branch_id)?.name || 'Sin Asignar' }}
                </span>
                <span v-else class="text-xs text-slate-400">Cargando...</span>
            </template>

            <template #specialty_id-data="{ row }">
                <UBadge v-if="row.specialty_id" color="gray" variant="solid">
                    {{ specialtiesList.find(s => s.id === row.specialty_id)?.name || 'No definido' }}
                </UBadge>
                <span v-else class="text-xs text-slate-400">-</span>
            </template>

            <template #actions-data="{ row }">
                <UButton icon="i-heroicons-pencil-square" color="gray" variant="ghost" size="xs" @click="editMember(row)" />
            </template>

            <template #commission_type-data="{ row }">
                <span class="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {{ row.commission_type === 'both' ? 'Arriendo + Comisión' : row.commission_type === 'fixed_rent' ? 'Arriendo Mensual' : 'Solo Comisión' }}
                </span>
            </template>

            <template #fixed_rent_cost-data="{ row }">
                <span v-if="row.commission_type === 'fixed_rent' || row.commission_type === 'both'" class="font-medium text-slate-700 dark:text-slate-200">
                    {{ formatCurrency(row.fixed_rent_cost) }}
                </span>
                <span v-else class="text-slate-400">-</span>
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
                        {{ editingMember ? 'Editar Usuario y Rol' : 'Nuevo Usuario' }}
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
                    <USelect v-model="form.role" :options="[{ label: 'Administrador', value: 'admin' }, { label: 'Usuario', value: 'stylist' }]" />
                </UFormGroup>

                <UFormGroup label="Sucursal Asignada" name="branch">
                    <USelect 
                        v-model="form.branch_id" 
                        :options="branches" 
                        option-attribute="name" 
                        value-attribute="id"
                        placeholder="Selecciona una sucursal"
                    />
                </UFormGroup>

                <UFormGroup label="Especialidad" name="specialty" v-if="form.role === 'stylist'">
                    <USelect
                        v-model="form.specialty_id"
                        :options="specialtiesList"
                        option-attribute="name"
                        value-attribute="id"
                        placeholder="Selecciona una especialidad"
                        clearable
                    />
                </UFormGroup>

                <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4" v-if="form.role === 'stylist' || form.role === 'admin'">
                    <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Esquema de Ganancias</p>

                    <!-- Opción: Arriendo puesto mensual -->
                    <div class="space-y-2">
                        <UCheckbox v-model="form.has_fixed_rent" label="Arriendo puesto mensual" />
                        <div v-if="form.has_fixed_rent" class="pl-6">
                            <UFormGroup label="Valor arriendo mensual" name="fixed_rent_cost">
                                <UInput v-model="form.fixed_rent_cost" type="number" icon="i-heroicons-currency-dollar" placeholder="200000" size="sm" />
                            </UFormGroup>
                        </div>
                    </div>

                    <!-- Opción: Comisión -->
                    <div class="space-y-3">
                        <UCheckbox v-model="form.has_commission" label="Comisión (%)" />
                        <div v-if="form.has_commission" class="grid grid-cols-2 gap-4 pl-6">
                            <UFormGroup label="% Comisión Servicios" name="commission_rate" help="Porcentaje que GANA la peluquería por servicio">
                                <UInput v-model="form.commission_rate" type="number" icon="i-heroicons-scissors" placeholder="0" size="sm" />
                            </UFormGroup>
                            <UFormGroup label="% Comisión Productos" name="product_commission_rate" help="Porcentaje que GANA la peluquería por venta de productos">
                                <UInput v-model="form.product_commission_rate" type="number" icon="i-heroicons-shopping-bag" placeholder="0" size="sm" />
                            </UFormGroup>
                        </div>
                    </div>
                </div>

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
headerTitle.value = 'Gestión Rol' // Updated Title
const user = useSupabaseUser()
const team = ref<any[]>([])
const branches = ref<any[]>([])
const specialtiesList = ref<any[]>([]) // Add specialties list
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
    specialty_id: '',
    commission_rate: 0,
    product_commission_rate: 0,
    has_fixed_rent: false,
    has_commission: false,
    fixed_rent_cost: 0
})

const columns = [
    { key: 'full_name', label: 'Nombre' },
    { key: 'role', label: 'Rol' },
    { key: 'specialty_id', label: 'Especialidad' }, // Add column
    { key: 'commission_type', label: 'Tipo' },
    { key: 'fixed_rent_cost', label: 'Arriendo' },
    { key: 'commission_rate', label: '% Serv' },
    { key: 'product_commission_rate', label: '% Prod' },
    { key: 'branch_id', label: 'Sucursal' },
    { key: 'actions', label: '' }
]

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val)
}

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

        const { data: specData } = await client
            .from('specialties')
            .select('id, name')
            .eq('tenant_id', currentTenantId.value)
        
        if (specData) specialtiesList.value = specData
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
    form.specialty_id = ''
    form.commission_rate = 0
    form.product_commission_rate = 0
    form.has_fixed_rent = false
    form.has_commission = false
    form.fixed_rent_cost = 0
    isOpen.value = true
}

const editMember = (member: any) => {
    editingMember.value = member
    form.full_name = member.full_name
    form.role = member.role
    form.branch_id = member.branch_id || ''
    form.specialty_id = member.specialty_id || ''
    form.commission_rate = member.commission_rate || 0
    form.product_commission_rate = member.product_commission_rate || 0
    form.has_fixed_rent = member.commission_type === 'fixed_rent' || member.commission_type === 'both'
    form.has_commission = member.commission_type === 'percentage' || member.commission_type === 'both'
    form.fixed_rent_cost = member.fixed_rent_cost || 0
    isOpen.value = true
}

const saveMember = async () => {
    if (!currentTenantId.value) {
        alert('Error: No se ha identificado tu negocio.')
        return
    }

    saving.value = true
    try {
        // Derivar commission_type de los checkboxes
        const commissionType = form.has_fixed_rent && form.has_commission ? 'both'
            : form.has_fixed_rent ? 'fixed_rent'
            : form.has_commission ? 'percentage'
            : 'percentage' // default si no selecciona nada

        const commonData = {
            role: form.role,
            branch_id: form.branch_id || null,
            specialty_id: form.specialty_id || null,
            commission_type: commissionType,
            commission_rate: form.has_commission ? Number(form.commission_rate) : 0,
            product_commission_rate: form.has_commission ? Number(form.product_commission_rate) : 0,
            fixed_rent_cost: form.has_fixed_rent ? Number(form.fixed_rent_cost) : 0
        }

        if (editingMember.value) {
            // Update Existing (Profile Only via RLS)
            const { data: updatedData, error } = await client
                .from('profiles')
                .update(commonData)
                .eq('id', editingMember.value.id)
                .select()

            if (error) throw error
            
            alert('Miembro actualizado correctamente.')
        } else {
            // Create New (Via API)
            const response = await $fetch('/api/admin/users', {
                method: 'POST',
                body: {
                    email: form.email,
                    password: form.password,
                    full_name: form.full_name,
                    tenant_id: currentTenantId.value,
                    ...commonData
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
