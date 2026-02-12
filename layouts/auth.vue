<template>
  <div class="min-h-[100dvh] bg-gray-100 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 overflow-y-auto">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
       <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">GestorEstilista</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-2">Plataforma de Gestión SaaS</p>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-slate-200 dark:border-slate-800">
         <slot />
      </div>
    </div>
  </div>
</template>
