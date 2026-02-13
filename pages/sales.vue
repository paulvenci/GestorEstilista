<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="hidden md:block">
        <h1 class="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Caja y Ventas</h1>
        <p class="text-slate-500 dark:text-slate-400">Registro de transacciones y comisiones</p>
      </div>
      
      <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
        <div class="flex gap-2">
            <UInput v-model="startDate" type="date" class="w-full md:w-auto" />
            <UInput v-model="endDate" type="date" class="w-full md:w-auto" />
        </div>
        <UButton icon="i-heroicons-funnel" label="Filtrar" color="emerald" @click="fetchTransactions" :loading="loading" />
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard :ui="{ background: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-1 ring-emerald-200 dark:ring-emerald-800' }">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-emerald-100 dark:bg-emerald-800 rounded-full">
            <UIcon name="i-heroicons-currency-dollar" class="text-3xl text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400">Ventas Totales (Mes)</p>
            <p class="text-2xl font-bold text-emerald-900 dark:text-white">{{ formatCurrency(totalSales) }}</p>
          </div>
        </div>
      </UCard>

      <UCard :ui="{ background: 'bg-blue-50 dark:bg-blue-900/20', ring: 'ring-1 ring-blue-200 dark:ring-blue-800' }">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
            <UIcon name="i-heroicons-user-group" class="text-3xl text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Transacciones</p>
            <p class="text-2xl font-bold text-blue-900 dark:text-white">{{ transactions.length }}</p>
          </div>
        </div>
      </UCard>

      <UCard :ui="{ background: 'bg-purple-50 dark:bg-purple-900/20', ring: 'ring-1 ring-purple-200 dark:ring-purple-800' }">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-purple-100 dark:bg-purple-800 rounded-full">
            <UIcon name="i-heroicons-banknotes" class="text-3xl text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p class="text-sm font-medium text-purple-600 dark:text-purple-400">Comisiones Totales</p>
            <p class="text-2xl font-bold text-purple-900 dark:text-white">{{ formatCurrency(totalCommissions) }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Tabs -->
    <UTabs :items="items" class="w-full">
      <template #item="{ item }">
        
        <!-- Transactions Tab -->
        <UCard v-if="item.key === 'transactions'" shadow="md" :ui="{ body: { padding: 'p-0' }, background: 'bg-white dark:bg-slate-900', ring: 'ring-1 ring-slate-200 dark:ring-slate-800' }">
          <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 class="font-bold text-slate-700 dark:text-slate-300">Historial de Transacciones</h3>
            <div class="flex items-center gap-2">
                <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Buscar cliente, estilista..." size="sm" />
                <UButton icon="i-heroicons-arrow-path" variant="ghost" color="gray" @click="fetchTransactions" :loading="loading" />
            </div>
          </div>

          <UTable 
            :rows="paginatedTransactions" 
            :columns="columns" 
            :loading="loading" 
            :sort="sort"
            @update:sort="sort = $event"
            sort-mode="manual"
            class="w-full"
            :ui="{ divide: 'divide-y divide-slate-200 dark:divide-slate-800', th: { color: 'text-slate-900 dark:text-white' }, td: { color: 'text-slate-500 dark:text-slate-400' } }"
          >
            <template #total_amount-data="{ row }">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(row.total_amount) }}</span>
            </template>
            
            <template #commission_amount-data="{ row }">
              <span class="text-slate-500 text-xs">{{ formatCurrency(row.commission_amount) }}</span>
            </template>

            <template #created_at-data="{ row }">
              {{ formatDate(row.created_at) }}
            </template>

            <template #payment_method-data="{ row }">
              <UBadge :color="getMethodColor(row.payment_method)" variant="subtle">{{ getMethodLabel(row.payment_method) }}</UBadge>
            </template>
          </UTable>
          
          <div class="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <UPagination v-model="page" :page-count="pageCount" :total="filteredTransactions.length" />
          </div>
        </UCard>

        <!-- Stylists Report Tab -->
        <UCard v-else-if="item.key === 'stylists'" shadow="md" :ui="{ body: { padding: 'p-0' }, background: 'bg-white dark:bg-slate-900', ring: 'ring-1 ring-slate-200 dark:ring-slate-800' }">
          <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
             <h3 class="font-bold text-slate-700 dark:text-slate-300">Rendimiento por Estilista</h3>
          </div>
          
          <UTable 
            :rows="stylistStats" 
            :columns="stylistColumns"
            :loading="loading"
            :ui="{ divide: 'divide-y divide-slate-200 dark:divide-slate-800', th: { color: 'text-slate-900 dark:text-white' }, td: { color: 'text-slate-500 dark:text-slate-400' } }"
          >
             <template #total_sales-data="{ row }">
               <span class="font-bold text-slate-600 dark:text-slate-400">{{ formatCurrency(row.total_sales) }}</span>
             </template>
             <template #total_commissions-data="{ row }">
               <span class="font-bold text-purple-600 dark:text-purple-400">{{ formatCurrency(row.total_commissions) }}</span>
             </template>
              <template #total_paid-data="{ row }">
               <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(row.total_paid) }}</span>
             </template>
              <template #balance-data="{ row }">
               <span :class="row.balance > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'">{{ formatCurrency(row.balance) }}</span>
             </template>

             <template #commission_rate-data="{ row }">
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2 text-xs">
                        <span class="text-slate-500 w-16">Servicios:</span>
                        <span v-if="!row.editing" @click="row.editing = true" class="cursor-pointer hover:underline decoration-dashed font-medium">{{ row.commission_rate }}%</span>
                        <UInput v-else v-model="row.temp_rate" type="number" size="2xs" class="w-14" />
                    </div>
                    <div class="flex items-center gap-2 text-xs">
                        <span class="text-slate-500 w-16">Productos:</span>
                         <span v-if="!row.editing" @click="row.editing = true" class="cursor-pointer hover:underline decoration-dashed font-medium">{{ row.product_commission_rate || 0 }}%</span>
                         <div v-else class="flex gap-1">
                             <UInput v-model="row.temp_product_rate" type="number" size="2xs" class="w-14" />
                             <UButton icon="i-heroicons-check" size="2xs" color="emerald" @click="updateCommission(row)" />
                             <UButton icon="i-heroicons-x-mark" size="2xs" color="gray" variant="ghost" @click="row.editing = false" />
                         </div>
                    </div>
                </div>
             </template>

             <template #actions-data="{ row }">
                 <UButton 
                    label="Pagar" 
                    size="xs" 
                    color="emerald" 
                    variant="soft" 
                    icon="i-heroicons-banknotes" 
                    @click="openPayoutModal(row)"
                    :disabled="row.balance <= 0"
                 />
             </template>
          </UTable>
        </UCard>
      </template>
    </UTabs>

    <!-- Payout Modal -->
    <UModal v-model="isPayoutModalOpen">
        <UCard>
            <template #header>
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white">Registrar Pago de Comisión</h3>
                    <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="isPayoutModalOpen = false" />
                </div>
            </template>
            
            <div class="space-y-4" v-if="selectedStylistForPayout">
                <div class="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-100 dark:border-emerald-800">
                    <p class="text-sm text-emerald-800 dark:text-emerald-300">Estilista</p>
                    <p class="text-lg font-bold text-emerald-900 dark:text-white">{{ selectedStylistForPayout.full_name }}</p>
                    <div class="flex justify-between mt-2 text-sm">
                        <span>Saldo Pendiente:</span>
                        <span class="font-bold">{{ formatCurrency(selectedStylistForPayout.balance) }}</span>
                    </div>
                </div>

                <UFormGroup label="Monto a Pagar">
                    <UInput v-model="payoutForm.amount" type="number" icon="i-heroicons-currency-dollar" />
                </UFormGroup>

                <UFormGroup label="Fecha">
                    <UInput v-model="payoutForm.date" type="date" />
                </UFormGroup>

                <UFormGroup label="Notas">
                    <UTextarea v-model="payoutForm.notes" placeholder="Detalles del pago (Transferencia, Efectivo, etc.)" />
                </UFormGroup>

                <div class="flex justify-end gap-2 pt-4">
                    <UButton label="Cancelar" color="gray" variant="ghost" @click="isPayoutModalOpen = false" />
                    <UButton label="Registrar Pago" color="emerald" :loading="payoutSaving" @click="savePayout" />
                </div>
            </div>
        </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Caja')
