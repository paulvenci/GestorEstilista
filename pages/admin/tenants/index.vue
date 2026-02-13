<template>
  <div class="space-y-8">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="hidden md:block">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Peluquerías</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Directorio de negocios registrados en la plataforma.</p>
      </div>
      <UButton icon="i-heroicons-plus" label="Nueva Peluquería" color="emerald" size="lg" @click="isOpen = true" class="shadow-lg shadow-emerald-500/20" />
    </div>

    <div class="space-y-4">
      <UCard class="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" :ui="{ body: { padding: 'p-0' } }">
        <UTable 
          :rows="tenants" 
          :columns="columns" 
          :ui="{ 
            thead: 'bg-slate-50 dark:bg-slate-800/50',
            th: { color: 'text-slate-900 dark:text-white' },
            td: { color: 'text-slate-600 dark:text-slate-400' }
          }"
        >
          <template #name-data="{ row }">
            <div>
                <div class="font-bold text-slate-900 dark:text-white">{{ row.name }}</div>
                <div class="text-xs text-slate-500">{{ row.slug }}</div>
            </div>
          </template>
          
          <template #plan-data="{ row }">
            <UBadge v-if="row.plans" color="gray" variant="subtle">{{ row.plans.name }}</UBadge>
            <span v-else class="text-xs text-red-400">Sin Plan</span>
          </template>

          <template #status-data="{ row }">
            <UBadge :color="getStatusColor(row.status)" variant="subtle">
                {{ getStatusLabel(row.status) }}
            </UBadge>
          </template>

          <template #next_billing_date-data="{ row }">
            <span v-if="row.next_billing_date" class="text-sm">
                {{ new Date(row.next_billing_date).toLocaleDateString() }}
            </span>
            <span v-else class="text-xs text-slate-400">N/A</span>
          </template>

          <template #actions-data="{ row }">
            <UDropdown :items="transformActions(row)">
                <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal" />
            </UDropdown>
          </template>
        </UTable>
      </UCard>
    </div>

    <!-- Modal Nueva Peluquería (Existing) -->
    <UModal v-model="isOpen">
       <!-- ... existing content ... -->
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Registrar Nueva Peluquería
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
          </div>
        </template>
        
        <form @submit.prevent="createTenant" class="space-y-4 py-2">
          <UFormGroup label="Nombre del Negocio" name="name">
            <UInput v-model="newTenant.name" icon="i-heroicons-building-storefront" />
          </UFormGroup>

          <UFormGroup label="Slug (URL)" name="slug">
            <UInput v-model="newTenant.slug" icon="i-heroicons-link" />
          </UFormGroup>

          <UFormGroup label="Plan de Suscripción" name="plan">
             <USelect 
                v-model="newTenant.plan_id" 
                :options="plans" 
                option-attribute="name" 
                value-attribute="id"
             />
          </UFormGroup>

          <div class="flex justify-end gap-3 mt-6">
            <UButton color="gray" variant="ghost" label="Cancelar" @click="isOpen = false" />
            <UButton type="submit" color="emerald" label="Crear Peluquería" :loading="creating" />
          </div>
        </form>
      </UCard>
    </UModal>

    <!-- Modal Registrar Pago -->
    <UModal v-model="isPaymentModalOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <h3 class="font-semibold text-gray-900 dark:text-white">Registrar Pago - {{ selectedTenant?.name }}</h3>
        </template>
        
        <form @submit.prevent="registerPayment" class="space-y-4 py-2">
           <UFormGroup label="Monto (CLP)" name="amount">
             <UInput v-model="paymentForm.amount" type="number" icon="i-heroicons-currency-dollar" />
           </UFormGroup>

           <UFormGroup label="Método de Pago" name="method">
             <USelect v-model="paymentForm.payment_method" :options="['Transferencia', 'Efectivo', 'Tarjeta']" />
           </UFormGroup>

           <UFormGroup label="Referencia / Comprobante" name="reference">
             <UInput v-model="paymentForm.reference_id" placeholder="Nro operación" />
           </UFormGroup>

           <div class="flex justify-end gap-3 mt-6">
             <UButton color="gray" variant="ghost" label="Cancelar" @click="isPaymentModalOpen = false" />
             <UButton type="submit" color="emerald" label="Confirmar Pago" :loading="processingPayment" />
           </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// ... existing imports and defines ...
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Peluquerías')
headerTitle.value = 'Peluquerías'
const router = useRouter()
const isOpen = ref(false)
const creating = ref(false)
const tenants = ref<any[]>([])
const plans = ref<any[]>([])

