/**
 * --- LÓGICA DO JOGO (APP.JS) ---
 * Gerencia a comunicação com o servidor Socket.io, economia e o estado da partida.
 */

// 1. Inicialização de Perfil Seguro via conta.js
const meuPerfilLocal = ContaSistema.carregar();
const meuNomeConfirmado = meuPerfilLocal.nome;
const minhaFotoConfirmada = meuPerfilLocal.foto;

// Atualiza o header assim que o app inicia através do core do sistema
if (typeof ContaSistema.atualizarUI === 'function') {
    ContaSistema.atualizarUI();
}
 
// 2. Conexão com o Servidor Multiplayer
const URL_SERVIDOR = "https://jogo-da-velha-t0jl.onrender.com"; 
const socket = io(URL_SERVIDOR);

// 3. Estados Globais do Jogo
let minhaSala = "";
let meuSimbolo = ""; 
let meuTurno = false;
let vitoriasX = 0;
let vitoriasO = 0;
let tabuleiroEstado = ["", "", "", "", "", "", "", "", ""];

// Elementos da Interface
const casas = document.querySelectorAll('.casa');
const statusText = document.getElementById('status');
const lobby = document.getElementById('tela-lobby');
const jogoArea = document.getElementById('area-jogo');
const FOTO_PADRAO = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// --- OUVINTES DE EVENTOS SOCKET.IO ---

// Recebe a lista de salas e desenha no lobby
socket.on('lista-salas', (salas) => {
    const container = document.getElementById('lista-salas-container');
    if (!container) return;
    container.innerHTML = "";
    
    if (!salas || salas.length === 0) {
        container.innerHTML = '<div class="no-salas">Nenhuma matriz aberta. Inicie uma nova!</div>';
        return;
    }
    
    salas.forEach(sala => {
        if (sala.jogadores < 2) {
            const fotoDono = sala.donoFoto || FOTO_PADRAO;
            const nomeDono = sala.donoNome || "Desconhecido";

            const item = document.createElement('div');
            item.className = 'item-sala';
            item.innerHTML = `
                <div class="sala-info-bloco">
                    <img class="sala-dono-avatar" src="${fotoDono}" alt="Dono">
                    <div class="sala-detalhes">
                        <span class="sala-nome-txt">${sala.nome}</span>
                        <span class="sala-vagas">Criador: ${nomeDono} (${sala.jogadores}/2)</span>
                    </div>
                </div>
                <button onclick="entrarNaSala('${sala.nome}')">Conectar</button>
            `;
            container.appendChild(item);
        }
    });
});

// Atribuição de time/símbolo (X ou O)
socket.on('player-assignment', (dados) => {
    const simbolo = typeof dados === 'object' ? dados.simbolo : dados;
    meuSimbolo = simbolo;

    if (simbolo === "X") {
        statusText.innerText = "Você é o Player 1 [X]. Aguardando oponente...";
        document.getElementById('p1-name').innerText = meuNomeConfirmado;
        document.getElementById('p1-avatar').src = minhaFotoConfirmada;
        meuTurno = true;
    } else {
        statusText.innerText = "Você é o Player 2 [O]. Sincronizando rodada...";
        document.getElementById('p2-name').innerText = meuNomeConfirmado;
        document.getElementById('p2-avatar').src = minhaFotoConfirmada;
        meuTurno = false;
    }
    resgatarVez();
});

