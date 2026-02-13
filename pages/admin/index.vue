<template>
  <div class="space-y-8">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="hidden md:block">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard Super Admin</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Resumen del sistema y métricas globales.</p>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard class="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all hover:shadow-md cursor-pointer" @click="navigateTo('/admin/tenants')">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <UIcon name="i-heroicons-building-office-2" class="text-3xl text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Peluquerías</div>
            <div class="text-3xl font-bold text-slate-900 dark:text-white">{{ tenantsCount }}</div>
          </div>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all hover:shadow-md">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <UIcon name="i-heroicons-users" class="text-3xl text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Usuarios Totales</div>
            <div class="text-3xl font-bold text-slate-900 dark:text-white">{{ usersCount }}</div>
          </div>
        </div>
      </UCard>
    </div>

    <div class="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6">
      <h3 class="font-bold text-emerald-900 dark:text-emerald-400">Acceso Rápido</h3>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <UButton to="/admin/tenants" variant="outline" color="emerald" label="Gestionar Peluquerías" icon="i-heroicons-building-office-2" />
        <UButton to="/" variant="outline" color="gray" label="Ver Agenda (Tenant Actual)" icon="i-heroicons-calendar" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient()
const headerTitle = useState('headerTitle', () => 'Métricas')
headerTitle.value = 'Métricas'
const tenantsCount = ref(0)
const usersCount = ref(0)

const fetchDashboardData = async () => {
  const [tenantsRes, profilesRes] = await Promise.all([
    client.from('tenants').select('*', { count: 'exact', head: true }),
    client.from('profiles').select('*', { count: 'exact', head: true })
  ])

  tenantsCount.value = tenantsRes.count || 0
  usersCount.value = profilesRes.count || 0
}

onMounted(() => {
  fetchDashboardData()
})
</script>
