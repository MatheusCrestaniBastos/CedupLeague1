/**
 * 🔧 Configuração do Supabase
 *
 * Este arquivo contém as credenciais e configuração do Supabase.
 * IMPORTANTE: Substitua as credenciais abaixo pelas suas.
 */

// Credenciais do Supabase
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anonima-aqui';

// Inicializar cliente Supabase
let supabase;

try {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase inicializado com sucesso');
    } else {
        console.error('❌ Biblioteca Supabase não carregada. Certifique-se de incluir o CDN do Supabase.');
    }
} catch (error) {
    console.error('❌ Erro ao inicializar Supabase:', error);
}

// Configurações do aplicativo
const APP_CONFIG = {
    nome: 'Cartola Coach',
    versao: '1.0.0',
    orcamentoInicial: 100, // Cartoletas iniciais
    maxJogadoresEscalacao: 5, // Gol, Fixo, Ala1, Ala2, Pivô
    posicoes: ['Goleiro', 'Fixo', 'Ala', 'Pivô'],
    statusJogador: {
        disponivel: 'Disponível',
        lesionado: 'Lesionado',
        suspenso: 'Suspenso'
    }
};

// Exportar para uso global
window.APP_CONFIG = APP_CONFIG;
