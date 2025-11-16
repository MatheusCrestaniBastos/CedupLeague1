/**
 * 🌓 Sistema de Tema Dark/Light
 *
 * Este arquivo gerencia a alternância entre tema escuro e claro.
 */

/**
 * Inicializa o tema
 */
function inicializarTema() {
    // Verificar tema salvo no localStorage
    const temaSalvo = localStorage.getItem('tema') || 'light';
    aplicarTema(temaSalvo);

    // Configurar botão de toggle (se existir)
    const btnToggle = document.getElementById('theme-toggle');
    if (btnToggle) {
        btnToggle.addEventListener('click', alternarTema);
        atualizarIconeTema(temaSalvo);
    }
}

/**
 * Aplica tema
 * @param {string} tema - 'dark' ou 'light'
 */
function aplicarTema(tema) {
    const html = document.documentElement;

    if (tema === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }

    localStorage.setItem('tema', tema);
}

/**
 * Alterna entre tema dark e light
 */
function alternarTema() {
    const html = document.documentElement;
    const temaAtual = html.classList.contains('dark') ? 'dark' : 'light';
    const novoTema = temaAtual === 'dark' ? 'light' : 'dark';

    aplicarTema(novoTema);
    atualizarIconeTema(novoTema);
}

/**
 * Atualiza ícone do botão de tema
 * @param {string} tema - Tema atual
 */
function atualizarIconeTema(tema) {
    const btnToggle = document.getElementById('theme-toggle');
    if (!btnToggle) return;

    if (tema === 'dark') {
        btnToggle.innerHTML = '☀️';
        btnToggle.title = 'Ativar tema claro';
    } else {
        btnToggle.innerHTML = '🌙';
        btnToggle.title = 'Ativar tema escuro';
    }
}

/**
 * Obtém tema atual
 * @returns {string} 'dark' ou 'light'
 */
function obterTemaAtual() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// Inicializar tema quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarTema);
} else {
    inicializarTema();
}

// Exportar funções para uso global
window.inicializarTema = inicializarTema;
window.aplicarTema = aplicarTema;
window.alternarTema = alternarTema;
window.obterTemaAtual = obterTemaAtual;
