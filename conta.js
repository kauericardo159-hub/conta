// conta.js - Sistema de Persistência de Dados Pro (Save/Load/Economy)

const ContaSistema = {
    // Chave única usada no LocalStorage do navegador
    STORAGE_KEY: 'meu_game_user_account',

    // Dados padrão para novos usuários ou redefinições
    dadosPadrao: {
        nome: "Jogador_Novo",
        gender: "masculino",
        foto: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // Imagem neutra base
        modelo3d: "", // Armazenamento de malhas personalizadas se necessário
        bits: 0,       // Moeda padrão do Hub (Sincronizado)
        rank: "Recruta" // Classificação inicial de nível (Sincronizado)
    },

    /**
     * Carrega os dados da conta. Retorna o progresso salvo ou a estrutura limpa.
     * @returns {Object} Dados estruturados da conta do jogador
     */
    carregar: function() {
        try {
            const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);
            
            if (dadosSalvos) {
                const conta = JSON.parse(dadosSalvos);
                
                // Mapeamento preventivo garantindo fallbacks seguros para chaves novas ou legadas
                return {
                    nome: conta.nome || this.dadosPadrao.nome,
                    gender: conta.gender || this.dadosPadrao.gender,
                    foto: conta.foto || this.dadosPadrao.foto,
                    modelo3d: conta.modelo3d || (conta.avatar || ""), // Migração limpa para chaves antigas
                    bits: conta.bits !== undefined ? Number(conta.bits) : this.dadosPadrao.bits,
                    rank: conta.rank || this.dadosPadrao.rank
                };
            }
        } catch (error) {
            console.warn("⚠️ [ContaSistema] Acesso ao LocalStorage bloqueado ou corrompido. Usando dados virtuais.", error);
        }
        
        // Retorna uma cópia dos dados iniciais se nenhum registro for encontrado
        return { ...this.dadosPadrao };
    },

    /**
     * Salva as configurações estéticas do perfil mantendo os dados de progresso intactos.
     * @param {string} nome - Nickname do jogador
     * @param {string} gender - Gênero/Paleta de Neon ('masculino' ou 'feminino')
     * @param {string} avatarBase64 - String comprimida da foto ou arquivo 3D
     */
    salvar: function(nome, gender, avatarBase64) {
        try {
            // Puxa o estado atual completo (incluindo Bits e Rank já conquistados)
            const contaAtual = this.carregar();

            let fotoSalvar = contaAtual.foto;
            let modeloSalvar = contaAtual.modelo3d;

            if (avatarBase64) {
                if (avatarBase64.startsWith("data:image")) {
                    fotoSalvar = avatarBase64;
                } else {
                    modeloSalvar = avatarBase64;
                }
            }

            // Mesclagem Inteligente: Preserva o progresso econômico e atualiza a identidade
            const novosDados = {
                ...contaAtual, // Mantém intocados os Bits, Ranks e contratos salvos pelo Hub
                nome: nome ? nome.trim() : contaAtual.nome,
                gender: gender || contaAtual.gender,
                foto: fotoSalvar,
                modelo3d: modeloSalvar
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(novosDados));
            console.log("💾 [ContaSistema] Identidade sincronizada sem afetar seu saldo de jogo!");
            return true;
        } catch (error) {
            console.error("❌ [ContaSistema] Falha ao injetar dados no LocalStorage (Limite estourado?):", error);
            return false;
        }
    },

    /**
     * Gerenciador Econômico: Adiciona ou remove fundos diretamente das atividades do jogo.
     * @param {number} quantidade - Quantia a somar (positivo) ou subtrair (negativo)
     */
    modificarBits: function(quantidade) {
        try {
            const conta = this.carregar();
            conta.bits = Math.max(0, conta.bits + quantidade); // Impede que o saldo fique negativo
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conta));
            console.log(`🪙 [ContaSistema] Balanço atualizado: ${conta.bits} BT`);
            return conta.bits;
        } catch (error) {
            console.error("❌ [ContaSistema] Erro nas operações financeiras locais:", error);
            return 0;
        }
    },

    /**
     * Gerenciador de Patentes: Promove ou altera a classificação competitiva do jogador.
     * @param {string} novoRank - String identificadora do novo Rank (ex: 'Elite', 'Ciborgue')
     */
    definirRank: function(novoRank) {
        try {
            if (!novoRank) return false;
            const conta = this.carregar();
            conta.rank = novoRank.trim();
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conta));
            console.log(`🏆 [ContaSistema] Nova classificação definida: ${conta.rank}`);
            return true;
        } catch (error) {
            console.error("❌ [ContaSistema] Não foi possível atualizar o Rank local:", error);
            return false;
        }
    },

    /**
     * Remove completamente o registro local do ecossistema.
     */
    limpar: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log("🧹 [ContaSistema] Memória limpa e conta desvinculada.");
            return true;
        } catch (error) {
            console.error("❌ [ContaSistema] Falha ao limpar o banco de dados local:", error);
            return false;
        }
    }
};
