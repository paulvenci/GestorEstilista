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

            <!-- Items Selector (Services & Products) -->
             <div class="space-y-2">
                 <div class="flex justify-between items-center">
                     <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Servicios y Productos</label>
                 </div>
                 
                 <!-- Items List -->
                 <div class="space-y-2" v-if="items.length > 0">
                    <div v-for="(item, index) in items" :key="index" class="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700 text-sm">
                        <div class="flex items-center gap-2">
                             <UBadge :color="item.type === 'service' ? 'blue' : 'purple'" variant="subtle" size="xs">
                                 {{ item.type === 'service' ? 'Servicio' : 'Producto' }}
                             </UBadge>
                             <div class="flex flex-col">
                                 <span class="font-medium">{{ item.name }}</span>
                                 <span class="text-xs text-gray-500">{{ formatCurrency(item.price) }}</span>
                             </div>
                        </div>
                        <div class="flex items-center gap-2">
                             <UButton icon="i-heroicons-trash" size="2xs" color="red" variant="ghost" @click="removeItem(index)" />
                        </div>
                    </div>
                 </div>
                 <div v-else class="text-xs text-gray-400 italic text-center py-2 border border-dashed rounded border-gray-300">
                     No hay servicios agregados
                 </div>

                 <!-- Add Item -->
                 <div class="flex gap-2">
                      <USelectMenu 
                        v-model="selectedItemToAdd" 
                        :options="allItemOptions" 
                        option-attribute="label"
                        placeholder="Agregar Servicio o Producto..." 
                        class="flex-1"
                        searchable
                        searchable-placeholder="Buscar..."
                     />
                     <UButton icon="i-heroicons-plus" color="primary" variant="soft" @click="addItem" :disabled="!selectedItemToAdd" />
                 </div>
             </div>
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
          <USelect v-model="appointment.stylist_id" :options="stylists" option-attribute="full_name" value-attribute="id" :disabled="isStylistRestricted" />
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
            Confirmar Venta
          </h4>
          
          <div class="space-y-2">
            <div v-for="(item, index) in items" :key="index" class="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded border border-emerald-100 dark:border-emerald-900/50 text-sm">
                <div>
                    <p class="font-medium text-slate-800 dark:text-white">{{ item.name }}</p>
                    <p class="text-xs text-slate-500">{{ item.type === 'service' ? 'Servicio' : 'Producto' }}</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-bold text-emerald-600">{{ formatCurrency(item.price) }}</span>
                     <!-- Allow Remove in Charge Mode -->
                    <UButton icon="i-heroicons-trash" size="2xs" color="red" variant="ghost" @click="removeItem(index)" />
                </div>
            </div>
          </div>

          <!-- Add extra products specifically in charge mode? Re-using common selector might be cleaner but let's keep it simple -->
           <div class="flex gap-2">
             <USelectMenu 
                v-model="selectedItemToAdd" 
                :options="productOptions" 
                option-attribute="label"
                placeholder="Agregar Producto Adicional..." 
                searchable
                class="flex-1"
             />
             <UButton icon="i-heroicons-plus" color="emerald" variant="soft" @click="addProductInChargeMode" :disabled="!selectedItemToAdd" />
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

