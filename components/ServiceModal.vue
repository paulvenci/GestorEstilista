<template>
  <UModal v-model="isOpen">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ isEdit ? 'Editar Servicio' : 'Nuevo Servicio' }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
        </div>
      </template>

      <form @submit.prevent="saveService" class="space-y-4">
        <UFormGroup label="Nombre del Servicio" name="name" required>
          <UInput v-model="form.name" placeholder="Ej: Corte Caballero" autofocus />
        </UFormGroup>

        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="Precio ($)" name="price" required>
            <UInput v-model="form.price" type="number" placeholder="0.00" />
          </UFormGroup>

          <UFormGroup label="Duración (minutos)" name="duration" required>
            <UInput v-model="form.duration_min" type="number" step="15" placeholder="30" />
          </UFormGroup>
        </div>

        <UFormGroup label="% Ganancia Peluquería" name="commission_rate" help="Porcentaje que gana la peluquería por este servicio">
          <UInput v-model="form.commission_rate" type="number" icon="i-heroicons-receipt-percent" placeholder="0" />
        </UFormGroup>

        <UFormGroup label="Estado" name="active">
          <UToggle v-model="form.active" />
          <span class="ml-2 text-sm text-gray-500">{{ form.active ? 'Activo' : 'Inactivo' }}</span>
        </UFormGroup>
      </form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="isOpen = false">Cancelar</UButton>
          <UButton color="emerald" :loading="saving" @click="saveService">Guardar</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  initialData?: any
}>()

const emit = defineEmits(['update:modelValue', 'saved'])

const client = useSupabaseClient()
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref({
  id: undefined,
  name: '',
  price: 0,
  duration_min: 30,
  commission_rate: 0,
  active: true
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
        price: 0,
        duration_min: 30,
        commission_rate: 0,
        active: true
      }
    }
  }
})

const saveService = async () => {
  if (!form.value.name) return
  
  saving.value = true
  try {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const payload = { ...form.value }
    
    // Si es nuevo, obtenemos el tenant_id del usuario actual
    if (!isEdit.value) {
        const { data: profile } = await client.from('profiles').select('tenant_id').eq('id', user.id).single()
        if (!profile) throw new Error('No se encontró perfil para asociar el servicio')
        payload.tenant_id = profile.tenant_id
        delete payload.id
    }

    let error
    if (isEdit.value) {
      const { error: err } = await client.from('services').update(payload).eq('id', form.value.id)
      error = err
    } else {
      const { error: err } = await client.from('services').insert(payload)
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
