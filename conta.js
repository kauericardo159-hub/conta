/**
 * --- SISTEMA DE GERENCIAMENTO DE CONTA LOCAL PRO ---
 * Gerencia persistência, backup, importação, economia e metadados de conta.
 */

const ContaSistema = {
    STORAGE_KEY: 'meu_game_user_account',

    // Estrutura expandida para suportar os novos módulos e economia
    dadosPadrao: {
        nome: "Jogador_Novo",
        gender: "masculino",
        foto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        modelo3d: "",
        bits: 0, // Injetado para sincronizar com o ecossistema de recompensas do jogo
        saves: { "Jogo da Velha": "0 vitórias", "Nível": "1" },
        memorias: { "Data de Criação": new Date().toLocaleDateString() },
        sites: { "Base": "Ativo" }
    },

    carregar: function() {
        try {
            const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);
            return dadosSalvos ? { ...this.dadosPadrao, ...JSON.parse(dadosSalvos) } : this.dadosPadrao;
        } catch (e) {
            console.error("Erro ao carregar conta:", e);
            return this.dadosPadrao;
        }
    },

    // Salva apenas os dados da UI (Perfil) preservando as listas de progresso
    salvarDadosBase: function(nome, gender, foto) {
        const atual = this.carregar();
        const novaConta = { ...atual, nome, gender, foto };
        this._persistir(novaConta);
    },

    // Motor de Economia Integrado (Essencial para o Jogo da Velha Multiplayer)
    modificarBits: function(qtd) {
        const conta = this.carregar();
        conta.bits = Math.max(0, (conta.bits || 0) + qtd);
        this._persistir(conta);
        this.atualizarUI(); // Sincroniza visualmente as telas abertas
        return conta.bits;
    },

    // Sincronizador de UI Global (Seguro para index.html e perfil.html)
    atualizarUI: function() {
        const conta = this.carregar();
        
        // Elementos da Topbar do Jogo da Velha (se existirem na página atual)
        const headerAvatar = document.getElementById('headerAvatar');
        const headerNome = document.getElementById('headerNome');
        const headerBits = document.getElementById('headerBits');
        
        if (headerAvatar) headerAvatar.src = conta.foto;
        if (headerNome) headerNome.textContent = conta.nome;
        if (headerBits) headerBits.textContent = `⚡ ${conta.bits || 0}`;

        // Elementos da página própria de perfil (perfil.html)
        const userDisplay = document.getElementById('userDisplay');
        const usernameInput = document.getElementById('usernameInput');
        const avatarPreview = document.getElementById('avatarPreview');
        
        if (userDisplay) userDisplay.textContent = conta.nome;
        if (usernameInput && document.activeElement !== usernameInput) usernameInput.value = conta.nome;
        if (avatarPreview) avatarPreview.src = conta.foto;
    },

    // Atualiza progresso (usado por jogos para salvar pontuação ou dados)
    atualizarProgresso: function(modulo, chave, valor) {
        const conta = this.carregar();
        if (!conta[modulo]) conta[modulo] = {};
        conta[modulo][chave] = valor;
        this._persistir(conta);
    },

    _persistir: function(dados) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dados));
    },

    // --- MÓDULOS DE BACKUP E IMPORTAÇÃO ---

    exportarConta: function() {
        const dados = localStorage.getItem(this.STORAGE_KEY);
        if (!dados) return alert("Nada para baixar!");
        
        const blob = new Blob([dados], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `minha_conta_${new Date().getTime()}.json`;
        a.click();
    },

    importarConta: function(jsonString) {
        try {
            const novaConta = JSON.parse(jsonString);
            // Validação para garantir integridade estrutural mínima
            if (novaConta && typeof novaConta === 'object' && novaConta.nome) {
                // Garante que chaves de moedas antigas sem o campo inicializem em 0
                if (novaConta.bits === undefined) novaConta.bits = 0;
                this._persistir(novaConta);
                this.atualizarUI();
                return true;
            }
            throw new Error("Formato inválido");
        } catch (e) {
            alert("Erro ao importar: O arquivo JSON parece corrompido ou não é uma conta válida.");
            return false;
        }
    },

    limpar: function() {
        localStorage.removeItem(this.STORAGE_KEY);
        return true;
    }
};
