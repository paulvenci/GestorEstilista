<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Inventario de Productos</h1>
        <p class="text-sm md:text-base text-slate-500 dark:text-slate-400">Gestiona el stock y precios de tus productos de venta</p>
      </div>
      <UButton label="Nuevo Producto" icon="i-heroicons-plus" color="emerald" @click="openNew" class="w-full md:w-auto justify-center" />
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UCard :ui="{ background: 'bg-white dark:bg-slate-900' }">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                    <UIcon name="i-heroicons-cube" class="text-2xl" />
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">Total Productos</p>
                    <p class="text-2xl font-bold">{{ products.length }}</p>
                </div>
            </div>
        </UCard>
         <UCard :ui="{ background: 'bg-white dark:bg-slate-900' }">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                    <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl" />
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">Stock Bajo</p>
                    <p class="text-2xl font-bold">{{ lowStockCount }}</p>
                </div>
            </div>
        </UCard>
         <UCard :ui="{ background: 'bg-white dark:bg-slate-900' }">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                    <UIcon name="i-heroicons-currency-dollar" class="text-2xl" />
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">Valor Inventario</p>
                    <p class="text-2xl font-bold">{{ formatCurrency(inventoryValue) }}</p>
                </div>
            </div>
        </UCard>
    </div>

    <UCard :ui="{ background: 'bg-white dark:bg-slate-900', ring: 'ring-1 ring-slate-200 dark:ring-slate-800' }">
      <UTable 
        :rows="products" 
        :columns="columns" 
        :loading="loading"
        :ui="{ divide: 'divide-y divide-slate-200 dark:divide-slate-800', th: { color: 'text-slate-900 dark:text-white' }, td: { color: 'text-slate-500 dark:text-slate-400' } }"
      >
        <template #price-data="{ row }">
          <span class="font-medium text-slate-900 dark:text-white">{{ formatCurrency(row.price) }}</span>
        </template>
        
        <template #stock-data="{ row }">
          <span :class="{'text-red-500 font-bold': row.stock <= row.low_stock_threshold, 'text-emerald-500': row.stock > row.low_stock_threshold}">
            {{ row.stock }} u.
          </span>
        </template>

        <template #active-data="{ row }">
          <UBadge :color="row.active ? 'emerald' : 'gray'" variant="subtle" size="xs">{{ row.active ? 'Activo' : 'Inactivo' }}</UBadge>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton icon="i-heroicons-pencil-square" size="xs" color="blue" variant="ghost" @click="openEdit(row)" />
            <UButton icon="i-heroicons-trash" size="xs" color="red" variant="ghost" @click="deleteProduct(row)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <ProductModal v-model="isModalOpen" :initial-data="selectedProduct" @saved="fetchProducts" />
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/database.types'

const client = useSupabaseClient<Database>()
const loading = ref(false)
const products = ref<Database['public']['Tables']['products']['Row'][]>([])
const isModalOpen = ref(false)
const selectedProduct = ref<Database['public']['Tables']['products']['Row'] | null>(null)

const columns = [
  { key: 'name', label: 'Producto' },
  { key: 'stock', label: 'Stock' },
  { key: 'price', label: 'Precio Venta' },
  { key: 'cost', label: 'Costo' },
  { key: 'active', label: 'Estado' },
  { key: 'actions', label: 'Acciones' }
]

// Computed Metrics
const lowStockCount = computed(() => products.value.filter(p => p.stock <= (p.low_stock_threshold || 5)).length)
const inventoryValue = computed(() => products.value.reduce((acc, p) => acc + ((p.cost || 0) * p.stock), 0))

const fetchProducts = async () => {
    loading.value = true
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
        loading.value = false
        return
    }

    const { data, error } = await client
        .from('products')
        .select('*')
        .order('name')
    
    if (data) products.value = data
    loading.value = false
}

const openNew = () => {
    selectedProduct.value = null
    isModalOpen.value = true
}

const openEdit = (product: Database['public']['Tables']['products']['Row']) => {
    selectedProduct.value = { ...product }
    isModalOpen.value = true
}

const deleteProduct = async (product: Database['public']['Tables']['products']['Row']) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return

    const { error } = await client.from('products').delete().eq('id', product.id)
    if (error) {
        alert('Error al eliminar: ' + error.message)
    } else {
        fetchProducts()
    }
}

const formatCurrency = (val: number | null) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val || 0)
}

onMounted(() => {
    fetchProducts()
})
</script>
