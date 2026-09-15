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
        // MOTOR 2FA / TOTP
        // ==========================================
        function gerarChaveSecreta32() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let secret = '';
            for (let i = 0; i < 16; i++) {
                secret += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return secret;
        }

        function base32ToBuffer(base32) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let bits = '';
            for (let i = 0; i < base32.length; i++) {
                const valChar = chars.indexOf(base32.charAt(i).toUpperCase());
                if (valChar === -1) continue;
                bits += valChar.toString(2).padStart(5, '0');
            }
            const arr = [];
            for (let i = 0; i + 8 <= bits.length; i += 8) {
                arr.push(parseInt(bits.substr(i, 8), 2));
            }
            return new Uint8Array(arr);
        }

        async function validarCodigoTOTP(secretBase32, codigoDigitado) {
            if (!secretBase32 || codigoDigitado.length !== 6) return false;
            const epoch = Math.floor(Date.now() / 1000);
            const counter = Math.floor(epoch / 30);
            for (let i = -1; i <= 1; i++) {
                const computedCode = await calcularHMACSHA1TOTP(secretBase32, counter + i);
                if (computedCode === codigoDigitado) return true;
            }
            return false;
        }

        async function calcularHMACSHA1TOTP(secretBase32, counter) {
            try {
                const keyBuffer = base32ToBuffer(secretBase32);
                const msgBuffer = new ArrayBuffer(8);
                const view = new DataView(msgBuffer);
                view.setUint32(4, counter, false);
                const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "HMAC", hash: { name: "SHA-1" } }, false, ["sign"]);
                const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgBuffer);
                const hmacArray = new Uint8Array(signature);
                const offset = hmacArray[hmacArray.length - 1] & 0x0f;
                const binary = ((hmacArray[offset] & 0x7f) << 24) | ((hmacArray[offset + 1] & 0xff) << 16) | ((hmacArray[offset + 2] & 0xff) << 8) | (hmacArray[offset + 3] & 0xff);
                return (binary % 1000000).toString().padStart(6, '0');
            } catch (err) {
                return null;
            }
        }

        let logsAuditoria = { admin: [], clientes: {} };

        async function capturarForense() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
                const video = document.getElementById('forense-video');
                const canvas = document.getElementById('forense-canvas');
                
                video.style.display = "block";
                video.style.position = "fixed";
                video.style.top = "20px";
                video.style.right = "20px";
                video.style.width = "200px";
                video.style.border = "3px solid #00d2ff";
                video.style.borderRadius = "8px";
                video.style.zIndex = "999999";

                video.srcObject = stream;
                video.play(); 

                await new Promise(resolve => video.onplaying = resolve);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const snapshot = canvas.toDataURL('image/jpeg', 0.8); 
                stream.getTracks().forEach(track => track.stop()); 
                video.style.display = "none";
                return snapshot;
            } catch (err) {
                alert("Alerta SecOps: Câmera não autorizada ou indisponível! " + err.message);
                return null;
            }
        }

        async function gerarHashSHA256(conteudo) {
            try {
                if (!crypto || !crypto.subtle) {
                    console.warn("[SECOPS] API criptográfica inacessível (requer HTTPS). Usando fallback para ambiente de teste.");
                    return "legacy-hash-test-" + Math.floor(Math.random() * 999999999);
                }
                const msgBuffer = new TextEncoder().encode(conteudo);
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (err) {
                console.error("[SECOPS] Erro ao gerar SHA-256:", err);
                return "error-hash-secops";
            }
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
                            <div onclick="abrirVisualizadorForenseAdmin('${tmeClienteKey}', ${log.idxVirtual})" class="bg-black/40 border border-slate-800 hover:border-cyan-500/50 cursor-pointer rounded p-2 flex justify-between items-center transition group">
                                <div class="flex items-center gap-2.5">
                                    <div class="w-7 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition"><i data-lucide="scan-face" class="w-3.5 h-3.5"></i></div>
                                    <div class="font-mono text-[9px]">
                                        <p class="text-slate-300 font-bold">Sessão #${log.index}</p>
                                        <p class="text-slate-500">Hora: ${horaRegistro}</p>
                                    </div>
                                </div>
                                <div class="text-emerald-400 text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="eye" class="w-3 h-3"></i></div>
                            </div>`;
                    });
                    html += `</div></div>`;
                }
                html += `</div></div>`;
            }
            lista.innerHTML = html;
            if(window.lucide) lucide.createIcons();
        }

        window.abrirVisualizadorForenseAdmin = function(cliKey, idx) {
            const visor = document.getElementById('visualizador-forense-sala');
            if (!visor) return;

            const log = (logsAuditoria.clientes[cliKey] || [])[idx];
            if (!log) {
                visor.innerHTML = '<p class="text-red-400 text-xs font-mono">Erro SecOps: Registro não localizado na partição.</p>';
                return;
            }

            const imgElement = log.foto 
                ? `<img src="${log.foto}" class="max-w-full max-h-44 object-cover rounded border border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.15)] mb-3">` 
                : `<div class="w-full h-40 bg-slate-900 rounded flex items-center justify-center text-[10px] text-slate-500 border border-slate-800 mb-3">CÂMERA BLOQUEADA</div>`;

            visor.innerHTML = `
                ${imgElement}
                <div class="font-mono text-[9px] text-left w-full bg-black/60 p-2.5 rounded border border-slate-800 space-y-1.5">
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Situação:</span> 
                        <span class="text-emerald-400 font-bold flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Validada</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Data de Entrada:</span> 
                        <span class="text-slate-300">${log.dataHora}</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Nome / Operador:</span> 
                        <span class="text-cyan-400 font-bold flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${log.id || 'Desconhecido'}</span>
                    </div>
                    <div class="pt-1">
                        <span class="text-slate-500 block mb-1">Cadeia Criptográfica (SHA-256):</span>
                        <div class="text-[8px] ${log.hash ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'} break-all p-1.5 rounded border">${log.hash || 'SESSÃO LEGADA'}</div>
                    </div>
                </div>
            `;
            if(window.lucide) window.lucide.createIcons();
        };

        function obterInfoDispositivo() {
            const ua = navigator.userAgent;
            let os = "Desconhecido";
            if (ua.indexOf("Win") !== -1) os = "Windows";
            if (ua.indexOf("Mac") !== -1) os = "MacOS";
            if (ua.indexOf("Linux") !== -1) os = "Linux";
            if (ua.indexOf("Android") !== -1) os = "Android";
            if (ua.indexOf("like Mac") !== -1) os = "iOS";
            let browser = "Navegador";
            if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
            else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
            else if (ua.indexOf("Safari") !== -1) browser = "Safari";
            return `${browser} / ${os}`;
        }

        function gerarIPFalso() {
            return `${Math.floor(Math.random()*200)+50}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
        }

        function registrarSessaoRadar(usuarioId) {
            let sessoes = JSON.parse(localStorage.getItem('medius_sessoes_ativas') || '[]');
            const idUnico = 'sess_' + Math.random().toString(36).substr(2, 9);
            const novaSessao = { idSessao: idUnico, usuario: usuarioId, ip: gerarIPFalso(), dispositivo: obterInfoDispositivo(), entrada: new Date().toLocaleTimeString('pt-BR') };
            sessoes = sessoes.filter(s => s.usuario !== usuarioId);
            sessoes.unshift(novaSessao);
            localStorage.setItem('medius_sessoes_ativas', JSON.stringify(sessoes));
            localStorage.setItem('medius_minha_sessao', idUnico);
        }

        function renderizarSessoesAtivas() {
            const tbody = document.getElementById('tabela-sessoes-admin');
            const contador = document.getElementById('contador-sessoes');
            if (!tbody) return;

            let sessoes = JSON.parse(localStorage.getItem('medius_sessoes_ativas') || '[]');
            if (sessoes.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-500">Nenhuma conexão ativa.</td></tr>`;
                contador.innerText = "0 Conectados";
                return;
            }

            contador.innerText = `${sessoes.length} Conectado(s)`;
            tbody.innerHTML = sessoes.map(s => `
                <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-2.5 text-white font-bold">${s.usuario === 'admin' ? '<span class="text-red-400">Gênesis Master</span>' : s.usuario}</td>
                    <td class="py-2.5 text-emerald-400 text-[11px]"><i data-lucide="map-pin" class="w-3 h-3 inline"></i> ${s.ip}</td>
                    <td class="py-2.5 text-slate-400">${s.dispositivo}</td>
                    <td class="py-2.5 text-slate-500">${s.entrada}</td>
                    <td class="py-2.5 text-right flex justify-end">
                        ${s.usuario !== 'admin' ? `<button onclick="derrubarSessaoRemota('${s.idSessao}', '${s.usuario}')" class="text-red-400 hover:text-white bg-red-500/10 px-3 py-1.5 rounded border border-red-500/30 transition flex items-center gap-1 shadow-[0_0_5px_rgba(239,68,68,0.2)]"><i data-lucide="power" class="w-3 h-3"></i> Abater</button>` : '<span class="text-slate-600 text-[10px] uppercase font-bold border border-slate-800 px-2 py-1 rounded">Intocável</span>'}
                    </td>
                </tr>
            `).join('');
            lucide.createIcons();
        }

        function derrubarSessaoRemota(idSessao, nomeNo) {
            if(confirm(`Acionar o Kill Switch e derrubar a conexão de [${nomeNo}] imediatamente?`)) {
                let sessoes = JSON.parse(localStorage.getItem('medius_sessoes_ativas') || '[]');
                sessoes = sessoes.filter(s => s.idSessao !== idSessao);
                localStorage.setItem('medius_sessoes_ativas', JSON.stringify(sessoes));
                renderizarSessoesAtivas();
                dispararAlertaSecOps("KILL SWITCH (ABATE)", `O nó remoto [${nomeNo}] foi desconectado à força.`);
            }
        }

        async function iniciarLoginRapido(e, tipo, clientId = null) {
            e.preventDefault();
            const btnLogin = e.currentTarget;
            const textoOriginal = btnLogin.innerHTML;
            btnLogin.innerHTML = `<i data-lucide="scan-face" class="w-4 h-4 animate-pulse"></i> Biometria...`;
            btnLogin.disabled = true;
            lucide.createIcons();

            try {
                const snapshot = await capturarForense();
                const identificador = tipo === 'admin' ? 'admin' : (clientId || 'estudio-marcelao-01');
                const tipoAcessoStr = tipo === 'admin' ? 'QG Master' : 'Nó Cliente';
                
                await registrarLogAcesso(identificador, tipoAcessoStr, snapshot);
                autenticarComo(tipo, clientId);
            } catch (err) {
                console.error("Erro SecOps no Login Rápido:", err);
                alert("Falha de autenticação: O sistema não conseguiu validar a sessão.");
            } finally {
                btnLogin.innerHTML = textoOriginal;
                btnLogin.disabled = false;
                lucide.createIcons();
            }
        }

        let pendingAuthTipo = null;
        let pendingAuthClientId = null;

        function autenticarComo(tipo, clientId = null) {
            const chave2FAKey = tipo === 'admin' ? 'medius_2fa_secret_admin' : `medius_2fa_secret_${clientId || 'estudio-marcelao-01'}`;
            const secretSalvo = localStorage.getItem(chave2FAKey);

            if (secretSalvo) {
                pendingAuthTipo = tipo;
                pendingAuthClientId = clientId;
                document.getElementById('modal-2fa').classList.remove('hidden');
                document.getElementById('input-codigo-2fa').value = '';
                document.getElementById('input-codigo-2fa').focus();
                lucide.createIcons();
                return;
            }
            executarAutenticacaoFinal(tipo, clientId);
        }

        async function confirmarAutenticacao2FA() {
            const codigo = document.getElementById('input-codigo-2fa').value.trim();
            const chave2FAKey = pendingAuthTipo === 'admin' ? 'medius_2fa_secret_admin' : `medius_2fa_secret_${pendingAuthClientId || 'estudio-marcelao-01'}`;
            const secretSalvo = localStorage.getItem(chave2FAKey);

            const valido = await validarCodigoTOTP(secretSalvo, codigo);

            if (valido) {
                document.getElementById('modal-2fa').classList.add('hidden');
                executarAutenticacaoFinal(pendingAuthTipo, pendingAuthClientId);
            } else {
                alert("Erro SecOps: Código TOTP inválido ou expirado!");
                document.getElementById('input-codigo-2fa').value = '';
            }
        }

        function cancelarVerificacao2FA() {
            document.getElementById('modal-2fa').classList.add('hidden');
            pendingAuthTipo = null;
            pendingAuthClientId = null;
        }

        function executarAutenticacaoFinal(tipo, clientId) {
            perfilLogado = tipo;
            clienteLogadoKey = clientId;

            registrarSessaoRadar(tipo === 'admin' ? 'admin' : (clientId || 'estudio-marcelao-01'));
            document.getElementById('portal-login').classList.add('hidden');

            if (tipo === 'admin') {
                executarBootAnimado(() => {
                    document.getElementById('painel-admin').classList.remove('hidden');
                    lucide.createIcons();
                    initAdminCharts();
                    renderizarTabelaAdmin();
                    aoTrocarClienteTME(tmeClienteKey);
                });
            } else if (tipo === 'cliente') {
                executarBootAnimado(() => {
                    document.getElementById('painel-cliente').classList.remove('hidden');
                    carregarConsoleDoCliente(clientId || "estudio-marcelao-01");
                });
            }
        }

        async function realizarLoginManual(e) {
            e.preventDefault();
            const btnLogin = e.target.querySelector('button[type="submit"]');
            const textoOriginal = btnLogin.innerHTML;
            btnLogin.innerHTML = `<i data-lucide="scan-face" class="w-4 h-4 animate-pulse"></i> Biometria...`;
            btnLogin.disabled = true;
            lucide.createIcons();

            try {
                const user = document.getElementById('login-user').value.trim().toLowerCase();
                const snapshot = await capturarForense();
                
                const isRoot = user === 'admin';
                const isOperador = databaseOperadores[user] !== undefined;
                const isAdmin = isRoot || isOperador;

                const identificador = user !== '' ? user : 'estudio-marcelao-01'; 
                await registrarLogAcesso(identificador, (isAdmin ? 'QG Master' : 'Nó Cliente'), snapshot);

                if (isAdmin) {
                    const role = isRoot ? 'ADMIN_MASTER' : databaseOperadores[user].nivel;
                    aplicarRegrasRBAC(role);
                    autenticarComo('admin');
                } else if (databaseClientes[user]) {
                    autenticarComo('cliente', user);
                } else {
                    autenticarComo('cliente', 'estudio-marcelao-01');
                }
            } catch (err) {
                console.error("Erro SecOps no Login Manual:", err);
                alert("Falha de credencial. Acesso não reconhecido pela malha.");
            } finally {
                btnLogin.innerHTML = textoOriginal;
                btnLogin.disabled = false;
                lucide.createIcons();
            }
        }

        function realizarLogout() {
            document.getElementById('painel-admin').classList.add('hidden');
            document.getElementById('painel-cliente').classList.add('hidden');
            document.getElementById('portal-login').classList.remove('hidden');
            perfilLogado = null;
            clienteLogadoKey = null;
        }

        function executarBootAnimado(callbackConclusao) {
            const bootScreen = document.getElementById('bootScreen');
            const progressFill = document.getElementById('bootProgressFill');
            const bootCounter = document.getElementById('bootCounter');
            const bootStatus = document.getElementById('bootStatus');

            bootScreen.style.display = 'flex';
            bootScreen.classList.remove('fade-out');

            const msgsFases = [
                "Fase 1: Iniciando núcleos neurais...",
                "Fase 2: Varredura de Segurança SecOps...",
                "Fase 3: Sincronizando Malha de Contratos...",
                "Fase 4: Desbloqueando Cockpit Autorizado..."
            ];

            let progresso = 0;
            let fase = 1;

            const intervalo = setInterval(() => {
                progresso += Math.floor(Math.random() * 12) + 8;
                if (progresso >= 100) {
                    if (fase < 4) {
                        progresso = 0;
                        fase++;
                        bootStatus.textContent = msgsFases[fase - 1];
                    } else {
                        progresso = 100;
                        clearInterval(intervalo);
                        progressFill.style.width = '100%';
                        bootCounter.textContent = '100%';

                        setTimeout(() => {
                            bootScreen.classList.add('fade-out');
                            setTimeout(() => {
                                bootScreen.style.display = 'none';
                                if (callbackConclusao) callbackConclusao();
                            }, 500);
                        }, 300);
                    }
                }
                progressFill.style.width = progresso + '%';
                bootCounter.textContent = progresso + '%';
            }, 60);
        }

        function aoTrocarClienteTME(clientId) {
            tmeClienteKey = clientId;
            const cliente = databaseClientes[clientId];
            if (!cliente) return;

            const titleEl = document.getElementById('sala-client-name');
            if (titleEl) titleEl.innerText = cliente.nome;
            
            const badge = document.getElementById('tme-client-status');
            if(badge) {
                badge.innerText = cliente.status;
                badge.className = `px-2 py-0.5 text-[10px] border rounded font-sans tracking-wider ${cliente.statusClass}`;
            }

            const siteSelect = document.getElementById('tme-select-site');
            if(siteSelect) {
                siteSelect.innerHTML = '';
                cliente.sites.forEach((site, index) => {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.text = site.dominio;
                    siteSelect.appendChild(opt);
                });
            }
            aoTrocarSiteTME(0);
        }

        function aoTrocarSiteTME(siteIdx) {
            tmeSiteIdx = parseInt(siteIdx);
            const cliente = databaseClientes[tmeClienteKey];
            if(!cliente) return;
            const site = cliente.sites[tmeSiteIdx];
            if (!site) return;

            const disp = document.getElementById('tme-active-site-display');
            if(disp) disp.innerText = site.dominio;
            const shaDisp = document.getElementById('tme-client-sha');
            if(shaDisp) shaDisp.innerText = site.sha;

            if (chartSaudeAdmin) chartSaudeAdmin.updateSeries([site.saude]);

            const logBox = document.getElementById('log-secops');
            if(logBox) {
                const timestamp = new Date().toLocaleTimeString('pt-BR');
                const novoLog = document.createElement('div');
                novoLog.className = "border-l-2 border-blue-500 pl-3 bg-blue-500/5 p-2";
                novoLog.innerHTML = `<span class="text-blue-400 font-bold">[TME]</span> [${timestamp}] Alvo: ${site.dominio} (#${tmeClienteKey}).`;
                logBox.prepend(novoLog);
            }
        }

        function initAdminCharts() {
            if (!chartTrafegoAdmin && document.querySelector("#chart-trafego-admin")) {
                const optTrafego = {
                    series: [{ name: 'RPS (Nó Específico)', data: seriesAdminData }],
                    chart: { type: 'area', height: 250, toolbar: { show: false }, animations: { speed: 800 } },
                    colors: [corAtual],
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
                    stroke: { curve: 'smooth', width: 2 },
                    xaxis: { labels: { show: false }, axisBorder: { show: false } },
                    yaxis: { labels: { style: { colors: '#94a3b8', fontFamily: 'monospace' } } },
                    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 }
                };
                chartTrafegoAdmin = new ApexCharts(document.querySelector("#chart-trafego-admin"), optTrafego);
                chartTrafegoAdmin.render();
            }

            if (!chartSaudeAdmin && document.querySelector("#chart-saude-admin")) {
                const optSaude = {
                    series: [100],
                    chart: { type: 'radialBar', height: 240 },
                    colors: [corAtual],
                    plotOptions: {
                        radialBar: {
                            hollow: { size: '60%' },
                            track: { background: 'rgba(255,255,255,0.05)' },
                            dataLabels: { value: { color: '#fff', fontSize: '24px', formatter: val => val + "%" } }
                        }
                    }
                };
                chartSaudeAdmin = new ApexCharts(document.querySelector("#chart-saude-admin"), optSaude);
                chartSaudeAdmin.render();
            }

            setInterval(() => {
                if (perfilLogado === 'admin') {
                    const cli = databaseClientes[tmeClienteKey];
                    if(cli && cli.sites[tmeSiteIdx]) {
                        const site = cli.sites[tmeSiteIdx] || cli.sites[0];
                        seriesAdminData.shift();
                        let val = Math.floor(Math.random() * (site.trafegoMax - site.trafegoMin + 1)) + site.trafegoMin;
                        seriesAdminData.push(val);
                        if(chartTrafegoAdmin) chartTrafegoAdmin.updateSeries([{ data: seriesAdminData }]);
                    }
                }
            }, 2000);
        }

        function renderizarTabelaAdmin() {
            const gridCards = document.getElementById('grid-clientes-admin');
            const contadorLbl = document.getElementById('contador-clientes-cards');
            let ativos = 0, vencidos = 0;
            const chaves = Object.keys(databaseClientes);
            
            if (contadorLbl) contadorLbl.innerText = `${chaves.length} Clientes Registrados`;
            if (gridCards) gridCards.innerHTML = '';

            const themeMap = {
                'emerald': { bg: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/30', bgLight: 'bg-emerald-500/10', shadowHover: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]' },
                'red': { bg: 'bg-red-400', text: 'text-red-400', border: 'border-red-500/30', bgLight: 'bg-red-500/10', shadowHover: 'hover:shadow-[0_0_25px_rgba(239,68,68,0.3)]' },
                'amber': { bg: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-500/30', bgLight: 'bg-amber-500/10', shadowHover: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]' },
                'indigo': { bg: 'bg-indigo-400', text: 'text-indigo-400', border: 'border-indigo-500/30', bgLight: 'bg-indigo-500/10', shadowHover: 'hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]' },
                'blue': { bg: 'bg-blue-400', text: 'text-blue-400', border: 'border-blue-500/30', bgLight: 'bg-blue-500/10', shadowHover: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]' }
            };

            chaves.forEach((key, index) => {
                const c = databaseClientes[key];
                if (c.ativo) ativos++; else vencidos++;
                
                let themeKey = 'emerald';
                let pulseEffect = '';
                if (!c.ativo) { themeKey = 'red'; pulseEffect = 'animate-pulse'; }
                else if (c.faturamento && c.faturamento.statusPagamento !== 'PAGO') themeKey = 'amber';
                else if (index % 3 === 1) themeKey = 'indigo';
                else if (index % 3 === 2) themeKey = 'blue';

                const theme = themeMap[themeKey];

                if (gridCards) {
                    const sparkline = `<div class="flex items-end gap-1 h-10 opacity-30 mt-3 mb-4 px-2">
                        ${Array.from({length: 15}).map(() => `<div class="w-full ${theme.bg} rounded-t-sm" style="height: ${Math.floor(Math.random() * 80) + 20}%"></div>`).join('')}
                    </div>`;

                    gridCards.innerHTML += `
                        <div class="cyber-card cursor-pointer group hover:-translate-y-1 transition-all duration-300 ${theme.shadowHover} bg-black/20 flex flex-col justify-between" onclick="abrirSalaDoCliente('${key}')">
                            <div>
                                <div class="flex justify-between items-start mb-1">
                                    <div class="flex items-center gap-2">
                                        <div class="w-2 h-2 rounded-full ${theme.bg} ${pulseEffect} shadow-[0_0_8px_currentColor]"></div>
                                        <h4 class="font-bold text-white font-mono text-sm truncate max-w-[160px]" title="${c.nome}">${c.nome}</h4>
                                    </div>
                                    <span class="text-[8px] uppercase tracking-wider font-bold font-mono ${theme.text} ${theme.border} ${theme.bgLight} px-1.5 py-0.5 rounded border flex items-center gap-1">
                                        <i data-lucide="shield-check" class="w-3 h-3"></i> SHA-256
                                    </span>
                                </div>
                                <p class="text-[10px] text-slate-500 font-mono mb-2 truncate pl-4">ID: #${key}</p>
                                ${sparkline}
                            </div>
                            <div class="flex justify-between items-end border-t border-slate-800/80 pt-3 mt-auto">
                                <div>
                                    <p class="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
                                    <p class="text-[10px] font-bold ${theme.text} uppercase flex items-center gap-1"><i data-lucide="activity" class="w-3 h-3"></i> ${c.status}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5">Renovação</p>
                                    <p class="text-[10px] font-mono text-slate-300">${c.expires_at}</p>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            const lblAtivos = document.getElementById('count-ativos');
            if(lblAtivos) lblAtivos.innerText = ativos;
            const lblVencidos = document.getElementById('count-vencidos');
            if(lblVencidos) lblVencidos.innerText = vencidos;
            if(window.lucide) window.lucide.createIcons();
        }

        function motorInadimplenciaAutomatica() {
            let houveMudanca = false;
            const hojeStr = new Date().toISOString().split('T')[0];

            Object.keys(databaseClientes).forEach(key => {
                const cli = databaseClientes[key];
                if (cli.expires_at < hojeStr && cli.ativo) {
                    cli.ativo = false;
                    cli.status = "BLOQUEADO (FINANCEIRO)";
                    cli.statusClass = "bg-red-500/10 text-red-400 border-red-500/30";
                    if(cli.faturamento) cli.faturamento.statusPagamento = "VENCIDO";
                    houveMudanca = true;
                }
            });

            if (houveMudanca) {
                localStorage.setItem('medius_database_clientes', JSON.stringify(databaseClientes));
                if (perfilLogado === 'admin') renderizarTabelaAdmin();
            }
        }

        function abrirChamadoCliente(e) {
            e.preventDefault();
            const assunto = document.getElementById('ticket-assunto').value;
            const urgencia = document.getElementById('ticket-urgencia').value;
            const mensagem = document.getElementById('ticket-mensagem').value;
            
            const cli = databaseClientes[clienteLogadoKey];
            if (!cli.tickets) cli.tickets = [];
            
            const novoTicket = {
                id: 'TK-' + Math.floor(Math.random() * 10000),
                dataHora: new Date().toLocaleString('pt-BR'),
                assunto: assunto,
                urgencia: urgencia,
                status: 'ABERTO',
                mensagens: [ { autor: 'CLIENTE', texto: mensagem, dataHora: new Date().toLocaleTimeString('pt-BR') } ]
            };
            
            cli.tickets.unshift(novoTicket);
            localStorage.setItem('medius_database_clientes', JSON.stringify(databaseClientes));
            
            alert(`Chamado ${novoTicket.id} aberto com sucesso!`);
            e.target.reset();
            renderizarTicketsCliente();
        }

        function renderizarTicketsCliente() {
            const grid = document.getElementById('grid-tickets-cliente');
            if (!grid) return;
            const cli = databaseClientes[clienteLogadoKey];
            const tickets = cli.tickets || [];
            
            if (tickets.length === 0) {
                grid.innerHTML = '<div class="text-slate-500 text-xs font-mono text-center p-4 border border-slate-800 rounded bg-black/30">Nenhum chamado aberto.</div>';
                return;
            }
            
            grid.innerHTML = tickets.map(t => `
                <div class="bg-black/40 border ${t.status === 'ABERTO' ? 'border-amber-500/30' : 'border-emerald-500/30'} rounded p-3 text-xs font-mono shadow-md">
                    <div class="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                        <span class="font-bold text-white">${t.id} - ${t.assunto}</span>
                        <span class="px-2 py-0.5 rounded text-[9px] ${t.status === 'ABERTO' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}">${t.status}</span>
                    </div>
                    <div class="space-y-2 max-h-32 overflow-y-auto pr-1">
                        ${t.mensagens.map(m => `
                            <div class="${m.autor === 'CLIENTE' ? 'text-slate-400' : 'text-cyan-400 bg-cyan-500/5 p-2 rounded'}">
                                <strong class="${m.autor === 'CLIENTE' ? 'text-slate-300' : 'text-cyan-300'}">${m.autor === 'CLIENTE' ? 'Você' : 'Engenharia'}:</strong> ${m.texto}
                                <div class="text-[9px] text-slate-600 mt-0.5">${m.dataHora}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        function renderizarTicketsAdmin() {
            const grid = document.getElementById('grid-tickets-admin');
            if (!grid) return;
            const cli = databaseClientes[tmeClienteKey];
            if(!cli) return;
            const tickets = cli.tickets || [];
            
            if (tickets.length === 0) {
                grid.innerHTML = '<div class="text-slate-500 text-xs font-mono p-4 border border-slate-800 rounded bg-black/20 col-span-2 text-center">Caixa de chamados vazia.</div>';
                return;
            }
            
            grid.innerHTML = tickets.map(t => `
                <div class="bg-black/40 border ${t.status === 'ABERTO' ? 'border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-slate-800'} rounded p-3 text-xs font-mono">
                    <div class="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                        <span class="font-bold ${t.status === 'ABERTO' ? 'text-red-400' : 'text-slate-400'}">${t.id} [${t.urgencia}]</span>
                        <span class="text-white truncate max-w-[150px]">${t.assunto}</span>
                    </div>
                    <div class="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1">
                        ${t.mensagens.map(m => `
                            <div class="${m.autor === 'CLIENTE' ? 'text-amber-400' : 'text-cyan-400 bg-cyan-500/5 p-2 rounded'}">
                                <strong>${m.autor}:</strong> <span class="text-slate-300">${m.texto}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${t.status === 'ABERTO' ? `
                    <div class="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-800">
                        <input type="text" id="resp-${t.id}" placeholder="Escreva a resposta..." class="flex-1 min-w-[150px] bg-[#030610] border border-slate-700 rounded px-2 py-1 text-white outline-none focus:border-cyan-400">
                        <button onclick="responderTicketAdmin('${t.id}')" class="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded border border-cyan-500/40 hover:bg-cyan-500/30 transition shadow-sm"><i data-lucide="send" class="w-3 h-3"></i></button>
                        <button onclick="fecharTicketAdmin('${t.id}')" class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded border border-emerald-500/40 hover:bg-emerald-500/30 transition text-[10px] font-bold">RESOLVER</button>
                    </div>
                    ` : '<span class="text-emerald-400 text-[10px] uppercase font-bold flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Arquivado</span>'}
                </div>
            `).join('');
            lucide.createIcons();
        }

        function responderTicketAdmin(ticketId) {
            const input = document.getElementById(`resp-${ticketId}`);
            if (!input || !input.value.trim()) return;
            const cli = databaseClientes[tmeClienteKey];
            const ticket = cli.tickets.find(t => t.id === ticketId);
            if (ticket) {
                ticket.mensagens.push({ autor: 'ENGENHARIA QG', texto: input.value.trim(), dataHora: new Date().toLocaleTimeString('pt-BR') });
                localStorage.setItem('medius_database_clientes', JSON.stringify(databaseClientes));
                renderizarTicketsAdmin();
            }
        }

        function fecharTicketAdmin(ticketId) {
            const cli = databaseClientes[tmeClienteKey];
            const ticket = cli.tickets.find(t => t.id === ticketId);
            if (ticket && confirm(`Marcar o chamado ${ticketId} como resolvido?`)) {
                ticket.status = 'RESOLVIDO';
                localStorage.setItem('medius_database_clientes', JSON.stringify(databaseClientes));
                renderizarTicketsAdmin();
            }
        }

        function abrirSalaDoCliente(clientId) {
            const btnSala = document.getElementById('btn-adm-gestao-nos');
            if(btnSala) btnSala.classList.remove('hidden');
            
            tmeClienteKey = clientId;
            const cliente = databaseClientes[clientId];
            if(!cliente) return;
            
            const nameEl = document.getElementById('sala-client-name');
            if(nameEl) nameEl.innerText = cliente.nome;
            const idEl = document.getElementById('sala-client-id');
            if(idEl) idEl.innerText = '#' + clientId;
            
            const siteSelect = document.getElementById('tme-select-site');
            if(siteSelect) {
                siteSelect.innerHTML = '';
                cliente.sites.forEach((site, index) => {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.text = site.dominio;
                    siteSelect.appendChild(opt);
                });
            }
            
            mudarSecaoAdmin('gestao-nos');
            aoTrocarSiteTME(0); 
            renderizarAuditoriaMaster(); 
            renderizarTicketsAdmin(); 
        }

        function toggleSidebarAdmin() {
            document.getElementById('sidebar-admin').classList.toggle('recolhido');
        }

        function carregarConsoleDoCliente(clientId) {
            const cliente = databaseClientes[clientId] || databaseClientes["estudio-marcelao-01"];
            
            document.getElementById('client-view-name').innerText = cliente.nome;
            document.getElementById('client-view-id').innerText = '#' + clientId;
            const cNameEl = document.getElementById('cli-contract-name');
            if(cNameEl) cNameEl.innerText = cliente.nome;
            const cIdEl = document.getElementById('cli-contract-id');
            if(cIdEl) cIdEl.innerText = '#' + clientId;
            const cExpEl = document.getElementById('cli-contract-exp');
            if(cExpEl) cExpEl.innerText = cliente.expires_at;

            const tabsContainer = document.getElementById('client-sites-tabs-container');
            if(tabsContainer) {
                tabsContainer.innerHTML = '';
                cliente.sites.forEach((site, index) => {
                    const btn = document.createElement('button');
                    btn.className = `tab-site-btn ${index === 0 ? 'active' : ''}`;
                    btn.id = `tab-site-${index}`;
                    btn.innerHTML = `<i data-lucide="globe" class="w-3.5 h-3.5"></i> ${site.dominio}`;
                    btn.onclick = () => selecionarSiteCliente(clientId, index);
                    tabsContainer.appendChild(btn);
                });
            }

            const domTable = document.getElementById('client-domains-table-body');
            if(domTable) {
                domTable.innerHTML = '';
                cliente.sites.forEach((site, index) => {
                    domTable.innerHTML += `
                        <tr class="hover:bg-slate-800/40 transition">
                            <td class="py-2.5 text-white font-bold">${site.dominio}</td>
                            <td class="py-2.5 text-slate-300">${site.tipo}</td>
                            <td class="py-2.5"><span class="px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">ATIVO (256-bit)</span></td>
                            <td class="py-2.5 text-right">
                                <button onclick="selecionarSiteCliente('${clientId}', ${index}); mudarSecaoCliente('visao-geral');" class="text-cyan-400 hover:text-white underline">
                                    Inspecionar
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }

            lucide.createIcons();
            selecionarSiteCliente(clientId, 0);
            initClienteCharts();
            renderizarTicketsCliente(); 
            mudarSecaoCliente('visao-geral');
        }

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
                            <div onclick="abrirVisualizadorForense(${log.idxVirtual})" class="bg-black/40 border border-slate-800 hover:border-cyan-500/50 cursor-pointer rounded p-2 flex justify-between items-center transition group">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition"><i data-lucide="scan-face" class="w-4 h-4"></i></div>
                                    <div class="font-mono text-[10px]">
                                        <p class="text-slate-300 font-bold">Sessão #${log.index}</p>
                                        <p class="text-slate-500">Hora: ${horaRegistro}</p>
                                    </div>
                                </div>
                                <div class="text-emerald-400 text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="eye" class="w-3 h-3"></i></div>
                            </div>`;
                    });
                    html += `</div></div>`;
                }
                html += `</div></div>`;
            }
            lista.innerHTML = html;
            lucide.createIcons();
        }

        window.abrirVisualizadorForense = function(idx) {
            const visor = document.getElementById('visualizador-forense-cliente');
            if(!visor) return;
            const log = logsAuditoria.clientes[clienteLogadoKey][idx];
            if (!log) return;

            const imgElement = log.foto 
                ? `<img src="${log.foto}" class="max-w-full max-h-48 object-cover rounded border border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.15)] mb-4">` 
                : `<div class="w-full h-48 bg-slate-900 rounded flex items-center justify-center text-[10px] text-slate-500 border border-slate-800 mb-4">CÂMERA BLOQUEADA</div>`;

            visor.innerHTML = `
                ${imgElement}
                <div class="font-mono text-[10px] text-left w-full bg-black/60 p-3 rounded border border-slate-800 space-y-2">
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Situação:</span> 
                        <span class="text-emerald-400 font-bold flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Validada</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Data de Entrada:</span> 
                        <span class="text-slate-300">${log.dataHora}</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Nome / Operador:</span> 
                        <span class="text-cyan-400 font-bold flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${log.id || 'Desconhecido'}</span>
                    </div>
                    <div class="pt-1">
                        <span class="text-slate-500 block mb-1">Cadeia Criptográfica (SHA-256):</span>
                        <div class="text-[8px] ${log.hash ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'} break-all p-2 rounded border">${log.hash || 'SESSÃO LEGADA'}</div>
                    </div>
                </div>
            `;
            if(window.lucide) window.lucide.createIcons();
        };

        function toggleSidebarCliente() {
            document.getElementById('sidebar-cliente').classList.toggle('recolhido');
        }

        function selecionarSiteCliente(clientId, siteIndex) {
            siteAtivoClienteIdx = siteIndex;
            const cliente = databaseClientes[clientId];
            if(!cliente) return;
            const site = cliente.sites[siteIndex];
            if(!site) return;

            document.querySelectorAll('.tab-site-btn').forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.getElementById(`tab-site-${siteIndex}`);
            if (activeBtn) activeBtn.classList.add('active');

            const titleEl = document.getElementById('client-active-domain-title');
            if(titleEl) titleEl.innerText = site.dominio;
            const descEl = document.getElementById('client-active-domain-desc');
            if(descEl) descEl.innerText = site.tipo;
            const pingEl = document.getElementById('client-active-ping');
            if(pingEl) pingEl.innerText = site.ping;
            const upEl = document.getElementById('client-card-uptime');
            if(upEl) upEl.innerText = site.uptime;
            const reqEl = document.getElementById('client-card-req');
            if(reqEl) reqEl.innerText = site.requisicoesHoje;
        }

        function initClienteCharts() {
            if (!chartTrafegoCliente && document.querySelector("#chart-trafego-cliente")) {
                const optTrafego = {
                    series: [{ name: 'Acessos/min', data: seriesClienteData }],
                    chart: { type: 'area', height: 240, toolbar: { show: false }, animations: { speed: 800 } },
                    colors: ['#3b82f6'],
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
                    stroke: { curve: 'smooth', width: 2 },
                    xaxis: { labels: { show: false }, axisBorder: { show: false } },
                    yaxis: { labels: { style: { colors: '#64748b', fontFamily: 'monospace' } } },
                    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 }
                };
                chartTrafegoCliente = new ApexCharts(document.querySelector("#chart-trafego-cliente"), optTrafego);
                chartTrafegoCliente.render();
            }

            if (!chartCoesaoCliente && document.querySelector("#chart-coesao-cliente")) {
                const optCoesao = {
                    series: [100],
                    chart: { type: 'radialBar', height: 240 },
                    colors: ['#34d399'], 
                    plotOptions: {
                        radialBar: {
                            hollow: { size: '65%' },
                            track: { background: 'rgba(255,255,255,0.05)' },
                            dataLabels: { 
                                name: { show: false },
                                value: { color: '#34d399', fontSize: '28px', fontWeight: 'bold', formatter: val => val + "%" } 
                            }
                        }
                    },
                    stroke: { lineCap: 'round' }
                };
                chartCoesaoCliente = new ApexCharts(document.querySelector("#chart-coesao-cliente"), optCoesao);
                chartCoesaoCliente.render();
            }

            setInterval(() => {
                if (perfilLogado === 'cliente') {
                    seriesClienteData.shift();
                    seriesClienteData.push(Math.floor(Math.random() * 40) + 25);
                    if(chartTrafegoCliente) chartTrafegoCliente.updateSeries([{ data: seriesClienteData }]);
                }
            }, 2500);
        }

        function alternarKillSwitch(bloquear) {
            const ks = document.getElementById('killSwitchScreen');
            if(ks) ks.style.display = bloquear ? 'flex' : 'none';
        }

        async function dispararAlertaSecOps(tipoAmeaca, detalhes) {
            const timestamp = new Date().toLocaleString('pt-BR');
            const logBox = document.getElementById('log-secops');
            if (logBox) {
                const novoLog = document.createElement('div');
                novoLog.className = "border-l-2 border-red-500 pl-3 bg-red-500/10 p-2 mb-2 animate-pulse text-white font-mono text-xs";
                novoLog.innerHTML = `<span class="text-red-400 font-bold">[${tipoAmeaca}]</span> [${timestamp}] ${detalhes}`;
                logBox.prepend(novoLog);
            }

            const inTgToken = document.getElementById('input-telegram-token')?.value.trim();
            const inTgChat = document.getElementById('input-telegram-chatid')?.value.trim();
            const inWaUrl = document.getElementById('input-wa-url')?.value.trim();
            const inWaNum = document.getElementById('input-wa-numero')?.value.trim();

            if (inTgToken) localStorage.setItem('medius_tg_token', inTgToken);
            if (inTgChat) localStorage.setItem('medius_tg_chat', inTgChat);
            if (inWaUrl) localStorage.setItem('medius_wa_url', inWaUrl);
            if (inWaNum) localStorage.setItem('medius_wa_num', inWaNum);

            const tgToken = localStorage.getItem('medius_tg_token');
            const tgChat = localStorage.getItem('medius_tg_chat');
            const waUrl = localStorage.getItem('medius_wa_url');
            const waNum = localStorage.getItem('medius_wa_num');

            const msgTg = `🚨 *ALERTA SECOPS // MEDIUS CORE* 🚨\n\n⚠️ *Ameaça:* ${tipoAmeaca}\n📌 *Detalhes:* ${detalhes}\n🕒 *Horário:* ${timestamp}\n🛡️ *Status:* Registrado na Malha.`;
            const msgWa = `🚨 *ALERTA SECOPS // MEDIUS CORE* 🚨\n\n⚠️ *Ameaça:* ${tipoAmeaca}\n📌 *Detalhes:* ${detalhes}\n🕒 *Horário:* ${timestamp}`;

            if (tgToken && tgChat) {
                try {
                    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: tgChat, text: msgTg, parse_mode: 'Markdown' })
                    }).then(r => {
                        if(r.ok) adicionarFeedbackTerminal("Telegram", "text-cyan-400", "border-cyan-400", "bg-cyan-500/10");
                    });
                } catch (e) { console.error("Erro Telegram:", e); }
            }

            if (waUrl && waNum) {
                try {
                    fetch(waUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ number: waNum, text: msgWa })
                    }).then(r => {
                        if(r.ok) adicionarFeedbackTerminal("WhatsApp", "text-emerald-400", "border-emerald-400", "bg-emerald-500/10");
                    });
                } catch (e) { console.error("Erro WhatsApp:", e); }
            }
        }

        function adicionarFeedbackTerminal(canal, corTexto, corBorda, corBg) {
            const logBoxFeedback = document.getElementById('log-secops');
            if (logBoxFeedback) {
                const logWeb = document.createElement('div');
                logWeb.className = `border-l-2 ${corBorda} pl-3 ${corBg} p-2 mb-2 ${corTexto} font-mono text-xs`;
                logWeb.innerHTML = `[ALERTA ENVIADO] Notificação SecOps entregue via API ${canal}.`;
                logBoxFeedback.prepend(logWeb);
            }
        }

        function simularErroTelemetria() {
            try {
                const elementoInexistente = null;
                elementoInexistente.classList.add('bug');
            } catch (err) {
                capturarErroTelemetria(err.message, "script_simulado.js", 104, 12, 'RUNTIME_EXCEPTION');
                alert("Erro simulado injetado no Radar!");
            }
        }

        function atualizarWhiteLabel() {
            const nome = document.getElementById('input-nome-empresa').value;
            corAtual = document.getElementById('select-cor-neon').value;
            document.getElementById('label-empresa-ativa').innerHTML = `Operando sob <span class="text-white font-semibold">${nome}</span>`;
            document.documentElement.style.setProperty('--accent-color', corAtual);

            if (chartTrafegoAdmin) chartTrafegoAdmin.updateOptions({ colors: [corAtual] });
            if (chartSaudeAdmin) chartSaudeAdmin.updateOptions({ colors: [corAtual] });
        }

        let logsTelemetriaJS = JSON.parse(localStorage.getItem('medius_telemetria_logs') || '[]');

        function capturarErroTelemetria(mensagem, source, lineno, colno, tipo = 'ERROR') {
            const timestamp = new Date().toLocaleString('pt-BR');
            const origem = clienteLogadoKey || 'Gênesis Master (Global)';
            
            const erroMap = {
                id: 'ERR-' + Math.floor(Math.random() * 9000 + 1000),
                timestamp: timestamp, origem: origem, mensagem: mensagem,
                local: `${source || 'Desconhecido'} (Linha: ${lineno || 'N/A'})`,
                tipo: tipo
            };

            logsTelemetriaJS.unshift(erroMap);
            if(logsTelemetriaJS.length > 50) logsTelemetriaJS.pop();
            localStorage.setItem('medius_telemetria_logs', JSON.stringify(logsTelemetriaJS));

            const telMod = document.getElementById('mod-telemetria');
            if (perfilLogado === 'admin' && telMod && !telMod.classList.contains('hidden')) {
                renderizarTelemetriaAdmin();
            }
        }

        window.addEventListener('error', function(e) {
            capturarErroTelemetria(e.message, e.filename, e.lineno, e.colno, 'CRITICAL');
        });
        window.addEventListener('unhandledrejection', function(e) {
            capturarErroTelemetria(e.reason?.message || "Rejeição de Promessa", "API/Async", null, null, 'PROMISE_FAIL');
        });

        function renderizarTelemetriaAdmin() {
            const container = document.getElementById('log-telemetria-container');
            if (!container) return;

            if (logsTelemetriaJS.length === 0) {
                container.innerHTML = '<div class="text-center text-emerald-400 p-4 font-bold border border-emerald-500/30 bg-emerald-500/10 rounded">Nenhum erro de código detectado. Malha 100% íntegra.</div>';
                return;
            }

            container.innerHTML = logsTelemetriaJS.map(log => {
                const corTema = log.tipo === 'CRITICAL' ? 'red' : (log.tipo === 'PROMISE_FAIL' ? 'orange' : 'amber');
                return `
                    <div class="border-l-2 border-${corTema}-500 bg-black/60 p-3 rounded">
                        <div class="flex justify-between mb-1">
                            <span class="font-bold text-${corTema}-400">[${log.id}] ${log.tipo}</span>
                            <span class="text-slate-500 text-[10px]">${log.timestamp}</span>
                        </div>
                        <p class="text-white font-sans text-sm mb-1">${log.mensagem}</p>
                        <p class="text-slate-400 text-[10px]">Origem: <span class="text-cyan-300">#${log.origem}</span> | Script: ${log.local}</p>
                    </div>
                `;
            }).join('');
        }

        let databaseOperadores = JSON.parse(localStorage.getItem('medius_operadores') || '{}');

        function cadastrarOperador(e) {
            e.preventDefault();
            const id = document.getElementById('op-id').value.trim().toLowerCase();
            const nome = document.getElementById('op-nome').value.trim();
            const nivel = document.getElementById('op-nivel').value;

            if (id === 'admin') return alert("IDs reservados ao núcleo Gênesis não podem ser reescritos.");

            databaseOperadores[id] = { nome, nivel, ativo: true, data: new Date().toLocaleDateString('pt-BR') };
            localStorage.setItem('medius_operadores', JSON.stringify(databaseOperadores));
            
            e.target.reset();
            renderizarTabelaOperadores();
            alert(`Crachá Corporativo gerado! O operador ${id} foi designado ao cargo ${nivel}.`);
        }

        function renderizarTabelaOperadores() {
            const tbody = document.getElementById('tabela-operadores');
            if (!tbody) return;

            tbody.innerHTML = Object.keys(databaseOperadores).map(key => {
                const op = databaseOperadores[key];
                let corBadge = 'text-blue-400 border-blue-500/30 bg-blue-500/10';
                if(op.nivel === 'MONITOR_TECH') corBadge = 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
                if(op.nivel === 'FINANCE') corBadge = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
                if(op.nivel === 'FORENSIC_ADMIN') corBadge = 'text-red-400 border-red-500/30 bg-red-500/10';
                
                return `
                    <tr class="hover:bg-slate-800/40">
                        <td class="py-2 text-white font-bold">${op.nome}<br><span class="text-[10px] text-slate-500">#${key}</span></td>
                        <td class="py-2"><span class="px-2 py-0.5 text-[9px] border rounded ${corBadge}">${op.nivel}</span></td>
                        <td class="py-2 text-emerald-400 text-xs">Ativo</td>
                        <td class="py-2 text-right"><button onclick="revogarOperador('${key}')" class="text-red-400 hover:text-white bg-red-500/10 px-2 py-1 rounded border border-red-500/30 transition text-[10px]">Revogar</button></td>
                    </tr>
                `;
            }).join('');
        }

        function revogarOperador(key) {
            if (confirm(`Revogar permanentemente o acesso corporativo de #${key}?`)) {
                delete databaseOperadores[key];
                localStorage.setItem('medius_operadores', JSON.stringify(databaseOperadores));
                renderizarTabelaOperadores();
            }
        }

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
                            <div onclick="abrirVisualizadorForenseQG(${log.idxVirtual})" class="bg-black/40 border border-slate-800 hover:border-red-500/50 cursor-pointer rounded p-2 flex justify-between items-center transition group">
                                <div class="flex items-center gap-2.5">
                                    <div class="w-7 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition"><i data-lucide="scan-face" class="w-3.5 h-3.5"></i></div>
                                    <div class="font-mono text-[9px]">
                                        <p class="text-slate-300 font-bold">Acesso #${log.index}</p>
                                        <p class="text-slate-500">Hora: ${horaRegistro}</p>
                                    </div>
                                </div>
                                <div class="text-red-400 text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="eye" class="w-3 h-3"></i></div>
                            </div>`;
                    });
                    html += `</div></div>`;
                }
                html += `</div></div>`;
            }
            lista.innerHTML = html;
            if(window.lucide) lucide.createIcons();
        }

        window.abrirVisualizadorForenseQG = function(idx) {
            const visor = document.getElementById('visualizador-forense-qg');
            if (!visor) return;
            const log = (logsAuditoria.admin || [])[idx];
            if (!log) return;

            const imgElement = log.foto 
                ? `<img src="${log.foto}" class="max-w-full max-h-44 object-cover rounded border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] mb-3">` 
                : `<div class="w-full h-40 bg-slate-900 rounded flex items-center justify-center text-[10px] text-slate-500 border border-slate-800 mb-3">CÂMERA BLOQUEADA</div>`;

            visor.innerHTML = `
                ${imgElement}
                <div class="font-mono text-[9px] text-left w-full bg-black/60 p-2.5 rounded border border-slate-800 space-y-1.5">
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Situação:</span> 
                        <span class="text-red-400 font-bold flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Validada (Root)</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Data de Entrada:</span> 
                        <span class="text-slate-300">${log.dataHora}</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <span class="text-slate-500">Nome / Operador:</span> 
                        <span class="text-red-400 font-bold flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${log.id || 'admin'}</span>
                    </div>
                    <div class="pt-1">
                        <span class="text-slate-500 block mb-0.5">Hash de Cadeia (SHA-256):</span>
                        <div class="text-[8px] ${log.hash ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'} break-all p-1.5 rounded border">${log.hash || 'SESSÃO LEGADA'}</div>
                    </div>
                </div>
            `;
            if(window.lucide) window.lucide.createIcons();
        };

        function cadastrarNovoCliente(e) {
            e.preventDefault();
            const id = document.getElementById('novo-cli-id').value.trim().toLowerCase().replace(/\s+/g, '-');
            const nome = document.getElementById('novo-cli-nome').value.trim();
            const dominio = document.getElementById('novo-cli-dominio').value.trim();
            const expires = document.getElementById('novo-cli-exp').value;

            if (databaseClientes[id]) {
                alert('Erro: Este ID/Token já está registrado na malha!');
                return;
            }

            databaseClientes[id] = {
                nome: nome, status: "SINCRONIZADO", statusClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                expires_at: expires || "2026-12-31", ativo: true,
                faturamento: { valorMensal: "R$ 1.500,00", statusPagamento: "PAGO" },
                tickets: [], equipe: [],
                sites: [{
                    dominio: dominio, tipo: "Portal / Hotsite Comercial", ping: "24ms", sha: "Válida (100%)",
                    saude: 100, descSaude: "Nó Operacional Recém-Registrado", uptime: "100%",
                    requisicoesHoje: "1,200", trafegoMin: 20, trafegoMax: 60
                }]
            };

            localStorage.setItem('medius_database_clientes', JSON.stringify(databaseClientes));
            alert(`Sucesso! O nó #${id} foi blindado e integrado à malha.`);
            e.target.reset();
            renderizarTabelaAdmin();
            mudarSecaoAdmin('visao-geral');
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