headerTitle.value = 'Caja'

// Filter State
const today = new Date()
const startDate = ref(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10))
const endDate = ref(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10))
const search = ref('')

// Pagination & Sort
const page = ref(1)
const pageCount = 10
const sort = ref({ column: 'created_at', direction: 'desc' })

const loading = ref(false)
const transactions = ref([])
const payouts = ref([])
const stylists = ref([])

const items = [{
  key: 'transactions',
  label: 'Transacciones',
  icon: 'i-heroicons-list-bullet'
}, {
  key: 'stylists',
  label: 'Reporte y Equipo',
  icon: 'i-heroicons-user-group'
}]

// Date Navigation
// Computed Data
const filteredTransactions = computed(() => {
    let result = [...transactions.value]

    // Search
    if (search.value) {
        const q = search.value.toLowerCase()
        result = result.filter(t => 
            t.client?.full_name?.toLowerCase().includes(q) ||
            t.profiles?.full_name?.toLowerCase().includes(q) ||
            t.payment_method?.toLowerCase().includes(q)
        )
    }

    // Sort
    if (sort.value) {
        result.sort((a, b) => {
            let aVal = a[sort.value.column]
            let bVal = b[sort.value.column]

            // Handle nested objects for sort if needed (e.g. client.full_name)
            if (sort.value.column === 'client.full_name') {
                aVal = a.client?.full_name
                bVal = b.client?.full_name
            } else if (sort.value.column === 'profiles.full_name') {
                aVal = a.profiles?.full_name
                bVal = b.profiles?.full_name
            }

            if (aVal < bVal) return sort.value.direction === 'asc' ? -1 : 1
            if (aVal > bVal) return sort.value.direction === 'asc' ? 1 : -1
            return 0
        })
    }

    return result
})