// Debug/Navigation helper
const transformActions = (row: any) => [
    [{ 
        label: 'Ver Detalles', 
        icon: 'i-heroicons-eye', 
        click: () => {
            console.log('Navigating to tenant:', row.slug)
            router.push(`/admin/tenants/${row.slug}`)
        }
    }],
    [{ label: 'Registrar Pago', icon: 'i-heroicons-banknotes', click: () => openPaymentModal(row) }],
    [{ label: 'Suspender', icon: 'i-heroicons-no-symbol', color: 'red' }]
]

// Payment Logic
const isPaymentModalOpen = ref(false)
const processingPayment = ref(false)
const selectedTenant = ref(null)
const paymentForm = reactive({
    amount: 0,
    payment_method: 'Transferencia',
    reference_id: ''
})

const newTenant = ref({
  name: '',
  slug: '',
  plan_id: '',
  status: 'active'
})

const columns = [
  { key: 'name', label: 'Negocio' },
  { key: 'plan', label: 'Plan' },
  { key: 'status', label: 'Estado' },
  { key: 'next_billing_date', label: 'Próximo Pago' },
  { key: 'actions', label: 'Acciones' }
]

// ... fetch functions ...
const fetchTenants = async () => {
  const { data } = await client
    .from('tenants')
    .select('*, plans(name, price)')
    .order('created_at', { ascending: false })
  
  if (data) tenants.value = data
}

const fetchPlans = async () => {
    const { data } = await client.from('plans').select('id, name').eq('active', true)
    if (data) {
        plans.value = data
        if (data.length > 0) newTenant.value.plan_id = data[0].id
    }
}

const createTenant = async () => {
  creating.value = true
  try {
    const { error } = await client.from('tenants').insert(newTenant.value)
    if (error) throw error
    
    isOpen.value = false
    newTenant.value = { name: '', slug: '', plan_id: plans.value[0]?.id || '', status: 'active' }
    await fetchTenants()
    alert('Peluquería creada exitosamente')
  } catch (e: any) {
    alert('Error al crear: ' + e.message)
  } finally {
    creating.value = false
  }
}

// Payment Functions
const openPaymentModal = (tenant: any) => {
    selectedTenant.value = tenant
    // Pre-fill amount based on plan price if available
    paymentForm.amount = tenant.plans?.price || 0
    paymentForm.reference_id = ''
    paymentForm.payment_method = 'Transferencia'
    isPaymentModalOpen.value = true
}

const registerPayment = async () => {
    if (!selectedTenant.value) return
    processingPayment.value = true
    
    try {
        // 1. Insert Payment Record
        const { error: payError } = await client.from('tenant_payments').insert({
            tenant_id: selectedTenant.value.id,
            amount: paymentForm.amount,
            payment_method: paymentForm.payment_method,
            reference_id: paymentForm.reference_id,
            status: 'completed'
        })
        if (payError) throw payError

        // 2. Update Tenant Next Billing Date (Add 1 Month)
        // Calculate new date: If overdue, from today + 1 month? Or from previous date?
        // Let's assume from today for simplicity + 1 month.
        const nextDate = new Date()
        nextDate.setMonth(nextDate.getMonth() + 1)
        
        const { error: tenantError } = await client.from('tenants').update({
            status: 'active', // Reactivate if suspended
            next_billing_date: nextDate.toISOString()
        }).eq('id', selectedTenant.value.id)

        if (tenantError) throw tenantError

        isPaymentModalOpen.value = false
        await fetchTenants()
        alert('Pago registrado y suscripción renovada.')

    } catch (e: any) {
        alert('Error al registrar pago: ' + e.message)
    } finally {
        processingPayment.value = false
    }
}

const getStatusColor = (status: string) => {
    switch(status) {
        case 'active': return 'emerald'
        case 'suspended': return 'red'
        case 'pending_payment': return 'orange'
        default: return 'gray'
    }
}

const getStatusLabel = (status: string) => {
    switch(status) {
        case 'active': return 'Activo'
        case 'suspended': return 'Suspendido'
        case 'pending_payment': return 'Pendiente Pago'
        default: return status
    }
}



onMounted(() => {
  fetchTenants()
  fetchPlans()
})
</script>
