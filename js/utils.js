/**
 * 🛠️ Funções Utilitárias
 *
 * Este arquivo contém funções auxiliares utilizadas em todo o projeto.
 */

/**
 * Mostra notificação toast
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - Tipo de notificação: 'success', 'error', 'warning', 'info'
 */
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remove notificações antigas
    const toastAntigo = document.getElementById('toast-notification');
    if (toastAntigo) {
        toastAntigo.remove();
    }

    // Cores baseadas no tipo
    const cores = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    // Ícones baseados no tipo
    const icones = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    // Criar elemento toast
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = `fixed top-4 right-4 ${cores[tipo]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-in`;
    toast.innerHTML = `
        <span class="text-xl font-bold">${icones[tipo]}</span>
        <span>${mensagem}</span>
    `;

    document.body.appendChild(toast);

    // Remover após 3 segundos
    setTimeout(() => {
        toast.classList.add('animate-slide-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Formata valores monetários (Cartoletas)
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado
 */
function formatarCartoletas(valor) {
    return `C$ ${Number(valor).toFixed(2)}`;
}

/**
 * Formata pontos
 * @param {number} pontos - Pontos a serem formatados
 * @returns {string} Pontos formatados
 */
function formatarPontos(pontos) {
    return Number(pontos).toFixed(2);
}

/**
 * Formata data para formato brasileiro
 * @param {string|Date} data - Data a ser formatada
 * @returns {string} Data formatada
 */
function formatarData(data) {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formata data e hora para formato brasileiro
 * @param {string|Date} data - Data a ser formatada
 * @returns {string} Data e hora formatadas
 */
function formatarDataHora(data) {
    const d = new Date(data);
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Debounce para otimizar buscas
 * @param {Function} func - Função a ser executada
 * @param {number} delay - Delay em milissegundos
 * @returns {Function} Função com debounce
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Valida email
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se válido
 */
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Mostra loading
 * @param {boolean} mostrar - Se deve mostrar ou ocultar
 */
function mostrarLoading(mostrar = true) {
    let loading = document.getElementById('global-loading');

    if (mostrar) {
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'global-loading';
            loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            loading.innerHTML = `
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p class="text-gray-700 dark:text-gray-300">Carregando...</p>
                </div>
            `;
            document.body.appendChild(loading);
        }
        loading.classList.remove('hidden');
    } else {
        if (loading) {
            loading.classList.add('hidden');
        }
    }
}

/**
 * Confirma ação do usuário
 * @param {string} mensagem - Mensagem de confirmação
 * @returns {Promise<boolean>} True se confirmado
 */
async function confirmarAcao(mensagem) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md">
                <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">Confirmação</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-6">${mensagem}</p>
                <div class="flex gap-3 justify-end">
                    <button id="btn-cancelar" class="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition">
                        Cancelar
                    </button>
                    <button id="btn-confirmar" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                        Confirmar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-confirmar').onclick = () => {
            modal.remove();
            resolve(true);
        };

        document.getElementById('btn-cancelar').onclick = () => {
            modal.remove();
            resolve(false);
        };
    });
}

/**
 * Trata erros do Supabase
 * @param {Error} error - Erro do Supabase
 * @returns {string} Mensagem de erro amigável
 */
function tratarErroSupabase(error) {
    console.error('Erro Supabase:', error);

    const mensagensErro = {
        'Invalid login credentials': 'Email ou senha incorretos',
        'Email not confirmed': 'Email ainda não confirmado',
        'User already registered': 'Usuário já cadastrado',
        'duplicate key': 'Este registro já existe',
        'violates foreign key': 'Erro de referência de dados',
        'Network request failed': 'Erro de conexão. Verifique sua internet.'
    };

    for (const [key, value] of Object.entries(mensagensErro)) {
        if (error.message && error.message.includes(key)) {
            return value;
        }
    }

    return 'Ocorreu um erro. Tente novamente.';
}

/**
 * Ordena array de objetos
 * @param {Array} array - Array a ser ordenado
 * @param {string} campo - Campo para ordenar
 * @param {string} ordem - 'asc' ou 'desc'
 * @returns {Array} Array ordenado
 */
function ordenarArray(array, campo, ordem = 'asc') {
    return array.sort((a, b) => {
        const valorA = a[campo];
        const valorB = b[campo];

        if (ordem === 'asc') {
            return valorA > valorB ? 1 : -1;
        } else {
            return valorA < valorB ? 1 : -1;
        }
    });
}

/**
 * Capitaliza primeira letra
 * @param {string} str - String a ser capitalizada
 * @returns {string} String capitalizada
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Trunca texto
 * @param {string} texto - Texto a ser truncado
 * @param {number} limite - Limite de caracteres
 * @returns {string} Texto truncado
 */
function truncarTexto(texto, limite = 50) {
    if (!texto || texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
}

/**
 * Gera cor baseada em string (para avatares)
 * @param {string} str - String base
 * @returns {string} Cor em hexadecimal
 */
function gerarCor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const cores = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];

    return cores[Math.abs(hash) % cores.length];
}

// Exportar funções para uso global
window.mostrarNotificacao = mostrarNotificacao;
window.formatarCartoletas = formatarCartoletas;
window.formatarPontos = formatarPontos;
window.formatarData = formatarData;
window.formatarDataHora = formatarDataHora;
window.debounce = debounce;
window.validarEmail = validarEmail;
window.mostrarLoading = mostrarLoading;
window.confirmarAcao = confirmarAcao;
window.tratarErroSupabase = tratarErroSupabase;
window.ordenarArray = ordenarArray;
window.capitalize = capitalize;
window.truncarTexto = truncarTexto;
window.gerarCor = gerarCor;
