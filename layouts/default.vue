<template>
  <div class="min-h-screen min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 transition-colors duration-300">
    
    <!-- Mobile Overlay -->
    <div v-if="isMobileMenuOpen" class="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>

    <!-- Sidebar -->
    <aside 
      class="w-72 bg-slate-900 dark:bg-slate-900/90 text-white flex flex-col shadow-xl border-r border-slate-800 fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 transform md:transform-none"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <div class="p-6 border-b border-slate-800 flex justify-between items-center">
        <h1 class="font-extrabold text-2xl tracking-tight text-emerald-400">
          Gestor<span class="text-white">Estilista</span>
        </h1>
        <UButton icon="i-heroicons-x-mark" variant="ghost" color="white" class="md:hidden" @click="isMobileMenuOpen = false" />
      </div>
      
      <nav class="flex-1 p-4 space-y-4 mt-4">
        <UButton 
          to="/" 
          variant="ghost" 
          icon="i-heroicons-calendar" 
          label="Agenda" 
          block 
          class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-300 hover:text-white"
          active-class="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
          @click="isMobileMenuOpen = false"
        />
        <UButton 
          to="/clients" 
          variant="ghost" 
          icon="i-heroicons-users" 
          label="Clientes" 
          block 
          class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-300 hover:text-white"
          active-class="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
          @click="isMobileMenuOpen = false"
        />
        <UButton 
          to="/sales" 
  variant="ghost" 
  icon="i-heroicons-currency-dollar" 
  label="Caja" 
  block 
  class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-300 hover:text-white"
  active-class="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
  @click="isMobileMenuOpen = false"
/>
<UButton 
  to="/services" 
  variant="ghost" 
  icon="i-heroicons-scissors" 
  label="Catálogo" 
  block 
  class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-300 hover:text-white"
  active-class="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
  @click="isMobileMenuOpen = false"
/>
<UButton 
  to="/products" 
  variant="ghost" 
  icon="i-heroicons-cube" 
  label="Inventario" 
  block 
  class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-300 hover:text-white"
  active-class="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
  @click="isMobileMenuOpen = false"
/>
      </nav>

      <div class="p-4 border-t border-slate-800 space-y-2">
        <div class="flex justify-between items-center px-2">
          <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Configuración</span>
          <ColorModeButton />
        </div>
        <UButton 
          color="gray" 
          variant="ghost" 
          icon="i-heroicons-arrow-left-on-rectangle" 
          label="Cerrar Sesión" 
          block 
          class="justify-start text-slate-400 hover:text-white hover:bg-slate-800" 
          @click="handleLogout" 
        />
      </div>
    </aside>

    <!-- Mobile Header -->
    <div class="md:hidden fixed top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between p-4 shadow-md transition-colors duration-300">
      <h1 class="font-bold text-xl text-slate-900 dark:text-emerald-400">GestorEstilista</h1>
      <div class="flex gap-2">
        <ColorModeButton />
        <UButton icon="i-heroicons-bars-3" variant="ghost" color="gray" @click="isMobileMenuOpen = !isMobileMenuOpen" />
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 relative pt-16 md:pt-0">
      <div class="p-2 md:p-6 h-full">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const router = useRouter()
const isMobileMenuOpen = ref(false)

const handleLogout = async () => {
  await client.auth.signOut()
  router.push('/login')
}
</script>
