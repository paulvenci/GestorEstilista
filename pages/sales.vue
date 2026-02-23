<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="hidden md:block">
        <h1 class="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Caja y Ventas</h1>
        <p class="text-slate-500 dark:text-slate-400">Registro de transacciones y comisiones</p>
      </div>
            <div class="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <UFormGroup label="Desde">
                <UInput type="date" v-model="startDate" />
            </UFormGroup>
            <UFormGroup label="Hasta">
                <UInput type="date" v-model="endDate" />
            </UFormGroup>
            <UButton icon="i-heroicons-funnel" color="emerald" @click="fetchTransactions" :loading="loading" label="Filtrar" />
            
            <UButton 
                v-if="userRole === 'admin'"
                icon="i-heroicons-trash" 
                color="red" 
                variant="soft"
                label="Limpiar Historial" 
                :loading="clearingHistory"
                @click="clearHistory"
                class="ml-auto"
            />
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
        <div class="w-full">
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
              <template #stylist_earnings-data="{ row }">
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">
                      {{ formatCurrency((row.total_amount || 0) - (row.commission_amount || 0)) }}
                  </span>
              </template>

              <template #commission_amount-data="{ row }">
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">
                      {{ formatCurrency(row.commission_amount) }}
                  </span>
              </template>

              <template #total_amount-data="{ row }">
                <span class="font-bold text-slate-800 dark:text-slate-200">{{ formatCurrency(row.total_amount) }}</span>
              </template>
              
              <template #details-data="{ row }">
                  <div class="space-y-1">
                      <div v-for="titem in row.transaction_items" :key="titem.name" class="text-xs">
                           <UBadge :color="titem.item_type === 'service' ? 'blue' : 'purple'" variant="subtle" size="xs" class="mr-1">
                              {{ titem.item_type === 'service' ? 'S' : 'P' }}
                           </UBadge>
                           <span class="text-slate-600 dark:text-slate-300">{{ titem.name }} (x{{ titem.quantity }})</span>
                      </div>
                  </div>
              </template>

              <template #client_name-data="{ row }">
                  <span class="text-slate-700 dark:text-slate-300">{{ row.clients?.full_name || '-' }}</span>
              </template>

              <template #stylist_name-data="{ row }">
                  <span class="text-slate-700 dark:text-slate-300">{{ row.profiles?.full_name || '-' }}</span>
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
        </div>
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
import { ref, reactive, computed, onMounted } from 'vue'

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

// Refs
const loading = ref(false)
const transactions = ref<any[]>([])
const payouts = ref<any[]>([])
const stylists = ref<any[]>([])

const items = [{
  key: 'transactions',
  label: 'Transacciones',
  icon: 'i-heroicons-list-bullet'
}]

// Date Navigation
// Computed Data
const filteredTransactions = computed(() => {
    let result = [...transactions.value]

    // Search
    if (search.value) {
        const q = search.value.toLowerCase()
        result = result.filter(t => 
            t.clients?.full_name?.toLowerCase().includes(q) ||
            t.profiles?.full_name?.toLowerCase().includes(q) ||
            t.payment_method?.toLowerCase().includes(q)
        )
    }

    // Sort
    if (sort.value) {
        result.sort((a, b) => {
            let aVal = a[sort.value.column]
            let bVal = b[sort.value.column]

            // Handle nested objects for sort
            if (sort.value.column === 'client_name') {
                aVal = a.clients?.full_name
                bVal = b.clients?.full_name
            } else if (sort.value.column === 'stylist_name') {
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
  { key: 'client_name', label: 'Cliente', sortable: true },
  { key: 'stylist_name', label: 'Estilista', sortable: true },
  { key: 'details', label: 'Detalle' },
  { key: 'payment_method', label: 'Método', sortable: true },
  { key: 'stylist_earnings', label: 'Ganado (Estilista)' }, 
  { key: 'commission_amount', label: 'Ganado (Peluquería)', sortable: true },
  { key: 'total_amount', label: 'Total', sortable: true }
]

const stylistColumns = computed(() => {
    return [] // Deprecated
})

// Fetch Data
const userRole = useState('userRole')

const fetchTransactions = async () => {
  loading.value = true
  
  const { data: { user } } = await client.auth.getUser()
  if (!user) {
    loading.value = false
    return
  }

  let query = client
    .from('transactions')
    .select('*, clients(full_name), profiles(full_name, commission_type), transaction_items(name, quantity, item_type)')
    .gte('created_at', `${startDate.value}T00:00:00`)
    .lte('created_at', `${endDate.value}T23:59:59`)
    .order('created_at', { ascending: false })
  
  // Si NO es admin, solo ver sus propias transacciones
  if (userRole.value !== 'admin') {
      query = query.eq('stylist_id', user.id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching transactions:', error)
  }

  if (data) {
    transactions.value = data
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

// Clear History Logic
const clearingHistory = ref(false)

const clearHistory = async () => {
    if (!confirm('¿Estás seguro de que deseas ELIMINAR TODO EL HISTORIAL DE VENTAS Y PAGOS? esta acción no se puede deshacer y es solo para fines de pruebas o reinicio.')) return

    clearingHistory.value = true
    try {
        // 1. Delete Transactions (cascades to items)
        const { error: txError } = await client.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all not matching impossible UUID
        if (txError) throw txError

        // 2. Delete Payouts
        const { error: pyError } = await client.from('commission_payouts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (pyError) throw pyError

        alert('Historial eliminado correctamente.')
        fetchTransactions()
    } catch (e: any) {
        alert('Error al eliminar historial: ' + e.message)
    } finally {
        clearingHistory.value = false
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
