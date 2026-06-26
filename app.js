// app.js - Controle da Interface Pro (UI Perfil)

// Captura segura dos elementos da interface (compatível com perfil.html)
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
const usernameInput = document.getElementById('usernameInput');
const genderInput = document.getElementById('genderInput');
const userDisplay = document.getElementById('userDisplay');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');

// Elementos de exibição da economia do Hub
const hubBits = document.getElementById('hubBits');
const hubRank = document.getElementById('hubRank');

// Estado interno controlado por reatividade
let fotoBase64Atual = "";

/**
 * 1. INICIALIZAÇÃO: Renderiza os dados locais e aplica o tema visual
 */
function carregarDadosNaTela() {
    const usuario = ContaSistema.carregar();
    
    // Injeção de textos e inputs
    if (userDisplay) userDisplay.textContent = usuario.nome;
    if (usernameInput) usernameInput.value = usuario.nome;
    if (genderInput) genderInput.value = usuario.gender || "masculino";
    
    // Atualização dos recursos financeiros e patentes
    if (hubBits) hubBits.textContent = `${usuario.bits} BT`;
    if (hubRank) hubRank.textContent = usuario.rank;
    
    // Sincronização do preview de imagem
    if (avatarPreview) {
        avatarPreview.src = usuario.foto;
        fotoBase64Atual = usuario.foto;
        aplicarNeonDinamico(usuario.gender);
    }
}

/**
 * Auxiliar: Altera a paleta neon do avatar baseado no gênero selecionado
 */
function aplicarNeonDinamico(genero) {
    if (!avatarPreview) return;
    
    if (genero === 'feminino') {
        avatarPreview.style.borderColor = '#ff007f';
        avatarPreview.style.boxShadow = '0 0 20px rgba(255, 0, 127, 0.35)';
    } else {
        avatarPreview.style.borderColor = '#00f0ff';
        avatarPreview.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.35)';
    }
}

// Escuta ativa do DOM para carregamento inicial
window.addEventListener('DOMContentLoaded', carregarDadosNaTela);

/**
 * 2. REATIVIDADE VISUAL: Altera o neon em tempo real ao mudar o seletor
 */
if (genderInput) {
    genderInput.addEventListener('change', (e) => {
        aplicarNeonDinamico(e.target.value);
    });
}

/**
 * 3. COMPRESSÃO VIA CANVAS: Reduz a foto para 128x128 para evitar lag no Socket.io
 */
if (avatarInput) {
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert("Por favor, selecione um arquivo de imagem válido (PNG/JPG).");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.src = event.target.result;
                img.onload = function() {
                    // Instancia um canvas invisível em memória para processamento de vfx
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Define o tamanho ideal e ultra-leve para tráfego de rede estável
                    canvas.width = 128;
                    canvas.height = 128;
                    
                    // Desenha a imagem redimensionando para o quadrado perfeito
                    ctx.drawImage(img, 0, 0, 128, 128);
                    
                    // Converte para string compacta JPEG com 80% de qualidade
                    fotoBase64Atual = canvas.toDataURL('image/jpeg', 0.8);
                    avatarPreview.src = fotoBase64Atual;
                };
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * 4. PERSISTÊNCIA SEGURA: Salva os dados sem corromper as variáveis da carteira
 */
if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        const novoNome = usernameInput.value.trim();
        const novoGenero = genderInput.value;
        
        if (novoNome === "") {
            alert("Por favor, digite um nome de usuário válido.");
            return;
        }

        // Executa o salvamento com o spread seguro implementado no conta.js
        // (Isso protege o modelo3d, bits e rank automaticamente contra apagamentos)
        const sucesso = ContaSistema.salvar(novoNome, novoGenero, fotoBase64Atual);
        
        if (sucesso) {
            if (userDisplay) userDisplay.textContent = novoNome;
            alert("Sincronização concluída! Seu perfil global foi atualizado.");
        } else {
            alert("Erro crítico ao salvar as alterações no banco local.");
        }
    });
}

/**
 * 5. RESET DE INSTÂNCIA: Limpa o armazenamento e restaura o estado padrão
 */
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (confirm("Deseja mesmo resetar e excluir os dados locais da sua conta? Todo o progresso será perdido.")) {
            ContaSistema.limpar();
            carregarDadosNaTela(); // Força a UI a voltar para o "Jogador_Novo"
        }
    });
}
