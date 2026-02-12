<template>
  <UModal v-model="isOpen">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ isEdit ? 'Editar Producto' : 'Nuevo Producto' }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
        </div>
      </template>

      <form @submit.prevent="saveProduct" class="space-y-4">
        <UFormGroup label="Nombre del Producto" name="name" required>
          <UInput v-model="form.name" placeholder="Ej: Shampoo Keratina" autofocus />
        </UFormGroup>

        <UFormGroup label="Descripción" name="description">
            <UTextarea v-model="form.description" placeholder="Detalles del producto..." />
        </UFormGroup>

        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="Precio Venta ($)" name="price" required>
            <UInput v-model="form.price" type="number" step="0.01" placeholder="0.00" />
          </UFormGroup>

          <UFormGroup label="Costo ($)" name="cost">
            <UInput v-model="form.cost" type="number" step="0.01" placeholder="0.00" />
          </UFormGroup>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Stock Actual" name="stock" required>
                <UInput v-model="form.stock" type="number" placeholder="0" />
            </UFormGroup>

            <UFormGroup label="Alerta Stock Bajo" name="low_stock">
                <UInput v-model="form.low_stock_threshold" type="number" placeholder="5" />
            </UFormGroup>
        </div>

        <UFormGroup label="Estado" name="active">
          <UToggle v-model="form.active" />
          <span class="ml-2 text-sm text-gray-500">{{ form.active ? 'Activo' : 'Inactivo' }}</span>
        </UFormGroup>
      </form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="isOpen = false">Cancelar</UButton>
          <UButton color="emerald" :loading="saving" @click="saveProduct">Guardar</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Database } from '~/types/database.types'

const props = defineProps<{
  modelValue: boolean
  initialData?: Database['public']['Tables']['products']['Row'] | null
}>()

const emit = defineEmits(['update:modelValue', 'saved'])

const client = useSupabaseClient<Database>()
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref<Partial<Database['public']['Tables']['products']['Insert']>>({
  id: undefined,
  name: '',
  description: '',
  price: 0,
  cost: 0,
  stock: 0,
  low_stock_threshold: 5,
  active: true,
  tenant_id: undefined 
})

const saving = ref(false)
const isEdit = computed(() => !!form.value.id)

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.initialData) {
      form.value = { ...props.initialData }
    } else {
      form.value = {
        id: undefined,
        name: '',
        description: '',
        price: 0,
        cost: 0,
        stock: 0,
        low_stock_threshold: 5,
        active: true,
        tenant_id: undefined
      }
    }
  }
})

const saveProduct = async () => {
  if (!form.value.name) return
  
  saving.value = true
  try {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Prepare payload ensuring numbers are numbers (input sometimes returns strings)
    const payload: any = { 
        ...form.value,
        price: Number(form.value.price),
        cost: Number(form.value.cost),
        stock: Number(form.value.stock),
        low_stock_threshold: Number(form.value.low_stock_threshold)
    }
    
    // Si es nuevo, obtenemos el tenant_id del usuario actual
    if (!isEdit.value) {
        const { data: profile } = await client.from('profiles').select('tenant_id').eq('id', user.id).single()
        if (!profile) throw new Error('No se encontró perfil para asociar el producto')
        payload.tenant_id = profile.tenant_id
        delete payload.id
    }

    let error
    if (isEdit.value && form.value.id) {
      const { error: err } = await client.from('products').update(payload).eq('id', form.value.id)
      error = err
    } else {
      const { error: err } = await client.from('products').insert(payload)
      error = err
    }

    if (error) throw error

    emit('saved')
    isOpen.value = false
    
  } catch (e: any) {
    alert(e.message)
  } finally {
    saving.value = false
  }
}
</script>
