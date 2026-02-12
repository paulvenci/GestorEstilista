<template>
  <div class="min-h-screen bg-gray-900 text-white flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-800 flex flex-col">
      <div class="p-4 border-b border-gray-700">
        <h1 class="font-bold text-xl text-primary-400">Super Admin</h1>
      </div>
      <nav class="flex-1 p-4 space-y-2">
        <UButton to="/admin" variant="ghost" color="gray" icon="i-heroicons-home" label="Dashboard" block class="justify-start" />
        <UButton to="/admin/tenants" variant="ghost" color="gray" icon="i-heroicons-building-office-2" label="Peluquerías" block class="justify-start" />
      </nav>
      <div class="p-4 border-t border-gray-700">
        <UButton color="red" variant="ghost" icon="i-heroicons-arrow-left-on-rectangle" label="Salir" block class="justify-start" @click="handleLogout" />
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-8 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const router = useRouter()

const handleLogout = async () => {
  await client.auth.signOut()
  router.push('/login')
}
</script>
