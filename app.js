// app.js - Controle da Interface Pro (UI)

// Pegando os elementos do HTML de forma segura
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
const usernameInput = document.getElementById('usernameInput');
const userDisplay = document.getElementById('userDisplay');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');

// Variáveis de estado para não perder dados da conta ao salvar
let fotoBase64Atual = "";
let modelo3dAtual = "";
let genderAtual = "masculino";

/**
 * 1. Inicialização: Busca as informações da conta e renderiza na tela
 */
function carregarDadosNaTela() {
    const usuario = ContaSistema.carregar();
    
    // Atualiza os textos e inputs da UI
    userDisplay.textContent = usuario.nome;
    usernameInput.value = usuario.nome;
    avatarPreview.src = usuario.foto;
    
    // Preserva o estado atual nos bastidores
    fotoBase64Atual = usuario.foto;
    modelo3dAtual = usuario.modelo3d;
    genderAtual = usuario.gender;
}

// Escuta o carregamento do navegador para ativar a função
window.addEventListener('DOMContentLoaded', carregarDadosNaTela);

/**
 * 2. Upload de Imagem: Converte a nova foto de perfil para Base64
 */
if (avatarInput) {
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validação simples para garantir que é uma imagem
            if (!file.type.startsWith('image/')) {
                alert("Por favor, selecione um arquivo de imagem válido (PNG/JPG).");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                // Guarda a string da imagem e atualiza o preview redondo na tela
                fotoBase64Atual = event.target.result;
                avatarPreview.src = fotoBase64Atual; 
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * 3. Ação de Salvar: Atualiza o banco local sem corromper os dados secundários
 */
if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        const novoNome = usernameInput.value.trim();
        
        if (novoNome === "") {
            alert("Por favor, digite um nome de usuário válido.");
            return;
        }

        // Passa os parâmetros na nova ordem do conta.js
        // Passamos a fotoBase64Atual para o slot de avatar. O conta.js sabe que é uma imagem e salvará em .foto
        const sucesso = ContaSistema.salvar(novoNome, genderAtual, fotoBase64Atual);
        
        if (sucesso) {
            // Se o usuário tiver um modelo3d guardado de algum jogo, nós precisamos garantir que ele não suma
            // Esta linha garante que o modelo3d anterior continue intacto na persistência
            if (modelo3dAtual) {
                const contaReatualizada = ContaSistema.carregar();
                ContaSistema.salvar(contaReatualizada.nome, contaReatualizada.gender, fotoBase64Atual);
                // Injeta diretamente o modelo de volta caso o motor precise reordenar
                let dadosBrutos = JSON.parse(localStorage.getItem(ContaSistema.STORAGE_KEY));
                dadosBrutos.modelo3d = modelo3dAtual;
                localStorage.setItem(ContaSistema.STORAGE_KEY, JSON.stringify(dadosBrutos));
            }

            // Atualiza o texto principal da tela
            userDisplay.textContent = novoNome;
            alert("Sua conta global foi atualizada com sucesso!");
        } else {
            alert("Erro ao salvar as alterações. Verifique o console.");
        }
    });
}

/**
 * 4. Botão Opcional: Limpar a conta direto pela interface
 */
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (confirm("Deseja mesmo excluir os dados locais da sua conta?")) {
            ContaSistema.limpar();
            carregarDadosNaTela(); // Reseta a interface para o "Jogador_Novo"
        }
    });
}
