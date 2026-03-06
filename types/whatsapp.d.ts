export { };

interface WhatsappTenantState {
    client: any;
    ready: boolean;
    qr: string | null;
}

declare global {
    var whatsappClients: Map<string, WhatsappTenantState>;
    var MAX_WHATSAPP_TENANTS: number;
}
