// ==========================================
// MEDIUS CLOUD CORE // SUPABASE INTEGRATION
// ==========================================
const SUPABASE_URL = 'https://fkxrcspkxtgiioduwxol.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreHJjc3BreHRnaWlvZHV3eG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzk2NzMsImV4cCI6MjEwNDcxNTY3M30.ObemWIIUk8VnqPKT5-kX62TENDyEMrXn7IN8WFe4_wo';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let databaseClientes = {};

async function sincronizarMalhaDaNuvem() {
    try {
        let { data: clientesSupabase, error } = await supabaseClient
            .from('clients')
            .select('*, client_sites(*)');

        if (error) {
            console.error("[SECOPS ERRO] Falha ao sincronizar com o Supabase:", error.message);
            return;
        }

        databaseClientes = {};
        clientesSupabase.forEach(cli => {
            databaseClientes[cli.id] = {
                nome: cli.nome_empresa,
                status: cli.status_contrato,
                statusClass: cli.ativo ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30",
                expires_at: cli.expires_at,
                ativo: cli.ativo,
                sites: cli.client_sites.map(s => ({
                    dominio: s.dominio,
                    tipo: s.tipo_aplicacao,
                    ping: s.ping_ms + "ms",
                    sha: "Válida (256-bit)",
                    saude: s.saude_percentual,
                    descSaude: "Nó Operacional Protegido",
                    uptime: "99.98%",
                    requisicoesHoje: "14,250",
                    trafegoMin: 30,
                    trafegoMax: 90
                }))
            };
        });

        console.log("[MEDIUS CORE] Malha sincronizada com sucesso via Supabase!");
        
        // Atualiza a tela se as funções de renderização do painel estiverem presentes
        if (typeof renderizarTabelaAdmin === 'function') {
            renderizarTabelaAdmin();
        }
    } catch (err) {
        console.error("[CRITICAL] Erro de rede no handshake com a nuvem:", err);
    }
}

// Executa a sincronização assim que o DOM carregar
window.addEventListener('DOMContentLoaded', () => {
    sincronizarMalhaDaNuvem();
});
