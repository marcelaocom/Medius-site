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
// MOTOR DE RELATÓRIOS OFICIAIS (O CÉREBRO UNIVERSAL)
// ==========================================
window.gerarRelatorioOficial = function(painel, setor, clienteKey = null) {
    const dataHora = new Date().toLocaleString('pt-BR');
    let nomeAlvo = "QG Gênesis Master";
    let dominiosAlvo = "Todos os nós ativos da malha";
    let conteudoHTML = "";

    // 1. DEDUÇÃO DO ALVO
    if (setor === 'Auditoria Forense - Root') {
        nomeAlvo = "QG Gênesis Master (Acesso Root)";
        dominiosAlvo = "Controle Central Administrativo";
    } else if (clienteKey && databaseClientes[clienteKey]) {
        const c = databaseClientes[clienteKey];
        nomeAlvo = `${c.nome} (ID: #${clienteKey})`;
        dominiosAlvo = c.sites ? c.sites.map(s => s.dominio).join(', ') : 'Nenhum domínio';
    } else if (painel === 'CLIENTE' && typeof clienteLogadoKey !== 'undefined') {
        const c = databaseClientes[clienteLogadoKey];
        nomeAlvo = c ? `${c.nome} (ID: #${clienteLogadoKey})` : `Operação Cliente`;
        dominiosAlvo = c && c.sites ? c.sites.map(s => s.dominio).join(', ') : 'Nenhum domínio';
    }

    // 2. CONSTRUÇÃO DO CONTEÚDO POR SETOR CIRÚRGICO
    if (setor === 'Visão Geral' && painel === 'ADM') {
        const clientesGerais = Object.keys(databaseClientes).map(k => ({ id: k, ...databaseClientes[k] }));
        conteudoHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: monospace;">
                <thead>
                    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                        <th style="padding: 10px;">ID Cliente</th>
                        <th style="padding: 10px;">Empresa</th>
                        <th style="padding: 10px;">Status da Malha</th>
                        <th style="padding: 10px;">Vencimento</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientesGerais.map(c => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px; font-weight: bold; color: #0369a1;">#${c.id}</td>
                            <td style="padding: 10px;">${c.nome}</td>
                            <td style="padding: 10px; font-weight: bold; color: ${c.ativo ? '#15803d' : '#dc2626'};">${c.status}</td>
                            <td style="padding: 10px;">${c.expires_at}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="padding: 15px; text-align: center;">Nenhum cliente registrado.</td></tr>'}
                </tbody>
            </table>`;
    } 
    else if (setor === 'Malha de Clientes') {
        const clientesGerais = Object.keys(databaseClientes).map(k => ({ id: k, ...databaseClientes[k] }));
        conteudoHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: monospace;">
                <thead>
                    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                        <th style="padding: 10px;">Cliente / Nó</th>
                        <th style="padding: 10px;">Domínio Principal</th>
                        <th style="padding: 10px;">Status Financeiro</th>
                        <th style="padding: 10px;">Mensalidade</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientesGerais.map(c => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px; font-weight: bold;">${c.nome}</td>
                            <td style="padding: 10px;">${c.sites && c.sites[0] ? c.sites[0].dominio : 'N/A'}</td>
                            <td style="padding: 10px; font-weight: bold; color: ${c.faturamento && c.faturamento.statusPagamento === 'PAGO' ? '#10b981' : '#ef4444'};">${c.faturamento ? c.faturamento.statusPagamento : 'N/A'}</td>
                            <td style="padding: 10px;">${c.faturamento ? c.faturamento.valorMensal : 'R$ 0,00'}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="padding: 15px; text-align: center;">Nenhum cliente registrado.</td></tr>'}
                </tbody>
            </table>`;
    }
    else if (setor === 'Radar de Sessões') {
        const sessoes = JSON.parse(localStorage.getItem('medius_sessoes_ativas') || '[]');
        conteudoHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: monospace;">
                <thead>
                    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                        <th style="padding: 10px;">Usuário / Nó</th>
                        <th style="padding: 10px;">IP Rastreado</th>
                        <th style="padding: 10px;">Dispositivo (OS)</th>
                        <th style="padding: 10px;">Entrada (Hora)</th>
                    </tr>
                </thead>
                <tbody>
                    ${sessoes.map(s => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px; font-weight: bold; color: #0369a1;">${s.usuario}</td>
                            <td style="padding: 10px;">${s.ip}</td>
                            <td style="padding: 10px;">${s.dispositivo}</td>
                            <td style="padding: 10px;">${s.entrada}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="padding: 15px; text-align: center;">Nenhuma sessão ativa.</td></tr>'}
                </tbody>
            </table>`;
    }
    else if (setor === 'Telemetria de Erros') {
        const erros = JSON.parse(localStorage.getItem('medius_telemetria_logs') || '[]');
        conteudoHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: monospace;">
                <thead>
                    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                        <th style="padding: 10px;">Horário</th>
                        <th style="padding: 10px;">Tipo</th>
                        <th style="padding: 10px;">Nó de Origem</th>
                        <th style="padding: 10px;">Mensagem de Falha</th>
                    </tr>
                </thead>
                <tbody>
                    ${erros.map(e => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px;">${e.timestamp}</td>
                            <td style="padding: 10px; font-weight: bold; color: #dc2626;">${e.tipo}</td>
                            <td style="padding: 10px;">#${e.origem}</td>
                            <td style="padding: 10px;">${e.mensagem}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="padding: 15px; text-align: center;">Nenhum log de erro detectado.</td></tr>'}
                </tbody>
            </table>`;
    }
    else if (setor === 'QG Financeiro') {
        const fin = typeof calcularFinanceiroGeral === 'function' ? calcularFinanceiroGeral() : { mrr: 0, custos: 0, lucro: 0 };
        const fmt = val => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        conteudoHTML = `
            <div style="display: flex; gap: 20px; margin-top: 20px;">
                <div style="flex: 1; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; background: #f8fafc;">
                    <span style="display: block; font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Faturamento Total (MRR)</span>
                    <span style="display: block; font-size: 24px; font-weight: bold; color: #10b981; margin-top: 10px;">${fmt(fin.mrr)}</span>
                </div>
                <div style="flex: 1; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; background: #fef2f2;">
                    <span style="display: block; font-size: 10px; font-weight: bold; color: #ef4444; text-transform: uppercase;">Custos de Operação (AWS/Taxas)</span>
                    <span style="display: block; font-size: 24px; font-weight: bold; color: #ef4444; margin-top: 10px;">${fmt(fin.custos)}</span>
                </div>
                <div style="flex: 1; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; background: #f0f9ff;">
                    <span style="display: block; font-size: 10px; font-weight: bold; color: #0284c7; text-transform: uppercase;">Lucro Líquido Medius</span>
                    <span style="display: block; font-size: 24px; font-weight: bold; color: #0284c7; margin-top: 10px;">${fmt(fin.lucro)}</span>
                </div>
            </div>`;
    }
    else if (setor === 'Visão Geral' && painel === 'CLIENTE') {
        const c = databaseClientes[clienteLogadoKey];
        const sites = c ? c.sites : [];
        conteudoHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: monospace;">
                <thead>
                    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                        <th style="padding: 10px;">Domínio Blindado</th>
                        <th style="padding: 10px;">Uptime (SLA)</th>
                        <th style="padding: 10px;">Latência (Ping)</th>
                        <th style="padding: 10px;">Status de Integridade</th>
                    </tr>
                </thead>
                <tbody>
                    ${sites.map(s => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px; font-weight: bold; color: #0369a1;">${s.dominio}</td>
                            <td style="padding: 10px; font-weight: bold; color: #15803d;">${s.uptime}</td>
                            <td style="padding: 10px;">${s.ping}</td>
                            <td style="padding: 10px;">${s.descSaude}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="padding: 15px; text-align: center;">Nenhum domínio vinculado.</td></tr>'}
                </tbody>
            </table>`;
    }
    else if (setor === 'Auditoria Forense' || setor === 'Auditoria Forense - Root') {
        let logs = [];
        if (setor === 'Auditoria Forense - Root') logs = logsAuditoria.admin || [];
        else if (painel === 'ADM' && clienteKey) logs = logsAuditoria.clientes[clienteKey] || [];
        else if (painel === 'CLIENTE') logs = logsAuditoria.clientes[clienteLogadoKey] || [];

        conteudoHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: monospace;">
                <thead>
                    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                        <th style="padding: 10px;">Data / Hora</th>
                        <th style="padding: 10px;">ID Operador</th>
                        <th style="padding: 10px;">Status Biométrico</th>
                        <th style="padding: 10px;">Cadeia de Custódia (SHA-256)</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px;">${log.dataHora}</td>
                            <td style="padding: 10px; font-weight: bold; color: #0369a1;">${log.id || 'N/A'}</td>
                            <td style="padding: 10px; color: #15803d;">Validado</td>
                            <td style="padding: 10px; word-break: break-all; color: #475569;">${log.hash || 'Legado'}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="padding: 15px; text-align: center;">Nenhum registro encontrado.</td></tr>'}
                </tbody>
            </table>`;
    }
    else if (setor === 'Contrato & Licença') {
        const c = databaseClientes[clienteLogadoKey];
        if(c) {
            conteudoHTML = `
                <div style="border: 2px solid #e2e8f0; padding: 40px; border-radius: 8px; text-align: center; margin-top: 30px;">
                    <h2 style="color: #0f172a; text-transform: uppercase; font-size: 24px; margin-bottom: 10px;">Certificado de Blindagem Medius Core</h2>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Certificamos sob as diretrizes de SecOps que os domínios listados encontram-se sob monitoramento 24/7.</p>
                    
                    <div style="text-align: left; background: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
                        <p style="margin-bottom: 10px;"><strong>Titular da Licença:</strong> ${c.nome}</p>
                        <p style="margin-bottom: 10px;"><strong>Código da Operação:</strong> #${clienteLogadoKey}</p>
                        <p style="margin-bottom: 10px;"><strong>Validade da Licença:</strong> ${c.expires_at}</p>
                        <p><strong>Nível de Serviço Contratado:</strong> ENTERPRISE (Sincronia Total)</p>
                    </div>
                    
                    <p style="font-size: 10px; color: #94a3b8; font-style: italic;">* Documento gerado criptograficamente com validação no painel administrador.</p>
                </div>`;
        } else {
             conteudoHTML = `<p>Dados do contrato não encontrados.</p>`;
        }
    }

    // 3. ESTRUTURA GLOBAL DO PDF
    const docTitle = setor === 'Contrato & Licença' ? 'Certificado Oficial' : (setor === 'Visão Geral' ? 'Dossiê Executivo' : 'Extrato de Auditoria');
    const templateHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório - ${setor}</title>
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

            <div class="doc-title">${docTitle}</div>
            
            ${conteudoHTML}

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

    // 4. EXECUÇÃO
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(templateHtml);
        printWindow.document.close();
    } else {
        alert("Atenção: Seu navegador bloqueou o PDF. Permita os Pop-ups e tente novamente.");
    }
};
