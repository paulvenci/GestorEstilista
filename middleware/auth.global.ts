export default defineNuxtRouteMiddleware(async (to, from) => {
    const user = useSupabaseUser()
    const client = useSupabaseClient()

    // Auth pages (no slug needed)
    const authPages = ['/login', '/register']
    // Admin pages (superadmin, no slug needed either)
    const isAdminRoute = to.path.startsWith('/admin')
    const isAuthPage = authPages.includes(to.path)
    const isSuspendedPage = to.path === '/suspended'

    // Detect if this is a tenant app route (/{slug}/agenda, /{slug}/clientes, etc.)
    // A slug route has at least 2 segments: /{slug}/{page}
    const segments = to.path.split('/').filter(Boolean)
    const tenantSubPages = ['agenda', 'clientes', 'reportes', 'servicios', 'productos', 'configuracion', 'equipo', 'sucursales']
    const isTenantAppRoute = segments.length >= 2 && tenantSubPages.some(page => segments[1] === page || segments[1].startsWith(page))

    // If only 1 segment (/{slug}), it's a booking page - always public
    const isBookingPage = segments.length === 1 && !isAuthPage && !isAdminRoute && !isSuspendedPage

    // 1. Auth pages: check if user is logged in, redirect if so
    if (isAuthPage) {
        if (user.value?.id) {
            const { data: profile } = await client
                .from('profiles')
                .select('tenants ( slug )')
                .eq('id', user.value.id)
                .single()
            const slug = profile?.tenants?.slug
            return navigateTo(slug ? `/${slug}/agenda` : '/admin')
        }
        // Not logged in - allow access to login/register
        return
    }

    // 2. Booking pages are always public
    if (isBookingPage) return

    // 3. Suspended page - allow access
    if (isSuspendedPage) return

    // 4. Protected routes: tenant app routes and admin routes
    if (isTenantAppRoute || isAdminRoute) {
        if (!user.value?.id) {
            const { data: { session } } = await client.auth.getSession()
            if (!session?.user) {
                return navigateTo('/login')
            }
        }
    }
})
