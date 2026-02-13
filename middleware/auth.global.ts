export default defineNuxtRouteMiddleware(async (to, from) => {
    const user = useSupabaseUser()
    const client = useSupabaseClient()

    // Routes that don't require auth
    const publicRoutes = ['/login', '/register']

    // 1. If user ref is missing, try to fetch session to be sure
    if (!user.value && !publicRoutes.includes(to.path)) {
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
            // Manually set the user value if possible (or just rely on session for this check)
            // useSupabaseUser is readonly-ish usually but we can rely on the check
            // user.value = session.user // This might not work if it's a computed ref from Nuxt

            // If we have a session, we are good to go, but we should let Nuxt auth know?
            // Usually getSession updates the internal state.

            // For now, if we found a session, strict auth check passes.
        } else {
            return navigateTo('/login')
        }
    }

    // If user is logged in (or we assume they are from session check above) and tries to access login page
    // We check user.value again? If it was updated. 
    // If not updated, we might need to trust the session check we just did.

    // Simplification:
    // If we are navigating to public routes and we HAVE a session, redirect to home.
    if (publicRoutes.includes(to.path)) {
        if (user.value) return navigateTo('/')
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) return navigateTo('/')
    }
})
