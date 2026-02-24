export default defineNuxtRouteMiddleware(async (to, from) => {
    const client = useSupabaseClient()
    const { data: { user } } = await client.auth.getUser()

    if (!user) {
        return navigateTo('/login')
    }

    try {
        const { data: profile, error } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        if (error || !profile || profile.role !== 'superadmin') {
            return navigateTo('/login')
        }
    } catch (e) {
        return navigateTo('/login')
    }
})