// Sincronização Inteligente da Sala (Evita o sumiço do seu avatar na esquerda)
socket.on('room-info', (info) => {
    if (!meuSimbolo || !info) return;

    if (meuSimbolo === "X") {
        document.getElementById('p1-name').innerText = meuNomeConfirmado;
        document.getElementById('p1-avatar').src = minhaFotoConfirmada;
        
        if (info.p2) {
            document.getElementById('p2-name').innerText = info.p2.nome;
            document.getElementById('p2-avatar').src = (info.p2.foto && info.p2.foto.length > 10) ? info.p2.foto : FOTO_PADRAO;
        } else {
            document.getElementById('p2-name').innerText = "Aguardando...";
            document.getElementById('p2-avatar').src = FOTO_PADRAO;
        }
    } 
    else if (meuSimbolo === "O") {
        document.getElementById('p2-name').innerText = meuNomeConfirmado;
        document.getElementById('p2-avatar').src = minhaFotoConfirmada;
        
        if (info.p1) {
            document.getElementById('p1-name').innerText = info.p1.nome;
            document.getElementById('p1-avatar').src = (info.p1.foto && info.p1.foto.length > 10) ? info.p1.foto : FOTO_PADRAO;
        } else {
            document.getElementById('p1-name').innerText = "Aguardando...";
            document.getElementById('p1-avatar').src = FOTO_PADRAO;
        }
    }
    resgatarVez();
});

// Início oficial do jogo (Dois players na sala)
socket.on('start-game', () => {
    resgatarVez();
});

// Captura jogada do oponente
socket.on('move-made', (dados) => {
    fazerJogadaLocal(dados.index, dados.simbolo);
});

// W.O. ou desconexão prematura
socket.on('player-disconnected', () => {
    statusText.innerText = "Oponente desconectou da rede! Ganhador por W.O.";
    
    // Registra vitória por abandono e paga recompensa parcial de W.O.
    sincronizarVitoriaNoPerfil();
    if (typeof ContaSistema.modificarBits === 'function') {
        ContaSistema.modificarBits(25);
    }
    
    setTimeout(() => location.reload(), 3000);
});

// --- FUNÇÕES DE CONTROLE DE FLUXO ---

function entrarNaSala(nomeSala) {
    minhaSala = nomeSala;
    lobby.style.display = "none";
    jogoArea.style.display = "block";
    statusText.innerText = "Negociando chaves com o servidor...";

    socket.emit('entrar-na-sala', {
        sala: minhaSala,
        jogadorNome: meuNomeConfirmado,
        jogadorFoto: minhaFotoConfirmada
    });
}

// Evento de clique no Tabuleiro
casas.forEach(casa => {
    casa.addEventListener('click', () => {
        const idx = casa.getAttribute('data-index');
        if (!meuTurno || tabuleiroEstado[idx] !== "") return;

        fazerJogadaLocal(idx, meuSimbolo);
        socket.emit('make-move', { sala: minhaSala, index: idx, simbolo: meuSimbolo });
    });
});

function fazerJogadaLocal(index, simbolo) {
    tabuleiroEstado[index] = simbolo;
    if (casas[index]) casas[index].innerText = simbolo;
    meuTurno = (simbolo !== meuSimbolo);
    
    if (!checarResultado()) {
        resgatarVez();
    }
}

function resgatarVez() {
    const vezDoP1 = (meuTurno && meuSimbolo === "X") || (!meuTurno && meuSimbolo === "O");
    statusText.innerText = vezDoP1 ? "Sua vez de jogar!" : "Aguardando ação do oponente...";
    
    // Liga/Desliga as bordas neon dinâmicas baseado rigorosamente na classe .ativo
    document.getElementById('p1-display').classList.toggle('ativo', vezDoP1);
    document.getElementById('p2-display').classList.toggle('ativo', !vezDoP1);
    
    // Preserva os dados locais ativos no painel
    if (meuSimbolo === "X") {
        document.getElementById('p1-name').innerText = meuNomeConfirmado;
        document.getElementById('p1-avatar').src = minhaFotoConfirmada;
    } else if (meuSimbolo === "O") {
        document.getElementById('p2-name').innerText = meuNomeConfirmado;
        document.getElementById('p2-avatar').src = minhaFotoConfirmada;
    }
}

