<template>
  <div class="space-y-4">
    <UFormGroup label="Buscar Cliente Existente">
      <USelectMenu
        v-model="selectedClient"
        :options="clients"
        option-attribute="full_name"
        searchable
        placeholder="Escribe nombre o teléfono..."
        @change="emitSelection"
      />
    </UFormGroup>

    <div class="relative flex py-2 items-center">
      <div class="flex-grow border-t border-gray-300"></div>
      <span class="flex-shrink-0 mx-4 text-gray-400 text-sm">O registra uno nuevo</span>
      <div class="flex-grow border-t border-gray-300"></div>
    </div>

    <form @submit.prevent="createClient" class="space-y-3">
      <UInput v-model="newClient.full_name" placeholder="Nombre Completo" icon="i-heroicons-user" />
      <UInput v-model="newClient.phone" placeholder="Teléfono" icon="i-heroicons-phone" />
      <UButton type="submit" label="Crear Cliente" size="sm" block variant="soft" :disabled="!newClient.full_name" :loading="creating" />
    </form>
  </div>
</template>

<script setup lang="ts">
interface Client {
  id: string
  full_name: string
  phone: string | null
}

const props = defineProps<{
  clients: Client[]
}>()

const emit = defineEmits<{
  (e: 'select', client: Client): void
  (e: 'created', client: Client): void
}>()
const client = useSupabaseClient()
const creating = ref(false)

const selectedClient = ref<Client | null>(null)
const newClient = ref({
  full_name: '',
  phone: ''
})

const emitSelection = () => {
  if (selectedClient.value) {
    emit('select', selectedClient.value)
  }
}

const createClient = async () => {
  if (!newClient.value.full_name) return
  creating.value = true
  
  try {
    const { data, error } = await client.from('clients').insert({
      full_name: newClient.value.full_name,
      phone: newClient.value.phone
    }).select().single()

    if (error) throw error
    
    emit('created', data)
    newClient.value = { full_name: '', phone: '' }
    // Alert or toast could go here
  } catch (e) {
    console.error(e)
  } finally {
    creating.value = false
  }
}
</script>
