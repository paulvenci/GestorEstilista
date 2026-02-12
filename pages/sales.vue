<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Caja y Ventas</h1>
        <p class="text-slate-500 dark:text-slate-400">Registro de transacciones y comisiones</p>
      </div>
      
      <div class="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <UButton icon="i-heroicons-chevron-left" variant="ghost" color="gray" @click="prevMonth" />
        <span class="font-bold text-slate-700 dark:text-slate-200 min-w-[150px] text-center capitalize">{{ formatMonth(currentDate) }}</span>
        <UButton icon="i-heroicons-chevron-right" variant="ghost" color="gray" @click="nextMonth" />
        <div class="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
        <UButton label="Hoy" variant="soft" color="emerald" @click="goToToday" />
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
            <UButton icon="i-heroicons-arrow-path" variant="ghost" color="gray" @click="fetchTransactions" :loading="loading" />
          </div>

          <UTable 
            :rows="transactions" 
            :columns="columns" 
            :loading="loading" 
            :ui="{ divide: 'divide-y divide-slate-200 dark:divide-slate-800', th: { color: 'text-slate-900 dark:text-white' }, td: { color: 'text-slate-500 dark:text-slate-400' } }"
          >
            <template #amount-data="{ row }">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(row.total_amount) }}</span>
            </template>
            
            <template #commission-data="{ row }">
              <span class="text-slate-500 text-xs">{{ formatCurrency(row.commission_amount) }}</span>
            </template>

            <template #date-data="{ row }">
              {{ formatDate(row.created_at) }}
            </template>

            <template #method-data="{ row }">
              <UBadge :color="getMethodColor(row.payment_method)" variant="subtle">{{ getMethodLabel(row.payment_method) }}</UBadge>
            </template>
          </UTable>
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
               <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(row.total_sales) }}</span>
             </template>
             <template #total_commissions-data="{ row }">
               <span class="font-bold text-purple-600 dark:text-purple-400">{{ formatCurrency(row.total_commissions) }}</span>
             </template>
             <template #commission_rate-data="{ row }">
                <div class="flex items-center gap-2">
                  <span v-if="!row.editing" @click="row.editing = true" class="cursor-pointer hover:underline decoration-dashed">{{ row.commission_rate }}%</span>
                  <div v-else class="flex items-center gap-1">
                     <UInput v-model="row.temp_rate" type="number" size="xs" class="w-16" />
                     <UButton icon="i-heroicons-check" size="2xs" color="emerald" @click="updateCommission(row)" />
                     <UButton icon="i-heroicons-x-mark" size="2xs" color="gray" variant="ghost" @click="row.editing = false" />
                  </div>
                </div>
             </template>
          </UTable>
        </UCard>

      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const currentDate = ref(new Date())
const loading = ref(false)
const transactions = ref([])
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
const formatMonth = (date: Date) => date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
const prevMonth = () => {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() - 1)
  currentDate.value = d
  fetchTransactions()
}
const nextMonth = () => {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + 1)
  currentDate.value = d
  fetchTransactions()
}
const goToToday = () => {
  currentDate.value = new Date()
  fetchTransactions()
}

// Columns
const columns = [
  { key: 'date', label: 'Fecha' },
  { key: 'client.full_name', label: 'Cliente' },
  { key: 'profiles.full_name', label: 'Estilista' }, // profiles is joined
  { key: 'method', label: 'Método' },
  { key: 'amount', label: 'Monto' },
  { key: 'commission', label: 'Comisión' }
]

const stylistColumns = [
  { key: 'full_name', label: 'Estilista' },
  { key: 'transaction_count', label: 'Citas' },
  { key: 'total_sales', label: 'Ventas Totales' },
  { key: 'total_commissions', label: 'Comisiones Ganadas' },
  { key: 'commission_rate', label: '% Comisión' }
]

// Fetch Data
const fetchTransactions = async () => {
  loading.value = true
  
  const { data: { user } } = await client.auth.getUser()
  if (!user) {
    loading.value = false
    return
  }

  const start = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
  const end = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0, 23, 59, 59)

  const { data, error } = await client
    .from('transactions')
    .select('*, clients(full_name), profiles(full_name)')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false })

  if (data) {
    transactions.value = data
  }

  // Fetch Stylists (Profiles) for the report
  const { data: profilesData } = await client.from('profiles').select('*')
  if (profilesData) {
      stylists.value = profilesData.map(p => ({
          ...p,
          editing: false,
          temp_rate: p.commission_rate
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
        return {
            ...stylist,
            transaction_count: stylistTx.length,
            total_sales: stylistTx.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0),
            total_commissions: stylistTx.reduce((sum, t) => sum + (Number(t.commission_amount) || 0), 0)
        }
    })
})

const updateCommission = async (row) => {
    const { error } = await client.from('profiles').update({ commission_rate: row.temp_rate }).eq('id', row.id)
    if (!error) {
        row.commission_rate = row.temp_rate
        row.editing = false
        // Refresh? Not needed for rate display, but maybe future calcs
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
