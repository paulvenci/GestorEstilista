export default defineNuxtRouteMiddleware(async (to, from) => {
    const user = useSupabaseUser()
    const client = useSupabaseClient()

    // 1. Check if user is logged in
    if (!user.value || !user.value.id) return

    // 2. Allow access to public/auth pages to prevent loops
    const publicPages = ['/login', '/suspended', '/register']
    if (publicPages.includes(to.path)) return

    // 3. Check Tenant Status (Cached)
    // We use a unique key for useState to avoid conflicts
    const tenantStatus = useState<string | null>('tenant_status', () => null)

    if (!tenantStatus.value) {
        try {
            const { data, error } = await client
                .from('profiles')
                .select(`
                    tenants (
                        status
                    )
                `)
                .eq('id', user.value.id)
                .single()

            if (error) {
                // Determine if it's a "row not found" or actual error
                // If profile doesn't exist yet (e.g. during registration), we skip
                console.warn('Tenant check warning:', error.message)
                return
            }

            // @ts-ignore - Supabase type join
            if (data && data.tenants) {
                tenantStatus.value = data.tenants.status
            }
        } catch (e) {
            console.error('Error fetching tenant status:', e)
        }
    }

    // 4. Redirect if suspended
    if (tenantStatus.value === 'suspended') {
        return navigateTo('/suspended')
    }
})
