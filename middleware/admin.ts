export default defineNuxtRouteMiddleware(async (to, from) => {
    const user = useSupabaseUser()
    const client = useSupabaseClient()

    if (!user.value) {
        return navigateTo('/login')
    }

    // Check if user has superadmin role
    const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('id', user.value.id)
        .single()

    if (!profile || profile.role !== 'superadmin') {
        return navigateTo('/')
    }
})
