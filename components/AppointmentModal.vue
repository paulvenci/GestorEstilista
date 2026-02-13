<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-lg">{{ isEdit ? 'Editar' : 'Nuevo' }}</h3>
          <div class="flex gap-2">
            <UButton size="xs" :color="type === 'appointment' ? 'primary' : 'gray'" label="Cita" @click="type = 'appointment'" />
            <UButton size="xs" :color="type === 'block' ? 'red' : 'gray'" label="Bloqueo" @click="type = 'block'" />
          </div>
          <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="isOpen = false" />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Fields for Appointments -->
        <template v-if="type === 'appointment'">
            <!-- Client Selector -->
            <ClientSelector v-if="!isEdit" :clients="allClients" @select="handleClientSelect" @created="handleClientCreated" />
            <div v-else class="p-3 bg-gray-50 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
              <span class="text-xs text-gray-500 dark:text-gray-400 block">Cliente</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ appointment.client?.full_name || 'Sin Cliente' }}</span>
            </div>

            <!-- Service -->
            <UFormGroup label="Servicio">
              <USelect v-model="appointment.service_id" :options="services" option-attribute="name" value-attribute="id" @change="updateEndTime" />
            </UFormGroup>
        </template>

        <!-- Fields for Blocks -->
        <template v-else>
            <div class="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm border border-red-200 dark:border-red-800">
                <p class="font-bold">Bloquear Horario</p>
                <p>Este espacio no estará disponible para nuevas citas.</p>
            </div>
        </template>

        <!-- Common Fields -->
        <UFormGroup label="Estilista" required>
          <USelect v-model="appointment.stylist_id" :options="stylists" option-attribute="full_name" value-attribute="id" />
        </UFormGroup>

        <!-- Time -->
        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="Inicio">
            <UInput type="datetime-local" v-model="localStartTime" @change="updateEndTime" />
          </UFormGroup>
          <UFormGroup label="Fin (Estimado)">
             <UInput type="datetime-local" v-model="localEndTime" />
          </UFormGroup>
        </div>


        <!-- Payment Fields (When Charging) -->
        <div v-if="isCharging" class="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-3 animation-fade-in">
          <h4 class="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
            <UIcon name="i-heroicons-shopping-cart" />
            Detalles de Venta
          </h4>
          
          <!-- Cart Items -->
          <div class="space-y-2">
            <div v-for="(item, index) in cart" :key="index" class="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded border border-emerald-100 dark:border-emerald-900/50 text-sm">
                <div>
                    <p class="font-medium text-slate-800 dark:text-white">{{ item.name }}</p>
                    <p class="text-xs text-slate-500">{{ item.type === 'service' ? 'Servicio' : 'Producto' }}</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-bold text-emerald-600">{{ formatCurrency(item.price) }}</span>
                    <UButton icon="i-heroicons-trash" size="2xs" color="red" variant="ghost" @click="removeFromCart(index)" v-if="item.type !== 'service'" />
                </div>
            </div>
          </div>

          <!-- Add Product -->
          <div class="flex gap-2">
             <USelectMenu 
                v-model="selectedProductToAdd" 
                :options="productOptions" 
                option-attribute="label"
                placeholder="Agregar Producto..." 
                searchable
                class="flex-1"
             />
             <UButton icon="i-heroicons-plus" color="emerald" variant="soft" @click="addToCart" :disabled="!selectedProductToAdd" />
          </div>

          <UDivider />

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Total a Cobrar">
               <div class="text-2xl font-bold text-slate-900 dark:text-white text-right pr-2">
                   {{ formatCurrency(cartTotal) }}
               </div>
            </UFormGroup>
            <UFormGroup label="Método de Pago">
               <USelect v-model="payment.method" :options="methods" option-attribute="label" value-attribute="value" />
            </UFormGroup>
          </div>
        </div>

        <UFormGroup label="Notas">
          <UTextarea v-model="appointment.notes" placeholder="Detalles..." />
        </UFormGroup>

        <UFormGroup label="Estado" v-if="isEdit">
           <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
               <!-- Status Indicator -->
               <div v-if="appointment.status === 'completed'" class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                   <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
                   <span>Completado</span>
               </div>
               <div v-else class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm font-medium">
                   <div class="w-2 h-2 rounded-full bg-amber-400"></div>
                   <span>Pendiente</span>
               </div>

               <!-- Actions -->
               <div class="flex items-center gap-2">
                   <UButton 
                      v-if="!isCharging && clientHasPhone" 
                      color="green" 
                      variant="ghost" 
                      icon="i-heroicons-chat-bubble-left-right" 
                      @click="sendWhatsApp"
                      size="xs"
                   />
                   <UButton 
                      v-if="!isCharging && appointment.status !== 'completed'" 
                      color="emerald" 
                      variant="solid" 
                      size="2xs"
                      label="Cobrar" 
                      icon="i-heroicons-currency-dollar" 
                      @click="startCharging" 
                   />
               </div>
           </div>
        </UFormGroup>

        <div class="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-slate-800">
           <!-- Left Action: Delete -->
           <UButton 
             v-if="isEdit && !isCharging" 
             color="red" 
             variant="ghost" 
             label="Eliminar" 
             @click="cancelAppointment" 
           />
           <div v-else></div> <!-- Spacer if no delete button -->
           
           <!-- Right Actions: Save/Cancel -->
           <div class="flex items-center gap-2">
             <UButton v-if="isCharging" color="gray" variant="ghost" label="Cancelar" @click="isCharging = false" />
             
             <UButton 
               type="submit" 
               :label="isCharging ? 'Confirmar Pago' : 'Guardar'" 
               :color="isCharging ? 'emerald' : 'primary'" 
               :loading="saving" 
               @click="saveAppointment"
               class="min-w-[100px] justify-center"
             />
           </div>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
