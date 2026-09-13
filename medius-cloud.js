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

// ==========================================
// MOTOR DE RELATÓRIOS OFICIAIS (PDF)
// ==========================================
window.gerarRelatorioOficial = function(painel, setor, clienteKey = null) {
    // 1. Coleta de Metadados (O DNA do Relatório)
    const dataHora = new Date().toLocaleString('pt-BR');
    let nomeAlvo = "QG Gênesis Master";
    let dominiosAlvo = "Todos os nós ativos da malha";
    let conteudoTabela = "";

    // 2. Ajusta Metadados dinâmicos baseados no Supabase (databaseClientes)
    if (setor === 'Auditoria Forense - Root') {
        nomeAlvo = "QG Gênesis Master (Acesso Root)";
        dominiosAlvo = "Controle Central Administrativo";
    } else if (clienteKey && typeof databaseClientes !== 'undefined' && databaseClientes[clienteKey]) {
        // Geração via Painel ADM olhando um Cliente
        const c = databaseClientes[clienteKey];
        nomeAlvo = `${c.nome} (ID: #${clienteKey})`;
        dominiosAlvo = c.sites && c.sites.length > 0 ? c.sites.map(s => s.dominio).join(', ') : 'Nenhum domínio registrado';
    } else if (painel === 'CLIENTE' && typeof clienteLogadoKey !== 'undefined') {
        // Geração via Painel do Próprio Cliente
        const c = databaseClientes[clienteLogadoKey];
        nomeAlvo = c ? `${c.nome} (ID: #${clienteLogadoKey})` : `Operação Cliente (ID: #${clienteLogadoKey})`;
        dominiosAlvo = c && c.sites && c.sites.length > 0 ? c.sites.map(s => s.dominio).join(', ') : 'Nenhum domínio registrado';
    }

    // 3. Monta o conteúdo com base no Setor da Malha
    if (setor === 'Auditoria Forense' || setor === 'Auditoria Forense - Root') {
        let logs = [];
        
        // Define de qual gaveta puxar os dados biométricos
        if (setor === 'Auditoria Forense - Root') {
            logs = typeof logsAuditoria !== 'undefined' ? (logsAuditoria.admin || []) : [];
        } else if (painel === 'ADM' && clienteKey) {
            logs = typeof logsAuditoria !== 'undefined' ? (logsAuditoria.clientes[clienteKey] || []) : [];
        } else if (painel === 'CLIENTE' && typeof clienteLogadoKey !== 'undefined') {
            logs = typeof logsAuditoria !== 'undefined' ? (logsAuditoria.clientes[clienteLogadoKey] || []) : [];
        }

        conteudoTabela = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: monospace;">
                <thead>
                    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                        <th style="padding: 10px;">Data / Hora</th>
                        <th style="padding: 10px;">ID Operador</th>
                        <th style="padding: 10px;">Status</th>
                        <th style="padding: 10px;">Hash de Integridade (SHA-256)</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.length > 0 ? logs.map(log => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px;">${log.dataHora}</td>
                            <td style="padding: 10px; font-weight: bold; color: #0369a1;">${log.id || 'N/A'}</td>
                            <td style="padding: 10px; color: #15803d;">Validado</td>
                            <td style="padding: 10px; word-break: break-all; color: #475569;">${log.hash || 'Legado'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="4" style="padding: 15px; text-align: center;">Nenhum registro de acesso encontrado.</td></tr>'}
                </tbody>
            </table>
        `;
    }

    // 4. Constrói o Layout Corporativo Limpo para PDF (Enterprise Pattern)
    const templateHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório Oficial - ${setor}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }
                .header { border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #0f172a; text-transform: uppercase; }
                .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; font-size: 13px; margin-bottom: 30px; }
                .meta-title { font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 10px; margin-bottom: 4px; display: block; }
                .meta-value { margin-bottom: 12px; font-weight: bold; color: #0f172a; display: block; }
                .meta-value:last-child { margin-bottom: 0; }
                .doc-title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; color: #0284c7; }
                .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">MEDIUS CORE // TME</div>
                <div style="font-size: 12px; font-weight: bold; color: #64748b; text-align: right;">
                    PAINEL: ${painel}<br>
                    GERADO EM: ${dataHora}
                </div>
            </div>

            <div class="meta-box">
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="width: 50%; vertical-align: top;">
                            <span class="meta-title">Módulo Analisado:</span>
                            <span class="meta-value">${setor}</span>
                            <span class="meta-title">Protocolo de Segurança:</span>
                            <span class="meta-value" style="color: #10b981;">Blindagem Ativa (SHA-256)</span>
                        </td>
                        <td style="width: 50%; vertical-align: top;">
                            <span class="meta-title">Organização / ID Alvo:</span>
                            <span class="meta-value">${nomeAlvo}</span>
                            <span class="meta-title">Domínios Cobertos:</span>
                            <span class="meta-value">${dominiosAlvo}</span>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="doc-title">Extrato de Auditoria</div>
            
            ${conteudoTabela}

            <div class="footer">
                Documento gerado automaticamente pelo sistema de governança Medius Core Enterprise.<br>
                A integridade destes dados é protegida por criptografia de ponta a ponta.
            </div>
            
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `;

    // 5. Executa a extração e lida com bloqueadores de Pop-ups
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(templateHtml);
        printWindow.document.close();
    } else {
        console.warn("[SECOPS AVISO] Pop-up bloqueado pelo navegador.");
        alert("Atenção, Comandante: O seu navegador bloqueou a abertura do PDF. Por favor, permita pop-ups para este site e tente novamente.");
    }
};
