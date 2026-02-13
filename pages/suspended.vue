<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <div class="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/30">
          <UIcon name="i-heroicons-exclamation-triangle" class="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
          Cuenta Suspendida
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          El acceso a esta peluquería ha sido suspendido temporalmente.
        </p>
      </div>

      <div class="rounded-md bg-white dark:bg-slate-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-300 mb-4">
          Esto puede deberse a un pago pendiente o a una decisión administrativa.
          Por favor, contacta al administrador del sistema o al soporte técnico para regularizar la situación.
        </p>
        
        <div class="flex flex-col gap-3">
            <UButton to="/login" variant="ghost" color="gray" label="Volver al Login" icon="i-heroicons-arrow-left" block />
        </div>
      </div>
      
      <p class="text-xs text-gray-400">
        Si crees que esto es un error, por favor contáctanos.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})
</script>
