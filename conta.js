// conta.js - Sistema de Persistência de Dados Pro (Save/Load)

const ContaSistema = {
    // Chave que será usada no LocalStorage do navegador
    STORAGE_KEY: 'meu_game_user_account',

    // Dados padrão caso seja a primeira vez do usuário no ecossistema
    dadosPadrao: {
        nome: "Jogador_Novo",
        gender: "masculino",
        foto: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // Foto padrão do mini-perfil
        modelo3d: "" // String base64 vazia inicialmente (usa o modelo base do jogo)
    },

    /**
     * Função para salvar os dados completos da conta do usuário.
     * @param {string} nome - Nickname do jogador
     * @param {string} gender - Gênero/Modelo base ('masculino' ou 'feminino')
     * @param {string} avatarBase64 - Arquivo 3D ou Imagem convertida em string Base64
     */
    salvar: function(nome, gender, avatarBase64) {
        try {
            // Verifica o tipo de arquivo enviado para salvar no lugar certo
            let fotoSalvar = this.dadosPadrao.foto;
            let modeloSalvar = "";

            if (avatarBase64) {
                if (avatarBase64.startsWith("data:image")) {
                    // Se for uma imagem real (png/jpg), salva como foto de perfil
                    fotoSalvar = avatarBase64;
                } else {
                    // Se for o arquivo 3D convertido (.gltf/.glb), salva no slot de modelo
                    modeloSalvar = avatarBase64;
                }
            } else {
                // Se o usuário já tinha algo salvo anteriormente, mantém o que existia
                const contaAtual = this.carregar();
                fotoSalvar = contaAtual.foto;
                modeloSalvar = contaAtual.modelo3d;
            }

            const dadosParaSalvar = {
                nome: nome.trim() || this.dadosPadrao.nome,
                gender: gender || this.dadosPadrao.gender,
                foto: fotoSalvar,
                modelo3d: modeloSalvar
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dadosParaSalvar));
            console.log("💾 [ContaSistema] Dados da conta sincronizados e salvos!");
            return true;
        } catch (error) {
            console.error("❌ [ContaSistema] Erro ao salvar dados no LocalStorage (Limite de espaço excedido?):", error);
            return false;
        }
    },

    /**
     * Função para carregar os dados da conta.
     * Retorna os dados existentes ou o objeto padrão estruturado.
     */
    carregar: function() {
        try {
            const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);
            
            if (dadosSalvos) {
                const contaEstruturada = JSON.parse(dadosSalvos);
                
                // Garante compatibilidade caso alguma propriedade antiga esteja faltando
                return {
                    nome: contaEstruturada.nome || this.dadosPadrao.nome,
                    gender: contaEstruturada.gender || this.dadosPadrao.gender,
                    foto: contaEstruturada.foto || this.dadosPadrao.foto,
                    modelo3d: contaEstruturada.modelo3d || (contaEstruturada.avatar || "") // Migração segura caso usasse a chave antiga '.avatar'
                };
            }
        } catch (error) {
            console.warn("⚠️ [ContaSistema] Não foi possível acessar o LocalStorage. Usando dados temporários.", error);
        }
        
        // Se não tiver nada salvo ou der erro, retorna a estrutura limpa padrão
        return this.dadosPadrao;
    },

    /**
     * Remove completamente as credenciais e dados salvos da conta local.
     */
    limpar: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log("🧹 [ContaSistema] Conta desconectada e dados limpos com sucesso.");
            return true;
        } catch (error) {
            console.error("❌ [ContaSistema] Falha ao limpar o banco de dados local:", error);
            return false;
        }
    }
};