// Types
interface CartItem {
    id: string
    name: string
    price: number
    type: 'service' | 'product'
    quantity: number
    original_item: any // Keeping any for flexibility as source objects differ, but could be specific Union
}

const props = defineProps(['modelValue', 'stylists', 'services', 'products', 'clients', 'initialData'])
const emit = defineEmits(['update:modelValue', 'refresh'])

const client = useSupabaseClient()
const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.initialData?.id)
const saving = ref(false)
const type = ref('appointment') // 'appointment' | 'block'
const isCharging = ref(false)

// Cart State
const cart = ref<CartItem[]>([])
const selectedProductToAdd = ref(null)

const appointment = ref({
  stylist_id: '',
  service_id: '',
  client_id: '',
  notes: '',
  status: 'pending'
})

const payment = ref({
  method: 'cash' 
})

const methods = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Tarjeta', value: 'card' },
  { label: 'Transferencia', value: 'transfer' },
  { label: 'Otro', value: 'other' }
]

// Computed
const productOptions = computed(() => {
    return (props.products || []).map(p => ({
        id: p.id,
        label: `${p.name} - ${formatCurrency(p.price)} (Stock: ${p.stock})`,
        value: p,
        disabled: p.stock <= 0
    }))
})

const cartTotal = computed(() => {
    return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

// Local state for datetime inputs
const localStartTime = ref('')
const localEndTime = ref('')

// Initialize form
watch(() => props.modelValue, (val) => {
  if (val) {
    isCharging.value = false
    cart.value = []
    if (props.initialData) {
      appointment.value = { ...props.initialData }
      type.value = props.initialData.status === 'blocked' ? 'block' : 'appointment'
      localStartTime.value = formatDateTimeLocal(props.initialData.start_time)
      localEndTime.value = formatDateTimeLocal(props.initialData.end_time)
    } else {
       // Reset if new
       type.value = 'appointment'
       appointment.value = { stylist_id: '', service_id: '', client_id: '', notes: '', status: 'pending' }
       localStartTime.value = ''
       localEndTime.value = ''
    }
  }
})

const localClients = ref<any[]>([])

// Merge props.clients with localClients (created in this session)
const allClients = computed(() => {
    const combined = [...(props.clients || []), ...localClients.value]
    // Deduplicate by ID
    const unique = new Map()
    for (const c of combined) {
        unique.set(c.id, c)
    }
    return Array.from(unique.values())
})

const clientHasPhone = computed(() => {
    if (!appointment.value.client_id) return false
    const c = allClients.value.find(c => c.id === appointment.value.client_id)
    return c && c.phone && c.phone.length > 5
})

const sendWhatsApp = () => {
    const c = allClients.value.find(c => c.id === appointment.value.client_id)
    if (!c || !c.phone) return

    const date = new Date(localStartTime.value).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    const time = new Date(localStartTime.value).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    
    // Clean phone number (remove non-digits)
    const phone = c.phone.replace(/\D/g, '')
    const message = `Hola ${c.full_name}, recordamos tu cita en GestorEstilista el ${date} a las ${time}.`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    
    window.open(url, '_blank')
}

const handleClientSelect = (clientData) => {
  appointment.value.client_id = clientData.id
}

const handleClientCreated = (clientData) => {
    localClients.value.push(clientData)
    handleClientSelect(clientData)
}

const updateEndTime = () => {
  if (type.value === 'block' || !appointment.value.service_id) return
  
  const service = props.services.find(s => s.id === appointment.value.service_id)
  if (!service || !localStartTime.value) return

  const start = new Date(localStartTime.value)
  const end = new Date(start.getTime() + service.duration_min * 60000)
  localEndTime.value = formatDateTimeLocal(end.toISOString())
}

// Cart Logic
const startCharging = () => {
  isCharging.value = true
  cart.value = []
  
  // Add Service
  const service = props.services.find(s => s.id === appointment.value.service_id)
  if (service) {
      cart.value.push({
          id: service.id,
          name: service.name,
          price: service.price,
          type: 'service',
          quantity: 1,
          original_item: service
      })
  }
  payment.value.method = 'cash'
}

const addToCart = () => {
    if (!selectedProductToAdd.value) return
    const product = selectedProductToAdd.value.value // Extract from USelectMenu object
    
    cart.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        type: 'product',
        quantity: 1,
        original_item: product
    })
    
    selectedProductToAdd.value = null
}

