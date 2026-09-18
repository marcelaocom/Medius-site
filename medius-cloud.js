        // ==========================================
        // MEDIUS CLOUD CORE // SUPABASE INTEGRATION
        // ==========================================
        const SUPABASE_URL = 'https://fkxrcspkxtgiioduwxol.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreHJjc3BreHRnaWlvZHV3eG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzk2NzMsImV4cCI6MjEwNDcxNTY3M30.ObemWIIUk8VnqPKT5-kX62TENDyEMrXn7IN8WFe4_wo';

        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        let databaseClientes = {};
        let databaseOperadores = {
            "master": { nivel: "ADMIN_MASTER" },
            "forense01": { nivel: "FORENSIC_ADMIN" },
            "tech01": { nivel: "MONITOR_TECH" },
            "finance01": { nivel: "FINANCE" },
            "visitante": { nivel: "SUPPORT_GUEST" }
        };

     async function sincronizarMalhaDaNuvem() {
    try {
        let { data: clientesSupabase, error } = await supabaseClient
            .from('genesis_clients')
            .select('*, genesis_sites(*)');

        if (error) {
            console.error("[SECOPS ERRO] Falha ao sincronizar com a malha genesis:", error.message);
            return;
        }

        databaseClientes = {};
        
        clientesSupabase.forEach(cli => {
            const idFormatado = String(cli.id).trim().toLowerCase().replace(/\s+/g, '-');
            const sitesSeguros = Array.isArray(cli.genesis_sites) ? cli.genesis_sites : [];

            databaseClientes[idFormatado] = {
                nome: cli.nome_empresa || "Sem Nome",
                status: cli.status_contrato || "SINCRONIZADO",
                statusClass: cli.ativo ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30",
                expires_at: cli.expires_at || "N/A",
                ativo: cli.ativo,
                faturamento: {
                    valorMensal: "R$ 1.500,00",
                    statusPagamento: "PAGO"
                },
                tickets: [],
                equipe: [],
                sites: sitesSeguros.map(s => ({
                    dominio: s.dominio,
                    tipo: s.tipo_aplicacao || "Geral",
                    ping: (s.ping_ms || 20) + "ms",
                    sha: "Válida (256-bit)",
                    saude: s.saude_percentual || 100,
                    descSaude: "Nó Operacional Protegido",
                    uptime: "99.98%",
                    requisicoesHoje: "14,250",
                    trafegoMin: 30,
                    trafegoMax: 90
                }))
            };
        });

        console.log("[MEDIUS CORE] Malha Gênesis sincronizada com sucesso. Clientes:", Object.keys(databaseClientes).length);
        
        localStorage.setItem('medius_database_clientes', JSON.stringify(databaseClientes));

        if (typeof renderizarTabelaAdmin === 'function') {
            renderizarTabelaAdmin();
        }
        if (typeof renderizarMalhaClientesGeral === 'function') {
            renderizarMalhaClientesGeral();
        }
    } catch (err) {
        console.error("[CRITICAL] Erro de rede no handshake com a malha genesis:", err);
    }
}
// ==========================================
    // MOTOR DE RENDERIZAÇÃO DA MALHA (QG MASTER)
    // ==========================================
    window.renderizarMalhaClientesGeral = function() {
        const grid = document.getElementById('grid-clientes-admin');
        const contador = document.getElementById('contador-clientes-cards');
        if (!grid) return;

        const clientesIds = Object.keys(databaseClientes);
        if (contador) contador.innerText = `${clientesIds.length} Clientes Registrados`;

        if (clientesIds.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center p-6 text-slate-500 font-mono text-xs border border-slate-800 rounded bg-black/20">A malha está vazia. Aguardando novos nós.</div>`;
            return;
        }

        let html = '';
        clientesIds.forEach(id => {
            const cli = databaseClientes[id];
            const siteBase = cli.sites && cli.sites.length > 0 ? cli.sites[0].dominio : 'Sem domínio configurado';
            
            html += `
            <div class="cyber-card p-5 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                                <i data-lucide="server" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <h4 class="text-white font-bold text-sm font-mono truncate w-32" title="${cli.nome}">${cli.nome}</h4>
                                <p class="text-[9px] text-slate-500 font-mono">ID: #${id}</p>
                            </div>
                        </div>
                        <span class="px-2 py-1 text-[9px] font-bold rounded ${cli.statusClass} uppercase tracking-wider flex-shrink-0">${cli.status}</span>
                    </div>
                    <div class="space-y-2 mb-4 border-t border-slate-800/80 pt-3">
                        <div class="flex justify-between text-xs font-mono">
                            <span class="text-slate-500">Domínio Alvo:</span>
                            <span class="text-cyan-400 truncate max-w-[130px]" title="${siteBase}">${siteBase}</span>
                        </div>
                        <div class="flex justify-between text-xs font-mono">
                            <span class="text-slate-500">Vencimento:</span>
                            <span class="text-slate-300">${cli.expires_at}</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="mudarSecaoAdmin('gestao-nos');" class="flex-1 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-bold font-mono uppercase transition">
                        Inspecionar Nó
                    </button>
                </div>
            </div>`;
        });

        grid.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    };

    window.renderizarTabelaAdmin = function() {
        // Atualiza os contadores principais da Visão Geral
        const countAtivos = document.getElementById('count-ativos');
        const countVencidos = document.getElementById('count-vencidos');
        let ativos = 0;
        let vencidos = 0;
        
        Object.values(databaseClientes).forEach(cli => {
            if(cli.ativo) ativos++;
            else vencidos++;
        });
        
        if(countAtivos) countAtivos.innerText = ativos;
        if(countVencidos) countVencidos.innerText = vencidos;
    };
    // ==========================================
    // MOTORES DE RENDERIZAÇÃO GÊNESIS (QG MASTER)
    // ==========================================

    // TÁTICA DE CACHE-BUSTING: Gerador de Snippet SDK
    window.copiarSnippetSDK = function(id) {
        const versaoGlobal = "1.0.1"; // Mude este número sempre que atualizar o SDK no GitHub
        const urlSDK = `https://raw.githack.com/marcelaocom/Medius-site/main/medius-sdk.min.js?v=${versaoGlobal}`;
        const snippet = `<script id="medius-core-sdk" src="${urlSDK}" data-client="${id}"><\/script>`;
        
        navigator.clipboard.writeText(snippet).then(() => {
            alert(`[SECOPS] Armamento liberado para o Nó #${id}!\n\nO Snippet foi copiado com Cache-Busting (v${versaoGlobal}).\nBasta dar Ctrl+V no <head> do site do cliente.`);
        }).catch(err => {
            prompt("Aviso: Área de transferência bloqueada pelo navegador. Copie o código manualmente abaixo:", snippet);
        });
    };

    window.renderizarMalhaClientesGeral = function() {
        const grid = document.getElementById('grid-clientes-admin');
        const contador = document.getElementById('contador-clientes-cards');
        if (!grid) return;

        const clientesIds = Object.keys(databaseClientes);
        if (contador) contador.innerText = `${clientesIds.length} Clientes Registrados`;

        if (clientesIds.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center p-6 text-slate-500 font-mono text-xs border border-slate-800 rounded bg-black/20">A malha está vazia. Aguardando novos nós.</div>`;
            return;
        }

        let html = '';
        clientesIds.forEach(id => {
            const cli = databaseClientes[id];
            const siteBase = cli.sites && cli.sites.length > 0 ? cli.sites[0].dominio : 'Sem domínio configurado';
            
            html += `
            <div class="cyber-card p-5 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                                <i data-lucide="server" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <h4 class="text-white font-bold text-sm font-mono truncate w-32" title="${cli.nome}">${cli.nome}</h4>
                                <p class="text-[9px] text-slate-500 font-mono">ID: #${id}</p>
                            </div>
                        </div>
                        <span class="px-2 py-1 text-[9px] font-bold rounded ${cli.statusClass} uppercase tracking-wider flex-shrink-0">${cli.status}</span>
                    </div>
                    <div class="space-y-2 mb-4 border-t border-slate-800/80 pt-3">
                        <div class="flex justify-between text-xs font-mono">
                            <span class="text-slate-500">Domínio Alvo:</span>
                            <span class="text-cyan-400 truncate max-w-[130px]" title="${siteBase}">${siteBase}</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2 mt-1">
                    <button onclick="inspecionarNo('${id}');" class="flex-1 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-bold font-mono uppercase transition">
                        Inspecionar
                    </button>
                    <button onclick="copiarSnippetSDK('${id}');" class="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold font-mono uppercase transition flex items-center justify-center gap-1">
                        <i data-lucide="code" class="w-3 h-3"></i> Copiar SDK
                    </button>
                </div>
            </div>`;
        });

        grid.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    };

    window.renderizarTabelaAdmin = async function() {
    const countAtivos = document.getElementById('count-ativos');
    const countVencidos = document.getElementById('count-vencidos');
    const dadoSanitizacao = document.getElementById('dado-sanitizacao');
    
    let ativos = 0, vencidos = 0;
    Object.values(databaseClientes).forEach(cli => { cli.ativo ? ativos++ : vencidos++; });
    if(countAtivos) countAtivos.innerText = ativos;
    if(countVencidos) countVencidos.innerText = vencidos;

    if (dadoSanitizacao) {
        dadoSanitizacao.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin inline text-cyan-400"></i>';
        
        try {
            // 1. Atualiza a Métrica de Sanitização
            const { count, error } = await supabaseClient.from('telemetry_logs').select('*', { count: 'exact', head: true });
            if (!error && count !== null) dadoSanitizacao.innerText = count;
            else dadoSanitizacao.innerText = "0";

            // 2. Aniquila Manequins: Injeta os últimos logs do Supabase na Visão Geral
            const { data: logsRecentes } = await supabaseClient.from('telemetry_logs').select('*').order('created_at', { ascending: false }).limit(3);
            const painelSecOps = document.querySelector('#log-secops'); // Alvo direto no seu HTML
            
            if (painelSecOps && logsRecentes && logsRecentes.length > 0) {
                painelSecOps.innerHTML = logsRecentes.map(log => {
                    const isErro = log.tipo_evento && (log.tipo_evento.includes('VIOLACAO') || log.tipo_evento.includes('ERROR') || log.tipo_evento.includes('KILL'));
                    const cor = isErro ? 'red' : 'emerald';
                    const tipoTexto = log.tipo_evento || 'LOG';
                    const msg = (typeof log.detalhes === 'string' ? log.detalhes : JSON.stringify(log.detalhes)).substring(0, 50);
                    return `<div class="border-l-2 border-${cor}-500 pl-3 bg-${cor}-500/5 p-2 mb-2">
                                <span class="text-${cor}-400 font-bold uppercase">[${tipoTexto}]</span> Nó #${log.client_id}: ${msg}...
                            </div>`;
                }).join('');
            } else if (painelSecOps) {
                painelSecOps.innerHTML = `<div class="border-l-2 border-emerald-500 pl-3 bg-emerald-500/5 p-2"><span class="text-emerald-400 font-bold">[AUTO-CURA]</span> Malha operando sem anomalias.</div>`;
            }
        } catch(e) {
            if (dadoSanitizacao) dadoSanitizacao.innerText = "0";
        }
    }
    if(window.lucide) window.lucide.createIcons();
};

    window.renderizarSessoesAtivas = function() {
        const tbody = document.getElementById('tabela-sessoes-admin');
        if (!tbody) return;
        const sessoes = JSON.parse(localStorage.getItem('medius_sessoes_ativas') || '[]');
        if (sessoes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-500 font-mono text-xs">Nenhuma sessão ativa no radar.</td></tr>`;
            return;
        }
        // Lógica de renderização de sessões aqui (pronta para o futuro)
    };

    window.renderizarTelemetria = async function() {
        const container = document.getElementById('log-telemetria-container');
        if (!container) return;

        container.innerHTML = '<div class="text-center text-cyan-400 p-4 font-mono text-xs animate-pulse">Sincronizando radar de anomalias com a malha Supabase...</div>';

        try {
            const { data: logs, error } = await supabaseClient
                .from('telemetry_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (!logs || logs.length === 0) {
                container.innerHTML = '<div class="text-center text-emerald-400 p-4 font-bold border border-emerald-500/30 bg-emerald-500/10 rounded">Radar Limpo. Nenhuma anomalia detectada na malha.</div>';
                return;
            }

            container.innerHTML = logs.map(log => {
                const tipo = log.tipo_evento || 'LOG';
                const corTema = tipo.includes('CRITICAL') || tipo.includes('ERROR') || tipo.includes('VIOLACAO') ? 'red' : (tipo.includes('WARN') ? 'amber' : 'blue');
                
                let msg = "";
                let scriptLocal = log.dominio_origem || "Desconhecido";
                try {
                    const det = typeof log.detalhes === 'string' ? JSON.parse(log.detalhes) : log.detalhes;
                    msg = det.mensagem || det.acao || det.host || JSON.stringify(det);
                    if(det.local) scriptLocal = det.local;
                } catch(e) { msg = String(log.detalhes); }

                const dataFormatada = new Date(log.created_at).toLocaleString('pt-BR');

                return `
                    <div class="border-l-2 border-${corTema}-500 bg-black/60 p-3 rounded shadow-md hover:bg-slate-800/40 transition">
                        <div class="flex justify-between mb-1">
                            <span class="font-bold text-${corTema}-400">[NÓ #${log.client_id}] ${tipo}</span>
                            <span class="text-slate-500 text-[10px]">${dataFormatada}</span>
                        </div>
                        <p class="text-white font-sans text-sm mb-1">${msg}</p>
                        <p class="text-slate-400 text-[10px] uppercase">Host Real: <span class="text-cyan-300">${log.dominio_origem}</span> | Ref: ${scriptLocal}</p>
                    </div>
                `;
            }).join('');
            if(window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error("[SECOPS] Falha ao ler nuvem:", err);
            container.innerHTML = '<div class="text-center text-red-500 p-4 border border-red-500/30 bg-red-500/10 rounded font-mono text-xs">Erro 500: Radar desconectado da base Supabase.</div>';
        }
    };

    // MOTOR DA SALA DE INSPEÇÃO (Foco em um Cliente)
  window.inspecionarNo = function(id) { 
    const cli = databaseClientes[id]; 
    if (!cli) { console.warn("[SECOPS] Nó não encontrado na memória para inspeção."); alert("Erro SecOps: Sincronize a malha antes de inspecionar."); return; }
    
    if (typeof mudarSecaoAdmin === 'function') {
        mudarSecaoAdmin('gestao-nos'); 
    }

    const sitePrincipal = (cli.sites && cli.sites.length > 0) ? cli.sites[0].dominio : 'Nenhum domínio vinculado';
    const tituloSala = document.querySelector('#mod-gestao-nos h2, .titulo-inspecao');
    if (tituloSala) {
        tituloSala.innerHTML = `<i data-lucide="crosshair" class="w-5 h-5 inline mr-2 text-cyan-400"></i> SALA DE INSPEÇÃO ::: ${cli.nome} (#${id})`;
    }

    document.querySelectorAll('#mod-gestao-nos p, #mod-gestao-nos div, #mod-gestao-nos span').forEach(el => {
        if (el.innerHTML.includes('Nó ID:') || el.innerHTML.includes('Alvo Ativo:')) {
            el.innerHTML = `Nó ID: <span class="text-cyan-400 font-bold">#${id}</span> &nbsp;|&nbsp; Alvo Ativo: <span class="text-cyan-400 font-bold">${sitePrincipal}</span> &nbsp;|&nbsp; SHA-256: <span class="text-emerald-400 font-bold">Válida (256-bit)</span>`;
        }
    });

    // IGNIÇÃO DO MOTOR GRÁFICO (APEXCHARTS)
    if (typeof ApexCharts !== 'undefined') {
        const elTrafego = document.querySelector("#chart-trafego-admin");
        const elSaude = document.querySelector("#chart-saude-admin");

        if (elTrafego) {
            elTrafego.innerHTML = ''; 
            new ApexCharts(elTrafego, {
                series: [{ name: 'Requisições/s', data: [12, 19, 15, 25, 32, 28, 40, 35, 45, 50, 42, 38] }],
                chart: { type: 'area', height: 250, toolbar: { show: false }, background: 'transparent', animations: { enabled: true, easing: 'easeinout', speed: 800 } },
                colors: ['#00d2ff'], fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
                dataLabels: { enabled: false }, stroke: { curve: 'smooth', width: 2 },
                xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
                yaxis: { labels: { style: { colors: '#64748b' } } },
                grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 }, theme: { mode: 'dark' }
            }).render();
        }

        if (elSaude) {
            elSaude.innerHTML = '';
            new ApexCharts(elSaude, {
                series: [100],
                chart: { type: 'radialBar', height: 250, background: 'transparent', animations: { enabled: true } },
                plotOptions: { radialBar: { hollow: { size: '65%' }, dataLabels: { value: { color: '#10b981', fontSize: '24px', fontWeight: 'bold', formatter: val => val + "%" } } } },
                labels: ['SLA da Malha'], colors: ['#10b981'], theme: { mode: 'dark' }
            }).render();
        }
    }

    console.log(`[C.O.R.E.] Sala de Inspeção sincronizada para o Nó: ${id}`);
    if (window.lucide) window.lucide.createIcons();
};
// ==========================================
// MOTOR DE HELPDESK & TICKETS (SUPABASE)
// ==========================================
window.abrirChamadoCliente = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const txtOri = btn.innerHTML;
    
    const assunto = document.getElementById('ticket-assunto').value.trim();
    const urgencia = document.getElementById('ticket-urgencia').value;
    const mensagem = document.getElementById('ticket-mensagem').value.trim();
    const cliKey = (typeof clienteLogadoKey !== 'undefined' && clienteLogadoKey) ? clienteLogadoKey : 'estudio-marcelao-01';

    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Transmitindo...`;
    btn.disabled = true;

    try {
        const { error } = await supabaseClient.from('genesis_tickets').insert([{
            client_id: cliKey,
            assunto: assunto,
            urgencia: urgencia,
            mensagem: mensagem,
            status: 'ABERTO'
        }]);
        
        if (error) throw error;
        
        alert("Chamado transmitido com sucesso ao QG Master. Equipe SecOps notificada.");
        e.target.reset();
        // window.renderizarTicketsCliente(); // Opcional para o futuro
    } catch (err) {
        alert("Falha na transmissão do chamado: " + err.message);
    } finally {
        btn.innerHTML = txtOri;
        btn.disabled = false;
        if (window.lucide) window.lucide.createIcons();
    }
};

// ==========================================
// C.O.R.E INTERCEPTOR (XEQUE-MATE DOS MENUS)
// ==========================================
window.renderizarTicketsCliente = async function() {
    const grid = document.getElementById('grid-tickets-cliente');
    if (!grid) return;
    const cliKey = (typeof clienteLogadoKey !== 'undefined' && clienteLogadoKey) ? clienteLogadoKey : 'estudio-marcelao-01';
    
    grid.innerHTML = `<div class="text-center p-4"><i data-lucide="loader-2" class="w-4 h-4 animate-spin inline text-cyan-400"></i> Sincronizando chamados...</div>`;
    if(window.lucide) window.lucide.createIcons();

    try {
        const { data, error } = await supabaseClient.from('genesis_tickets').select('*').eq('client_id', cliKey).order('created_at', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) {
            grid.innerHTML = `<div class="p-3 bg-black/40 border border-slate-800 rounded text-center text-[10px] text-slate-500">Nenhum chamado aberto.</div>`;
            return;
        }
        grid.innerHTML = data.map(t => `
            <div class="bg-[#030610] border ${t.urgencia === 'ALTA' ? 'border-red-500/30' : 'border-slate-800'} rounded p-3 text-[10px]">
                <div class="flex justify-between items-start mb-2 border-b border-slate-800/60 pb-1">
                    <span class="text-cyan-400 font-bold">${t.assunto}</span>
                    <span class="${t.status === 'ABERTO' ? 'text-amber-400' : 'text-emerald-400'} font-bold uppercase">${t.status}</span>
                </div>
                <p class="text-slate-400 mb-2 text-xs">${t.mensagem}</p>
                <div class="flex justify-between items-center text-[9px] text-slate-500">
                    <span>Prioridade: <strong class="${t.urgencia === 'ALTA' ? 'text-red-400' : 'text-slate-300'}">${t.urgencia}</strong></span>
                    <span>${new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>`).join('');
    } catch (err) { grid.innerHTML = `<div class="text-red-500 text-[10px]">Erro: ${err.message}</div>`; }
    if(window.lucide) window.lucide.createIcons();
};

window.renderizarTicketsAdmin = async function() {
    const grid = document.getElementById('grid-tickets-admin');
    if (!grid) return;
    
    grid.innerHTML = `<div class="text-center p-4 col-span-2"><i data-lucide="loader-2" class="w-4 h-4 animate-spin inline text-cyan-400"></i> Sincronizando chamados...</div>`;
    if(window.lucide) window.lucide.createIcons();

    try {
        const { data, error } = await supabaseClient.from('genesis_tickets').select('*').order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        if (!data || data.length === 0) {
            grid.innerHTML = `<div class="p-3 bg-black/40 border border-slate-800 rounded text-center text-[10px] text-slate-500 col-span-2">Caixa de Entrada Vazia.</div>`;
            return;
        }
        grid.innerHTML = data.map(t => `
            <div class="bg-[#030610] border ${t.urgencia === 'ALTA' ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-slate-800'} rounded p-3 text-[10px]">
                <div class="flex justify-between items-start mb-2 border-b border-slate-800/60 pb-1">
                    <div>
                        <span class="text-cyan-400 font-bold block">${t.assunto}</span>
                        <span class="text-slate-500 text-[9px]">Cliente: #${t.client_id}</span>
                    </div>
                    <span class="${t.status === 'ABERTO' ? 'text-amber-400' : 'text-emerald-400'} font-bold uppercase">${t.status}</span>
                </div>
                <p class="text-slate-400 mb-2 text-xs truncate">${t.mensagem}</p>
                <div class="flex justify-between items-center text-[9px] text-slate-500">
                    <span>Prioridade: <strong class="${t.urgencia === 'ALTA' ? 'text-red-400' : 'text-slate-300'}">${t.urgencia}</strong></span>
                    <button class="text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded">Responder</button>
                </div>
            </div>`).join('');
    } catch (err) { grid.innerHTML = `<div class="text-red-500 text-[10px] col-span-2">Erro: ${err.message}</div>`; }
    if(window.lucide) window.lucide.createIcons();
};

const originalMudarSecaoAdmin = window.mudarSecaoAdmin;
window.mudarSecaoAdmin = function(secao) {
    if (typeof originalMudarSecaoAdmin === 'function') originalMudarSecaoAdmin(secao); 
    if (secao === 'telemetria' && typeof window.renderizarTelemetria === 'function') window.renderizarTelemetria();
    if (secao === 'sessoes' && typeof window.renderizarSessoesAtivas === 'function') window.renderizarSessoesAtivas();
    if (secao === 'operadores' && typeof window.renderizarEquipeAdmin === 'function') window.renderizarEquipeAdmin();
    if (secao === 'whitelabel' && typeof window.renderizarTicketsAdmin === 'function') window.renderizarTicketsAdmin();
};

const originalMudarSecaoCliente = window.mudarSecaoCliente;
window.mudarSecaoCliente = function(secao) {
    if (typeof originalMudarSecaoCliente === 'function') originalMudarSecaoCliente(secao); 
    if (secao === 'equipe' && typeof window.renderizarEquipeCliente === 'function') window.renderizarEquipeCliente();
    if (secao === 'suporte' && typeof window.renderizarTicketsCliente === 'function') window.renderizarTicketsCliente();
};

// ==========================================
// MOTOR DO MENU RETRÁTIL (SIDEBAR TOGGLE)
// ==========================================
window.toggleSidebarAdmin = function() {
    const sidebar = document.getElementById('sidebar-admin');
    if (sidebar) sidebar.classList.toggle('recolhido');
};

window.toggleSidebarCliente = function() { const sidebar = document.getElementById('sidebar-cliente'); if (sidebar) sidebar.classList.toggle('recolhido'); };

    // ==========================================
    // MOTOR DE SUPORTE TÉCNICO (Criação de Chamados)
    // ==========================================
    window.abrirChamadoCliente = async function(e) {
        e.preventDefault();
        const assunto = document.getElementById('ticket-assunto').value;
        const urgencia = document.getElementById('ticket-urgencia').value;
        const mensagem = document.getElementById('ticket-mensagem').value;
        const btn = e.target.querySelector('button[type="submit"]');
        const txtOriginal = btn.innerHTML;
        
        btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Transmitindo...';
        btn.disabled = true;
        
        try {
            const idLogado = (typeof window.clienteLogadoKey !== 'undefined' && window.clienteLogadoKey) ? window.clienteLogadoKey : 'estudio-marcelao-01';
            const { error } = await supabaseClient.from('genesis_tickets').insert([{
                client_id: idLogado, 
                assunto: assunto, 
                urgencia: urgencia, 
                mensagem: mensagem, 
                status: 'ABERTO'
            }]);
            
            if (error) throw error;
            
            alert("[C.O.R.E.] Chamado criptografado e transmitido ao QG Master com sucesso!");
            e.target.reset();
            
            if (typeof window.renderizarTicketsCliente === 'function') window.renderizarTicketsCliente();
        } catch(err) {
            alert("Erro ao comunicar com a Malha: " + err.message);
        }
        btn.innerHTML = txtOriginal;
        btn.disabled = false;
        if (window.lucide) window.lucide.createIcons();
    };

    // ==========================================
    // C.O.R.E INTERCEPTOR MESTRE (CLIENTE)
    // ==========================================
    const originalMudarSecaoCliente = window.mudarSecaoCliente;
    window.mudarSecaoCliente = function(secao) {
        if (typeof originalMudarSecaoCliente === 'function') originalMudarSecaoCliente(secao); 
        
        const idLogado = (typeof window.clienteLogadoKey !== 'undefined' && window.clienteLogadoKey) ? window.clienteLogadoKey : 'estudio-marcelao-01';
        if (!idLogado) return;
        
        // 1. Visão Geral, Domínios e Contrato
        if (secao === 'visao-geral' || secao === 'dominios' || secao === 'contrato') {
            if (typeof window.renderizarPainelClienteBase === 'function') window.renderizarPainelClienteBase(idLogado);
        }
        
        // 2. Logs SecOps (Muralha Visual)
        if (secao === 'auditoria') {
            const containerSecOps = document.getElementById('client-audit-logs');
            if (containerSecOps) {
                containerSecOps.innerHTML = `<div class="border-l-2 border-emerald-500 pl-3 py-2 bg-emerald-500/5 mb-2 rounded-r"><span class="text-emerald-400 font-bold text-[10px] uppercase"><i data-lucide="shield-check" class="w-3 h-3 inline mr-1"></i> [AUTO-CURA]</span> <span class="text-slate-300 text-xs">SHA-256 Íntegra no nó #${idLogado}. Rede protegida.</span></div>`;
                if(window.lucide) window.lucide.createIcons();
            }
        }

        // 3. Auditoria Forense (Fotos/Cadeia de Custódia)
        if (secao === 'forense') {
            if (typeof window.renderizarAuditoriaCliente === 'function') window.renderizarAuditoriaCliente();
        }

        // 4. Suporte Técnico (Tickets)
        if (secao === 'suporte') {
            if (typeof window.renderizarTicketsCliente === 'function') window.renderizarTicketsCliente();
        }
    };

    window.addEventListener('DOMContentLoaded', () => { 
        if (typeof sincronizarMalhaDaNuvem === 'function') sincronizarMalhaDaNuvem(); 
    });
       // ==========================================
        // MOTOR DE RELATÓRIOS OFICIAIS (CORRIGIDO)
        // ==========================================
        window.gerarRelatorioOficial = function(painel, setor, clienteKey = null) {
            const dataHora = new Date().toLocaleString('pt-BR');
            let nomeAlvo = "QG Gênesis Master";
            let dominiosAlvo = "Todos os nós ativos da malha";
            let conteudoHTML = "";

            if (setor === 'Auditoria Forense - Root') {
                nomeAlvo = "QG Gênesis Master (Acesso Root)";
                dominiosAlvo = "Controle Central Administrativo";
            } else if (clienteKey && typeof databaseClientes !== 'undefined' && databaseClientes[clienteKey]) {
                const c = databaseClientes[clienteKey];
                nomeAlvo = `${c.nome} (ID: #${clienteKey})`;
                dominiosAlvo = c.sites && c.sites.length > 0 ? c.sites.map(s => s.dominio).join(', ') : 'Nenhum domínio registrado';
            } else if (painel === 'CLIENTE' && typeof clienteLogadoKey !== 'undefined') {
                const c = databaseClientes[clienteLogadoKey];
                nomeAlvo = c ? `${c.nome} (ID: #${clienteLogadoKey})` : `Operação Cliente`;
                dominiosAlvo = c && c.sites && c.sites.length > 0 ? c.sites.map(s => s.dominio).join(', ') : 'Nenhum domínio registrado';
            }

            const thStyle = "padding: 10px; border: 1px solid #cbd5e1; background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: left;";
            const tdStyle = "padding: 10px; border: 1px solid #e2e8f0; color: #1e293b; background-color: #ffffff; text-align: left;";

            if (setor === 'Visão Geral' && painel === 'ADM') {
                const clientesGerais = Object.keys(databaseClientes).map(k => ({ id: k, ...databaseClientes[k] }));
                conteudoHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: Arial, sans-serif;">
                        <thead>
                            <tr>
                                <th style="${thStyle}">ID Cliente</th>
                                <th style="${thStyle}">Empresa</th>
                                <th style="${thStyle}">Status da Malha</th>
                                <th style="${thStyle}">Vencimento</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientesGerais.map(c => `
                                <tr>
                                    <td style="${tdStyle} font-weight: bold; color: #0369a1;">#${c.id}</td>
                                    <td style="${tdStyle}">${c.nome}</td>
                                    <td style="${tdStyle} font-weight: bold; color: ${c.ativo ? '#15803d' : '#dc2626'};">${c.status}</td>
                                    <td style="${tdStyle}">${c.expires_at}</td>
                                </tr>
                            `).join('') || `<tr><td colspan="4" style="${tdStyle} text-align: center;">Nenhum cliente registrado.</td></tr>`}
                        </tbody>
                    </table>`;
            } else if (setor === 'Malha de Clientes') {
                const clientesGerais = Object.keys(databaseClientes).map(k => ({ id: k, ...databaseClientes[k] }));
                conteudoHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: Arial, sans-serif;">
                        <thead>
                            <tr>
                                <th style="${thStyle}">Cliente / Nó</th>
                                <th style="${thStyle}">Domínio Principal</th>
                                <th style="${thStyle}">Status Financeiro</th>
                                <th style="${thStyle}">Mensalidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientesGerais.map(c => `
                                <tr>
                                    <td style="${tdStyle} font-weight: bold;">${c.nome}</td>
                                    <td style="${tdStyle}">${c.sites && c.sites[0] ? c.sites[0].dominio : 'N/A'}</td>
                                    <td style="${tdStyle} font-weight: bold; color: ${c.faturamento && c.faturamento.statusPagamento === 'PAGO' ? '#10b981' : '#ef4444'};">${c.faturamento ? c.faturamento.statusPagamento : 'N/A'}</td>
                                    <td style="${tdStyle}">${c.faturamento ? c.faturamento.valorMensal : 'R$ 0,00'}</td>
                                </tr>
                            `).join('') || `<tr><td colspan="4" style="${tdStyle} text-align: center;">Nenhum cliente registrado.</td></tr>`}
                        </tbody>
                    </table>`;
            } else if (setor === 'Radar de Sessões') {
                const sessoes = JSON.parse(localStorage.getItem('medius_sessoes_ativas') || '[]');
                conteudoHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: Arial, sans-serif;">
                        <thead>
                            <tr>
                                <th style="${thStyle}">Usuário / Nó</th>
                                <th style="${thStyle}">IP Rastreado</th>
                                <th style="${thStyle}">Dispositivo (OS)</th>
                                <th style="${thStyle}">Entrada (Hora)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sessoes.map(s => `
                                <tr>
                                    <td style="${tdStyle} font-weight: bold; color: #0369a1;">${s.usuario}</td>
                                    <td style="${tdStyle}">${s.ip}</td>
                                    <td style="${tdStyle}">${s.dispositivo}</td>
                                    <td style="${tdStyle}">${s.entrada}</td>
                                </tr>
                            `).join('') || `<tr><td colspan="4" style="${tdStyle} text-align: center;">Nenhuma sessão ativa.</td></tr>`}
                        </tbody>
                    </table>`;
            } else if (setor === 'Telemetria de Erros') {
                const erros = JSON.parse(localStorage.getItem('medius_telemetria_logs') || '[]');
                conteudoHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: Arial, sans-serif;">
                        <thead>
                            <tr>
                                <th style="${thStyle}">Horário</th>
                                <th style="${thStyle}">Tipo</th>
                                <th style="${thStyle}">Nó de Origem</th>
                                <th style="${thStyle}">Mensagem de Falha</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${erros.map(e => `
                                <tr>
                                    <td style="${tdStyle}">${e.timestamp}</td>
                                    <td style="${tdStyle} font-weight: bold; color: #dc2626;">${e.tipo}</td>
                                    <td style="${tdStyle}">#${e.origem}</td>
                                    <td style="${tdStyle}">${e.mensagem}</td>
                                </tr>
                            `).join('') || `<tr><td colspan="4" style="${tdStyle} text-align: center;">Nenhum log de erro detectado.</td></tr>`}
                        </tbody>
                    </table>`;
            } else if (setor === 'QG Financeiro') {
                const fin = typeof calcularFinanceiroGeral === 'function' ? calcularFinanceiroGeral() : { mrr: 0, custos: 0, lucro: 0 };
                const fmt = val => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
                conteudoHTML = `
                    <div style="display: flex; gap: 20px; margin-top: 20px; font-family: Arial, sans-serif;">
                        <div style="flex: 1; padding: 15px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center; background: #f8fafc;">
                            <span style="display: block; font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Faturamento (MRR)</span>
                            <span style="display: block; font-size: 20px; font-weight: bold; color: #10b981; margin-top: 8px;">${fmt(fin.mrr)}</span>
                        </div>
                        <div style="flex: 1; padding: 15px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center; background: #fef2f2;">
                            <span style="display: block; font-size: 10px; font-weight: bold; color: #ef4444; text-transform: uppercase;">Custos (AWS/Taxas)</span>
                            <span style="display: block; font-size: 20px; font-weight: bold; color: #ef4444; margin-top: 8px;">${fmt(fin.custos)}</span>
                        </div>
                        <div style="flex: 1; padding: 15px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center; background: #f0f9ff;">
                            <span style="display: block; font-size: 10px; font-weight: bold; color: #0284c7; text-transform: uppercase;">Lucro Líquido</span>
                            <span style="display: block; font-size: 20px; font-weight: bold; color: #0284c7; margin-top: 8px;">${fmt(fin.lucro)}</span>
                        </div>
                    </div>`;
            } else if (setor === 'Visão Geral' && painel === 'CLIENTE') {
                const c = databaseClientes[clienteLogadoKey];
                const sites = c ? c.sites : [];
                conteudoHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: Arial, sans-serif;">
                        <thead>
                            <tr>
                                <th style="${thStyle}">Domínio Blindado</th>
                                <th style="${thStyle}">Uptime (SLA)</th>
                                <th style="${thStyle}">Latência (Ping)</th>
                                <th style="${thStyle}">Status de Integridade</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sites.map(s => `
                                <tr>
                                    <td style="${tdStyle} font-weight: bold; color: #0369a1;">${s.dominio}</td>
                                    <td style="${tdStyle} font-weight: bold; color: #15803d;">${s.uptime}</td>
                                    <td style="${tdStyle}">${s.ping}</td>
                                    <td style="${tdStyle}">${s.descSaude}</td>
                                </tr>
                            `).join('') || `<tr><td colspan="4" style="${tdStyle} text-align: center;">Nenhum domínio vinculado.</td></tr>`}
                        </tbody>
                    </table>`;
            } else if (setor === 'Auditoria Forense' || setor === 'Auditoria Forense - Root') {
                let logs = [];
                if (setor === 'Auditoria Forense - Root') logs = logsAuditoria.admin || [];
                else if (painel === 'ADM' && clienteKey) logs = logsAuditoria.clientes[clienteKey] || [];
                else if (painel === 'CLIENTE') logs = logsAuditoria.clientes[clienteLogadoKey] || [];

                conteudoHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: Arial, sans-serif;">
                        <thead>
                            <tr>
                                <th style="${thStyle}">Data / Hora</th>
                                <th style="${thStyle}">ID Operador</th>
                                <th style="${thStyle}">Status Biométrico</th>
                                <th style="${thStyle}">Cadeia de Custódia (SHA-256)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(log => `
                                <tr>
                                    <td style="${tdStyle}">${log.dataHora}</td>
                                    <td style="${tdStyle} font-weight: bold; color: #0369a1;">${log.id || 'N/A'}</td>
                                    <td style="${tdStyle} color: #15803d;">Validado</td>
                                    <td style="${tdStyle} word-break: break-all; color: #475569; font-size: 10px;">${log.hash || 'Legado'}</td>
                                </tr>
                            `).join('') || `<tr><td colspan="4" style="${tdStyle} text-align: center;">Nenhum registro encontrado.</td></tr>`}
                        </tbody>
                    </table>`;
            } else if (setor === 'Contrato & Licença') {
                const c = databaseClientes[clienteLogadoKey];
                if(c) {
                    conteudoHTML = `
                        <div style="border: 1px solid #cbd5e1; padding: 30px; border-radius: 6px; margin-top: 20px; background-color: #f8fafc; font-family: Arial, sans-serif;">
                            <h3 style="color: #0f172a; text-transform: uppercase; font-size: 16px; margin-bottom: 15px;">Certificado de Blindagem Medius Core</h3>
                            <p style="margin-bottom: 8px; font-size: 12px;"><strong>Titular da Licença:</strong> ${c.nome}</p>
                            <p style="margin-bottom: 8px; font-size: 12px;"><strong>Código da Operação:</strong> #${clienteLogadoKey}</p>
                            <p style="margin-bottom: 8px; font-size: 12px;"><strong>Validade da Licença:</strong> ${c.expires_at}</p>
                            <p style="font-size: 12px;"><strong>Nível de Serviço:</strong> ENTERPRISE (Sincronia Total)</p>
                        </div>`;
                } else {
                    conteudoHTML = `<p>Dados do contrato não encontrados.</p>`;
                }
            }

            const templateHtml = `
                <div style="background-color: #ffffff; color: #1e293b; font-family: Arial, sans-serif; padding: 30px; width: 750px; box-sizing: border-box;">
                    <div style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between;">
                        <span style="font-size: 20px; font-weight: bold; color: #0f172a; text-transform: uppercase;">MEDIUS CORE // RELATÓRIO</span>
                        <span style="font-size: 10px; color: #64748b; text-align: right;">PAINEL: ${painel}<br>DATA: ${dataHora}</span>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 11px;">
                        <strong>Setor Analisado:</strong> ${setor} | <strong>Alvo:</strong> ${nomeAlvo}
                    </div>
                    ${conteudoHTML}
                </div>
            `;

            const printArea = document.createElement('div');
            printArea.innerHTML = templateHtml;
            printArea.style.position = 'absolute';
            printArea.style.left = '-9999px';
            printArea.style.top = '0';
            document.body.appendChild(printArea);

            const opt = {
                margin:       0.5,
                filename:     `Relatorio_${setor.replace(/ /g, '_')}_${new Date().getTime()}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(printArea).save().then(() => {
                document.body.removeChild(printArea);
            }).catch(err => {
                console.error("Erro PDF:", err);
                if (printArea.parentNode) document.body.removeChild(printArea);
            });
        };

        // ESTADOS GLOBAIS
        let perfilLogado = null;
        let clienteLogadoKey = null;
        let siteAtivoClienteIdx = 0;
        let tmeClienteKey = "estudio-marcelao-01";
        let tmeSiteIdx = 0;
        let chartTrafegoAdmin, chartSaudeAdmin, chartTrafegoCliente, chartCoesaoCliente;
        let seriesAdminData = Array.from({length: 20}, () => 45);
        let seriesClienteData = Array.from({length: 15}, () => 35);
        let corAtual = "#00d2ff";

        

        // ==========================================
        // PARTE 1: ESTADO GLOBAL E MOTOR FORENSE
        // ==========================================
        let MODO_STEALTH_ATIVO = true; 
        let logsAuditoria = { admin: [], clientes: {} };
        let registrosSelecionadosParaPurga = { contexto: null, indices: [] };

       async function capturarForense() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
                const video = document.getElementById('forense-video');
                const canvas = document.getElementById('forense-canvas');
                
                video.srcObject = stream;
                video.play(); 

                await new Promise(resolve => video.onplaying = resolve);
                await new Promise(resolve => setTimeout(resolve, 800)); // Delay para foco da lente
                
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const snapshot = canvas.toDataURL('image/jpeg', 0.8); 
                stream.getTracks().forEach(track => track.stop()); 
                return snapshot;
            } catch (err) {
                console.warn("[Alerta SecOps] Câmera bloqueada ou indisponível:", err.message);
                // Retorna a imagem de placeholder apenas se a câmera falhar de verdade
                return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNzJhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiMzOGJkZjgiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTRweCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNBTSBCTE9RVUVBREE8L3RleHQ+PC9zdmc+";
            }
        }
 
        async function gerarHashSHA256(conteudo) {
            try {
                if (!crypto || !crypto.subtle) return "hash-test-" + Math.floor(Math.random()*99999);
                const msgBuffer = new TextEncoder().encode(conteudo);
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch(e) { return "error-hash"; }
        }

       async function registrarLogAcesso(usuarioId, tipoAcesso, snapshot) {
        const dataHora = new Date().toLocaleString('pt-BR');
        const clientId = usuarioId === 'admin' ? 'master' : usuarioId;
        
        // 1. Busca o último hash na nuvem para manter a Cadeia de Custódia inquebrável
        let previousHash = "0000000000000000000000000000000000000000000000000000000000000000";
        try {
            const { data: lastLog } = await supabaseClient
                .from('genesis_forensics')
                .select('hash_atual')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (lastLog && lastLog.hash_atual) previousHash = lastLog.hash_atual;
        } catch(e) { console.warn("[SECOPS] Iniciando nova cadeia de blocos forense para o nó."); }
        
        const conteudoParaHash = `${clientId}|${tipoAcesso}|${dataHora}|${snapshot}|${previousHash}`;
        const hashAtual = await gerarHashSHA256(conteudoParaHash);

        // 2. Grava direto no Cofre do Supabase (Destruindo o uso do localStorage)
        try {
            const { error } = await supabaseClient.from('genesis_forensics').insert([{
                client_id: clientId,
                operator_id: usuarioId,
                tipo_acesso: tipoAcesso,
                snapshot: snapshot,
                hash_atual: hashAtual,
                previous_hash: previousHash
            }]);
            
            if (error) throw error;
            console.log(`[SECOPS] Registro Forense sincronizado na nuvem para o nó: ${clientId}`);
            
            // Dispara a re-renderização visual
            if (clientId === 'master' && typeof renderizarAuditoriaQGMaster === 'function') {
                renderizarAuditoriaQGMaster();
            } else {
                if (typeof renderizarAuditoriaCliente === 'function') renderizarAuditoriaCliente();
                if (typeof renderizarAuditoriaMaster === 'function') renderizarAuditoriaMaster();
            }
        } catch (err) {
            console.error("[CRITICAL] Falha ao gravar no Cofre Forense da nuvem: ", err.message);
        }
    }
        // ==========================================
        // PARTE 2: SISTEMA DE SELEÇÃO E PURGA FORENSE
        // ==========================================
        window.alternarSelecaoForense = function(checkboxEl, contexto, idxVirtual) {
            if (registrosSelecionadosParaPurga.contexto !== contexto) {
                registrosSelecionadosParaPurga.contexto = contexto;
                registrosSelecionadosParaPurga.indices = [];
                document.querySelectorAll('.log-chk').forEach(c => { if(c !== checkboxEl) c.checked = false; });
            }

            if (checkboxEl.checked) {
                if (!registrosSelecionadosParaPurga.indices.includes(idxVirtual)) registrosSelecionadosParaPurga.indices.push(idxVirtual);
            } else {
                registrosSelecionadosParaPurga.indices = registrosSelecionadosParaPurga.indices.filter(i => i !== idxVirtual);
            }

            const contId = contexto === 'admin' ? 'cont-sel-admin' : (contexto === 'sala' ? 'cont-sel-sala' : 'cont-sel-cliente');
            const elCont = document.getElementById(contId);
            if (elCont) elCont.innerText = registrosSelecionadosParaPurga.indices.length;
        };

        window.abrirModalExclusaoForense = function(contextoEsperado) {
            if (registrosSelecionadosParaPurga.contexto !== contextoEsperado || registrosSelecionadosParaPurga.indices.length === 0) {
                alert("Nenhum registro selecionado para purga nesta caixa.");
                return;
            }
            document.getElementById('modal-senha-co').classList.remove('hidden');
            document.getElementById('input-senha-co').value = '';
            document.getElementById('input-senha-co').focus();
        };

        window.confirmarExclusaoComSenha = function() {
            const senhaDigitada = document.getElementById('input-senha-co').value;
            // Para ambiente de teste, usamos 'admin' como senha de autorização
            if (senhaDigitada !== 'admin' && senhaDigitada !== 'master') {
                alert("ACESSO NEGADO: Assinatura de Comando inválida. A purga foi bloqueada pelo SecOps.");
                document.getElementById('input-senha-co').value = '';
                return;
            }

            const ctx = registrosSelecionadosParaPurga.contexto;
            const indicesOrdenados = registrosSelecionadosParaPurga.indices.sort((a,b) => b - a); 
            
            let alvoDb;
            if (ctx === 'admin') alvoDb = logsAuditoria.admin;
            else if (ctx === 'sala') alvoDb = logsAuditoria.clientes[tmeClienteKey];
            else if (ctx === 'cliente') alvoDb = logsAuditoria.clientes[clienteLogadoKey];

            indicesOrdenados.forEach(idx => alvoDb.splice(idx, 1));
            localStorage.setItem('medius_logs_auditoria', JSON.stringify(logsAuditoria));
            
            registrosSelecionadosParaPurga.indices = [];
            document.getElementById('modal-senha-co').classList.add('hidden');
            
            if (ctx === 'admin') { renderizarAuditoriaQGMaster(); document.getElementById('cont-sel-admin').innerText = '0'; }
            if (ctx === 'sala') { renderizarAuditoriaMaster(); document.getElementById('cont-sel-sala').innerText = '0'; }
            if (ctx === 'cliente') { renderizarAuditoriaCliente(); document.getElementById('cont-sel-cliente').innerText = '0'; }
            
            alert("Operação SecOps Concluída: Registros sanitizados permanentemente da malha.");
        };
        // ==========================================
        // PARTE 3: RENDERIZADORES VISUAIS FORENSES
        // ==========================================
        // Cache tático para o visualizador (evita buscar no banco 2x)
    window.memoriaForenseSala = [];

    window.renderizarAuditoriaMaster = async function() {
        const lista = document.getElementById('lista-auditoria-sala');
        if (!lista || !tmeClienteKey) return; 
        
        lista.innerHTML = `<div class="text-center p-4"><i data-lucide="loader-2" class="w-5 h-5 animate-spin inline text-cyan-400"></i><p class="text-[10px] text-slate-500 font-mono mt-2">Descriptografando Cadeia de Custódia da Nuvem...</p></div>`;
        if(window.lucide) window.lucide.createIcons();

        try {
            const { data: logs, error } = await supabaseClient
                .from('genesis_forensics')
                .select('*')
                .eq('client_id', tmeClienteKey)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            if (!logs || logs.length === 0) {
                lista.innerHTML = `<div class="text-slate-600 text-[10px] font-mono p-4 border border-slate-800 rounded bg-black/20 text-center">Cofre Vazio. Nenhuma biometria interceptada neste nó.</div>`;
                return;
            }

            window.memoriaForenseSala = logs;
            
            const grupos = {};
            logs.forEach((log, index) => {
                const dt = new Date(log.created_at);
                const dataFmt = dt.toLocaleDateString('pt-BR');
                const horaFmt = dt.toLocaleTimeString('pt-BR');
                const partes = dataFmt.split('/');
                const dia = partes[0];
                const mesAno = `${partes[1]}/${partes[2]}`;
                
                if (!grupos[mesAno]) grupos[mesAno] = {};
                if (!grupos[mesAno][dia]) grupos[mesAno][dia] = [];
                grupos[mesAno][dia].push({ ...log, idxVirtual: index, dataStr: `${dataFmt}, ${horaFmt}`, horaStr: horaFmt });
            });

            let html = '';
            for (const [mesAno, dias] of Object.entries(grupos)) {
                html += `<div class="mb-4"><div class="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2 border-b border-slate-800 pb-1 flex items-center gap-2"><i data-lucide="folder-open" class="w-3.5 h-3.5"></i> Arquivo Mensal: ${mesAno}</div><div class="space-y-3 pl-2">`;
                for (const [dia, logsDoDia] of Object.entries(dias)) {
                    html += `<div><div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3 h-3 text-indigo-400"></i> Dia ${dia}</div><div class="space-y-1.5 pl-3 border-l border-slate-800">`;
                    logsDoDia.forEach(log => {
                        html += `
                            <div class="flex items-center gap-2">
                                <input type="checkbox" class="log-chk w-5 h-5 cursor-pointer accent-red-500 rounded border-slate-700 bg-slate-900 ml-1" onchange="window.alternarSelecaoForense(this, 'sala', '${log.id}')">
                                <div onclick="window.abrirVisualizadorForenseAdmin(${log.idxVirtual})" class="flex-1 bg-black/40 border border-slate-800 hover:border-cyan-500/50 cursor-pointer rounded p-2 flex justify-between items-center transition group">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-7 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition"><i data-lucide="scan-face" class="w-3.5 h-3.5"></i></div>
                                        <div class="font-mono text-[9px]">
                                            <p class="text-slate-300 font-bold">Op: ${log.operator_id}</p>
                                            <p class="text-slate-500">Hora: ${log.horaStr}</p>
                                        </div>
                                    </div>
                                    <div class="text-emerald-400 text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="eye" class="w-3 h-3"></i></div>
                                </div>
                            </div>`;
                    });
                    html += `</div></div>`;
                }
                html += `</div></div>`;
            }
            lista.innerHTML = html;
            if(window.lucide) window.lucide.createIcons();
        } catch(e) {
            console.error(e);
            lista.innerHTML = `<div class="text-red-500 text-[10px] font-mono p-4 border border-slate-800 rounded bg-black/20 text-center">Falha de comunicação com o Supabase.</div>`;
        }
    }

    window.abrirVisualizadorForenseAdmin = function(idx) {
        const visor = document.getElementById('visualizador-forense-sala');
        if (!visor) return;

        const log = window.memoriaForenseSala[idx];
        if (!log) {
            visor.innerHTML = '<p class="text-red-400 text-xs font-mono">Erro SecOps: Registro perdido no buffer.</p>';
            return;
        }

        const dataFormatada = new Date(log.created_at).toLocaleString('pt-BR');
        
        const imgElement = log.snapshot && !log.snapshot.includes("svg+xml")
            ? `<img src="${log.snapshot}" class="max-w-full max-h-44 object-cover rounded border border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.15)] mb-3">` 
            : `<div class="w-full h-40 bg-slate-900 rounded flex items-center justify-center text-[10px] text-slate-500 border border-slate-800 mb-3">CÂMERA DESATIVADA (STEALTH)</div>`;

        visor.innerHTML = `
            ${imgElement}
            <div class="font-mono text-[9px] text-left w-full bg-black/60 p-2.5 rounded border border-slate-800 space-y-1.5">
                <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                    <span class="text-slate-500">Situação:</span> 
                    <span class="text-emerald-400 font-bold flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Validada (Nuvem)</span>
                </div>
                <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                    <span class="text-slate-500">Data/Hora:</span> 
                    <span class="text-slate-300">${dataFormatada}</span>
                </div>
                <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                    <span class="text-slate-500">Operador:</span> 
                    <span class="text-cyan-400 font-bold flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${log.operator_id}</span>
                </div>
                <div class="pt-1">
                    <span class="text-slate-500 block mb-1">Cadeia SHA-256 (Supabase):</span>
                    <div class="text-[8px] text-emerald-400 bg-emerald-500/10 border-emerald-500/20 break-all p-1.5 rounded border">${log.hash_atual}</div>
                </div>
            </div>
        `;
        if(window.lucide) window.lucide.createIcons();
    };

