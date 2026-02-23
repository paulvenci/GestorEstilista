<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Especialidades</h1>
            <p class="text-slate-500 dark:text-slate-400 mt-1">Gestiona los tipos de profesionales (Estilistas, Manicuristas, etc.)</p>
        </div>
        <UButton label="Nueva Especialidad" icon="i-heroicons-plus" color="emerald" @click="openModal" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UCard v-for="role in specialties" :key="role.id" class="relative group border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <UIcon name="i-heroicons-tag" class="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 dark:text-white">{{ role.name }}</h3>
                        <p class="text-xs text-slate-400">ID: {{ role.id.slice(0, 8) }}</p>
                    </div>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <UButton icon="i-heroicons-pencil-square" color="gray" variant="ghost" size="xs" @click="editRole(role)" />
                    <UButton icon="i-heroicons-trash" color="red" variant="ghost" size="xs" @click="confirmDelete(role)" />
                </div>
            </div>
        </UCard>
    </div>

    <UModal v-model="isOpen">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                        {{ editingRole ? 'Editar Especialidad' : 'Nueva Especialidad' }}
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
                </div>
            </template>
            
            <form @submit.prevent="saveRole" class="space-y-4 py-2">
                <UFormGroup label="Nombre de la Especialidad" help="Ej: Manicurista, Estilista, Maquillador">
                    <UInput v-model="form.name" placeholder="Ej: Manicurista" autofocus />
                </UFormGroup>

                <div class="flex justify-end gap-3 mt-6">
                    <UButton color="gray" variant="ghost" label="Cancelar" @click="isOpen = false" />
                    <UButton type="submit" color="emerald" :label="editingRole ? 'Guardar Cambios' : 'Crear Especialidad'" :loading="saving" />
                </div>
            </form>
        </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser, useState } from '#imports'
const client = useSupabaseClient()
const user = useSupabaseUser()
const headerTitle = useState('headerTitle', () => 'Equipo')

headerTitle.value = 'Gestión de Roles'

const specialties = ref<any[]>([])
const isOpen = ref(false)
const saving = ref(false)
const editingRole = ref<any>(null)
const tenantId = ref<string | null>(null)

const form = reactive({
    name: ''
})

const fetchTenantId = async () => {
    try {
        let userId = user.value?.id
        if (!userId) {
            const { data: { user: authUser } } = await client.auth.getUser()
            userId = authUser?.id
        }

        if (!userId) {
            console.warn('No user ID found for fetchTenantId')
            return
        }

        const { data, error } = await client
            .from('profiles')
            .select('tenant_id')
            .eq('id', userId)
            .single()
        
        if (error) throw error
        if (data) {
            tenantId.value = data.tenant_id
            console.log('Tenant ID loaded:', tenantId.value)
        }
    } catch (e) {
        console.error('Error fetching tenant ID:', e)
    }
}

const fetchSpecialties = async () => {
    const { data, error } = await client
        .from('specialties')
        .select('*')
        .order('name')
    
    if (error) {
        console.error('Error fetching specialties:', error)
        return
    }
    if (data) specialties.value = data
}

const openModal = () => {
    editingRole.value = null
    form.name = ''
    isOpen.value = true
}

const editRole = (role: any) => {
    editingRole.value = role
    form.name = role.name
    isOpen.value = true
}

const saveRole = async () => {
    if (!form.name) return
    
    if (!tenantId.value || tenantId.value === 'undefined') {
        await fetchTenantId()
    }

    if (!tenantId.value || tenantId.value === 'undefined') {
        alert('Error: No se pudo obtener el ID del local válido. Por favor, recarga la página.')
        return
    }

    saving.value = true
    
    try {
        const payload = {
            name: form.name,
            tenant_id: tenantId.value
        }

        console.log('Inserting specialty with payload:', payload)
        console.log('Current user ID:', user.value?.id)

        if (editingRole.value) {
            const { error } = await client.from('specialties').update(payload).eq('id', editingRole.value.id)
            if (error) throw error
        } else {
            const { error } = await client.from('specialties').insert(payload)
            if (error) {
                console.error('Insert error details:', error)
                throw error
            }
        }
        
        isOpen.value = false
        await fetchSpecialties()
    } catch (e: any) {
        alert('Error al guardar: ' + e.message)
    } finally {
        saving.value = false
    }
}

const confirmDelete = async (role: any) => {
    if (!confirm(`¿Estás seguro de eliminar "${role.name}"? Esto afectará a los usuarios que la tengan asignada.`)) return
    
    const { error } = await client.from('specialties').delete().eq('id', role.id)
    if (error) alert(error.message)
    else await fetchSpecialties()
}

onMounted(async () => {
    await fetchTenantId()
    await fetchSpecialties()
})
</script>
