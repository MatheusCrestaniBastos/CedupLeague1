/**
 * 🏪 Mercado de Jogadores
 *
 * Este arquivo gerencia o mercado de jogadores e escalação do time.
 */

let usuarioAtual = null;
let jogadoresDisponiveis = [];
let escalacaoAtual = {
    goleiro: null,
    fixo: null,
    ala1: null,
    ala2: null,
    pivo: null
};
let rodadaAtual = null;

/**
 * Inicializa o mercado
 */
async function inicializarMercado() {
    try {
        mostrarLoading(true);

        // Verificar autenticação
        usuarioAtual = await verificarAutenticacao(true);
        if (!usuarioAtual) return;

        // Buscar rodada atual
        const { data: rodada } = await supabase
            .from('rodadas')
            .select('*')
            .eq('status', 'em_andamento')
            .maybeSingle();

        rodadaAtual = rodada;

        if (!rodadaAtual) {
            mostrarNotificacao('Nenhuma rodada ativa no momento', 'warning');
        }

        // Carregar dados
        await Promise.all([
            carregarJogadores(),
            carregarEscalacaoSalva(),
            atualizarSaldo()
        ]);

        // Configurar filtros e busca
        configurarFiltros();

    } catch (error) {
        console.error('Erro ao inicializar mercado:', error);
        mostrarNotificacao('Erro ao carregar mercado', 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Carrega lista de jogadores
 */
async function carregarJogadores() {
    try {
        const { data: jogadores, error } = await supabase
            .from('jogadores')
            .select(`
                *,
                times (nome, escudo)
            `)
            .eq('status', 'Disponível')
            .order('preco', { ascending: false });

        if (error) throw error;

        jogadoresDisponiveis = jogadores || [];
        renderizarJogadores(jogadoresDisponiveis);

    } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
        mostrarNotificacao('Erro ao carregar jogadores', 'error');
    }
}

/**
 * Renderiza lista de jogadores
 * @param {Array} jogadores - Lista de jogadores para renderizar
 */
function renderizarJogadores(jogadores) {
    const container = document.getElementById('lista-jogadores');
    if (!container) return;

    container.innerHTML = '';

    if (!jogadores || jogadores.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                Nenhum jogador encontrado
            </div>
        `;
        return;
    }

    jogadores.forEach(jogador => {
        const card = criarCardJogador(jogador);
        container.appendChild(card);
    });
}

/**
 * Cria card de jogador
 * @param {Object} jogador - Dados do jogador
 * @returns {HTMLElement} Card do jogador
 */
function criarCardJogador(jogador) {
    const div = document.createElement('div');
    div.className = 'bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition p-4';

    const jaEscalado = Object.values(escalacaoAtual).some(j => j && j.id === jogador.id);

    div.innerHTML = `
        <div class="flex items-start gap-3">
            <!-- Foto -->
            <div class="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                ${jogador.foto_url
                    ? `<img src="${jogador.foto_url}" alt="${jogador.nome}" class="w-full h-full object-cover" onerror="this.style.display='none'">`
                    : `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                        ${jogador.nome.charAt(0).toUpperCase()}
                    </div>`
                }
            </div>

            <!-- Informações -->
            <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-800 dark:text-white truncate">${jogador.nome}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">${jogador.posicao}</p>
                <p class="text-xs text-gray-500 dark:text-gray-500">${jogador.times?.nome || 'Sem time'}</p>

                <div class="mt-2 flex items-center justify-between">
                    <span class="text-lg font-bold text-green-600 dark:text-green-400">
                        ${formatarCartoletas(jogador.preco)}
                    </span>
                    <button
                        onclick="adicionarJogador(${JSON.stringify(jogador).replace(/"/g, '&quot;')})"
                        class="px-3 py-1 text-sm rounded transition ${
                            jaEscalado
                                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }"
                        ${jaEscalado ? 'disabled' : ''}
                    >
                        ${jaEscalado ? 'Escalado' : 'Adicionar'}
                    </button>
                </div>
            </div>
        </div>
    `;

    return div;
}

/**
 * Adiciona jogador à escalação
 * @param {Object} jogador - Jogador a ser adicionado
 */
function adicionarJogador(jogador) {
    try {
        // Verificar se já está escalado
        if (Object.values(escalacaoAtual).some(j => j && j.id === jogador.id)) {
            mostrarNotificacao('Jogador já está na escalação', 'warning');
            return;
        }

        // Determinar posição na escalação
        let posicao = null;
        if (jogador.posicao === 'Goleiro' && !escalacaoAtual.goleiro) {
            posicao = 'goleiro';
        } else if (jogador.posicao === 'Fixo' && !escalacaoAtual.fixo) {
            posicao = 'fixo';
        } else if (jogador.posicao === 'Ala') {
            if (!escalacaoAtual.ala1) posicao = 'ala1';
            else if (!escalacaoAtual.ala2) posicao = 'ala2';
        } else if (jogador.posicao === 'Pivô' && !escalacaoAtual.pivo) {
            posicao = 'pivo';
        }

        if (!posicao) {
            mostrarNotificacao(`Posição de ${jogador.posicao} já preenchida`, 'warning');
            return;
        }

        // Verificar saldo
        const custoAtual = calcularCustoEscalacao();
        const novoCusto = custoAtual + jogador.preco;
        if (novoCusto > usuarioAtual.cartoletas) {
            mostrarNotificacao('Saldo insuficiente', 'error');
            return;
        }

        // Adicionar jogador
        escalacaoAtual[posicao] = jogador;

        // Atualizar UI
        renderizarEscalacao();
        atualizarSaldo();
        renderizarJogadores(aplicarFiltros());

        mostrarNotificacao(`${jogador.nome} adicionado à escalação`, 'success');

    } catch (error) {
        console.error('Erro ao adicionar jogador:', error);
        mostrarNotificacao('Erro ao adicionar jogador', 'error');
    }
}

/**
 * Remove jogador da escalação
 * @param {string} posicao - Posição do jogador na escalação
 */
function removerJogador(posicao) {
    if (!escalacaoAtual[posicao]) return;

    const jogador = escalacaoAtual[posicao];
    escalacaoAtual[posicao] = null;

    renderizarEscalacao();
    atualizarSaldo();
    renderizarJogadores(aplicarFiltros());

    mostrarNotificacao(`${jogador.nome} removido da escalação`, 'info');
}

/**
 * Renderiza escalação atual
 */
function renderizarEscalacao() {
    const posicoes = ['goleiro', 'fixo', 'ala1', 'ala2', 'pivo'];

    posicoes.forEach(posicao => {
        const container = document.getElementById(`container-${posicao}`);
        if (!container) return;

        const jogador = escalacaoAtual[posicao];

        if (jogador) {
            container.innerHTML = `
                <div class="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            ${posicao.toUpperCase().replace('1', ' 1').replace('2', ' 2')}
                        </span>
                        <button onclick="removerJogador('${posicao}')"
                                class="text-red-500 hover:text-red-700 text-xl">
                            ✕
                        </button>
                    </div>
                    <h4 class="font-bold text-gray-800 dark:text-white text-sm truncate">
                        ${jogador.nome}
                    </h4>
                    <p class="text-xs text-green-600 dark:text-green-400">
                        ${formatarCartoletas(jogador.preco)}
                    </p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        ${posicao.toUpperCase().replace('1', ' 1').replace('2', ' 2')}
                    </p>
                    <p class="text-2xl mt-2">➕</p>
                </div>
            `;
        }
    });

    // Atualizar resumo
    const resumo = document.getElementById('resumo-escalacao');
    if (resumo) {
        const total = Object.values(escalacaoAtual).filter(j => j !== null).length;
        resumo.textContent = `${total}/5 jogadores escalados`;
    }
}

/**
 * Calcula custo total da escalação
 * @returns {number} Custo total
 */
function calcularCustoEscalacao() {
    return Object.values(escalacaoAtual)
        .filter(j => j !== null)
        .reduce((total, jogador) => total + jogador.preco, 0);
}

/**
 * Atualiza exibição de saldo
 */
function atualizarSaldo() {
    const custo = calcularCustoEscalacao();
    const restante = usuarioAtual.cartoletas - custo;

    const elemSaldo = document.getElementById('saldo-atual');
    const elemCusto = document.getElementById('custo-escalacao');
    const elemRestante = document.getElementById('saldo-restante');

    if (elemSaldo) elemSaldo.textContent = formatarCartoletas(usuarioAtual.cartoletas);
    if (elemCusto) elemCusto.textContent = formatarCartoletas(custo);
    if (elemRestante) {
        elemRestante.textContent = formatarCartoletas(restante);
        elemRestante.className = restante < 0 ? 'text-red-500' : 'text-green-500';
    }
}

/**
 * Salva escalação no banco
 */
async function salvarEscalacao() {
    try {
        // Validações
        const jogadoresEscalados = Object.values(escalacaoAtual).filter(j => j !== null);

        if (jogadoresEscalados.length !== 5) {
            mostrarNotificacao('Você precisa escalar 5 jogadores', 'warning');
            return;
        }

        if (!rodadaAtual) {
            mostrarNotificacao('Nenhuma rodada ativa', 'warning');
            return;
        }

        const custo = calcularCustoEscalacao();
        if (custo > usuarioAtual.cartoletas) {
            mostrarNotificacao('Saldo insuficiente', 'error');
            return;
        }

        const confirmar = await confirmarAcao('Deseja salvar esta escalação?');
        if (!confirmar) return;

        mostrarLoading(true);

        // Verificar se já existe escalação para esta rodada
        const { data: escalacaoExistente } = await supabase
            .from('escalacoes')
            .select('id')
            .eq('usuario_id', usuarioAtual.id)
            .eq('rodada_id', rodadaAtual.id)
            .maybeSingle();

        const dadosEscalacao = {
            usuario_id: usuarioAtual.id,
            rodada_id: rodadaAtual.id,
            goleiro_id: escalacaoAtual.goleiro.id,
            fixo_id: escalacaoAtual.fixo.id,
            ala1_id: escalacaoAtual.ala1.id,
            ala2_id: escalacaoAtual.ala2.id,
            pivo_id: escalacaoAtual.pivo.id,
            custo_total: custo,
            pontos_rodada: 0
        };

        if (escalacaoExistente) {
            // Atualizar escalação existente
            const { error } = await supabase
                .from('escalacoes')
                .update(dadosEscalacao)
                .eq('id', escalacaoExistente.id);

            if (error) throw error;
            mostrarNotificacao('Escalação atualizada com sucesso!', 'success');
        } else {
            // Criar nova escalação
            const { error } = await supabase
                .from('escalacoes')
                .insert([dadosEscalacao]);

            if (error) throw error;
            mostrarNotificacao('Escalação salva com sucesso!', 'success');
        }

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Erro ao salvar escalação:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Limpa escalação
 */
async function limparEscalacao() {
    const confirmar = await confirmarAcao('Deseja limpar toda a escalação?');
    if (!confirmar) return;

    escalacaoAtual = {
        goleiro: null,
        fixo: null,
        ala1: null,
        ala2: null,
        pivo: null
    };

    renderizarEscalacao();
    atualizarSaldo();
    renderizarJogadores(aplicarFiltros());

    mostrarNotificacao('Escalação limpa', 'info');
}

/**
 * Carrega escalação salva (se existir)
 */
async function carregarEscalacaoSalva() {
    try {
        if (!rodadaAtual) return;

        const { data: escalacao } = await supabase
            .from('escalacoes')
            .select(`
                *,
                goleiro:jogadores!escalacoes_goleiro_id_fkey(*),
                fixo:jogadores!escalacoes_fixo_id_fkey(*),
                ala1:jogadores!escalacoes_ala1_id_fkey(*),
                ala2:jogadores!escalacoes_ala2_id_fkey(*),
                pivo:jogadores!escalacoes_pivo_id_fkey(*)
            `)
            .eq('usuario_id', usuarioAtual.id)
            .eq('rodada_id', rodadaAtual.id)
            .maybeSingle();

        if (escalacao) {
            escalacaoAtual.goleiro = escalacao.goleiro;
            escalacaoAtual.fixo = escalacao.fixo;
            escalacaoAtual.ala1 = escalacao.ala1;
            escalacaoAtual.ala2 = escalacao.ala2;
            escalacaoAtual.pivo = escalacao.pivo;

            renderizarEscalacao();
            atualizarSaldo();
        }

    } catch (error) {
        console.error('Erro ao carregar escalação salva:', error);
    }
}

/**
 * Configura filtros de busca
 */
function configurarFiltros() {
    const inputBusca = document.getElementById('busca-jogador');
    const selectPosicao = document.getElementById('filtro-posicao');
    const selectTime = document.getElementById('filtro-time');
    const selectOrdem = document.getElementById('filtro-ordem');

    if (inputBusca) {
        inputBusca.addEventListener('input', debounce(() => {
            renderizarJogadores(aplicarFiltros());
        }));
    }

    if (selectPosicao) {
        selectPosicao.addEventListener('change', () => {
            renderizarJogadores(aplicarFiltros());
        });
    }

    if (selectTime) {
        selectTime.addEventListener('change', () => {
            renderizarJogadores(aplicarFiltros());
        });
    }

    if (selectOrdem) {
        selectOrdem.addEventListener('change', () => {
            renderizarJogadores(aplicarFiltros());
        });
    }
}

/**
 * Aplica filtros aos jogadores
 * @returns {Array} Jogadores filtrados
 */
function aplicarFiltros() {
    let resultado = [...jogadoresDisponiveis];

    // Filtro de busca
    const busca = document.getElementById('busca-jogador')?.value.toLowerCase();
    if (busca) {
        resultado = resultado.filter(j =>
            j.nome.toLowerCase().includes(busca)
        );
    }

    // Filtro de posição
    const posicao = document.getElementById('filtro-posicao')?.value;
    if (posicao && posicao !== 'todas') {
        resultado = resultado.filter(j => j.posicao === posicao);
    }

    // Filtro de time
    const time = document.getElementById('filtro-time')?.value;
    if (time && time !== 'todos') {
        resultado = resultado.filter(j => j.time_id === parseInt(time));
    }

    // Ordenação
    const ordem = document.getElementById('filtro-ordem')?.value || 'preco_desc';
    switch (ordem) {
        case 'preco_asc':
            resultado.sort((a, b) => a.preco - b.preco);
            break;
        case 'preco_desc':
            resultado.sort((a, b) => b.preco - a.preco);
            break;
        case 'nome_asc':
            resultado.sort((a, b) => a.nome.localeCompare(b.nome));
            break;
        case 'nome_desc':
            resultado.sort((a, b) => b.nome.localeCompare(a.nome));
            break;
    }

    return resultado;
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarMercado);
} else {
    inicializarMercado();
}

// Exportar funções para uso global
window.adicionarJogador = adicionarJogador;
window.removerJogador = removerJogador;
window.salvarEscalacao = salvarEscalacao;
window.limparEscalacao = limparEscalacao;
