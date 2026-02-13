<template>
  <div class="h-screen h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 transition-colors duration-300">
    
    <!-- Mobile Overlay -->
    <div v-if="isMobileMenuOpen" class="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>

    <!-- Sidebar -->
    <aside 
      class="w-72 bg-slate-900 dark:bg-slate-900/90 text-white flex flex-col shadow-xl border-r border-slate-800 fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 transform md:transform-none"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <div class="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
        <h1 class="font-extrabold text-2xl tracking-tight text-emerald-400">
          Admin<span class="text-white">Panel</span>
        </h1>
        <UButton icon="i-heroicons-x-mark" variant="ghost" color="white" class="md:hidden" @click="isMobileMenuOpen = false" />
      </div>
      
      <nav class="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
        <UButton 
          to="/admin" 
          variant="ghost" 
          icon="i-heroicons-chart-bar" 
          label="Dashboard" 
          block 
          class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 text-slate-300 hover:text-white"
          active-class="bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
          @click="isMobileMenuOpen = false"
        />
        <UButton 
          to="/admin/tenants" 
          variant="ghost" 
          icon="i-heroicons-building-office-2" 
          label="Peluquerías" 
          block 
          class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 text-slate-300 hover:text-white"
          active-class="bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
          @click="isMobileMenuOpen = false"
        />
        <UButton 
          to="/admin/branches" 
          variant="ghost" 
          icon="i-heroicons-building-storefront" 
          label="Sucursales" 
          block 
          class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 text-slate-300 hover:text-white"
          active-class="bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
          @click="isMobileMenuOpen = false"
        />
        <UButton 
          to="/admin/plans" 
          variant="ghost" 
          icon="i-heroicons-rectangle-stack" 
          label="Planes" 
          block 
          class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 text-slate-300 hover:text-white"
          active-class="bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
          @click="isMobileMenuOpen = false"
        />
      </nav>

      <div class="p-4 border-t border-slate-800 space-y-2 shrink-0">
        <div class="flex justify-between items-center px-2">
          <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Configuración</span>
          <ColorModeButton />
        </div>
        <UButton 
          color="red" 
          variant="ghost" 
          icon="i-heroicons-arrow-left-on-rectangle" 
          label="Salir" 
          block 
          class="justify-start text-slate-400 hover:text-red-400 hover:bg-red-400/10" 
          @click="handleLogout" 
        />
      </div>
    </aside>

    <!-- Mobile Header -->
    <div class="md:hidden fixed top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between p-4 shadow-md transition-colors duration-300">
      <div class="flex items-center gap-2">
        <h1 class="font-bold text-lg text-slate-900 dark:text-emerald-400 shrink-0">GestorEstilista</h1>
        <span v-if="headerTitle" class="text-slate-400 font-medium">/</span>
        <h1 v-if="headerTitle" class="font-bold text-base text-slate-900 dark:text-white truncate max-w-[120px]">{{ headerTitle }}</h1>
      </div>
      <div class="flex gap-2">
        <ColorModeButton />
        <UButton icon="i-heroicons-bars-3" variant="ghost" color="gray" @click="isMobileMenuOpen = !isMobileMenuOpen" />
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 relative w-full flex flex-col pt-16 md:pt-0">
      <div class="flex-1 p-4 md:p-8 overflow-y-auto">
        <slot />
      </div>
    </main>
  </div>
</template>>

<script setup lang="ts">
const client = useSupabaseClient()
const router = useRouter()
const headerTitle = useState('headerTitle')
const isMobileMenuOpen = ref(false)

const handleLogout = async () => {
  await client.auth.signOut()
  router.push('/login')
}
</script>
