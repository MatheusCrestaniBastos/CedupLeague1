/**
 * 🔧 Painel Administrativo
 *
 * Este arquivo gerencia todas as funcionalidades administrativas.
 */

let usuarioAtual = null;
let jogadoresLista = [];
let timesLista = [];
let rodadasLista = [];

/**
 * Inicializa painel admin
 */
async function inicializarAdmin() {
    try {
        mostrarLoading(true);

        // Verificar se é admin
        const isAdmin = await verificarAdmin();
        if (!isAdmin) return;

        usuarioAtual = await verificarAutenticacao(true);

        // Carregar dados
        await Promise.all([
            carregarEstatisticas(),
            carregarJogadoresAdmin(),
            carregarTimesAdmin(),
            carregarRodadasAdmin()
        ]);

        // Configurar event listeners
        configurarEventListeners();

    } catch (error) {
        console.error('Erro ao inicializar admin:', error);
        mostrarNotificacao('Erro ao carregar painel admin', 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Carrega estatísticas gerais
 */
async function carregarEstatisticas() {
    try {
        // Total de jogadores
        const { count: totalJogadores } = await supabase
            .from('jogadores')
            .select('*', { count: 'exact', head: true });

        // Total de times
        const { count: totalTimes } = await supabase
            .from('times')
            .select('*', { count: 'exact', head: true });

        // Total de rodadas
        const { count: totalRodadas } = await supabase
            .from('rodadas')
            .select('*', { count: 'exact', head: true });

        // Total de usuários
        const { count: totalUsuarios } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true });

        // Atualizar UI
        const elemJogadores = document.getElementById('total-jogadores');
        const elemTimes = document.getElementById('total-times');
        const elemRodadas = document.getElementById('total-rodadas');
        const elemUsuarios = document.getElementById('total-usuarios');

        if (elemJogadores) elemJogadores.textContent = totalJogadores || 0;
        if (elemTimes) elemTimes.textContent = totalTimes || 0;
        if (elemRodadas) elemRodadas.textContent = totalRodadas || 0;
        if (elemUsuarios) elemUsuarios.textContent = totalUsuarios || 0;

    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

/**
 * Carrega lista de jogadores
 */
async function carregarJogadoresAdmin() {
    try {
        const { data: jogadores, error } = await supabase
            .from('jogadores')
            .select(`
                *,
                times (nome)
            `)
            .order('nome');

        if (error) throw error;

        jogadoresLista = jogadores || [];
        renderizarJogadoresAdmin();

    } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
    }
}

/**
 * Renderiza tabela de jogadores
 */
function renderizarJogadoresAdmin() {
    const tbody = document.getElementById('lista-jogadores');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (jogadoresLista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-gray-500">
                    Nenhum jogador cadastrado
                </td>
            </tr>
        `;
        return;
    }

    jogadoresLista.forEach(jogador => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';

        tr.innerHTML = `
            <td class="px-4 py-3">${jogador.nome}</td>
            <td class="px-4 py-3">${jogador.posicao}</td>
            <td class="px-4 py-3">${jogador.times?.nome || '-'}</td>
            <td class="px-4 py-3 text-center">${formatarCartoletas(jogador.preco)}</td>
            <td class="px-4 py-3 text-center">
                <span class="px-2 py-1 rounded text-xs ${
                    jogador.status === 'Disponível'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }">
                    ${jogador.status}
                </span>
            </td>
            <td class="px-4 py-3 text-center">
                <button onclick="editarJogador(${jogador.id})"
                        class="text-blue-500 hover:text-blue-700 mr-2">
                    ✏️
                </button>
                <button onclick="excluirJogador(${jogador.id})"
                        class="text-red-500 hover:text-red-700">
                    🗑️
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/**
 * Adiciona novo jogador
 */
async function adicionarJogador() {
    try {
        const nome = document.getElementById('nome-jogador')?.value;
        const posicao = document.getElementById('posicao-jogador')?.value;
        const preco = parseFloat(document.getElementById('preco-jogador')?.value);
        const timeId = document.getElementById('time-jogador')?.value;
        const fotoUrl = document.getElementById('foto-jogador')?.value;

        // Validações
        if (!nome || !posicao || !preco || !timeId) {
            mostrarNotificacao('Preencha todos os campos obrigatórios', 'warning');
            return;
        }

        if (preco <= 0) {
            mostrarNotificacao('Preço deve ser maior que zero', 'warning');
            return;
        }

        mostrarLoading(true);

        const { error } = await supabase
            .from('jogadores')
            .insert([{
                nome: nome,
                posicao: posicao,
                preco: preco,
                time_id: parseInt(timeId),
                foto_url: fotoUrl || null,
                status: 'Disponível'
            }]);

        if (error) throw error;

        mostrarNotificacao('Jogador adicionado com sucesso!', 'success');

        // Limpar formulário
        document.getElementById('form-adicionar-jogador')?.reset();

        // Recarregar lista
        await carregarJogadoresAdmin();
        await carregarEstatisticas();

    } catch (error) {
        console.error('Erro ao adicionar jogador:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Edita jogador existente
 * @param {number} id - ID do jogador
 */
async function editarJogador(id) {
    try {
        const jogador = jogadoresLista.find(j => j.id === id);
        if (!jogador) return;

        // Preencher modal de edição
        document.getElementById('edit-jogador-id').value = jogador.id;
        document.getElementById('edit-nome-jogador').value = jogador.nome;
        document.getElementById('edit-posicao-jogador').value = jogador.posicao;
        document.getElementById('edit-preco-jogador').value = jogador.preco;
        document.getElementById('edit-time-jogador').value = jogador.time_id;
        document.getElementById('edit-foto-jogador').value = jogador.foto_url || '';

        // Mostrar modal
        const modal = document.getElementById('modal-editar-jogador');
        if (modal) {
            modal.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Erro ao editar jogador:', error);
    }
}

/**
 * Salva edição de jogador
 */
async function salvarEdicaoJogador() {
    try {
        const id = parseInt(document.getElementById('edit-jogador-id')?.value);
        const nome = document.getElementById('edit-nome-jogador')?.value;
        const posicao = document.getElementById('edit-posicao-jogador')?.value;
        const preco = parseFloat(document.getElementById('edit-preco-jogador')?.value);
        const timeId = document.getElementById('edit-time-jogador')?.value;
        const fotoUrl = document.getElementById('edit-foto-jogador')?.value;

        if (!nome || !posicao || !preco || !timeId) {
            mostrarNotificacao('Preencha todos os campos obrigatórios', 'warning');
            return;
        }

        mostrarLoading(true);

        const { error } = await supabase
            .from('jogadores')
            .update({
                nome: nome,
                posicao: posicao,
                preco: preco,
                time_id: parseInt(timeId),
                foto_url: fotoUrl || null
            })
            .eq('id', id);

        if (error) throw error;

        mostrarNotificacao('Jogador atualizado com sucesso!', 'success');

        // Fechar modal
        fecharModalEdicao();

        // Recarregar lista
        await carregarJogadoresAdmin();

    } catch (error) {
        console.error('Erro ao salvar edição:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Fecha modal de edição
 */
function fecharModalEdicao() {
    const modal = document.getElementById('modal-editar-jogador');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Exclui jogador
 * @param {number} id - ID do jogador
 */
async function excluirJogador(id) {
    try {
        const jogador = jogadoresLista.find(j => j.id === id);
        if (!jogador) return;

        const confirmar = await confirmarAcao(`Deseja realmente excluir ${jogador.nome}?`);
        if (!confirmar) return;

        mostrarLoading(true);

        const { error } = await supabase
            .from('jogadores')
            .delete()
            .eq('id', id);

        if (error) throw error;

        mostrarNotificacao('Jogador excluído com sucesso!', 'success');

        // Recarregar lista
        await carregarJogadoresAdmin();
        await carregarEstatisticas();

    } catch (error) {
        console.error('Erro ao excluir jogador:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Carrega lista de times
 */
async function carregarTimesAdmin() {
    try {
        const { data: times, error } = await supabase
            .from('times')
            .select('*')
            .order('nome');

        if (error) throw error;

        timesLista = times || [];
        renderizarTimesAdmin();
        popularSelectTimes();

    } catch (error) {
        console.error('Erro ao carregar times:', error);
    }
}

/**
 * Renderiza tabela de times
 */
function renderizarTimesAdmin() {
    const tbody = document.getElementById('lista-times');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (timesLista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center py-4 text-gray-500">
                    Nenhum time cadastrado
                </td>
            </tr>
        `;
        return;
    }

    timesLista.forEach(time => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';

        tr.innerHTML = `
            <td class="px-4 py-3">${time.nome}</td>
            <td class="px-4 py-3 text-center">
                ${time.escudo ? `<img src="${time.escudo}" alt="${time.nome}" class="h-8 mx-auto">` : '-'}
            </td>
            <td class="px-4 py-3 text-center">
                <button onclick="excluirTime(${time.id})"
                        class="text-red-500 hover:text-red-700">
                    🗑️
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/**
 * Popula selects de times
 */
function popularSelectTimes() {
    const selects = [
        document.getElementById('time-jogador'),
        document.getElementById('edit-time-jogador'),
        document.getElementById('filtro-time')
    ];

    selects.forEach(select => {
        if (!select) return;

        // Limpar opções existentes (exceto primeira)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Adicionar times
        timesLista.forEach(time => {
            const option = document.createElement('option');
            option.value = time.id;
            option.textContent = time.nome;
            select.appendChild(option);
        });
    });
}

/**
 * Exclui time
 * @param {number} id - ID do time
 */
async function excluirTime(id) {
    try {
        const time = timesLista.find(t => t.id === id);
        if (!time) return;

        const confirmar = await confirmarAcao(`Deseja realmente excluir ${time.nome}?`);
        if (!confirmar) return;

        mostrarLoading(true);

        const { error } = await supabase
            .from('times')
            .delete()
            .eq('id', id);

        if (error) throw error;

        mostrarNotificacao('Time excluído com sucesso!', 'success');

        // Recarregar lista
        await carregarTimesAdmin();
        await carregarEstatisticas();

    } catch (error) {
        console.error('Erro ao excluir time:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Carrega lista de rodadas
 */
async function carregarRodadasAdmin() {
    try {
        const { data: rodadas, error } = await supabase
            .from('rodadas')
            .select('*')
            .order('numero', { ascending: false });

        if (error) throw error;

        rodadasLista = rodadas || [];
        renderizarRodadasAdmin();

    } catch (error) {
        console.error('Erro ao carregar rodadas:', error);
    }
}

/**
 * Renderiza tabela de rodadas
 */
function renderizarRodadasAdmin() {
    const tbody = document.getElementById('lista-rodadas');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (rodadasLista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-gray-500">
                    Nenhuma rodada cadastrada
                </td>
            </tr>
        `;
        return;
    }

    rodadasLista.forEach(rodada => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';

        tr.innerHTML = `
            <td class="px-4 py-3 text-center font-bold">${rodada.numero}</td>
            <td class="px-4 py-3">${formatarData(rodada.data_inicio)}</td>
            <td class="px-4 py-3">${formatarData(rodada.data_fim)}</td>
            <td class="px-4 py-3 text-center">
                <span class="px-2 py-1 rounded text-xs ${
                    rodada.status === 'em_andamento'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : rodada.status === 'finalizada'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }">
                    ${capitalize(rodada.status.replace('_', ' '))}
                </span>
            </td>
            <td class="px-4 py-3 text-center">
                ${rodada.status === 'pendente' ? `
                    <button onclick="iniciarRodada(${rodada.id})"
                            class="text-green-500 hover:text-green-700 mr-2">
                        ▶️
                    </button>
                ` : ''}
                ${rodada.status === 'em_andamento' ? `
                    <button onclick="finalizarRodada(${rodada.id})"
                            class="text-red-500 hover:text-red-700 mr-2">
                        ⏹️
                    </button>
                ` : ''}
                <button onclick="excluirRodada(${rodada.id})"
                        class="text-red-500 hover:text-red-700">
                    🗑️
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/**
 * Inicia rodada
 * @param {number} id - ID da rodada
 */
async function iniciarRodada(id) {
    try {
        const confirmar = await confirmarAcao('Deseja iniciar esta rodada?');
        if (!confirmar) return;

        mostrarLoading(true);

        // Finalizar rodada anterior se houver
        await supabase
            .from('rodadas')
            .update({ status: 'finalizada' })
            .eq('status', 'em_andamento');

        // Iniciar nova rodada
        const { error } = await supabase
            .from('rodadas')
            .update({ status: 'em_andamento' })
            .eq('id', id);

        if (error) throw error;

        mostrarNotificacao('Rodada iniciada!', 'success');
        await carregarRodadasAdmin();

    } catch (error) {
        console.error('Erro ao iniciar rodada:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Finaliza rodada
 * @param {number} id - ID da rodada
 */
async function finalizarRodada(id) {
    try {
        const confirmar = await confirmarAcao('Deseja finalizar esta rodada? Esta ação calculará os pontos de todos os usuários.');
        if (!confirmar) return;

        mostrarLoading(true);

        const { error } = await supabase
            .from('rodadas')
            .update({ status: 'finalizada' })
            .eq('id', id);

        if (error) throw error;

        mostrarNotificacao('Rodada finalizada!', 'success');
        await carregarRodadasAdmin();

    } catch (error) {
        console.error('Erro ao finalizar rodada:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Exclui rodada
 * @param {number} id - ID da rodada
 */
async function excluirRodada(id) {
    try {
        const confirmar = await confirmarAcao('Deseja realmente excluir esta rodada?');
        if (!confirmar) return;

        mostrarLoading(true);

        const { error } = await supabase
            .from('rodadas')
            .delete()
            .eq('id', id);

        if (error) throw error;

        mostrarNotificacao('Rodada excluída!', 'success');
        await carregarRodadasAdmin();
        await carregarEstatisticas();

    } catch (error) {
        console.error('Erro ao excluir rodada:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Configura event listeners
 */
function configurarEventListeners() {
    // Botão adicionar jogador
    const btnAdicionarJogador = document.getElementById('btn-adicionar-jogador');
    if (btnAdicionarJogador) {
        btnAdicionarJogador.addEventListener('click', adicionarJogador);
    }

    // Botões do modal de edição
    const btnSalvarEdicao = document.getElementById('btn-salvar-edicao-jogador');
    if (btnSalvarEdicao) {
        btnSalvarEdicao.addEventListener('click', salvarEdicaoJogador);
    }

    const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao-jogador');
    if (btnCancelarEdicao) {
        btnCancelarEdicao.addEventListener('click', fecharModalEdicao);
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAdmin);
} else {
    inicializarAdmin();
}

// Exportar funções para uso global
window.adicionarJogador = adicionarJogador;
window.editarJogador = editarJogador;
window.salvarEdicaoJogador = salvarEdicaoJogador;
window.excluirJogador = excluirJogador;
window.excluirTime = excluirTime;
window.iniciarRodada = iniciarRodada;
window.finalizarRodada = finalizarRodada;
window.excluirRodada = excluirRodada;
window.fecharModalEdicao = fecharModalEdicao;
