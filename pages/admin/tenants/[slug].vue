<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <UButton icon="i-heroicons-arrow-left" color="gray" variant="ghost" to="/admin/tenants" />
        <div class="hidden md:block">
          <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight" v-if="tenant">
            {{ tenant.name }}
          </h1>
          <div class="flex items-center gap-2 mt-1" v-if="tenant">
             <UBadge :color="tenant.status === 'active' ? 'emerald' : 'red'" variant="subtle">
                {{ tenant.status === 'active' ? 'Activo' : 'Suspendido' }}
             </UBadge>
             <span class="text-slate-500 text-sm">{{ tenant.slug }}</span>
          </div>
        </div>
      </div>
      
      <div class="flex gap-3">
         <UButton label="Editar Negocio" icon="i-heroicons-pencil-square" color="gray" variant="ghost" @click="openEditTenantModal" />
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6" v-if="tenant">
      <UCard>
        <div class="flex flex-col">
            <span class="text-sm text-slate-500 font-medium">Plan Actual</span>
            <span class="text-2xl font-bold text-emerald-600">{{ tenant.plans?.name || 'Sin Plan' }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col">
            <span class="text-sm text-slate-500 font-medium">Próximo Pago</span>
            <span class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ tenant.next_billing_date ? new Date(tenant.next_billing_date).toLocaleDateString() : 'N/A' }}
            </span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col">
            <span class="text-sm text-slate-500 font-medium">Sucursales</span>
            <span class="text-2xl font-bold text-blue-600">{{ branches.length }} / {{ tenant.plans?.max_branches || 1 }}</span>
        </div>
      </UCard>
    </div>

    <!-- Branches Section -->
    <div class="space-y-4">
        <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">Sucursales</h2>
            <UButton label="Nueva Sucursal" icon="i-heroicons-plus" color="emerald" size="sm" @click="isBranchModalOpen = true" />
        </div>

        <UCard :ui="{ body: { padding: 'p-0' } }">
            <UTable :rows="branches" :columns="branchColumns">
                <template #is_main-data="{ row }">
                    <UBadge v-if="row.is_main" color="blue" variant="subtle">Casa Matriz</UBadge>
                </template>
                <template #active-data="{ row }">
                    <UBadge :color="row.active ? 'emerald' : 'gray'" variant="subtle">
                        {{ row.active ? 'Operativa' : 'Cerrada' }}
                    </UBadge>
                </template>
                <template #actions-data="{ row }">
                    <UButton icon="i-heroicons-pencil-square" color="gray" variant="ghost" size="xs" @click="editBranch(row)" />
                </template>
            </UTable>
        </UCard>
    </div>

    <!-- Users Section -->
    <div class="space-y-4" v-if="users.length > 0 || true">
         <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">Usuarios</h2>
            <UButton label="Nuevo Usuario" icon="i-heroicons-user-plus" color="emerald" size="sm" @click="openCreateUserModal" />
         </div>
         <UCard :ui="{ body: { padding: 'p-0' } }">
            <UTable :rows="users" :columns="userColumns">
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
                    <UButton icon="i-heroicons-pencil-square" color="gray" variant="ghost" size="xs" @click="editUser(row)" />
                </template>
            </UTable>
         </UCard>
    </div>

    <!-- Edit Tenant Modal -->
    <UModal v-model="isEditTenantModalOpen">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Editar Negocio</h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isEditTenantModalOpen = false" />
                </div>
            </template>
            
            <form @submit.prevent="updateTenant" class="space-y-4 py-2">
                <UFormGroup label="Nombre del Negocio" name="name">
                    <UInput v-model="editTenantForm.name" />
                </UFormGroup>
                
                <UFormGroup label="Slug (URL)" name="slug">
                    <UInput v-model="editTenantForm.slug" />
                    <p class="text-xs text-red-500 mt-1" v-if="editTenantForm.slug !== tenant?.slug">
                        ⚠ Cambiar el slug romperá enlaces existentes.
                    </p>
                </UFormGroup>

                <UFormGroup label="Plan de Suscripción" name="plan">
                    <USelect 
                        v-model="editTenantForm.plan_id" 
                        :options="plans"
                        option-attribute="name"
                        value-attribute="id"
                        placeholder="Selecciona un plan"
                    />
                </UFormGroup>

                <UFormGroup label="Estado" name="status">
                    <USelect v-model="editTenantForm.status" :options="[{ label: 'Activo', value: 'active' }, { label: 'Suspendido', value: 'suspended' }]" />
                </UFormGroup>

                <div class="flex justify-end gap-3 mt-6">
                    <UButton color="gray" variant="ghost" label="Cancelar" @click="isEditTenantModalOpen = false" />
                    <UButton type="submit" color="emerald" label="Guardar Cambios" :loading="updatingTenant" />
                </div>
            </form>
        </UCard>
    </UModal>

    <!-- Edit User Modal -->
    <!-- Edit/Create User Modal -->
    <UModal v-model="isUserModalOpen">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                        {{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isUserModalOpen = false" />
                </div>
            </template>
            
            <form @submit.prevent="saveUser" class="space-y-4 py-2">
                <div v-if="editingUser" class="text-sm text-slate-500 mb-2">
                    Usuario: <span class="font-bold text-slate-900 dark:text-white">{{ editingUser.full_name || 'Desconocido' }}</span>
                </div>

                <div v-else class="space-y-4">
                    <UFormGroup label="Nombre Completo" name="fullname" required>
                        <UInput v-model="userForm.full_name" icon="i-heroicons-user" />
                    </UFormGroup>
                    <UFormGroup label="Correo Electrónico" name="email" required>
                        <UInput v-model="userForm.email" type="email" icon="i-heroicons-envelope" />
                    </UFormGroup>
                    <UFormGroup label="Contraseña" name="password" required>
                        <UInput v-model="userForm.password" type="password" icon="i-heroicons-lock-closed" />
                    </UFormGroup>
                </div>

                <UFormGroup label="Rol" name="role">
                    <USelect v-model="userForm.role" :options="[{ label: 'Administrador', value: 'admin' }, { label: 'Estilista', value: 'stylist' }]" />
                </UFormGroup>

                <UFormGroup label="Sucursal Asignada" name="branch">
                    <USelect 
                        v-model="userForm.branch_id" 
                        :options="branches" 
                        option-attribute="name" 
                        value-attribute="id"
                        placeholder="Selecciona una sucursal"
                    />
                </UFormGroup>

                <div class="flex justify-end gap-3 mt-6">
                    <UButton color="gray" variant="ghost" label="Cancelar" @click="isUserModalOpen = false" />
                    <UButton type="submit" color="emerald" :label="editingUser ? 'Guardar Cambios' : 'Crear Usuario'" :loading="savingUser" />
                </div>
            </form>
        </UCard>
    </UModal>
    
    <!-- Branch Modal -->
    <UModal v-model="isBranchModalOpen">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Nueva Sucursal</h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isBranchModalOpen = false" />
                </div>
            </template>
            
            <form @submit.prevent="createBranch" class="space-y-4 py-2">
                <UFormGroup label="Nombre de Sucursal" name="name">
                    <UInput v-model="newBranch.name" placeholder="Ej: Centro" />
                </UFormGroup>
                <UFormGroup label="Dirección" name="address">
                    <UInput v-model="newBranch.address" icon="i-heroicons-map-pin" />
                </UFormGroup>
                <div class="flex justify-end gap-3 mt-4">
                    <UButton color="gray" variant="ghost" label="Cancelar" @click="isBranchModalOpen = false" />
                    <UButton type="submit" color="emerald" label="Guardar" :loading="creatingBranch" />
                </div>
            </form>
        </UCard>
    </UModal>

  </div>
</template>

<script setup lang="ts">
// Explicit imports
import { ref, reactive, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const route = useRoute()
const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Detalle')
headerTitle.value = 'Detalle'
const tenant = ref<any>(null)
const branches = ref<any[]>([])

const isEditTenantModalOpen = ref(false)
const updatingTenant = ref(false)
// Initialize with default values to avoid null access
const editTenantForm = reactive({
    name: '',
    slug: '',
    status: 'active',
    plan_id: null
})

// --- User Management State ---
const isUserModalOpen = ref(false)
const savingUser = ref(false)
const editingUser = ref<any>(null)
const users = ref<any[]>([])

const userForm = reactive({
    full_name: '',
    email: '',
    password: '',
    role: 'stylist',
    branch_id: ''
})

const openCreateUserModal = () => {
    console.log('Opening Create User Modal')
    editingUser.value = null
    userForm.full_name = ''
    userForm.email = ''
    userForm.password = ''
    userForm.role = 'stylist'
    userForm.branch_id = ''
    isUserModalOpen.value = true
}

const editUser = (user: any) => {
    console.log('Editing user:', user)
    editingUser.value = user
    userForm.full_name = user.full_name
    userForm.role = user.role
    userForm.branch_id = user.branch_id
    isUserModalOpen.value = true
}

const userColumns = [
    { key: 'full_name', label: 'Nombre' },
    { key: 'role', label: 'Rol' },
    { key: 'branch_id', label: 'Sucursal' },
    { key: 'actions', label: '' }
]

// --- End User Management State ---

const plans = ref<any[]>([])

const fetchPlans = async () => {
    const { data } = await client.from('plans').select('id, name')
    if (data) plans.value = data
}

const fetchTenantDetails = async () => {
    const slug = route.params.slug
    // 1. Get Tenant
    const { data: tenantData } = await client
        .from('tenants')
        .select('*, plans(*)')
        .eq('slug', slug)
        .single()
    
    if (tenantData) {
        tenant.value = tenantData
        
        // 2. Get Branches
        const { data: branchData } = await client
            .from('branches')
            .select('*')
            .eq('tenant_id', tenantData.id)
            .order('is_main', { ascending: false })
            
        if (branchData) branches.value = branchData

        // 3. Get Users
        const { data: userData } = await client
            .from('profiles')
            .select('*')
            .eq('tenant_id', tenantData.id)
        
        if (userData) users.value = userData
    }
}

const updateTenant = async () => {
    if (!tenant.value) return
    updatingTenant.value = true
    try {
        const { error } = await client
            .from('tenants')
            .update({
                name: editTenantForm.name,
                slug: editTenantForm.slug,
                status: editTenantForm.status,
                plan_id: editTenantForm.plan_id
            })
            .eq('id', tenant.value.id)

        if (error) throw error
        
        // If slug changed, we might need to redirect, but for now let's just refresh
        // Actually if slug changes, the current URL becomes invalid. 
        // Let's assume for now user knows what they are doing.
        if (editTenantForm.slug !== tenant.value.slug) {
            alert('Slug actualizado. Redirigiendo...')
            return navigateTo(`/admin/tenants/${editTenantForm.slug}`)
        }

        isEditTenantModalOpen.value = false
        await fetchTenantDetails()
        alert('Negocio actualizado correctamente')
    } catch (e: any) {
        alert('Error: ' + e.message)
    } finally {
        updatingTenant.value = false
    }
}

const openEditTenantModal = () => {
    if (!tenant.value) return
    editTenantForm.name = tenant.value.name
    editTenantForm.slug = tenant.value.slug
    editTenantForm.status = tenant.value.status
    editTenantForm.plan_id = tenant.value.plan_id
    isEditTenantModalOpen.value = true
}

onMounted(() => {
    fetchTenantDetails()
    fetchPlans() // Fetch plans on mount
})

const isBranchModalOpen = ref(false)
const creatingBranch = ref(false)
const newBranch = reactive({
    name: '',
    address: ''
})
const editingBranchId = ref<string | null>(null)

const editBranch = (branch: any) => {
    editingBranchId.value = branch.id
    newBranch.name = branch.name
    newBranch.address = branch.address
    isBranchModalOpen.value = true
}

const branchColumns = [
    { key: 'name', label: 'Nombre' },
    { key: 'address', label: 'Dirección' },
    { key: 'is_main', label: 'Tipo' },
    { key: 'active', label: 'Estado' },
    { key: 'actions', label: '' }
]

// Moved to top



const saveUser = async () => {
    savingUser.value = true
    try {
        if (editingUser.value) {
            // Update existing user (Profile only)
            const { error } = await client
                .from('profiles')
                .update({
                    role: userForm.role,
                    branch_id: userForm.branch_id
                })
                .eq('id', editingUser.value.id)

            if (error) throw error
             alert('Usuario actualizado correctamente')
        } else {
            // Create New User (Server API)
            // We need tenant ID
            if (!tenant.value) throw new Error('Tenant context missing')

            const response = await $fetch('/api/admin/users', {
                method: 'POST',
                body: {
                    email: userForm.email,
                    password: userForm.password,
                    full_name: userForm.full_name,
                    role: userForm.role,
                    branch_id: userForm.branch_id || null,
                    tenant_id: tenant.value.id
                }
            })
            
            alert('Usuario creado correctamente')
        }
        
        isUserModalOpen.value = false
        await fetchTenantDetails() // Refresh list
    } catch (e: any) {
        alert('Error: ' + (e.statusMessage || e.message))
    } finally {
        savingUser.value = false
    }
}

const createBranch = async () => {
    if (!tenant.value) return
    creatingBranch.value = true
    try {
        if (editingBranchId.value) {
            const { error } = await client.from('branches').update({
                name: newBranch.name,
                address: newBranch.address
            }).eq('id', editingBranchId.value)
             if (error) throw error
        } else {
            const { error } = await client.from('branches').insert({
                tenant_id: tenant.value.id,
                name: newBranch.name,
                address: newBranch.address,
                is_main: false
            })
             if (error) throw error
        }
        
        isBranchModalOpen.value = false
        newBranch.name = ''
        newBranch.address = ''
        editingBranchId.value = null
        await fetchTenantDetails()
        alert(editingBranchId.value ? 'Sucursal actualizada' : 'Sucursal creada')
    } catch (e: any) {
        alert('Error: ' + e.message)
    } finally {
        creatingBranch.value = false
    }
}


</script>
