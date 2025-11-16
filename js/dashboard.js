/**
 * 📊 Dashboard do Usuário
 *
 * Este arquivo gerencia a página de dashboard (painel principal do usuário).
 */

let usuarioAtual = null;

/**
 * Inicializa o dashboard
 */
async function inicializarDashboard() {
    try {
        mostrarLoading(true);

        // Verificar autenticação
        usuarioAtual = await verificarAutenticacao(true);
        if (!usuarioAtual) return;

        // Carregar dados
        await Promise.all([
            carregarDadosUsuario(),
            carregarRanking(),
            carregarHistorico()
        ]);

    } catch (error) {
        console.error('Erro ao inicializar dashboard:', error);
        mostrarNotificacao('Erro ao carregar dashboard', 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Carrega dados do usuário
 */
async function carregarDadosUsuario() {
    try {
        // Exibir dados básicos
        const elemNomeTime = document.getElementById('user-team-name');
        const elemCartoletas = document.getElementById('user-cartoletas');
        const elemPontos = document.getElementById('user-points');

        if (elemNomeTime) elemNomeTime.textContent = usuarioAtual.nome_time || 'Meu Time';
        if (elemCartoletas) elemCartoletas.textContent = formatarCartoletas(usuarioAtual.cartoletas || 0);
        if (elemPontos) elemPontos.textContent = formatarPontos(usuarioAtual.pontos_totais || 0);

        // Buscar rodada atual
        const { data: rodadaAtual } = await supabase
            .from('rodadas')
            .select('*')
            .eq('status', 'em_andamento')
            .maybeSingle();

        const elemRodada = document.getElementById('user-rounds');
        if (elemRodada) {
            elemRodada.textContent = rodadaAtual ? `Rodada ${rodadaAtual.numero}` : 'Nenhuma rodada ativa';
        }

        // Calcular posição no ranking
        const { data: ranking } = await supabase
            .from('usuarios')
            .select('id, pontos_totais')
            .order('pontos_totais', { ascending: false });

        if (ranking) {
            const posicao = ranking.findIndex(u => u.id === usuarioAtual.id) + 1;
            const elemPosicao = document.getElementById('user-position');
            if (elemPosicao) {
                elemPosicao.textContent = posicao > 0 ? `${posicao}º` : '-';
            }
        }

    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

/**
 * Carrega ranking geral
 */
async function carregarRanking() {
    try {
        const { data: ranking, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('pontos_totais', { ascending: false })
            .limit(10);

        if (error) throw error;

        const tbody = document.getElementById('ranking-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!ranking || ranking.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-gray-500 dark:text-gray-400">
                        Nenhum usuário no ranking ainda
                    </td>
                </tr>
            `;
            return;
        }

        ranking.forEach((usuario, index) => {
            const posicao = index + 1;
            const isUsuarioAtual = usuario.id === usuarioAtual.id;

            const tr = document.createElement('tr');
            tr.className = isUsuarioAtual
                ? 'bg-blue-50 dark:bg-blue-900/20 font-bold'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700';

            // Medalhas para top 3
            let medalha = '';
            if (posicao === 1) medalha = '🥇';
            else if (posicao === 2) medalha = '🥈';
            else if (posicao === 3) medalha = '🥉';

            tr.innerHTML = `
                <td class="px-4 py-3 text-center">${medalha} ${posicao}º</td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                             style="background-color: ${gerarCor(usuario.nome_time)}">
                            ${usuario.nome_time.charAt(0).toUpperCase()}
                        </div>
                        ${usuario.nome_time}
                        ${isUsuarioAtual ? '<span class="text-xs text-blue-500">(Você)</span>' : ''}
                    </div>
                </td>
                <td class="px-4 py-3 text-center font-semibold">${formatarPontos(usuario.pontos_totais || 0)}</td>
                <td class="px-4 py-3 text-center">${formatarCartoletas(usuario.cartoletas || 0)}</td>
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
    }
}

/**
 * Carrega histórico de rodadas do usuário
 */
async function carregarHistorico() {
    try {
        // Buscar escalações do usuário com pontuação
        const { data: escalacoes, error } = await supabase
            .from('escalacoes')
            .select(`
                *,
                rodadas (numero, data_inicio, data_fim)
            `)
            .eq('usuario_id', usuarioAtual.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        const container = document.getElementById('historico-lista');
        if (!container) return;

        container.innerHTML = '';

        if (!escalacoes || escalacoes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>Nenhuma escalação registrada ainda</p>
                    <a href="mercado.html" class="text-blue-500 hover:underline mt-2 inline-block">
                        Fazer primeira escalação
                    </a>
                </div>
            `;
            return;
        }

        escalacoes.forEach(escalacao => {
            const div = document.createElement('div');
            div.className = 'bg-white dark:bg-gray-700 p-4 rounded-lg shadow hover:shadow-md transition';

            const rodada = escalacao.rodadas;
            const pontos = escalacao.pontos_rodada || 0;

            div.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-semibold text-gray-800 dark:text-white">
                        Rodada ${rodada?.numero || '-'}
                    </h4>
                    <span class="text-2xl font-bold ${pontos > 0 ? 'text-green-500' : 'text-gray-400'}">
                        ${formatarPontos(pontos)}
                    </span>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    <p>Data: ${rodada ? formatarData(rodada.data_inicio) : '-'}</p>
                    <p>Custo: ${formatarCartoletas(escalacao.custo_total || 0)}</p>
                </div>
            `;

            container.appendChild(div);
        });

    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

/**
 * Atualiza dados do dashboard
 */
async function atualizarDashboard() {
    try {
        mostrarLoading(true);
        await Promise.all([
            carregarDadosUsuario(),
            carregarRanking(),
            carregarHistorico()
        ]);
        mostrarNotificacao('Dashboard atualizado!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
        mostrarNotificacao('Erro ao atualizar dashboard', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarDashboard);
} else {
    inicializarDashboard();
}

// Exportar funções para uso global
window.atualizarDashboard = atualizarDashboard;
window.carregarDadosUsuario = carregarDadosUsuario;
window.carregarRanking = carregarRanking;
window.carregarHistorico = carregarHistorico;