const paginatedTransactions = computed(() => {
    const start = (page.value - 1) * pageCount
    const end = start + pageCount
    return filteredTransactions.value.slice(start, end)
})

// Columns
const columns = [
  { key: 'created_at', label: 'Fecha', sortable: true },
  { key: 'client.full_name', label: 'Cliente', sortable: true },
  { key: 'profiles.full_name', label: 'Estilista', sortable: true }, // profiles is joined
  { key: 'payment_method', label: 'Método', sortable: true },
  { key: 'total_amount', label: 'Monto', sortable: true },
  { key: 'commission_amount', label: 'Comisión', sortable: true }
]

const stylistColumns = [
  { key: 'full_name', label: 'Estilista' },
  { key: 'transaction_count', label: 'Citas' },
  { key: 'total_commissions', label: 'Ganado' },
  { key: 'total_paid', label: 'Pagado' },
  { key: 'balance', label: 'Pendiente' },
  { key: 'commission_rate', label: '% Comisiones' }, // Combined column
  { key: 'actions', label: '' }
]

// Fetch Data
const fetchTransactions = async () => {
  loading.value = true
  
  const { data: { user } } = await client.auth.getUser()
  if (!user) {
    loading.value = false
    return
  }

  const { data, error } = await client
    .from('transactions')
    .select('*, clients(full_name), profiles(full_name)')
    .gte('created_at', `${startDate.value}T00:00:00`)
    .lte('created_at', `${endDate.value}T23:59:59`)
    .order('created_at', { ascending: false })

  if (data) {
    transactions.value = data
  }

  // Fetch Payouts
  const { data: payoutsData } = await client
    .from('commission_payouts')
    .select('*')
    .gte('date', startDate.value)
    .lte('date', endDate.value)
  
  if (payoutsData) payouts.value = payoutsData

  // Fetch Stylists (Profiles) for the report
  const { data: profilesData } = await client.from('profiles').select('*')
  if (profilesData) {
      stylists.value = profilesData.map(p => ({
          ...p,
          editing: false,
          temp_rate: p.commission_rate,
          temp_product_rate: p.product_commission_rate || 0
      }))
  }

  loading.value = false
}

// Stats
const totalSales = computed(() => transactions.value.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0))
const totalCommissions = computed(() => transactions.value.reduce((sum, t) => sum + (Number(t.commission_amount) || 0), 0))

const stylistStats = computed(() => {
    return stylists.value.map(stylist => {
        const stylistTx = transactions.value.filter(t => t.stylist_id === stylist.id)
        const stylistPayouts = payouts.value.filter(p => p.stylist_id === stylist.id)
        
        const earned = stylistTx.reduce((sum, t) => sum + (Number(t.commission_amount) || 0), 0)
        const paid = stylistPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        
        return {
            ...stylist,
            transaction_count: stylistTx.length,
            total_sales: stylistTx.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0),
            total_commissions: earned,
            total_paid: paid,
            balance: earned - paid
        }
    })
})

const updateCommission = async (row) => {
    const { error } = await client.from('profiles').update({ 
        commission_rate: row.temp_rate,
        product_commission_rate: row.temp_product_rate 
    }).eq('id', row.id)
    
    if (!error) {
        row.commission_rate = row.temp_rate
        row.product_commission_rate = row.temp_product_rate
        row.editing = false
    }
}



// Payout Logic
const isPayoutModalOpen = ref(false)
const payoutSaving = ref(false)
const selectedStylistForPayout = ref<any>(null)
const payoutForm = reactive({
    amount: 0,
    notes: '',
    date: new Date().toISOString().slice(0, 10)
})

const openPayoutModal = (stylist: any) => {
    selectedStylistForPayout.value = stylist
    payoutForm.amount = stylist.balance > 0 ? stylist.balance : 0
    payoutForm.notes = ''
    payoutForm.date = new Date().toISOString().slice(0, 10)
    isPayoutModalOpen.value = true
}

const savePayout = async () => {
    if (!selectedStylistForPayout.value) return
    payoutSaving.value = true
    
    const { data: { user } } = await client.auth.getUser()
    // Need tenant_id. We can get it from the stylist profile since they are in the same tenant
    const tenantId = selectedStylistForPayout.value.tenant_id

    try {
        const { error } = await client.from('commission_payouts').insert({
            tenant_id: tenantId,
            stylist_id: selectedStylistForPayout.value.id,
            amount: payoutForm.amount,
            notes: payoutForm.notes,
            date: payoutForm.date
        })

        if (error) throw error
        
        alert('Pago registrado correctamente')
        isPayoutModalOpen.value = false
        fetchTransactions() // Refresh data
    } catch (e: any) {
        alert('Error al registrar pago: ' + e.message)
    } finally {
        payoutSaving.value = false
    }
}

// Helpers
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val)
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const getMethodLabel = (method: string) => {
  const map = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', other: 'Otro' }
  return map[method] || method
}

const getMethodColor = (method: string) => {
  const map = { cash: 'green', card: 'blue', transfer: 'purple', other: 'gray' }
  return map[method] || 'gray'
}

onMounted(() => {
  fetchTransactions()
})
</script>
