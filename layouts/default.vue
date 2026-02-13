<template>
  <div class="h-screen h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 transition-colors duration-300">
    
    <!-- Mobile Overlay -->
    <div v-if="isMobileMenuOpen" class="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>

    <!-- Sidebar -->
    <aside 
      class="w-72 bg-slate-900 dark:bg-slate-900/90 text-white flex flex-col shadow-xl border-r border-slate-800 fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 transform md:transform-none"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <div class="px-6 py-4 border-b border-slate-800 shrink-0">
        <h1 class="font-extrabold text-2xl tracking-tight text-emerald-400">
          Gestor<span class="text-white">Estilista</span>
        </h1>
        
        <!-- Tenant & Branch Info -->
        <div v-if="userInfo.tenantName" class="mt-2 animate-fade-in block space-y-0.5">
            <div class="text-sm font-bold text-white truncate">{{ userInfo.fullName || 'Usuario' }}</div>
            <div class="text-xs font-semibold text-emerald-400 truncate">{{ userInfo.tenantName }}</div>
            <div class="text-xs text-slate-400 flex items-center gap-1">
                <UIcon name="i-heroicons-map-pin" class="w-3 h-3" />
                {{ userInfo.branchName || 'Sucursal Principal' }}
            </div>
        </div>
        
        <UButton icon="i-heroicons-x-mark" variant="ghost" color="white" class="md:hidden absolute top-4 right-4" @click="isMobileMenuOpen = false" />
      </div>
      
      <nav class="flex-1 p-4 space-y-4 mt-4 overflow-y-auto custom-scrollbar">
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

        <div v-if="userRole === 'admin'" class="pt-4 mt-4 border-t border-slate-800">
            <span class="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestión</span>
            <UButton 
              to="/team" 
              variant="ghost" 
              icon="i-heroicons-user-group" 
              label="Equipo" 
              block 
              class="justify-start px-4 py-3 mt-2 transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-300 hover:text-white"
              active-class="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
              @click="isMobileMenuOpen = false"
            />
            <UButton 
              to="/branches" 
              variant="ghost" 
              icon="i-heroicons-building-storefront" 
              label="Sucursales" 
              block 
              class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-300 hover:text-white"
              active-class="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
              @click="isMobileMenuOpen = false"
            />
        </div>

        <div v-if="userRole === 'superadmin'" class="pt-4 mt-4 border-t border-slate-800">
            <span class="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Super Admin</span>
            <UButton 
              to="/admin/tenants" 
              variant="ghost" 
              icon="i-heroicons-building-office-2" 
              label="Peluquerías" 
              block 
              class="justify-start px-4 py-3 mt-2 transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-300 hover:text-white"
              active-class="bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-900/20"
              @click="isMobileMenuOpen = false"
            />
             <UButton 
              to="/admin/dashboard" 
              variant="ghost" 
              icon="i-heroicons-chart-bar" 
              label="Métricas Globales" 
              block 
              class="justify-start px-4 py-3 transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-300 hover:text-white"
              active-class="bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-900/20"
              @click="isMobileMenuOpen = false"
            />
        </div>
      </nav>

      <div class="p-4 border-t border-slate-800 space-y-2 shrink-0">
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
        <div class="text-center pt-2">
            <span class="text-[10px] text-slate-600 dark:text-slate-500">v{{ config.public.appVersion }}</span>
        </div>
      </div>
    </aside>

    <!-- Mobile Header -->
    <div class="md:hidden fixed top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between p-4 shadow-md transition-colors duration-300">
      <div class="flex items-center gap-2">
        <h1 class="font-bold text-lg text-slate-900 dark:text-emerald-400 shrink-0">GestorEstilista</h1>
        <span v-if="headerTitle" class="text-slate-400 font-medium">/</span>
        <h1 v-if="headerTitle" class="font-bold text-lg text-slate-900 dark:text-white truncate max-w-[150px]">{{ headerTitle }}</h1>
      </div>
      <div class="flex gap-2">
        <ColorModeButton />
        <UButton icon="i-heroicons-bars-3" variant="ghost" color="gray" @click="isMobileMenuOpen = !isMobileMenuOpen" />
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 relative w-full flex flex-col pt-16 md:pt-0">
      <div class="flex-1 p-2 md:p-6 overflow-y-auto">
        <slot />
      </div>
    </main>
  </div>
</template>>

<script setup lang="ts">
import { watch, ref, reactive, onMounted } from 'vue'

const client = useSupabaseClient()
const router = useRouter()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const headerTitle = useState('headerTitle')
const isMobileMenuOpen = ref(false)
const userRole = useState<string | null>('userRole', () => null)

const handleLogout = async () => {
  await client.auth.signOut()
  router.push('/login')
}

const userInfo = reactive({
    role: null as string | null,
    tenantName: '',
    branchName: '',
    fullName: ''
})

const fetchUserInfo = async () => {
    let userId = user.value?.id

    // Fallback: Try getting session directly if user ref is empty
    if (!userId) {
        const { data: { user } } = await client.auth.getUser()
        if (user) {
            userId = user.id
            console.log('User ID recovered from getUser:', userId)
        }
    }

    if (!userId) {
        console.log('Waiting for user...')
        return
    }
    
    console.log('Fetching info for user:', userId)

    // Fetch Profile with Tenant and Branch info
    const { data, error } = await client
        .from('profiles')
        .select(`
            role,
            full_name,
            tenants ( name ),
            branches ( name )
        `)
        .eq('id', userId)
        .single()
    
    if (error) {
        console.error('Error fetching user info:', error)
        return
    }

    if (data) {
        userRole.value = data.role // Keep for v-if compatibility
        userInfo.role = data.role
        userInfo.fullName = data.full_name || ''
        userInfo.tenantName = data.tenants?.name || ''
        userInfo.branchName = data.branches?.name || ''
        
        console.log('User Info Loaded:', userInfo)
    } else {
        console.log('No profile found for this user.')
    }
}

// Watch both user ref and mount to retrying
watch(user, () => {
    fetchUserInfo()
}, { immediate: true })

onMounted(() => {
    // sometimes watch immediate fires before session is ready in some envs
    setTimeout(fetchUserInfo, 1000) 
})
</script>

<style>
.custom-scrollbar::-webkit-scrollbar {
  display: none;
}
.custom-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
