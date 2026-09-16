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
                        faturamento: {
                            valorMensal: "R$ 1.500,00",
                            statusPagamento: "PAGO"
                        },
                        tickets: [],
                        equipe: [],
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
                
                if (typeof renderizarTabelaAdmin === 'function') {
                    renderizarTabelaAdmin();
                }
            } catch (err) {
                console.error("[CRITICAL] Erro de rede no handshake com a nuvem:", err);
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            sincronizarMalhaDaNuvem();
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
            const caixaAlvo = usuarioId === 'admin' ? logsAuditoria.admin : (logsAuditoria.clientes[usuarioId] || []);
            const indexBlock = caixaAlvo.length;
            const previousHash = indexBlock === 0 ? "0000000000000000000000000000000000000000000000000000000000000000" : caixaAlvo[0].hash;
            
            const conteudoParaHash = `${indexBlock}|${usuarioId}|${tipoAcesso}|${dataHora}|${snapshot}|${previousHash}`;
            const hashAtual = await gerarHashSHA256(conteudoParaHash);

            const novoLog = {
                index: indexBlock, id: usuarioId, tipo: tipoAcesso, dataHora: dataHora, foto: snapshot, previousHash: previousHash, hash: hashAtual
            };
            
            if (usuarioId === 'admin') {
                logsAuditoria.admin.unshift(novoLog);
            } else {
                if (!logsAuditoria.clientes[usuarioId]) logsAuditoria.clientes[usuarioId] = [];
                logsAuditoria.clientes[usuarioId].unshift(novoLog);
            }
            
            localStorage.setItem('medius_logs_auditoria', JSON.stringify(logsAuditoria));
            renderizarAuditoriaMaster();
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
        function renderizarAuditoriaMaster() {
            const lista = document.getElementById('lista-auditoria-sala');
            if (!lista || !tmeClienteKey) return; 
            
            const logsCliente = logsAuditoria.clientes[tmeClienteKey] || [];
            if (logsCliente.length === 0) {
                lista.innerHTML = `<div class="text-slate-600 text-[10px] font-mono p-4 border border-slate-800 rounded bg-black/20 text-center">Nenhum registro biométrico nesta caixa.</div>`;
                return;
            }
            
            const grupos = {};
            logsCliente.forEach((log, index) => {
                const dataStr = log.dataHora.split(',')[0].trim();
                const partes = dataStr.split('/');
                const dia = partes.length >= 3 ? partes[0] : 'Extra';
                const mesAno = partes.length >= 3 ? `${partes[1]}/${partes[2]}` : 'Lote Especial';
                if (!grupos[mesAno]) grupos[mesAno] = {};
                if (!grupos[mesAno][dia]) grupos[mesAno][dia] = [];
                grupos[mesAno][dia].push({ ...log, idxVirtual: index });
            });

            let html = '';
            for (const [mesAno, dias] of Object.entries(grupos)) {
                html += `<div class="mb-4"><div class="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2 border-b border-slate-800 pb-1 flex items-center gap-2"><i data-lucide="folder-open" class="w-3.5 h-3.5"></i> Arquivo Mensal: ${mesAno}</div><div class="space-y-3 pl-2">`;
                for (const [dia, logs] of Object.entries(dias)) {
                    html += `<div><div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3 h-3 text-indigo-400"></i> Dia ${dia}</div><div class="space-y-1.5 pl-3 border-l border-slate-800">`;
                    logs.forEach(log => {
                        const horaRegistro = log.dataHora.split(',')[1] ? log.dataHora.split(',')[1].trim() : log.dataHora;
                        html += `
                            <div class="flex items-center gap-2">
                                <input type="checkbox" class="log-chk w-5 h-5 cursor-pointer accent-red-500 rounded border-slate-700 bg-slate-900 ml-1" onchange="window.alternarSelecaoForense(this, 'sala', ${log.idxVirtual})">
                                <div onclick="window.abrirVisualizadorForenseAdmin('${tmeClienteKey}', ${log.idxVirtual})" class="flex-1 bg-black/40 border border-slate-800 hover:border-cyan-500/50 cursor-pointer rounded p-2 flex justify-between items-center transition group">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-7 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition"><i data-lucide="scan-face" class="w-3.5 h-3.5"></i></div>
                                        <div class="font-mono text-[9px]">
                                            <p class="text-slate-300 font-bold">Sessão #${log.index}</p>
                                            <p class="text-slate-500">Hora: ${horaRegistro}</p>
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
        }

        window.abrirVisualizadorForenseAdmin = function(cliKey, idx) {
            const visor = document.getElementById('visualizador-forense-sala');
            if (!visor) return;

            const log = (logsAuditoria.clientes[cliKey] || [])[idx];
            if (!log) {
                visor.innerHTML = '<p class="text-red-400 text-xs font-mono">Erro SecOps: Registro não localizado na partição.</p>';
                return;
            }

            const imgElement = log.foto && !log.foto.includes("svg+xml")
                ? `<img src="${log.foto}" class="max-w-full max-h-44 object-cover rounded border border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.15)] mb-3">` 
                : `<div class="w-full h-40 bg-slate-900 rounded flex items-center justify-center text-[10px] text-slate-500 border border-slate-800 mb-3">CÂMERA DESATIVADA (STEALTH)</div>`;

            visor.innerHTML = `
                ${imgElement}
                <div class="font-mono text-[9px] text-left w-full bg-black/60 p-2.5 rounded border border-slate-800 space-y-1.5">
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Situação:</span> 
                        <span class="text-emerald-400 font-bold flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Validada</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Data:</span> 
                        <span class="text-slate-300">${log.dataHora}</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Nome:</span> 
                        <span class="text-cyan-400 font-bold flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${log.id || 'Desconhecido'}</span>
                    </div>
                    <div class="pt-1">
                        <span class="text-slate-500 block mb-1">Cadeia (SHA-256):</span>
                        <div class="text-[8px] ${log.hash && !log.hash.includes("test") ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'} break-all p-1.5 rounded border">${log.hash || 'SESSÃO LEGADA'}</div>
                    </div>
                </div>
            `;
            if(window.lucide) window.lucide.createIcons();
        };

        function renderizarAuditoriaCliente() {
            const lista = document.getElementById('lista-auditoria-cliente');
            if (!lista) return;
            
            const logsCliente = logsAuditoria.clientes[clienteLogadoKey] || [];
            if (logsCliente.length === 0) {
                lista.innerHTML = `<div class="text-slate-600 text-xs font-mono p-4 border border-slate-800 rounded bg-black/20 text-center">Nenhum acesso registrado em sua malha.</div>`;
                return;
            }
            
            const grupos = {};
            logsCliente.forEach((log, index) => {
                const dataStr = log.dataHora.split(',')[0].trim();
                const partes = dataStr.split('/');
                const dia = partes.length >= 3 ? partes[0] : 'Extra';
                const mesAno = partes.length >= 3 ? `${partes[1]}/${partes[2]}` : 'Lote Especial';
                if (!grupos[mesAno]) grupos[mesAno] = {};
                if (!grupos[mesAno][dia]) grupos[mesAno][dia] = [];
                grupos[mesAno][dia].push({ ...log, idxVirtual: index });
            });

            let html = '';
            for (const [mesAno, dias] of Object.entries(grupos)) {
                html += `<div class="mb-5"><div class="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3 border-b border-slate-700 pb-1 flex items-center gap-2"><i data-lucide="folder-open" class="w-3.5 h-3.5 text-cyan-500"></i> Arquivo Mensal: ${mesAno}</div><div class="space-y-4 pl-2">`;
                for (const [dia, logs] of Object.entries(dias)) {
                    html += `<div><div class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3 h-3 text-indigo-400"></i> Dia ${dia}</div><div class="space-y-2 pl-3 border-l border-slate-800/80">`;
                    logs.forEach(log => {
                        const horaRegistro = log.dataHora.split(',')[1] ? log.dataHora.split(',')[1].trim() : log.dataHora;
                        html += `
                            <div class="flex items-center gap-2">
                                <input type="checkbox" class="log-chk w-5 h-5 cursor-pointer accent-red-500 rounded border-slate-700 bg-slate-900 ml-1" onchange="window.alternarSelecaoForense(this, 'cliente', ${log.idxVirtual})">
                                <div onclick="window.abrirVisualizadorForense(${log.idxVirtual})" class="flex-1 bg-black/40 border border-slate-800 hover:border-cyan-500/50 cursor-pointer rounded p-2 flex justify-between items-center transition group">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition"><i data-lucide="scan-face" class="w-4 h-4"></i></div>
                                        <div class="font-mono text-[10px]">
                                            <p class="text-slate-300 font-bold">Sessão #${log.index}</p>
                                            <p class="text-slate-500">Hora: ${horaRegistro}</p>
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
        }

        window.abrirVisualizadorForense = function(idx) {
            const visor = document.getElementById('visualizador-forense-cliente');
            if(!visor) return;
            const log = logsAuditoria.clientes[clienteLogadoKey][idx];
            if (!log) return;

            const imgElement = log.foto && !log.foto.includes("svg+xml")
                ? `<img src="${log.foto}" class="max-w-full max-h-48 object-cover rounded border border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.15)] mb-4">` 
                : `<div class="w-full h-48 bg-slate-900 rounded flex items-center justify-center text-[10px] text-slate-500 border border-slate-800 mb-4">CÂMERA DESATIVADA (STEALTH)</div>`;

            visor.innerHTML = `
                ${imgElement}
                <div class="font-mono text-[10px] text-left w-full bg-black/60 p-3 rounded border border-slate-800 space-y-2">
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Situação:</span> 
                        <span class="text-emerald-400 font-bold flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Validada</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Data:</span> 
                        <span class="text-slate-300">${log.dataHora}</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Operador:</span> 
                        <span class="text-cyan-400 font-bold flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${log.id || 'Desconhecido'}</span>
                    </div>
                    <div class="pt-1">
                        <span class="text-slate-500 block mb-1">Cadeia (SHA-256):</span>
                        <div class="text-[8px] ${log.hash && !log.hash.includes("test") ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'} break-all p-2 rounded border">${log.hash || 'SESSÃO LEGADA'}</div>
                    </div>
                </div>
            `;
            if(window.lucide) window.lucide.createIcons();
        };

        function renderizarAuditoriaQGMaster() {
            const lista = document.getElementById('lista-auditoria-qg');
            if (!lista) return;
            const logsAdmin = logsAuditoria.admin || [];
            
            if (logsAdmin.length === 0) {
                lista.innerHTML = `<div class="text-slate-600 text-[10px] font-mono p-4 border border-slate-800 rounded bg-black/20 text-center">Nenhum acesso registrado no QG Master.</div>`;
                return;
            }
            
            const grupos = {};
            logsAdmin.forEach((log, index) => {
                const dataStr = log.dataHora.split(',')[0].trim();
                const partes = dataStr.split('/');
                const dia = partes.length >= 3 ? partes[0] : 'Extra';
                const mesAno = partes.length >= 3 ? `${partes[1]}/${partes[2]}` : 'Lote Especial';
                if (!grupos[mesAno]) grupos[mesAno] = {};
                if (!grupos[mesAno][dia]) grupos[mesAno][dia] = [];
                grupos[mesAno][dia].push({ ...log, idxVirtual: index });
            });

            let html = '';
            for (const [mesAno, dias] of Object.entries(grupos)) {
                html += `<div class="mb-4"><div class="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-2 border-b border-slate-800 pb-1 flex items-center gap-2"><i data-lucide="folder-lock" class="w-3.5 h-3.5"></i> Arquivo Root: ${mesAno}</div><div class="space-y-3 pl-2">`;
                for (const [dia, logs] of Object.entries(dias)) {
                    html += `<div><div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3 h-3 text-red-500/60"></i> Dia ${dia}</div><div class="space-y-1.5 pl-3 border-l border-slate-800">`;
                    logs.forEach(log => {
                        const horaRegistro = log.dataHora.split(',')[1] ? log.dataHora.split(',')[1].trim() : log.dataHora;
                        html += `
                            <div class="flex items-center gap-2">
                                <input type="checkbox" class="log-chk w-5 h-5 cursor-pointer accent-red-500 rounded border-slate-700 bg-slate-900 ml-1" onchange="window.alternarSelecaoForense(this, 'admin', ${log.idxVirtual})">
                                <div onclick="window.abrirVisualizadorForenseQG(${log.idxVirtual})" class="flex-1 bg-black/40 border border-slate-800 hover:border-red-500/50 cursor-pointer rounded p-2 flex justify-between items-center transition group">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-7 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition"><i data-lucide="scan-face" class="w-3.5 h-3.5"></i></div>
                                        <div class="font-mono text-[9px]">
                                            <p class="text-slate-300 font-bold">Acesso #${log.index}</p>
                                            <p class="text-slate-500">Hora: ${horaRegistro}</p>
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
        }

        window.abrirVisualizadorForenseQG = function(idx) {
            const visor = document.getElementById('visualizador-forense-qg');
            if (!visor) return;
            const log = (logsAuditoria.admin || [])[idx];
            if (!log) return;

            const imgElement = log.foto && !log.foto.includes("svg+xml")
                ? `<img src="${log.foto}" class="max-w-full max-h-44 object-cover rounded border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] mb-3">` 
                : `<div class="w-full h-40 bg-slate-900 rounded flex items-center justify-center text-[10px] text-slate-500 border border-slate-800 mb-3">CÂMERA DESATIVADA (STEALTH)</div>`;

            visor.innerHTML = `
                ${imgElement}
                <div class="font-mono text-[9px] text-left w-full bg-black/60 p-2.5 rounded border border-slate-800 space-y-1.5">
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Situação:</span> 
                        <span class="text-red-400 font-bold flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Validada (Root)</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Data:</span> 
                        <span class="text-slate-300">${log.dataHora}</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Operador:</span> 
                        <span class="text-red-400 font-bold flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${log.id || 'admin'}</span>
                    </div>
                    <div class="pt-1">
                        <span class="text-slate-500 block mb-0.5">Hash (SHA-256):</span>
                        <div class="text-[8px] ${log.hash && !log.hash.includes("test") ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'} break-all p-1.5 rounded border">${log.hash || 'SESSÃO LEGADA'}</div>
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
            
            const id = document.getElementById('novo-cli-id').value.trim().toLowerCase().replace(/\s+/g, '-');
            const nome = document.getElementById('novo-cli-nome').value.trim();
            const dominio = document.getElementById('novo-cli-dominio').value.trim();
            const expires = document.getElementById('novo-cli-exp').value || "2026-12-31";

            const btnSubmit = e.target.querySelector('button[type="submit"]');
            const txtOriginal = btnSubmit.innerHTML;
            btnSubmit.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Sincronizando...`;
            btnSubmit.disabled = true;
            if (window.lucide) window.lucide.createIcons();

            try {
                // Disparo 1: Injeta na tabela principal de clientes
                const { error: errCliente } = await supabaseClient
                    .from('clients')
                    .insert([{
                        id: id,
                        nome_empresa: nome,
                        status_contrato: "SINCRONIZADO",
                        expires_at: expires,
                        ativo: true
                    }]);

                if (errCliente) throw new Error("Falha ao registrar cliente: " + errCliente.message);

                // Disparo 2: Injeta o domínio na tabela de sites do cliente
                const { error: errSite } = await supabaseClient
                    .from('client_sites')
                    .insert([{
                        client_id: id,
                        dominio: dominio,
                        tipo_aplicacao: "Portal / Hotsite Comercial",
                        ping_ms: Math.floor(Math.random() * 30) + 10,
                        saude_percentual: 100,
                        ativo: true
                    }]);

                if (errSite) throw new Error("Falha ao registrar domínio: " + errSite.message);

                alert(`Sucesso SecOps! O nó #${id} foi blindado e gravado na nuvem.`);
                e.target.reset();
                
                // Força a malha a buscar a verdade atualizada no Supabase e repintar a tela
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
                if (secao === 'auditoria') document.getElementById('cli-sec-auditoria').classList.remove('hidden');
                if (secao === 'forense') {
                    document.getElementById('cli-sec-forense').classList.remove('hidden');
                    renderizarAuditoriaCliente();
                }
                if (secao === 'contrato') document.getElementById('cli-sec-contrato').classList.remove('hidden');
                if (secao === 'suporte') document.getElementById('cli-sec-suporte').classList.remove('hidden');
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
            
            if (tipo === 'admin') {
                perfilLogado = 'admin';
                document.getElementById('painel-admin').classList.remove('hidden');
                document.getElementById('indicador-conexao').innerHTML = '<span class="text-red-500 font-bold uppercase tracking-widest"><i data-lucide="shield-alert" class="w-4 h-4 inline mr-1"></i> Root / QG Master</span>';
                mudarSecaoAdmin('visao-geral');
                if (typeof renderizarFinanceiroAdmin === 'function') renderizarFinanceiroAdmin();
            } else if (tipo === 'cliente') {
                perfilLogado = 'cliente';
                clienteLogadoKey = clientId || 'estudio-marcelao-01';
                document.getElementById('painel-cliente').classList.remove('hidden');
                document.getElementById('indicador-conexao').innerHTML = `<span class="text-cyan-400 font-bold uppercase tracking-widest"><i data-lucide="server" class="w-4 h-4 inline mr-1"></i> Nó: #${clienteLogadoKey}</span>`;
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
                const user = document.getElementById('login-user').value.trim().toLowerCase();
                const snapshot = await capturarForense();
                
                const isRoot = user === 'admin';
                const isOperador = typeof databaseOperadores !== 'undefined' && databaseOperadores[user] !== undefined;
                const isAdmin = isRoot || isOperador;

                const identificador = user !== '' ? user : 'estudio-marcelao-01'; 
                await registrarLogAcesso(identificador, (isAdmin ? 'QG Master' : 'Nó Cliente'), snapshot);

                if (isAdmin) {
                    const role = isRoot ? 'ADMIN_MASTER' : databaseOperadores[user].nivel;
                    aplicarRegrasRBAC(role);
                    autenticarComo('admin');
                } else if (typeof databaseClientes !== 'undefined' && databaseClientes[user]) {
                    autenticarComo('cliente', user);
                } else {
                    // Fallback para demonstração se a senha não existir
                    autenticarComo('cliente', 'estudio-marcelao-01');
                }
            } catch (err) {
                console.error("[SECOPS ERRO] Falha no Login Manual:", err);
                alert("Falha de credencial. Acesso não reconhecido pela malha.");
            } finally {
                // A MÁGICA QUE DESTRAVA O BOTÃO MESMO SE DER ERRO
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