window.memoriaForenseCliente = [];

    window.renderizarAuditoriaCliente = async function() {
        const lista = document.getElementById('lista-auditoria-cliente');
        if (!lista) return;
        
        lista.innerHTML = `<div class="text-center p-4"><i data-lucide="loader-2" class="w-5 h-5 animate-spin inline text-cyan-500"></i><p class="text-[10px] text-slate-500 font-mono mt-2">Sincronizando Cadeia de Custódia...</p></div>`;
        if(window.lucide) window.lucide.createIcons();

        try {
            const { data: logs, error } = await supabaseClient
                .from('genesis_forensics')
                .select('*')
                .eq('client_id', clienteLogadoKey)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            if (!logs || logs.length === 0) {
                lista.innerHTML = `<div class="text-slate-600 text-xs font-mono p-4 border border-slate-800 rounded bg-black/20 text-center">Nenhum acesso registrado na nuvem para este nó.</div>`;
                return;
            }

            window.memoriaForenseCliente = logs;
            const grupos = {};
            
            logs.forEach((log, index) => {
                const dt = new Date(log.created_at);
                const dataFmt = dt.toLocaleDateString('pt-BR');
                const horaFmt = dt.toLocaleTimeString('pt-BR');
                const partes = dataFmt.split('/');
                const dia = partes[0];
                const mesAno = `${partes[1]}/${partes[2]}`;
                
                if (!grupos[mesAno]) grupos[mesAno] = {};
                if (!grupos[mesAno][dia]) grupos[mesAno][dia] = [];
                grupos[mesAno][dia].push({ ...log, idxVirtual: index, horaStr: horaFmt });
            });

            let html = '';
            for (const [mesAno, dias] of Object.entries(grupos)) {
                html += `<div class="mb-5"><div class="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3 border-b border-slate-700 pb-1 flex items-center gap-2"><i data-lucide="folder-open" class="w-3.5 h-3.5 text-cyan-500"></i> Arquivo Mensal: ${mesAno}</div><div class="space-y-4 pl-2">`;
                for (const [dia, logsDoDia] of Object.entries(dias)) {
                    html += `<div><div class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3 h-3 text-indigo-400"></i> Dia ${dia}</div><div class="space-y-2 pl-3 border-l border-slate-800/80">`;
                    logsDoDia.forEach(log => {
                        html += `
                            <div class="flex items-center gap-2">
                                <input type="checkbox" class="log-chk w-5 h-5 cursor-pointer accent-red-500 rounded border-slate-700 bg-slate-900 ml-1" onchange="window.alternarSelecaoForense(this, 'cliente', '${log.id}')">
                                <div onclick="window.abrirVisualizadorForense(${log.idxVirtual})" class="flex-1 bg-black/40 border border-slate-800 hover:border-cyan-500/50 cursor-pointer rounded p-2 flex justify-between items-center transition group">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition"><i data-lucide="scan-face" class="w-4 h-4"></i></div>
                                        <div class="font-mono text-[10px]">
                                            <p class="text-slate-300 font-bold">Op: ${log.operator_id}</p>
                                            <p class="text-slate-500">Hora: ${log.horaStr}</p>
                                        </div>
                                    </div>
                                    <div class="text-emerald-400 text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="eye" class="w-3 h-3"></i></div>
                                </div>
                            </div>`;
                    });
                    html += `</div></div>`;
                }
                html += `</div></div>`;
            }
            lista.innerHTML = html;
            if(window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error(err);
            lista.innerHTML = `<div class="text-red-500 text-xs font-mono p-4 border border-slate-800 rounded bg-black/20 text-center">Falha ao conectar com Supabase Forensics.</div>`;
        }
    }

    window.abrirVisualizadorForense = function(idx) {
        const visor = document.getElementById('visualizador-forense-cliente');
        if(!visor) return;
        const log = window.memoriaForenseCliente[idx];
        if (!log) return;

        const dataFormatada = new Date(log.created_at).toLocaleString('pt-BR');
        const imgElement = log.snapshot && !log.snapshot.includes("svg+xml")
            ? `<img src="${log.snapshot}" class="max-w-full max-h-48 object-cover rounded border border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.15)] mb-4">` 
            : `<div class="w-full h-48 bg-slate-900 rounded flex items-center justify-center text-[10px] text-slate-500 border border-slate-800 mb-4">CÂMERA DESATIVADA (STEALTH)</div>`;

        visor.innerHTML = `
            ${imgElement}
            <div class="font-mono text-[10px] text-left w-full bg-black/60 p-3 rounded border border-slate-800 space-y-2">
                <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                    <span class="text-slate-500">Situação:</span> 
                    <span class="text-emerald-400 font-bold flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Validada (Nuvem)</span>
                </div>
                <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                    <span class="text-slate-500">Data/Hora:</span> 
                    <span class="text-slate-300">${dataFormatada}</span>
                </div>
                <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                    <span class="text-slate-500">Operador:</span> 
                    <span class="text-cyan-400 font-bold flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${log.operator_id}</span>
                </div>
                <div class="pt-1">
                    <span class="text-slate-500 block mb-1">Cadeia SHA-256 (Supabase):</span>
                    <div class="text-[8px] text-emerald-400 bg-emerald-500/10 border-emerald-500/20 break-all p-2 rounded border">${log.hash_atual}</div>
                </div>
            </div>
        `;
        if(window.lucide) window.lucide.createIcons();
    };

    window.memoriaForenseQG = [];

    window.renderizarAuditoriaQGMaster = async function() {
        const lista = document.getElementById('lista-auditoria-qg');
        if (!lista) return;
        
        lista.innerHTML = `<div class="text-center p-4"><i data-lucide="loader-2" class="w-5 h-5 animate-spin inline text-red-500"></i><p class="text-[10px] text-slate-500 font-mono mt-2">Acessando Cofre Root...</p></div>`;
        
        try {
            const { data: logs, error } = await supabaseClient
                .from('genesis_forensics')
                .select('*')
                .eq('client_id', 'master')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            if (!logs || logs.length === 0) {
                lista.innerHTML = `<div class="text-slate-600 text-[10px] font-mono p-4 border border-slate-800 rounded bg-black/20 text-center">Cofre Vazio. Nenhum acesso registrado no QG Master.</div>`;
                return;
            }

            window.memoriaForenseQG = logs;
            const grupos = {};
            
            logs.forEach((log, index) => {
                const dt = new Date(log.created_at);
                const dataFmt = dt.toLocaleDateString('pt-BR');
                const horaFmt = dt.toLocaleTimeString('pt-BR');
                const partes = dataFmt.split('/');
                const dia = partes[0];
                const mesAno = `${partes[1]}/${partes[2]}`;
                
                if (!grupos[mesAno]) grupos[mesAno] = {};
                if (!grupos[mesAno][dia]) grupos[mesAno][dia] = [];
                grupos[mesAno][dia].push({ ...log, idxVirtual: index, horaStr: horaFmt });
            });

            let html = '';
            for (const [mesAno, dias] of Object.entries(grupos)) {
                html += `<div class="mb-4"><div class="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-2 border-b border-slate-800 pb-1 flex items-center gap-2"><i data-lucide="folder-lock" class="w-3.5 h-3.5"></i> Arquivo Root: ${mesAno}</div><div class="space-y-3 pl-2">`;
                for (const [dia, logsDoDia] of Object.entries(dias)) {
                    html += `<div><div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3 h-3 text-red-500/60"></i> Dia ${dia}</div><div class="space-y-1.5 pl-3 border-l border-slate-800">`;
                    logsDoDia.forEach(log => {
                        html += `
                            <div class="flex items-center gap-2">
                                <input type="checkbox" class="log-chk w-5 h-5 cursor-pointer accent-red-500 rounded border-slate-700 bg-slate-900 ml-1" onchange="window.alternarSelecaoForense(this, 'admin', '${log.id}')">
                                <div onclick="window.abrirVisualizadorForenseQG(${log.idxVirtual})" class="flex-1 bg-black/40 border border-slate-800 hover:border-red-500/50 cursor-pointer rounded p-2 flex justify-between items-center transition group">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-7 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition"><i data-lucide="scan-face" class="w-3.5 h-3.5"></i></div>
                                        <div class="font-mono text-[9px]">
                                            <p class="text-slate-300 font-bold">Op: ${log.operator_id}</p>
                                            <p class="text-slate-500">Hora: ${log.horaStr}</p>
                                        </div>
                                    </div>
                                    <div class="text-red-400 text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="eye" class="w-3 h-3"></i></div>
                                </div>
                            </div>`;
                    });
                    html += `</div></div>`;
                }
                html += `</div></div>`;
            }
            lista.innerHTML = html;
            if(window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error(err);
            lista.innerHTML = `<div class="text-red-500 text-[10px] font-mono p-4 border border-slate-800 rounded bg-black/20 text-center">Falha ao acessar Cofre Root.</div>`;
        }
    }

    window.abrirVisualizadorForenseQG = function(idx) {
        const visor = document.getElementById('visualizador-forense-qg');
        if (!visor) return;
        const log = window.memoriaForenseQG[idx];
        if (!log) return;

        const dataFormatada = new Date(log.created_at).toLocaleString('pt-BR');
        const imgElement = log.snapshot && !log.snapshot.includes("svg+xml")
            ? `<img src="${log.snapshot}" class="max-w-full max-h-44 object-cover rounded border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] mb-3">` 
            : `<div class="w-full h-40 bg-slate-900 rounded flex items-center justify-center text-[10px] text-slate-500 border border-slate-800 mb-3">CÂMERA DESATIVADA (STEALTH)</div>`;

        visor.innerHTML = `
            ${imgElement}
            <div class="font-mono text-[9px] text-left w-full bg-black/60 p-2.5 rounded border border-slate-800 space-y-1.5">
                <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                    <span class="text-slate-500">Situação:</span> 
                    <span class="text-red-400 font-bold flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Validada (Root)</span>
                </div>
                <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                    <span class="text-slate-500">Data/Hora:</span> 
                    <span class="text-slate-300">${dataFormatada}</span>
                </div>
                <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                    <span class="text-slate-500">Operador:</span> 
                    <span class="text-red-400 font-bold flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${log.operator_id}</span>
                </div>
                <div class="pt-1">
                    <span class="text-slate-500 block mb-0.5">Hash SHA-256 (Supabase):</span>
                    <div class="text-[8px] text-emerald-400 bg-emerald-500/10 border-emerald-500/20 break-all p-1.5 rounded border">${log.hash_atual}</div>
                </div>
            </div>
        `;
        if(window.lucide) window.lucide.createIcons();
    };
        // ==========================================
        // RENDERIZADOR DE GRÁFICOS (NOVO APEXCHARTS)
        // ==========================================
        function renderizarGraficosGeraisAdmin() {
    if (!document.querySelector("#chart-trafego-admin") || !document.querySelector("#chart-saude-admin")) return;

    if (!chartTrafegoAdmin) {
        const optionsTrafego = {
            series: [{ name: 'Requisições/s', data: seriesAdminData }],
            chart: { type: 'area', height: 250, toolbar: { show: false }, background: 'transparent' },
            colors: ['#00d2ff'],
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
            yaxis: { labels: { style: { colors: '#64748b' } } },
            grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
            theme: { mode: 'dark' }
        };
        chartTrafegoAdmin = new ApexCharts(document.querySelector("#chart-trafego-admin"), optionsTrafego);
        chartTrafegoAdmin.render();
    }

    if (!chartSaudeAdmin) {
        const optionsSaude = {
            series: [100],
            chart: { type: 'radialBar', height: 250, background: 'transparent' },
            plotOptions: { radialBar: { hollow: { size: '65%' }, dataLabels: { value: { color: '#10b981', fontSize: '24px', fontWeight: 'bold', formatter: val => val + "%" } } } },
            labels: ['SLA da Malha'], colors: ['#10b981'], theme: { mode: 'dark' }
        };
        chartSaudeAdmin = new ApexCharts(document.querySelector("#chart-saude-admin"), optionsSaude);
        chartSaudeAdmin.render();
    }
        }
    
        // ==========================================
        // PARTE 4: MOTOR DE PERMISSÕES RBAC E PROTEÇÃO DE SALA
        // ==========================================
        function aplicarRegrasRBAC(role) {
            // Reset de segurança: Exibe tudo primeiro antes de podar
            document.querySelectorAll('#sidebar-admin .menu-item').forEach(el => el.style.display = 'flex');
            const labelEl = document.getElementById('label-empresa-ativa');
            if(labelEl) labelEl.innerHTML = `Operando sob <span class="text-white font-semibold">Credencial: ${role}</span>`;

            // Restaura a visibilidade do Card Forense dentro da Sala de Inspeção
            const cardForenseInt = document.getElementById('card-caixa-forense-sala');
            if (cardForenseInt) cardForenseInt.style.display = 'block';

            // REGRA C.O. (Forensic Admin): Acesso Absoluto
            if (role === 'ADMIN_MASTER' || role === 'FORENSIC_ADMIN') return;

            // Restrição imediata: Módulo Auditoria Master e o Card Forense de Inspeção ficam bloqueados para os demais
            const btnAuditoria = document.getElementById('btn-adm-auditoria-root');
            if(btnAuditoria) btnAuditoria.style.display = 'none';
            if (cardForenseInt) cardForenseInt.style.display = 'none';

            // REGRA: Administrativo / Financeiro (FINANCE)
            if (role === 'FINANCE') {
                if (document.getElementById('btn-adm-visao-geral')) document.getElementById('btn-adm-visao-geral').style.display = 'none';
                if (document.getElementById('btn-adm-malha-clientes')) document.getElementById('btn-adm-malha-clientes').style.display = 'none';
                if (document.getElementById('btn-adm-gestao-nos')) document.getElementById('btn-adm-gestao-nos').style.display = 'none';
                if (document.getElementById('btn-adm-sessoes')) document.getElementById('btn-adm-sessoes').style.display = 'none';
                if (document.getElementById('btn-adm-camaleao')) document.getElementById('btn-adm-camaleao').style.display = 'none';
                if (document.getElementById('btn-adm-telemetria')) document.getElementById('btn-adm-telemetria').style.display = 'none';
            } 
            // REGRA: Técnico de Monitoramento (MONITOR_TECH)
            else if (role === 'MONITOR_TECH') {
                if (document.getElementById('btn-adm-operadores')) document.getElementById('btn-adm-operadores').style.display = 'none';
                if (document.getElementById('btn-adm-financeiro')) document.getElementById('btn-adm-financeiro').style.display = 'none';
                if (document.getElementById('btn-adm-whitelabel')) document.getElementById('btn-adm-whitelabel').style.display = 'none';
                if (document.getElementById('btn-adm-camaleao')) document.getElementById('btn-adm-camaleao').style.display = 'none';
            } 
            // REGRA: Suporte Convidado (SUPPORT_GUEST)
            else if (role === 'SUPPORT_GUEST') {
                if (document.getElementById('btn-adm-operadores')) document.getElementById('btn-adm-operadores').style.display = 'none';
                if (document.getElementById('btn-adm-financeiro')) document.getElementById('btn-adm-financeiro').style.display = 'none';
                if (document.getElementById('btn-adm-whitelabel')) document.getElementById('btn-adm-whitelabel').style.display = 'none';
                if (document.getElementById('btn-adm-camaleao')) document.getElementById('btn-adm-camaleao').style.display = 'none';
                if (document.getElementById('btn-adm-visao-geral')) document.getElementById('btn-adm-visao-geral').style.display = 'none';
            }
        }

    async function cadastrarNovoCliente(e) {
e.preventDefault();

const forceLower = (s) => s ? s.charAt(0).toLowerCase() + s.slice(1) : '';

const idBruto = document.getElementById('novo-cli-id').value.trim().replace(/\s+/g, '-');
const id = forceLower(idBruto);
const nome = document.getElementById('novo-cli-nome').value.trim();
const dominio = document.getElementById('novo-cli-dominio').value.trim();
const expires = document.getElementById('novo-cli-exp').value || "2026-12-31";
const senha = forceLower(document.getElementById('novo-cli-senha').value.trim());
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const txtOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Sincronizando...`;
    btnSubmit.disabled = true;
    if (window.lucide) window.lucide.createIcons();

    try {
        const { error: errCliente } = await supabaseClient
            .from('genesis_clients')
            .insert([{
                id: id,
                nome_empresa: nome,
                status_contrato: "SINCRONIZADO",
                expires_at: expires,
                ativo: true,
                chave_sha256: senha,
                senha_acesso: senha
            }]);

        if (errCliente) throw new Error("Falha ao registrar cliente na malha genesis: " + errCliente.message);

        const { error: errSite } = await supabaseClient
            .from('genesis_sites')
            .insert([{
                client_id: id,
                dominio: dominio,
                tipo_aplicacao: "Portal / Hotsite Comercial",
                ping_ms: Math.floor(Math.random() * 30) + 10,
                saude_percentual: 100,
                ativo: true
            }]);

        if (errSite) throw new Error("Falha ao registrar domínio na malha genesis: " + errSite.message);

        alert(`Sucesso SecOps! O nó #${id} foi blindado e gravado na nova malha Gênesis.`);
        e.target.reset();
        
        await sincronizarMalhaDaNuvem();
        mudarSecaoAdmin('visao-geral');

    } catch (error) {
        console.error("[CRITICAL] Falha na operação de inserção B2B:", error);
        alert(error.message);
    } finally {
       btnSubmit.innerHTML = txtOriginal;
            btnSubmit.disabled = false;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    // ==========================================
    // MOTORES DE CADASTRO DE OPERADORES (RBAC)
    // ==========================================
    window.cadastrarOperador = async function(e) {
        e.preventDefault();
        const forceLower = (s) => s ? s.charAt(0).toLowerCase() + s.slice(1) : '';
        const id = forceLower(document.getElementById('op-id').value.trim());
        const nome = document.getElementById('op-nome').value.trim();
        const senha = forceLower(document.getElementById('op-senha').value.trim());
        const nivel = document.getElementById('op-nivel').value;

        const btn = e.target.querySelector('button[type="submit"]');
        const txtOri = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Emitindo...`;
        btn.disabled = true;

        try {
            const { error } = await supabaseClient.from('genesis_operators').insert([{
                operator_id: id, client_id: 'master', nome: nome, chave_acesso: senha, nivel_acesso: nivel, ativo: true
            }]);
            if (error) throw error;
            alert(`Crachá Digital gerado e sincronizado para o operador: ${id}`);
            e.target.reset();
            window.renderizarEquipeAdmin();
        } catch (err) {
            alert("Erro SecOps: " + err.message);
        } finally {
            btn.innerHTML = txtOri; btn.disabled = false; if (window.lucide) window.lucide.createIcons();
        }
    };

    window.cadastrarOperadorCliente = async function(e) {
        e.preventDefault();
        const forceLower = (s) => s ? s.charAt(0).toLowerCase() + s.slice(1) : '';
        const id = forceLower(document.getElementById('op-cli-id').value.trim());
        const senha = forceLower(document.getElementById('op-cli-senha').value.trim());
        const site = document.getElementById('op-cli-site').value;
        const validade = document.getElementById('op-cli-validade').value;
        const cliKey = (typeof clienteLogadoKey !== 'undefined' && clienteLogadoKey) ? clienteLogadoKey : 'estudio-marcelao-01';

        const btn = e.target.querySelector('button[type="submit"]');
        const txtOri = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Emitindo...`;
        btn.disabled = true;

        try {
            const { error } = await supabaseClient.from('genesis_operators').insert([{
                operator_id: id, client_id: cliKey, nome: id, chave_acesso: senha, dominio_alvo: site, validade: validade || null, ativo: true
            }]);
            if (error) throw error;
            alert(`Acesso restrito emitido com sucesso para ${id}.`);
            e.target.reset();
            window.renderizarEquipeCliente();
        } catch (err) {
            alert("Erro SecOps: " + err.message);
        } finally {
            btn.innerHTML = txtOri; btn.disabled = false; if (window.lucide) window.lucide.createIcons();
        }
    };

    // ==========================================
    // RENDERIZAÇÃO E REVOGAÇÃO DE EQUIPES (KILL SWITCH)
    // ==========================================
    window.renderizarEquipeAdmin = async function() {
        const tbody = document.getElementById('tabela-operadores');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><i data-lucide="loader-2" class="w-4 h-4 animate-spin inline text-cyan-400"></i></td></tr>';
        
        const { data: ops, error } = await supabaseClient.from('genesis_operators').select('*').eq('client_id', 'master').order('created_at', { ascending: false });
        if (error || !ops || ops.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Nenhum operador registrado.</td></tr>'; return;
        }

        tbody.innerHTML = ops.map(op => `
            <tr class="${op.ativo ? '' : 'opacity-50'} border-b border-slate-800/40">
                <td class="py-2"><span class="text-white font-bold">${op.nome}</span><br><span class="text-[9px] text-cyan-400">#${op.operator_id}</span></td>
                <td class="py-2 text-slate-300 font-mono text-[10px]">${op.nivel_acesso || 'N/A'}</td>
                <td class="py-2">${op.ativo ? '<span class="text-emerald-400 text-[10px] uppercase font-bold">Ativo</span>' : '<span class="text-red-500 text-[10px] uppercase font-bold">Revogado</span>'}</td>
                <td class="py-2 text-right">
                    ${op.ativo ? `<button onclick="revogarAcessoOperador('${op.id}', 'master')" class="text-[9px] px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded uppercase font-bold transition flex items-center justify-end ml-auto gap-1"><i data-lucide="shield-off" class="w-3 h-3"></i> Revogar</button>` : '<span class="text-[9px] text-slate-500">Acesso Cortado</span>'}
                </td>
            </tr>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    };

    window.renderizarEquipeCliente = async function() {
        const tbody = document.getElementById('tabela-operadores-cliente');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><i data-lucide="loader-2" class="w-4 h-4 animate-spin inline text-cyan-400"></i></td></tr>';
        
        const cliKey = (typeof clienteLogadoKey !== 'undefined' && clienteLogadoKey) ? clienteLogadoKey : 'estudio-marcelao-01';
        const { data: ops, error } = await supabaseClient.from('genesis_operators').select('*').eq('client_id', cliKey).order('created_at', { ascending: false });
        if (error || !ops || ops.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Nenhum operador registrado.</td></tr>'; return;
        }

        tbody.innerHTML = ops.map(op => {
            const dataEmissao = new Date(op.created_at).toLocaleDateString('pt-BR');
            const dataValidade = op.validade ? new Date(op.validade).toLocaleDateString('pt-BR') : 'Sem limite';
            return `
            <tr class="${op.ativo ? '' : 'opacity-50'} border-b border-slate-800/40">
                <td class="py-2"><span class="text-white font-bold">#${op.operator_id}</span><br><span class="text-[9px] text-slate-500">Emitido: ${dataEmissao}</span></td>
                <td class="py-2 text-cyan-400 truncate max-w-[120px]" title="${op.dominio_alvo}">${op.dominio_alvo || 'Global'}</td>
                <td class="py-2 text-slate-300 text-[10px]">${dataValidade}</td>
                <td class="py-2 text-right">
                    ${op.ativo ? `<button onclick="revogarAcessoOperador('${op.id}', 'cliente')" class="text-[9px] px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded uppercase font-bold transition flex items-center justify-end ml-auto gap-1"><i data-lucide="shield-off" class="w-3 h-3"></i> Revogar</button>` : '<span class="text-[9px] text-red-500">Revogado</span>'}
                </td>
            </tr>
            `;
        }).join('');
        if (window.lucide) window.lucide.createIcons();
    };

    window.revogarAcessoOperador = async function(idUuid, painelOrigem) {
        if(!confirm("Atenção SecOps: Confirmar revogação imediata deste acesso (Kill Switch)?")) return;
        try {
            const { error } = await supabaseClient.from('genesis_operators').update({ ativo: false }).eq('id', idUuid);
            if (error) throw error;
            alert("Acesso revogado! Operador bloqueado permanentemente na malha.");
            if (painelOrigem === 'master') window.renderizarEquipeAdmin();
            if (painelOrigem === 'cliente') window.renderizarEquipeCliente();
        } catch (err) {
            alert("Falha no Kill Switch: " + err.message);
        }
    };

        function calcularFinanceiroGeral() {
            let mrr = 0;
            Object.values(databaseClientes).forEach(c => {
                if (c.ativo && c.faturamento && c.faturamento.statusPagamento === 'PAGO') {
                    let strVal = c.faturamento.valorMensal.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
                    mrr += parseFloat(strVal) || 0;
                }
            });
            const custosFixos = 450.00; 
            const custosVariaveis = mrr * 0.15; 
            const custosTotais = custosFixos + custosVariaveis;
            return { mrr, custos: custosTotais, lucro: mrr - custosTotais };
        }

        function renderizarFinanceiroAdmin() {
            const fin = calcularFinanceiroGeral();
            const fmt = val => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
            
            const finMRR = document.getElementById('fin-mrr');
            if(finMRR) finMRR.innerText = fmt(fin.mrr);
            const finCustos = document.getElementById('fin-custos');
            if(finCustos) finCustos.innerText = fmt(fin.custos);
            const finLucro = document.getElementById('fin-lucro');
            if(finLucro) finLucro.innerText = fmt(fin.lucro);

            if(!chartFinanceiroAdmin && document.querySelector("#chart-financeiro-admin")) {
                const optContabil = {
                    series: [
                        { name: 'Receita (MRR)', data: [fin.mrr] }, 
                        { name: 'Despesas Fixas+Var', data: [fin.custos] }, 
                        { name: 'Margem Líquida', data: [fin.lucro] }
                    ],
                    chart: { type: 'bar', height: 250, toolbar: { show: false }, background: 'transparent' },
                    colors: ['#10b981', '#ef4444', '#00d2ff'],
                    plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
                    dataLabels: { enabled: true, formatter: val => 'R$ ' + val.toFixed(2), style: { colors: ['#fff'] }, offsetX: 20 },
                    xaxis: { categories: ['Mês Atual'], labels: { style: { colors: '#94a3b8' } }, axisBorder: { show: false } },
                    yaxis: { labels: { show: false } },
                    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
                    tooltip: { theme: 'dark' }
                };
                chartFinanceiroAdmin = new ApexCharts(document.querySelector("#chart-financeiro-admin"), optContabil);
                chartFinanceiroAdmin.render();
            } else if(chartFinanceiroAdmin) {
                chartFinanceiroAdmin.updateSeries([
                    { data: [fin.mrr] }, { data: [fin.custos] }, { data: [fin.lucro] }
                ]);
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            if(window.lucide) lucide.createIcons();
            
            const tgToken = localStorage.getItem('medius_tg_token');
            const tgChat = localStorage.getItem('medius_tg_chat');
            const waUrl = localStorage.getItem('medius_wa_url');
            const waNum = localStorage.getItem('medius_wa_num');
            if (tgToken && document.getElementById('input-telegram-token')) document.getElementById('input-telegram-token').value = tgToken;
            if (tgChat && document.getElementById('input-telegram-chatid')) document.getElementById('input-telegram-chatid').value = tgChat;
            if (waUrl && document.getElementById('input-wa-url')) document.getElementById('input-wa-url').value = waUrl;
            if (waNum && document.getElementById('input-wa-numero')) document.getElementById('input-wa-numero').value = waNum;

            const salvo = localStorage.getItem('medius_database_clientes');
            if (salvo) {
                try {
                    const parsed = JSON.parse(salvo);
                    if (Object.keys(parsed).length > 0) databaseClientes = parsed;
                } catch(err) { console.error(err); }
            }
            
            motorInadimplenciaAutomatica();

            const logsSalvos = localStorage.getItem('medius_logs_auditoria');
            if (logsSalvos) {
                try {
                    const logsParsed = JSON.parse(logsSalvos);
                    if (logsParsed.admin && logsParsed.clientes) logsAuditoria = logsParsed;
                } catch(err) { console.error(err); }
            }
            renderizarTabelaAdmin();
            
            setTimeout(() => {
                const s2fa = localStorage.getItem('medius_2fa_secret_admin');
                const lbl = document.getElementById('status-2fa-label');
                if (lbl && s2fa) {
                    lbl.innerHTML = `<span class="text-emerald-400 font-bold">ATIVO (Protegido por TOTP)</span>`;
                }
            }, 500);
        });

        function gerarAtivar2FAAdmin() {
            let secret = localStorage.getItem('medius_2fa_secret_admin');
            if (!secret) {
                secret = gerarChaveSecreta32();
                localStorage.setItem('medius_2fa_secret_admin', secret);
            }
            const txtSec = document.getElementById('txt-secreta-2fa');
            if(txtSec) txtSec.innerText = secret;
            const containerQr = document.getElementById('container-qr-2fa');
            if(containerQr) containerQr.classList.remove('hidden');
            const statusLbl = document.getElementById('status-2fa-label');
            if(statusLbl) statusLbl.innerHTML = `<span class="text-emerald-400 font-bold">ATIVO (Protegido por TOTP)</span>`;
            alert("Semente 2FA gerada com sucesso! Copie o código exibido e adicione ao seu aplicativo (Google Authenticator ou Authy).");
        }

        // ==========================================
        // REGRAS DE ACESSO CORPORATIVO (RBAC) E COMPLIANCE
        // ==========================================
        function aplicarRegrasRBAC(role) {
            // Reset de segurança: Exibe tudo primeiro antes de podar
            document.querySelectorAll('#sidebar-admin .menu-item').forEach(el => el.style.display = 'flex');
            const labelEl = document.getElementById('label-empresa-ativa');
            if(labelEl) labelEl.innerHTML = `Operando sob <span class="text-white font-semibold">Credencial: ${role}</span>`;

            // Restaura a visibilidade do Card Forense dentro da Sala de Inspeção
            const cardForenseInt = document.getElementById('card-caixa-forense-sala');
            if (cardForenseInt) cardForenseInt.style.display = 'block';

            // REGRA C.O. (Forensic Admin): Acesso Absoluto
            if (role === 'ADMIN_MASTER' || role === 'FORENSIC_ADMIN') return;

            // Restrição imediata: Módulo Auditoria Master e o Card Forense de Inspeção ficam bloqueados
            const btnAuditoria = document.getElementById('btn-adm-auditoria-root');
            if(btnAuditoria) btnAuditoria.style.display = 'none';
            if (cardForenseInt) cardForenseInt.style.display = 'none';

            // REGRA: Administrativo / Financeiro (FINANCE)
            if (role === 'FINANCE') {
                if (document.getElementById('btn-adm-visao-geral')) document.getElementById('btn-adm-visao-geral').style.display = 'none';
                if (document.getElementById('btn-adm-malha-clientes')) document.getElementById('btn-adm-malha-clientes').style.display = 'none';
                if (document.getElementById('btn-adm-gestao-nos')) document.getElementById('btn-adm-gestao-nos').style.display = 'none';
                if (document.getElementById('btn-adm-sessoes')) document.getElementById('btn-adm-sessoes').style.display = 'none';
                if (document.getElementById('btn-adm-camaleao')) document.getElementById('btn-adm-camaleao').style.display = 'none';
                if (document.getElementById('btn-adm-telemetria')) document.getElementById('btn-adm-telemetria').style.display = 'none';
            } 
            // REGRA: Técnico de Monitoramento (MONITOR_TECH)
            else if (role === 'MONITOR_TECH') {
                if (document.getElementById('btn-adm-operadores')) document.getElementById('btn-adm-operadores').style.display = 'none';
                if (document.getElementById('btn-adm-financeiro')) document.getElementById('btn-adm-financeiro').style.display = 'none';
                if (document.getElementById('btn-adm-whitelabel')) document.getElementById('btn-adm-whitelabel').style.display = 'none';
                if (document.getElementById('btn-adm-camaleao')) document.getElementById('btn-adm-camaleao').style.display = 'none';
            } 
            // REGRA: Suporte Convidado (SUPPORT_GUEST)
            else if (role === 'SUPPORT_GUEST') {
                if (document.getElementById('btn-adm-operadores')) document.getElementById('btn-adm-operadores').style.display = 'none';
                if (document.getElementById('btn-adm-financeiro')) document.getElementById('btn-adm-financeiro').style.display = 'none';
                if (document.getElementById('btn-adm-whitelabel')) document.getElementById('btn-adm-whitelabel').style.display = 'none';
                if (document.getElementById('btn-adm-camaleao')) document.getElementById('btn-adm-camaleao').style.display = 'none';
                if (document.getElementById('btn-adm-visao-geral')) document.getElementById('btn-adm-visao-geral').style.display = 'none';
            }
        }

        function mudarSecaoAdmin(secao) {
            document.querySelectorAll('#sidebar-admin .menu-item').forEach(el => el.classList.remove('ativo'));
            const btn = document.getElementById('btn-adm-' + secao);
            if (btn) btn.classList.add('ativo');

            document.querySelectorAll('#painel-admin .dash-module').forEach(el => el.classList.add('hidden'));

            if (secao === 'visao-geral') {
                document.getElementById('mod-visao-geral').classList.remove('hidden');
            } else if (secao === 'malha-clientes') {
                document.getElementById('mod-malha-clientes').classList.remove('hidden');
                renderizarTabelaAdmin(); 
            } else if (secao === 'sessoes') {
                document.getElementById('mod-sessoes').classList.remove('hidden');
                renderizarSessoesAtivas();
            } else if (secao === 'gestao-nos') {
                document.getElementById('mod-gestao-nos').classList.remove('hidden');
            } else if (secao === 'whitelabel') {
                document.getElementById('mod-whitelabel').classList.remove('hidden');
            } else if (secao === 'telemetria') {
                document.getElementById('mod-telemetria').classList.remove('hidden');
            } else if (secao === 'operadores') {
                document.getElementById('mod-operadores').classList.remove('hidden');
                renderizarTabelaOperadores();
            } else if (secao === 'financeiro') {
                document.getElementById('mod-financeiro').classList.remove('hidden');
            } else if (secao === 'auditoria-root') {
                const just = prompt("⚠️ ÁREA RESTRITA DE ALTA SENSIBILIDADE.\n\nInforme a justificativa de Compliance (Ex: Ordem Judicial / Solicitação do Cliente / Averiguação de Rescisão):");
                if (!just || just.trim() === "") {
                    alert("Acesso Negado: A justificativa de Compliance é obrigatória para acessar os registros forenses.");
                    return mudarSecaoAdmin('visao-geral');
                }
                dispararAlertaSecOps("COMPLIANCE / ACESSO FORENSE", `Cofre Forense aberto. Justificativa registrada: ${just}`);
                
                document.getElementById('mod-auditoria-root').classList.remove('hidden');
                renderizarAuditoriaQGMaster();
            }
        }

        function mudarSecaoCliente(secao) {
            document.querySelectorAll('#sidebar-cliente .menu-item').forEach(el => el.classList.remove('ativo'));
            const btnMap = {
                'visao-geral': 'btn-cli-visao',
                'dominios': 'btn-cli-dominios',
                'equipe': 'btn-cli-equipe',
                'auditoria': 'btn-cli-auditoria',
                'forense': 'btn-cli-forense',
                'contrato': 'btn-cli-contrato',
                'suporte': 'btn-cli-suporte'
            };
            const btn = document.getElementById(btnMap[secao]);
            if (btn) btn.classList.add('ativo');

            document.querySelectorAll('#painel-cliente .client-module').forEach(el => el.classList.add('hidden'));

            const tabsBar = document.getElementById('client-tabs-bar');
            if (secao === 'visao-geral') {
                if(tabsBar) tabsBar.classList.remove('hidden');
                document.getElementById('cli-sec-visao').classList.remove('hidden');
            } else {
                if(tabsBar) tabsBar.classList.add('hidden');
                if (secao === 'dominios') document.getElementById('cli-sec-dominios').classList.remove('hidden');
                if (secao === 'equipe') {
                    document.getElementById('cli-sec-equipe').classList.remove('hidden');
                    renderizarEquipeCliente();
                }
                if (secao === 'auditoria') {
                    document.getElementById('cli-sec-auditoria').classList.remove('hidden');
                    renderizarTelemetriaCliente(); // NOVO: Gatilho de nuvem SecOps
                }
                if (secao === 'forense') {
                    document.getElementById('cli-sec-forense').classList.remove('hidden');
                    renderizarAuditoriaCliente();
                }
                if (secao === 'contrato') document.getElementById('cli-sec-contrato').classList.remove('hidden');
                if (secao === 'suporte') document.getElementById('cli-sec-suporte').classList.remove('hidden');
            }
        }

        async function renderizarTelemetriaCliente() {
            const container = document.getElementById('client-audit-logs');
            if (!container) return;

            container.innerHTML = '<div class="text-center text-cyan-400 p-4 font-mono text-xs animate-pulse">Consultando Cofre SecOps na Nuvem...</div>';

            try {
                // Lê apenas os dados que pertencem ao cliente logado
                const { data: logs, error } = await supabaseClient
                    .from('telemetry_logs')
                    .select('*')
                    .eq('client_id', clienteLogadoKey)
                    .order('created_at', { ascending: false })
                    .limit(30);

                if (error) throw error;

                if (!logs || logs.length === 0) {
                    container.innerHTML = '<div class="text-center text-emerald-400 p-4 font-bold border border-emerald-500/30 bg-emerald-500/10 rounded">Nenhum evento de segurança registrado. Blindagem ativa.</div>';
                    return;
                }

                container.innerHTML = logs.map(log => {
                    const tipo = log.tipo_evento || 'LOG';
                    const corTema = tipo.includes('CRITICAL') || tipo.includes('ERROR') || tipo.includes('VIOLACAO') ? 'red' : (tipo.includes('WARN') ? 'amber' : 'emerald');
                    
                    let msg = "";
                    try {
                        const det = typeof log.detalhes === 'string' ? JSON.parse(log.detalhes) : log.detalhes;
                        msg = det.mensagem || det.acao || det.host || JSON.stringify(det);
                    } catch(e) { msg = String(log.detalhes); }

                    const horaFormatada = new Date(log.created_at).toLocaleTimeString('pt-BR');

                    return `
                        <div class="border-l-2 border-${corTema}-500 pl-3 py-1.5 mb-2 bg-${corTema}-500/5 rounded-r">
                            <span class="text-${corTema}-400 font-bold">[${horaFormatada}]</span> <span class="text-white">${tipo}:</span> <span class="text-slate-300">${msg}</span>
                        </div>
                    `;
                }).join('');
            } catch (err) {
                console.error("[SECOPS] Erro ao carregar auditoria do cliente:", err);
                container.innerHTML = '<div class="text-center text-red-500 p-4 font-mono text-xs border border-red-500/30 bg-red-500/10 rounded">Erro de conexão com o Cofre SecOps.</div>';
            }
        }

        // ==========================================
        // GESTÃO DE EQUIPE DO CLIENTE (C.O. LOCAL)
        // ==========================================
        window.cadastrarOperadorCliente = function(e) {
            e.preventDefault();
            const c = databaseClientes[clienteLogadoKey];
            if (!c) return;

            const idEl = document.getElementById('op-cli-id');
            const siteEl = document.getElementById('op-cli-site');
            const valEl = document.getElementById('op-cli-validade');

            if(!idEl || !siteEl || !valEl) return;

            const id = idEl.value.trim();
            const site = siteEl.value;
            const validadeStr = valEl.value;
            const validadeObj = new Date(validadeStr);

            if (!c.equipe) c.equipe = [];
            c.equipe.unshift({
                id: id,
                dominioAcesso: site,
                validade: validadeObj.toLocaleString('pt-BR'),
                emissao: new Date().toLocaleString('pt-BR')
            });

            localStorage.setItem('medius_database_clientes', JSON.stringify(databaseClientes));
            e.target.reset();
            renderizarEquipeCliente();
            alert(`Acesso emitido para ${id}. Acesso restrito apenas ao domínio [${site}] até ${validadeObj.toLocaleString('pt-BR')}.`);
        };

        window.renderizarEquipeCliente = function() {
            const tbody = document.getElementById('tabela-operadores-cliente');
            const selectSites = document.getElementById('op-cli-site');
            if (!tbody || !selectSites) return;

            const c = databaseClientes[clienteLogadoKey];
            if (!c) return;

            selectSites.innerHTML = c.sites.map(s => `<option value="${s.dominio}">${s.dominio}</option>`).join('');

            const equipe = c.equipe || [];
            if (equipe.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500 font-mono text-xs">Nenhum operador com acesso emitido no contrato.</td></tr>';
                return;
            }

            tbody.innerHTML = equipe.map((op, idx) => `
                <tr class="hover:bg-slate-800/40">
                    <td class="py-2 text-white font-bold">${op.id}<br><span class="text-[9px] text-slate-500">Emitido: ${op.emissao}</span></td>
                    <td class="py-2 text-cyan-400 text-xs">${op.dominioAcesso}</td>
                    <td class="py-2 text-amber-400 text-xs">${op.validade}</td>
                    <td class="py-2 text-right"><button onclick="revogarOperadorCliente(${idx})" class="text-red-400 hover:text-white bg-red-500/10 px-2 py-1 rounded border border-red-500/30 transition text-[10px]">Revogar Acesso</button></td>
                </tr>
            `).join('');
        };

        window.revogarOperadorCliente = function(idx) {
            if (confirm("Alerta de Segurança: Revogar permanentemente a credencial deste operador?")) {
                const c = databaseClientes[clienteLogadoKey];
                c.equipe.splice(idx, 1);
                localStorage.setItem('medius_database_clientes', JSON.stringify(databaseClientes));
                renderizarEquipeCliente();
            }
        };
        // ==========================================
        // PARTE 5: MOTORES DE LOGIN BLINDADOS (ANTI-TRAVAMENTO)
        // ==========================================
       window.autenticarComo = function(tipo, clientId = null) {
        // CORREÇÃO C.O.R.E: Aponta para o ID correto do HTML (portal-login)
        const telaLogin = document.getElementById('portal-login');
        if (telaLogin) telaLogin.classList.add('hidden');
        
        // C.O.R.E: Captura o indicador com segurança
        const indicador = document.getElementById('indicador-conexao');
        
        if (tipo === 'admin') {
            perfilLogado = 'admin';
            document.getElementById('painel-admin').classList.remove('hidden');
            
            // Só tenta injetar o texto se a tag existir no HTML
            if (indicador) indicador.innerHTML = '<span class="text-red-500 font-bold uppercase tracking-widest"><i data-lucide="shield-alert" class="w-4 h-4 inline mr-1"></i> Root / QG Master</span>';
            
            mudarSecaoAdmin('visao-geral');
            if (typeof renderizarFinanceiroAdmin === 'function') renderizarFinanceiroAdmin();
       } else if (tipo === 'cliente') {
            perfilLogado = 'cliente';
            clienteLogadoKey = clientId || 'estudio-marcelao-01';
            document.getElementById('painel-cliente').classList.remove('hidden');
            
            if (indicador) indicador.innerHTML = `<span class="text-cyan-400 font-bold uppercase tracking-widest"><i data-lucide="server" class="w-4 h-4 inline mr-1"></i> Nó: #${clienteLogadoKey}</span>`;
            
            // RELIGANDO A MALHA: Injeta os dados da nuvem e mata os manequins
            if (typeof carregarConsoleDoCliente === 'undefined') {
                window.carregarConsoleDoCliente = function(id) {
                    const c = databaseClientes[id];
                    if (!c) return;

                    const nomeEl = document.getElementById('client-view-name');
                    const idEl = document.getElementById('client-view-id');
                    if (nomeEl) nomeEl.innerText = c.nome;
                    if (idEl) idEl.innerText = "#" + id;

                    const tbodyDominios = document.getElementById('client-domains-table-body');
                    if (tbodyDominios && c.sites) {
                        tbodyDominios.innerHTML = c.sites.map(s => `
                            <tr class="hover:bg-slate-800/40 border-b border-slate-800/50">
                                <td class="py-3 text-cyan-400 font-bold">${s.dominio}</td>
                                <td class="py-3 text-slate-400">${s.tipo}</td>
                                <td class="py-3 text-emerald-400 font-mono text-[10px] uppercase flex items-center gap-1 mt-1"><i data-lucide="shield-check" class="w-3 h-3"></i> ${s.sha}</td>
                                <td class="py-3 text-emerald-500 font-bold text-xs uppercase tracking-widest">Ativo</td>
                            </tr>
                        `).join('');
                    }
                    if (c.sites && c.sites.length > 0) selecionarSiteCliente(0);
                };

                window.selecionarSiteCliente = function(idx) {
                    const c = databaseClientes[clienteLogadoKey];
                    if (!c || !c.sites || !c.sites[idx]) return;
                    const site = c.sites[idx];

                    const titleEl = document.getElementById('client-active-domain-title');
                    const descEl = document.getElementById('client-active-domain-desc');
                    const pingEl = document.getElementById('client-active-ping');
                    const uptimeEl = document.getElementById('client-card-uptime');
                    const reqEl = document.getElementById('client-card-req');

                    if (titleEl) titleEl.innerText = site.dominio;
                    if (descEl) descEl.innerText = site.tipo;
                    if (pingEl) pingEl.innerText = site.ping;
                    if (uptimeEl) uptimeEl.innerText = site.uptime;
                    if (reqEl) reqEl.innerText = site.requisicoesHoje;

                    renderizarGraficosCliente();
                };

                window.renderizarGraficosCliente = function() {
                    if (chartTrafegoCliente) { chartTrafegoCliente.destroy(); chartTrafegoCliente = null; }
                    if (chartCoesaoCliente) { chartCoesaoCliente.destroy(); chartCoesaoCliente = null; }

                    const elTrafego = document.querySelector("#chart-trafego-cliente");
                    const elCoesao = document.querySelector("#chart-coesao-cliente");

                    if (elTrafego) {
                        chartTrafegoCliente = new ApexCharts(elTrafego, {
                            series: [{ name: 'Tráfego', data: seriesClienteData }],
                            chart: { type: 'area', height: 240, toolbar: { show: false }, background: 'transparent' },
                            colors: ['#3b82f6'],
                            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
                            dataLabels: { enabled: false },
                            stroke: { curve: 'smooth', width: 2 },
                            xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
                            yaxis: { labels: { style: { colors: '#64748b' } } },
                            grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
                            theme: { mode: 'dark' }
                        });
                        chartTrafegoCliente.render();
                    }

                    if (elCoesao) {
                        chartCoesaoCliente = new ApexCharts(elCoesao, {
                            series: [100],
                            chart: { type: 'radialBar', height: 220, background: 'transparent' },
                            plotOptions: { radialBar: { hollow: { size: '65%' }, dataLabels: { value: { color: '#10b981', fontSize: '20px', fontWeight: 'bold', formatter: val => val + "%" } } } },
                            labels: ['Integridade'], colors: ['#10b981'], theme: { mode: 'dark' }
                        });
                        chartCoesaoCliente.render();
                    }
                };
            }
            
            carregarConsoleDoCliente(clienteLogadoKey);
            mudarSecaoCliente('visao-geral');
        }
        if (window.lucide) window.lucide.createIcons();
    };
        window.iniciarLoginRapido = async function(e, tipo, clientId = null) {
            e.preventDefault();
            const btnLogin = e.currentTarget;
            const textoOriginal = btnLogin.innerHTML;
            btnLogin.innerHTML = `<i data-lucide="scan-face" class="w-4 h-4 animate-pulse"></i> Biometria...`;
            btnLogin.disabled = true;
            if (window.lucide) window.lucide.createIcons();

            try {
                const snapshot = await capturarForense();
                const identificador = tipo === 'admin' ? 'admin' : (clientId || 'estudio-marcelao-01');
                const tipoAcessoStr = tipo === 'admin' ? 'QG Master' : 'Nó Cliente';
                
                await registrarLogAcesso(identificador, tipoAcessoStr, snapshot);
                autenticarComo(tipo, clientId);
            } catch (err) {
                console.error("[SECOPS ERRO] Falha no Login Rápido:", err);
                alert("Falha de autenticação SecOps: O sistema não conseguiu validar a sessão.");
            } finally {
                // A MÁGICA QUE DESTRAVA O BOTÃO MESMO SE DER ERRO
                btnLogin.innerHTML = textoOriginal;
                btnLogin.disabled = false;
                if (window.lucide) window.lucide.createIcons();
            }
        };

        window.realizarLoginManual = async function(e) {
    e.preventDefault();
    const btnLogin = e.target.querySelector('button[type="submit"]');
    const textoOriginal = btnLogin.innerHTML;
    btnLogin.innerHTML = `<i data-lucide="scan-face" class="w-4 h-4 animate-pulse"></i> Biometria...`;
    btnLogin.disabled = true;
    if (window.lucide) window.lucide.createIcons();

    try {
        const inputUser = document.getElementById('login-user');
        const inputPass = document.getElementById('login-pass');
        
        const idMestre = inputUser ? inputUser.value.trim().toLowerCase().replace(/\s+/g, '-') : '';
        const senhaMestre = inputPass ? inputPass.value.trim() : '';

        if (!idMestre) {
            throw new Error("O campo Identificador está vazio.");
        }

        const { data: clienteEncontrado, error: errBusca } = await supabaseClient
            .from('genesis_clients')
            .select('*')
            .eq('id', idMestre)
            .single();

        if (errBusca || !clienteEncontrado) {
            throw new Error("Nó não encontrado na malha oficial Gênesis.");
        }

        if (clienteEncontrado.senha_acesso !== senhaMestre && clienteEncontrado.chave_sha256 !== senhaMestre) {
            throw new Error("Chave de acesso inválida para este nó.");
        }

        try {
            await registrarLogAcesso(idMestre, (idMestre === 'admin' || idMestre === 'root') ? 'QG Master' : 'Nó Cliente', null);
        } catch (e) { 
            console.warn("Log SecOps ignorado."); 
        }

        if (idMestre === 'admin' || idMestre === 'root') {
            autenticarComo('admin');
        } else {
            autenticarComo('cliente', idMestre);
        }

    } catch (err) {
        console.error("[SECOPS ERRO] Falha no Login via Supabase Gênesis:", err);
        alert("Falha de credencial: " + err.message);
    } finally {
        btnLogin.innerHTML = textoOriginal;
        btnLogin.disabled = false;
        if (window.lucide) window.lucide.createIcons();
    }
};
        
        window.realizarLogout = function() {
            if (confirm("Encerrar conexão e sanitizar rastros locais?")) {
                perfilLogado = null;
                clienteLogadoKey = null;
                document.getElementById('painel-admin').classList.add('hidden');
                document.getElementById('painel-cliente').classList.add('hidden');
                document.getElementById('portal-login').classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons();
            }
        };