const removeFromCart = (index: number) => {
    cart.value.splice(index, 1)
}

const saveAppointment = async () => {
    if (!appointment.value.stylist_id) {
        alert('Debes seleccionar un estilista.')
        return
    }

    saving.value = true
    try {
        const { data: { user } } = await client.auth.getUser()
        if (!user) throw new Error('Usuario no autenticado')

        // Fetch user's tenant_id
        const { data: profile } = await client.from('profiles').select('tenant_id').eq('id', user.id).single()
        if (!profile) throw new Error('No se pudo identificar el salón (tenant).')

        const tenantId = profile.tenant_id

        // 1. Check Availability (RPC) - Skip if completed or just paying
        if (appointment.value.status !== 'completed' && !isCharging.value) {
            const { data: isAvailable } = await client.rpc('check_availability', {
                p_stylist_id: appointment.value.stylist_id,
                p_start_time: new Date(localStartTime.value).toISOString(),
                p_end_time: new Date(localEndTime.value).toISOString(),
                p_exclude_appointment_id: appointment.value.id
            })

            if (!isAvailable) {
                alert('Conflicto de horario: El estilista ya tiene una cita o bloqueo en ese rango.')
                saving.value = false
                return
            }
        }

        // 2. Prepare Payload
        const payload = {
            ...appointment.value,
            tenant_id: tenantId,
            start_time: new Date(localStartTime.value).toISOString(),
            end_time: new Date(localEndTime.value).toISOString(),
            status: isCharging.value ? 'completed' : (type.value === 'block' ? 'blocked' : (isEdit.value ? appointment.value.status : 'pending'))
        }

        if (type.value === 'block') {
            payload.client_id = null
            payload.service_id = null
        }
        
        // 3. Save Appointment first to get ID if new
        const { data: savedAppt, error: apptError } = await client.from('appointments').upsert(payload).select().single()
        if (apptError) throw apptError
        
           // 4. Transactions Logic
        if (isCharging.value && savedAppt) {
           const stylist = props.stylists.find(s => s.id === payload.stylist_id)
           const serviceRate = stylist?.commission_rate || 0
           const productRate = stylist?.product_commission_rate || 0 // New field
           
           // Calculate total commission with split rates
           let totalCommission = 0
           
           // Create Transaction Items Payload & Calculate Commission
           const itemsPayload = cart.value.map(item => {
               const isService = item.type === 'service'
               const rate = isService ? serviceRate : productRate
               const itemTotal = item.price * item.quantity
               const commission = (itemTotal * rate) / 100
               
               totalCommission += commission

               return {
                   tenant_id: tenantId,
                   transaction_id: '', // Will be set after tx creation, or we create tx first
                   service_id: isService ? item.id : null,
                   product_id: !isService ? item.id : null,
                   item_id: item.id,
                   item_type: item.type,
                   name: item.name,
                   quantity: item.quantity,
                   unit_price: item.price
               }
           })

           // Create Transaction
           const { data: transaction, error: txError } = await client.from('transactions').insert({
              tenant_id: tenantId,
              appointment_id: savedAppt.id,
              client_id: payload.client_id,
              stylist_id: payload.stylist_id,
              total_amount: cartTotal.value,
              commission_amount: totalCommission, // Saved calculated total
              payment_method: payment.value.method,
              notes: 'Cobro de cita #' + savedAppt.id.slice(0, 6)
           }).select().single()
           
           if (txError) throw txError

           // Assign transaction_id to items and insert
           const finalItems = itemsPayload.map(i => ({ ...i, transaction_id: transaction.id }))
           const { error: itemsError } = await client.from('transaction_items').insert(finalItems)
           if (itemsError) throw itemsError

           // Deduct Stock
           for (const item of cart.value) {
               if (item.type === 'product') {
                   const newStock = item.original_item.stock - item.quantity
                   await client.from('products').update({ stock: newStock }).eq('id', item.id)
               }
           }
        }

        isOpen.value = false
        emit('refresh')
    } catch (e: any) {
        alert(e.message)
    } finally {
        saving.value = false
    }
}

const cancelAppointment = async () => {
    if(!confirm('¿Eliminar este registro?')) return
    await client.from('appointments').delete().eq('id', appointment.value.id)
    isOpen.value = false
    emit('refresh')
}

// Helpers
const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val)
}

// Helper: ISO to YYYY-MM-DDTHH:mm
const formatDateTimeLocal = (isoString?: string) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    const offset = d.getTimezoneOffset() * 60000
    const local = new Date(d.getTime() - offset)
    return local.toISOString().slice(0, 16)
}
</script>