function checarResultado() {
    const caminhosVitoria = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];

    for (const caminho of caminhosVitoria) {
        const [a, b, c] = caminho;
        if (tabuleiroEstado[a] && tabuleiroEstado[a] === tabuleiroEstado[b] && tabuleiroEstado[a] === tabuleiroEstado[c]) {
            finalizarRodada(tabuleiroEstado[a], caminho);
            return true;
        }
    }

    if (!tabuleiroEstado.includes("")) {
        finalizarRodada("Empate");
        return true;
    }
    return false;
}

function finalizarRodada(vencedor, caminhoGanhador = null) {
    meuTurno = false;
    
    if (vencedor === "Empate") {
        statusText.innerText = "Empate Técnico na Matrix!";
    } else {
        if (caminhoGanhador) {
            caminhoGanhador.forEach(i => { if (casas[i]) casas[i].setAttribute('data-venceu', 'true'); });
        }
        if (vencedor === "X") vitoriasX++;
        if (vencedor === "O") vitoriasO++;

        document.getElementById('score-x').innerText = vitoriasX;
        document.getElementById('score-o').innerText = vitoriasO;

        statusText.innerText = vencedor === meuSimbolo ? "Você venceu a rodada!" : "O oponente quebrou seu sinal!";
    }

    setTimeout(() => {
        if (vitoriasX === 3 || vitoriasO === 3) {
            const vencedorPartida = vitoriasX === 3 ? "X" : "O";
            
            if (meuSimbolo === vencedorPartida) {
                sincronizarVitoriaNoPerfil();
                if (typeof ContaSistema.modificarBits === 'function') ContaSistema.modificarBits(50);
                alert("🏆 VITÓRIA DO SISTEMA! Você faturou +50 Bits!");
            } else {
                if (typeof ContaSistema.modificarBits === 'function') ContaSistema.modificarBits(5);
                alert("💀 CONEXÃO PERDIDA: Oponente fechou a melhor de 3. +5 Bits.");
            }
            
            location.reload();
        } else {
            proximaRodada();
        }
    }, 2500);
}

function proximaRodada() {
    tabuleiroEstado = ["", "", "", "", "", "", "", "", ""];
    casas.forEach(casa => {
        casa.innerText = "";
        casa.removeAttribute('data-venceu');
    });
    meuTurno = (meuSimbolo === "O" && (vitoriasX + vitoriasO) % 2 !== 0) || (meuSimbolo === "X" && (vitoriasX + vitoriasO) % 2 === 0);
    resgatarVez();
}

/**
 * Extrai o progresso atualizado de vitórias de forma dinâmica e incrementa 
 * diretamente na partição de Saves e Nível do conta.js
 */
function sincronizarVitoriaNoPerfil() {
    const dadosAtuais = ContaSistema.carregar();
    const strVitórias = (dadosAtuais.saves && dadosAtuais.saves["Jogo da Velha"]) || "0 vitórias";
    
    let totalVitorias = parseInt(strVitórias.replace(/[^0-9]/g, '')) || 0;
    totalVitorias++;
    
    ContaSistema.atualizarProgresso('saves', 'Jogo da Velha', `${totalVitorias} vitórias`);
    
    const novoNivel = Math.floor(totalVitorias / 3) + 1;
    ContaSistema.atualizarProgresso('saves', 'Nível', String(novoNivel));
    ContaSistema.atualizarProgresso('memorias', 'Última Vitória', new Date().toLocaleDateString() + ' - Jogo da Velha');
}

// Botões de Interação direta da Interface
if (document.getElementById('btn-criar')) {
    document.getElementById('btn-criar').addEventListener('click', () => {
        let nomeSala = document.getElementById('input-sala').value.trim();
        if (!nomeSala) {
            nomeSala = `GRID_${Math.floor(Math.random() * 899 + 100)}`;
        }
        entrarNaSala(nomeSala);
    });
}

if (document.getElementById('btn-sair')) {
    document.getElementById('btn-sair').addEventListener('click', () => {
        socket.emit('sair-da-sala', minhaSala);
        location.reload();
    });
}