// Types
interface CartItem {
    id: string
    name: string
    price: number
    type: 'service' | 'product'
    quantity: number
    duration_min?: number
    original_item: any
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

// Items State (Shared for Booking and Charging)
const items = ref<CartItem[]>([])
const selectedItemToAdd = ref<any>(null)

const appointment = ref<any>({
  stylist_id: '',
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

// Computed Options
const allItemOptions = computed(() => {
    const sOpts = (props.services || []).map(s => ({
        id: s.id,
        label: `✂️ ${s.name} (${s.duration_min} min) - ${formatCurrency(s.price)}`,
        value: s,
        type: 'service'
    }))

    const pOpts = (props.products || []).map(p => ({
        id: p.id,
        label: `🛍️ ${p.name} - ${formatCurrency(p.price)} (Stock: ${p.stock})`,
        value: p,
        type: 'product',
        disabled: p.stock <= 0
    }))

    return [
        { label: 'Servicios', disabled: true },
        ...sOpts,
        { label: 'Productos', disabled: true },
        ...pOpts
    ]
})

const productOptions = computed(() => {
    return (props.products || []).map(p => ({
        id: p.id,
        label: `${p.name} - ${formatCurrency(p.price)} (Stock: ${p.stock})`,
        value: p,
        disabled: p.stock <= 0
    }))
})

// Totals
const totalDuration = computed(() => {
    return items.value
        .filter(i => i.type === 'service')
        .reduce((sum, i) => sum + ((i.duration_min || 0) * i.quantity), 0)
})

const cartTotal = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

// Local state for datetime inputs
const localStartTime = ref('')
const localEndTime = ref('')

// Settings
const tenantSettings = ref<any>({})
const fetchTenantSettings = async () => {
    const { data } = await client.from('tenants').select('settings').single()
    if (data?.settings) tenantSettings.value = data.settings
}

const currentUserProfile = ref(null)

const fetchCurrentUser = async () => {
    const { data: { user } } = await client.auth.getUser()
    if (user) {
        const { data } = await client.from('profiles').select('*').eq('id', user.id).single()
        currentUserProfile.value = data
    }
}

// Check if user is restricted (stylist only)
const isStylistRestricted = computed(() => {
    const role = currentUserProfile.value?.role
    // List of roles that are restricted to their own appointments
    return role === 'stylist' || role === 'barber'
})

// Initialize form
watch(() => props.modelValue, async (val) => {
  if (val) {
    if (!currentUserProfile.value) await fetchCurrentUser()
    
    fetchTenantSettings()
    isCharging.value = false
    items.value = []
    
    if (props.initialData) {
      appointment.value = { ...props.initialData }
      type.value = props.initialData.status === 'blocked' ? 'block' : 'appointment'
      localStartTime.value = formatDateTimeLocal(props.initialData.start_time)
      localEndTime.value = formatDateTimeLocal(props.initialData.end_time)

      // Populate Items
      if (props.initialData.appointment_items && props.initialData.appointment_items.length > 0) {
          // New Structure
          items.value = props.initialData.appointment_items.map(i => ({
              id: i.item_id, // This links to service/product ID
              name: i.name,
              price: i.unit_price, // Snapshot price or current? Use stored price usually
              type: i.item_type,
              quantity: i.quantity,
              duration_min: i.item_type === 'service' ? (props.services.find(s => s.id === i.item_id)?.duration_min || 30) : 0,
              original_item: i.item_type === 'service' 
                  ? props.services.find(s => s.id === i.item_id) 
                  : props.products.find(p => p.id === i.item_id)
          }))
      } else if (props.initialData.service_id) {
          // Legacy Structure Support
          const s = props.services.find(s => s.id === props.initialData.service_id)
          if (s) {
              items.value.push({
                  id: s.id,
                  name: s.name,
                  price: s.price,
                  type: 'service',
                  quantity: 1,
                  duration_min: s.duration_min,
                  original_item: s
              })
          }
      }

    } else {
       // Reset if new
       type.value = 'appointment'
       
       // Pre-fill stylist if restricted or if passed in initialData (which might just contain start/end)
       const prefillStylist = isStylistRestricted.value ? currentUserProfile.value.id : (props.initialData?.stylist_id || '')
       
       appointment.value = { stylist_id: prefillStylist, client_id: '', notes: '', status: 'pending' }
       
       localStartTime.value = ''
       localEndTime.value = ''
       // Default date to nearest hour if needed, handled by calendar selection usually
       if (props.initialData?.start_time) {
            // New from calendar selection
             localStartTime.value = formatDateTimeLocal(props.initialData.start_time)
             localEndTime.value = formatDateTimeLocal(props.initialData.end_time)
       }
    }
  }
})

const localClients = ref<any[]>([])
const allClients = computed(() => {
    const combined = [...(props.clients || []), ...localClients.value]
    const unique = new Map()
    for (const c of combined) unique.set(c.id, c)
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
    
    const dateObj = new Date(localStartTime.value)
    const date = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    const time = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    
    let message = ''
    const template = tenantSettings.value?.whatsapp_template
    
    if (template) {
        const stylistName = props.stylists.find(s => s.id === appointment.value.stylist_id)?.full_name || 'Nosotros'
        message = template
            .replace(/{cliente}/g, c.full_name)
            .replace(/{fecha}/g, date)
            .replace(/{hora}/g, time)
            .replace(/{estilista}/g, stylistName)
    } else {
        // Default
        message = `Hola ${c.full_name}, recordamos tu cita en GestorEstilista el ${date} a las ${time}.`
    }

    const phone = c.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
}

const handleClientSelect = (clientData: any) => {
    appointment.value.client_id = clientData.id
}
const handleClientCreated = (clientData) => {
    localClients.value.push(clientData)
    appointment.value.client_id = clientData.id
}

const updateEndTime = () => {
  if (type.value === 'block' || !localStartTime.value) return
  
  // Recalculate end time based on total duration of services
  const duration = totalDuration.value || 30 // Default 30 min
  const start = new Date(localStartTime.value)
  const end = new Date(start.getTime() + duration * 60000)
  localEndTime.value = formatDateTimeLocal(end.toISOString())
}

// Item Management
const addItem = () => {
    if (!selectedItemToAdd.value) return
    const opt = selectedItemToAdd.value
    const obj = opt.value

    items.value.push({
        id: obj.id, // Service or Product ID
        name: obj.name,
        price: obj.price,
        type: opt.type as 'service' | 'product',
        quantity: 1,
        duration_min: obj.duration_min || 0,
        original_item: obj
    })
    
    selectedItemToAdd.value = null
    updateEndTime() // Recalculate time if service added
}

const removeItem = (index: number) => {
    items.value.splice(index, 1)
    updateEndTime()
}

const addProductInChargeMode = () => {
    if (!selectedItemToAdd.value) return
    const p = selectedItemToAdd.value.value // from productOptions which are simpler
    items.value.push({
         id: p.id,
         name: p.name,
         price: p.price,
         type: 'product',
         quantity: 1,
         duration_min: 0,
         original_item: p
    })
    selectedItemToAdd.value = null
}

// Logic
const startCharging = () => {
  isCharging.value = true
  // Items are already in `items` array, no need to copy
  payment.value.method = 'cash'
}

const saveAppointment = async () => {
    // Validation
    if (!appointment.value.stylist_id) return alert('Selecciona un estilista.')
    if (type.value === 'appointment' && items.value.length === 0) return alert('Debes agregar al menos un servicio o producto.')

    saving.value = true
    try {
        const { data: { user } } = await client.auth.getUser()
        if (!user) throw new Error('Usuario no autenticado')
        const { data: profile } = await client.from('profiles').select('tenant_id').eq('id', user.id).single()
        if (!profile) throw new Error('No tenant found')
        const tenantId = profile.tenant_id

        // 1. Availability Check (Skip if completed/charging)
        if (appointment.value.status !== 'completed' && !isCharging.value) {
            const { data: isAvailable } = await client.rpc('check_availability', {
                p_stylist_id: appointment.value.stylist_id,
                p_start_time: new Date(localStartTime.value).toISOString(),
                p_end_time: new Date(localEndTime.value).toISOString(),
                p_exclude_appointment_id: appointment.value.id
            })
            if (!isAvailable) {
                alert('Conflicto de horario: El estilista no está disponible.')
                saving.value = false
                return
            }
        }

        // 2. Upsert Appointment
        const payload: any = {
            tenant_id: tenantId,
            client_id: type.value === 'block' ? null : appointment.value.client_id,
            stylist_id: appointment.value.stylist_id,
            service_id: null, // Deprecated/Legacy
            notes: appointment.value.notes,
            start_time: new Date(localStartTime.value).toISOString(),
            end_time: new Date(localEndTime.value).toISOString(),
            status: isCharging.value ? 'completed' : (type.value === 'block' ? 'blocked' : (isEdit.value ? appointment.value.status : 'pending'))
        }
        if (appointment.value.id) payload.id = appointment.value.id
        if (type.value === 'block') payload.status = 'blocked'

        const { data: savedAppt, error: apptError } = await client.from('appointments').upsert(payload).select().single()
        if (apptError) throw apptError

        // 3. Handle Items (Delete Allow and Re-insert) - Only if not Block
        if (type.value !== 'block') {
             // Delete existing
            if (payload.id) {
                await client.from('appointment_items').delete().eq('appointment_id', payload.id)
            }

            // Insert new
            const itemsPayload = items.value.map(i => ({
                tenant_id: tenantId,
                appointment_id: savedAppt.id,
                item_id: i.id,
                item_type: i.type,
                quantity: i.quantity,
                unit_price: i.price,
                name: i.name
            }))
            
            if (itemsPayload.length > 0) {
                const { error: itemsErr } = await client.from('appointment_items').insert(itemsPayload)
                if (itemsErr) throw itemsErr
            }
        }

        // 4. Transaction Logic (If Charging)
        if (isCharging.value && savedAppt) {
             const { data: freshStylist } = await client.from('profiles').select('commission_rate, product_commission_rate').eq('id', payload.stylist_id).single()
             const serviceRate = freshStylist?.commission_rate || 0
             const productRate = freshStylist?.product_commission_rate || 0

            // Create Transaction Items Payload & Calculate Commission
           let totalCommission = 0
           const itemsPayload = items.value.map(item => {
               const isService = item.type === 'service'
               const stylistRate = isService ? serviceRate : productRate
               const itemTotal = item.price * item.quantity
               
               // Comisión del estilista (% que gana la peluquería del trabajo del estilista)
               const stylistCommission = (itemTotal * stylistRate) / 100
               
               // Ganancia propia del servicio (% configurado en el servicio)
               let serviceOwnCommission = 0
               if (isService) {
                   const svc = props.services?.find(s => s.id === item.id)
                   const svcRate = Number(svc?.commission_rate) || 0
                   serviceOwnCommission = (itemTotal * svcRate) / 100
               }
               
               totalCommission += stylistCommission + serviceOwnCommission

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
           for (const item of items.value) {
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

const formatCurrency = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val)
const formatDateTimeLocal = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const offset = d.getTimezoneOffset() * 60000
    const local = new Date(d.getTime() - offset)
    return local.toISOString().slice(0, 16)
}
</script>
