# ⚽ Cartola Coach - Fantasy Futsal

Sistema completo de cartola/fantasy de futsal com gerenciamento de jogadores, escalações e pontuações.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Banco de Dados](#banco-de-dados)
- [Uso](#uso)
- [Screenshots](#screenshots)
- [Licença](#licença)

## 🎯 Sobre o Projeto

**Cartola Coach** é uma plataforma web de fantasy futsal onde usuários podem:
- Criar e gerenciar seus times
- Escalar jogadores para cada rodada
- Competir com outros usuários em um ranking
- Acompanhar estatísticas e pontuações

## ✨ Funcionalidades

### Para Usuários
- ✅ Cadastro e autenticação segura
- ✅ Dashboard com estatísticas pessoais
- ✅ Mercado de jogadores com filtros avançados
- ✅ Escalação de time (Goleiro, Fixo, 2 Alas, Pivô)
- ✅ Sistema de cartoletas (moeda virtual)
- ✅ Ranking geral de pontuação
- ✅ Histórico de rodadas
- ✅ Tema dark/light mode

### Para Administradores
- ✅ Painel administrativo completo
- ✅ Gerenciamento de jogadores (CRUD)
- ✅ Gerenciamento de times
- ✅ Gerenciamento de rodadas
- ✅ Controle de status de rodadas
- ✅ Estatísticas gerais do sistema

## 🚀 Tecnologias

### Frontend
- **HTML5** - Estrutura
- **CSS3** + **Tailwind CSS** - Estilização
- **JavaScript (ES6+)** - Lógica e interatividade

### Backend/Database
- **Supabase** - Backend as a Service
  - Autenticação
  - Banco de dados PostgreSQL
  - Real-time subscriptions
  - Storage

### CDNs
- Supabase JS Client (v2)
- Tailwind CSS

## 📁 Estrutura do Projeto

```
CedupLeague1/
├── index.html              # Página de login/cadastro
├── dashboard.html          # Dashboard do usuário
├── mercado.html           # Mercado de jogadores
├── admin.html             # Painel administrativo
├── css/
│   └── styles.css         # Estilos customizados
├── js/
│   ├── config.js          # Configuração do Supabase
│   ├── utils.js           # Funções utilitárias
│   ├── auth.js            # Autenticação
│   ├── theme.js           # Sistema de tema
│   ├── dashboard.js       # Lógica do dashboard
│   ├── mercado.js         # Lógica do mercado
│   └── admin.js           # Lógica do admin
├── assets/
│   └── images/            # Imagens do projeto
└── README.md
```

## 🔧 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/CedupLeague1.git
cd CedupLeague1
```

### 2. Configure um Servidor Local

O projeto usa JavaScript modules e requisições à API, portanto precisa rodar em um servidor web.

**Opção 1: Python**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Opção 2: Node.js (http-server)**
```bash
npx http-server -p 8000
```

**Opção 3: PHP**
```bash
php -S localhost:8000
```

**Opção 4: VS Code Live Server**
- Instale a extensão "Live Server"
- Clique com botão direito em `index.html`
- Selecione "Open with Live Server"

### 3. Acesse o Projeto

Abra seu navegador e acesse:
```
http://localhost:8000
```

## ⚙️ Configuração

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta (se ainda não tiver)
3. Crie um novo projeto
4. Anote a URL e a chave anônima (anon key)

### 2. Configurar Credenciais

Edite o arquivo `js/config.js`:

```javascript
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anonima-aqui';
```

### 3. Configurar Banco de Dados

Execute os seguintes scripts SQL no Supabase SQL Editor:

#### Tabela: usuarios
```sql
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    nome_time VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cartoletas DECIMAL(10, 2) DEFAULT 100.00,
    pontos_totais DECIMAL(10, 2) DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabela: times
```sql
CREATE TABLE times (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    escudo VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabela: jogadores
```sql
CREATE TABLE jogadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    posicao VARCHAR(50) NOT NULL,
    time_id INT REFERENCES times(id) ON DELETE CASCADE,
    preco DECIMAL(10, 2) NOT NULL,
    foto_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'Disponível',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabela: rodadas
```sql
CREATE TABLE rodadas (
    id SERIAL PRIMARY KEY,
    numero INT UNIQUE NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabela: escalacoes
```sql
CREATE TABLE escalacoes (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    rodada_id INT REFERENCES rodadas(id) ON DELETE CASCADE,
    goleiro_id INT REFERENCES jogadores(id),
    fixo_id INT REFERENCES jogadores(id),
    ala1_id INT REFERENCES jogadores(id),
    ala2_id INT REFERENCES jogadores(id),
    pivo_id INT REFERENCES jogadores(id),
    custo_total DECIMAL(10, 2),
    pontos_rodada DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, rodada_id)
);
```

#### Habilitar Row Level Security (RLS)

```sql
-- Usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todos os perfis" ON usuarios
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Jogadores
ALTER TABLE jogadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver jogadores" ON jogadores
    FOR SELECT USING (true);

-- Rodadas
ALTER TABLE rodadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver rodadas" ON rodadas
    FOR SELECT USING (true);

-- Escalacoes
ALTER TABLE escalacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprias escalações" ON escalacoes
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar próprias escalações" ON escalacoes
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar próprias escalações" ON escalacoes
    FOR UPDATE USING (auth.uid() = usuario_id);
```

### 4. Dados Iniciais (Opcional)

Insira alguns dados de exemplo:

```sql
-- Times de exemplo
INSERT INTO times (nome, escudo) VALUES
('Futsal FC', 'https://via.placeholder.com/100'),
('Quadra United', 'https://via.placeholder.com/100'),
('Bola na Rede', 'https://via.placeholder.com/100');

-- Jogadores de exemplo
INSERT INTO jogadores (nome, posicao, time_id, preco, status) VALUES
('João Silva', 'Goleiro', 1, 15.00, 'Disponível'),
('Pedro Santos', 'Fixo', 1, 20.00, 'Disponível'),
('Carlos Oliveira', 'Ala', 2, 18.00, 'Disponível'),
('Lucas Costa', 'Ala', 2, 17.00, 'Disponível'),
('Rafael Lima', 'Pivô', 3, 22.00, 'Disponível');

-- Rodada de exemplo
INSERT INTO rodadas (numero, data_inicio, data_fim, status) VALUES
(1, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'em_andamento');
```

## 📖 Uso

### Login/Cadastro
1. Acesse a página inicial (`index.html`)
2. Faça login com uma conta existente ou crie uma nova
3. Após o cadastro, você receberá C$ 100,00 de saldo inicial

### Dashboard
- Visualize suas estatísticas (cartoletas, pontos, posição)
- Confira o ranking dos top 10 jogadores
- Veja o histórico das suas rodadas

### Mercado
1. Use os filtros para encontrar jogadores
2. Clique em "Adicionar" para escalar um jogador
3. Monte seu time com 5 jogadores (Goleiro, Fixo, 2 Alas, Pivô)
4. Fique atento ao seu saldo disponível
5. Clique em "Salvar Escalação" para confirmar

### Painel Admin
**Apenas para administradores:**
1. Gerencie jogadores (adicionar, editar, excluir)
2. Visualize e gerencie times
3. Controle rodadas (iniciar, finalizar)
4. Acompanhe estatísticas gerais

## 🎨 Screenshots

> Adicione screenshots do projeto aqui

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## 👨‍💻 Autor

Desenvolvido com ❤️ para a comunidade de futsal

## 📞 Suporte

Se você encontrar algum problema ou tiver sugestões:
- Abra uma [issue](https://github.com/seu-usuario/CedupLeague1/issues)
- Entre em contato por email

---

**Boa sorte e divirta-se! ⚽🏆**
