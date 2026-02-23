
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
    // 1. Check if the requester is authenticated
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
    }

    const userId = user.id || user.sub

    // 2. Get the service role client (for admin actions)
    const client = serverSupabaseServiceRole(event)

    // 3. Verify permissions
    const { data: requesterProfile, error: profileError } = await client
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single()

    if (profileError || !requesterProfile) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Profile not found'
        })
    }

    // Check body for tenant_id first (we need it for validation)
    const body = await readBody(event)
    const { email, password, full_name, role, tenant_id, branch_id, commission_rate, product_commission_rate, commission_type, fixed_rent_cost } = body

    if (requesterProfile.role === 'superadmin') {
        // Superadmin can create anywhere
    } else if (requesterProfile.role === 'admin') {
        // Admin can only create for their own tenant
        if (requesterProfile.tenant_id !== tenant_id) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden: Admins can only create users for their own tenant'
            })
        }
    } else {
        throw createError({
            statusCode: 403,
            statusMessage: `Forbidden: Insufficient permissions. (Role: ${requesterProfile.role})`
        })
    }

    if (!email || !password || !tenant_id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields'
        })
    }

    // 5. Create the user in Auth
    const { data: newUser, error: createErrorData } = await client.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto confirm
        user_metadata: {
            full_name: full_name
        }
    })

    if (createErrorData) {
        throw createError({
            statusCode: 400,
            statusMessage: createErrorData.message
        })
    }

    if (!newUser.user) {
        throw createError({
            statusCode: 500,
            statusMessage: 'User creation failed without error'
        })
    }

    // 6. Create the Profile in Public schema
    // Note: We might have a trigger that creates a profile automatically on user creation.
    // However, since we need to set specific fields (tenant_id, role, branch_id), 
    // we should update it or insert it (upsert).

    // Let's check if the profile exists (created by trigger)
    const { data: existingProfile } = await client
        .from('profiles')
        .select('id')
        .eq('id', newUser.user.id)
        .single()

    if (existingProfile) {
        // Update existing profile (created by trigger)
        const { error: updateError } = await client
            .from('profiles')
            .update({
                full_name: full_name,
                role: role || 'stylist',
                tenant_id: tenant_id,
                branch_id: branch_id || null,
                commission_rate: Number(commission_rate) || 0,
                product_commission_rate: Number(product_commission_rate) || 0,
                commission_type: commission_type || 'percentage',
                fixed_rent_cost: Number(fixed_rent_cost) || 0
            })
            .eq('id', newUser.user.id)

        if (updateError) {
            // In worst case, delete the auth user since profile failed? 
            // Or just return error. let's return error.
            throw createError({
                statusCode: 500,
                statusMessage: 'Profile update failed: ' + updateError.message
            })
        }
    } else {
        // Insert new profile (if no trigger exists)
        const { error: insertError } = await client
            .from('profiles')
            .insert({
                id: newUser.user.id,
                full_name: full_name,
                role: role || 'stylist',
                tenant_id: tenant_id,
                branch_id: branch_id || null,
                commission_rate: Number(commission_rate) || 0,
                product_commission_rate: Number(product_commission_rate) || 0,
                commission_type: commission_type || 'percentage',
                fixed_rent_cost: Number(fixed_rent_cost) || 0
            })

        if (insertError) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Profile creation failed: ' + insertError.message
            })
        }
    }

    return { success: true, user: newUser.user }
})
