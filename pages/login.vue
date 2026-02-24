<template>
  <div class="space-y-6">
    <!-- Header moved to layout -->
    
    <form @submit.prevent="handleLogin" class="space-y-6">
      <UFormGroup label="Correo Electrónico" name="email">
        <UInput v-model="email" type="email" placeholder="tu@email.com" icon="i-heroicons-envelope" />
      </UFormGroup>
      
      <UFormGroup label="Contraseña" name="password">
        <UInput v-model="password" type="password" placeholder="********" icon="i-heroicons-lock-closed" />
      </UFormGroup>

      <UButton type="submit" block :loading="loading" label="Ingresar" />
    </form>

    <div v-if="errorMsg" class="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg mb-4 text-center">
      {{ errorMsg }}
    </div>

    <!-- For demo/dev purposes -->
    <div class="mt-4 text-center text-xs text-gray-400 space-y-1">
      <p>¿No tienes cuenta? Contacta a tu administrador.</p>
      <p class="text-xs text-slate-300 dark:text-slate-600">v{{ config.public.appVersion }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const client = useSupabaseClient()
const router = useRouter() // Use router for manual redirect
const config = useRuntimeConfig()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const { error } = await client.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) throw error
    
    // Wait for user to be populated (handling mobile hydration/latency)
    const user = useSupabaseUser()
    let attempts = 0
    while (!user.value && attempts < 10) {
        await new Promise(r => setTimeout(r, 200)) // Reduced wait time
        attempts++
    }

    if (!user.value) {
         // Fallback force reload if session is stuck
        window.location.href = '/login'
        return
    }

    // Fetch tenant slug for redirect
    const { data: profile } = await client
      .from('profiles')
      .select('tenants ( slug )')
      .eq('id', user.value.id)
      .single()
    
    const slug = profile?.tenants?.slug || ''
    if (slug) {
      navigateTo(`/${slug}/agenda`)
    } else {
      navigateTo('/admin') // superadmin without tenant
    }
  } catch (e: any) {
    errorMsg.value = e.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>
