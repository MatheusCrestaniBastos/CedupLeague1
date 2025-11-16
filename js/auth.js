/**
 * 🔐 Sistema de Autenticação
 *
 * Este arquivo contém todas as funções relacionadas à autenticação de usuários.
 */

/**
 * Realiza login do usuário
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha do usuário
 */
async function fazerLogin(email, senha) {
    try {
        mostrarLoading(true);

        // Validações
        if (!email || !senha) {
            mostrarNotificacao('Preencha todos os campos', 'warning');
            return;
        }

        if (!validarEmail(email)) {
            mostrarNotificacao('Email inválido', 'warning');
            return;
        }

        // Fazer login no Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: senha
        });

        if (error) throw error;

        // Buscar dados do usuário na tabela usuarios
        const { data: usuario, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (errorUsuario) {
            console.error('Erro ao buscar usuário:', errorUsuario);
        }

        mostrarNotificacao('Login realizado com sucesso!', 'success');

        // Redirecionar para dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Erro no login:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Realiza cadastro de novo usuário
 * @param {string} nomeTime - Nome do time do usuário
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha do usuário
 * @param {string} confirmaSenha - Confirmação de senha
 */
async function fazerCadastro(nomeTime, email, senha, confirmaSenha) {
    try {
        mostrarLoading(true);

        // Validações
        if (!nomeTime || !email || !senha || !confirmaSenha) {
            mostrarNotificacao('Preencha todos os campos', 'warning');
            return;
        }

        if (!validarEmail(email)) {
            mostrarNotificacao('Email inválido', 'warning');
            return;
        }

        if (senha.length < 6) {
            mostrarNotificacao('A senha deve ter no mínimo 6 caracteres', 'warning');
            return;
        }

        if (senha !== confirmaSenha) {
            mostrarNotificacao('As senhas não coincidem', 'warning');
            return;
        }

        // Verificar se nome do time já existe
        const { data: timeExistente } = await supabase
            .from('usuarios')
            .select('nome_time')
            .eq('nome_time', nomeTime)
            .maybeSingle();

        if (timeExistente) {
            mostrarNotificacao('Nome do time já está em uso', 'warning');
            return;
        }

        // Criar usuário no Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: senha
        });

        if (error) throw error;

        // Criar registro na tabela usuarios
        const { error: errorUsuario } = await supabase
            .from('usuarios')
            .insert([{
                id: data.user.id,
                nome_time: nomeTime,
                email: email,
                cartoletas: APP_CONFIG.orcamentoInicial,
                pontos_totais: 0,
                is_admin: false
            }]);

        if (errorUsuario) throw errorUsuario;

        mostrarNotificacao('Cadastro realizado com sucesso!', 'success');

        // Redirecionar para dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Erro no cadastro:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Faz logout do usuário
 */
async function fazerLogout() {
    try {
        const confirmar = await confirmarAcao('Deseja realmente sair?');
        if (!confirmar) return;

        mostrarLoading(true);

        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        mostrarNotificacao('Logout realizado com sucesso!', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error('Erro no logout:', error);
        mostrarNotificacao('Erro ao fazer logout', 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Verifica se usuário está autenticado
 * @param {boolean} redirecionarSeNao - Se deve redirecionar caso não esteja autenticado
 * @returns {Object|null} Dados do usuário ou null
 */
async function verificarAutenticacao(redirecionarSeNao = true) {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!session) {
            if (redirecionarSeNao) {
                mostrarNotificacao('Você precisa fazer login', 'warning');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
            return null;
        }

        // Buscar dados completos do usuário
        const { data: usuario, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (errorUsuario) {
            console.error('Erro ao buscar dados do usuário:', errorUsuario);
            return session.user;
        }

        return usuario;

    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        if (redirecionarSeNao) {
            window.location.href = 'index.html';
        }
        return null;
    }
}

/**
 * Verifica se usuário é administrador
 * @returns {Promise<boolean>} True se for admin
 */
async function verificarAdmin() {
    try {
        const usuario = await verificarAutenticacao(true);
        if (!usuario) return false;

        if (!usuario.is_admin) {
            mostrarNotificacao('Acesso negado. Você não é administrador.', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            return false;
        }

        return true;

    } catch (error) {
        console.error('Erro ao verificar admin:', error);
        window.location.href = 'dashboard.html';
        return false;
    }
}

/**
 * Recupera senha do usuário
 * @param {string} email - Email do usuário
 */
async function recuperarSenha(email) {
    try {
        mostrarLoading(true);

        if (!email || !validarEmail(email)) {
            mostrarNotificacao('Digite um email válido', 'warning');
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/index.html`
        });

        if (error) throw error;

        mostrarNotificacao('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');

    } catch (error) {
        console.error('Erro ao recuperar senha:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Atualiza perfil do usuário
 * @param {string} nomeTime - Novo nome do time
 */
async function atualizarPerfil(nomeTime) {
    try {
        mostrarLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        if (!nomeTime || nomeTime.trim() === '') {
            mostrarNotificacao('Digite um nome para o time', 'warning');
            return;
        }

        // Verificar se nome já existe (exceto o próprio usuário)
        const { data: timeExistente } = await supabase
            .from('usuarios')
            .select('nome_time')
            .eq('nome_time', nomeTime)
            .neq('id', session.user.id)
            .maybeSingle();

        if (timeExistente) {
            mostrarNotificacao('Nome do time já está em uso', 'warning');
            return;
        }

        const { error } = await supabase
            .from('usuarios')
            .update({ nome_time: nomeTime })
            .eq('id', session.user.id);

        if (error) throw error;

        mostrarNotificacao('Perfil atualizado com sucesso!', 'success');

        // Recarregar página para atualizar dados
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        mostrarNotificacao(tratarErroSupabase(error), 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Exportar funções para uso global
window.fazerLogin = fazerLogin;
window.fazerCadastro = fazerCadastro;
window.fazerLogout = fazerLogout;
window.verificarAutenticacao = verificarAutenticacao;
window.verificarAdmin = verificarAdmin;
window.recuperarSenha = recuperarSenha;
window.atualizarPerfil = atualizarPerfil;
