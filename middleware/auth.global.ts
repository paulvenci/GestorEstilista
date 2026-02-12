export default defineNuxtRouteMiddleware((to, from) => {
    const user = useSupabaseUser()

    // Routes that don't require auth
    const publicRoutes = ['/login', '/register']

    // If user is not logged in and tries to access a protected route
    if (!user.value && !publicRoutes.includes(to.path)) {
        return navigateTo('/login')
    }

    // If user is logged in and tries to access login page
    if (user.value && publicRoutes.includes(to.path)) {
        return navigateTo('/')
    }
})
