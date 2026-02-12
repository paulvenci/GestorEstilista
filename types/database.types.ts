export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    created_at: string
                    email: string | null
                    full_name: string | null
                    avatar_url: string | null
                    role: 'admin' | 'staff' | 'superadmin'
                    tenant_id: string | null
                }
                Insert: {
                    id: string
                    created_at?: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'admin' | 'staff' | 'superadmin'
                    tenant_id?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'admin' | 'staff' | 'superadmin'
                    tenant_id?: string | null
                }
            }
            services: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    description: string | null
                    price: number
                    duration_min: number
                    active: boolean
                    tenant_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    description?: string | null
                    price: number
                    duration_min?: number
                    active?: boolean
                    tenant_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    description?: string | null
                    price?: number
                    duration_min?: number
                    active?: boolean
                    tenant_id?: string
                }
            }
            products: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    description: string | null
                    price: number
                    cost: number | null
                    stock: number
                    low_stock_threshold: number
                    active: boolean
                    tenant_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    description?: string | null
                    price: number
                    cost?: number | null
                    stock?: number
                    low_stock_threshold?: number
                    active?: boolean
                    tenant_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    description?: string | null
                    price?: number
                    cost?: number | null
                    stock?: number
                    low_stock_threshold?: number
                    active?: boolean
                    tenant_id?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    created_at: string
                    full_name: string
                    phone: string | null
                    email: string | null
                    notes: string | null
                    tenant_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    full_name: string
                    phone?: string | null
                    email?: string | null
                    notes?: string | null
                    tenant_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    full_name?: string
                    phone?: string | null
                    email?: string | null
                    notes?: string | null
                    tenant_id?: string
                }
            }
            appointments: {
                Row: {
                    id: string
                    created_at: string
                    start_time: string
                    end_time: string
                    client_id: string
                    stylist_id: string
                    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
                    total_amount: number | null
                    notes: string | null
                    tenant_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    start_time: string
                    end_time: string
                    client_id: string
                    stylist_id: string
                    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
                    total_amount?: number | null
                    notes?: string | null
                    tenant_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    start_time?: string
                    end_time?: string
                    client_id?: string
                    stylist_id?: string
                    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
                    total_amount?: number | null
                    notes?: string | null
                    tenant_id?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    created_at: string
                    total_amount: number
                    commission_amount: number
                    payment_method: 'cash' | 'card' | 'transfer' | 'other'
                    notes: string | null
                    tenant_id: string
                    appointment_id: string | null
                    client_id: string | null
                    stylist_id: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    total_amount: number
                    commission_amount: number
                    payment_method: 'cash' | 'card' | 'transfer' | 'other'
                    notes?: string | null
                    tenant_id: string
                    appointment_id?: string | null
                    client_id?: string | null
                    stylist_id?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    total_amount?: number
                    commission_amount?: number
                    payment_method?: 'cash' | 'card' | 'transfer' | 'other'
                    notes?: string | null
                    tenant_id?: string
                    appointment_id?: string | null
                    client_id?: string | null
                    stylist_id?: string | null
                }
            }
            transaction_items: {
                Row: {
                    id: string
                    created_at: string
                    transaction_id: string
                    item_id: string
                    service_id: string | null
                    product_id: string | null
                    item_type: 'service' | 'product'
                    name: string
                    quantity: number
                    unit_price: number
                    total_price: number
                    tenant_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    transaction_id: string
                    item_id: string
                    service_id?: string | null
                    product_id?: string | null
                    item_type: 'service' | 'product'
                    name: string
                    quantity?: number
                    unit_price: number
                    total_price?: number
                    tenant_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    transaction_id?: string
                    item_id?: string
                    service_id?: string | null
                    product_id?: string | null
                    item_type?: 'service' | 'product'
                    name?: string
                    quantity?: number
                    unit_price?: number
                    total_price?: number
                    tenant_id?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
