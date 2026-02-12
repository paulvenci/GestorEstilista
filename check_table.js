
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
    const { data, error } = await supabase.from('transaction_items').select('count', { count: 'exact', head: true })

    if (error) {
        console.log('Error:', error.message)
        console.log('Code:', error.code)
    } else {
        console.log('Table exists')
    }
}

checkTable()
