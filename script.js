// ==========================================
// 1. FUNÇÕES GLOBAIS ORIGINAIS
// ==========================================

// FUNÇÃO DE PESQUISA
function fazerBusca() {
    var termo = document.getElementById("input-pesquisa").value;

    if (termo == "") {
        alert("Digite algo para pesquisar!");
    } else {
        alert("Você pesquisou por: " + termo);
    }
}

// FUNÇÃO DO MODO ESCURO
function mudarCorFundo() {
    // PEGA O BODY
    var corpoDoSite = document.body;

    // ADICIONA OU REMOVE A CLASSE
    corpoDoSite.classList.toggle("modo-escuro");

    // PEGA O BOTÃO
    var botao = document.getElementById("botao-tema");

    // ALTERA O TEXTO DO BOTÃO
    if (corpoDoSite.classList.contains("modo-escuro")) {
        botao.innerText = "Modo Claro";
    } else {
        botao.innerText = "Mudar Clima";
    }
}

// ==========================================
// 2. LÓGICA DOS PONTOS DE COLETA E MAPA INTERATIVO
// ==========================================

// Banco de dados dos pontos de coleta (Estados, Cidades e Endereços)
const pontosColeta = {
    "Minas Gerais (MG)": [
        { cidade: "Uberlândia", coord: [-18.8856, -48.2612], endereco: "Av. Paulo Roberto Cunha Santos, 1200 - Distrito Industrial", detalhe: "Polo Triângulo: Recebimento de frotas pesadas e sucatas." },
        { cidade: "Belo Horizonte", coord: [-19.9641, -44.0215], endereco: "Av. Cardeal Eugênio Tisserant, 450 - Barreiro", detalhe: "Polo Central: Escoamento de resíduos metálicos industriais." },
        { cidade: "João Monlevade", coord: [-19.8145, -43.1768], endereco: "Praça Rodrigo Cotta, s/n - Centro (Área Industrial)", detalhe: "Polo Aciaria: Conexão ferroviária para alta densidade." }
    ],
    "São Paulo (SP)": [
        { cidade: "Guarulhos", coord: [-23.4412, -46.4022], endereco: "Av. Orlanda Bérgamo, 620 - Cumbica", detalhe: "Polo Guarulhos: Hub de consolidação e prensagem de macrolotes." },
        { cidade: "Sorocaba", coord: [-23.4611, -47.4089], endereco: "Av. Jerome Case, 1800 - Zona Industrial", detalhe: "Polo Sorocaba: Captação de cavacos e sobras de usinagem." }
    ],
    "Espírito Santo (ES)": [
        { cidade: "Serra", coord: [-20.1415, -40.2563], endereco: "Av. Talma Rodrigues Ribeiro, 4500 - Civit II", detalhe: "Polo Civit: Abastecimento direto para usinas de reciclagem." },
        { cidade: "Cariacica", coord: [-20.3542, -40.3985], endereco: "Rodovia Governador José Sette, Km 6.5 - Alto Lage", detalhe: "Polo Cariacica: Pátio ferroviário para logística reversa." }
    ],
    "Rio de Janeiro (RJ)": [
        { cidade: "Duque de Caxias", coord: [-22.7410, -43.2842], endereco: "Rodovia Washington Luíz, Km 10 - Campos Elíseos", detalhe: "Polo Caxias: Pátio conectado ao Arco Metropolitano." },
        { cidade: "Volta Redonda", coord: [-22.5185, -44.0924], endereco: "Av. Almirante Adalberto de Barros Nunes, 3000 - Retiro", detalhe: "Polo Sul Fluminense: Retorno imediato de obsolescência metalúrgica." }
    ]
};

// Função para abrir/fechar as abas laterais dos estados
function toggleEstado(elemento) {
    const lista = elemento.nextElementSibling;
    const seta = elemento.querySelector('.seta');
    if (lista.style.display === 'none') {
        lista.style.display = 'block';
        seta.innerText = '▲';
    } else {
        lista.style.display = 'none';
        seta.innerText = '▼';
    }
}

// Inicializador principal do Mapa (SÓ roda se encontrar os elementos na página)
function inicializarMapaColeta() {
    const mapaContainer = document.getElementById('map');
    const accordionContainer = document.querySelector('.accordion-coleta');

    // Validação de segurança: se não for a página de coleta, não executa o código abaixo
    if (!mapaContainer || !accordionContainer) return;

    // Inicializa o mapa focado no Brasil
    const map = L.map('map').setView([-15.7938, -47.8828], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Adiciona o recurso do Street View (Pegman)
    new L.Pegman({
        position: 'topleft',
        theme: 'leaflet-pegman-v3'
    }).addTo(map);

    // Ícone personalizado de caminhãozinho verde para os marcadores
    const greenTruckIcon = L.divIcon({
        html: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="30" height="30">
                <path fill="#479270" d="M0 48C0 21.5 21.5 0 48 0l336 0c26.5 0 48 21.5 48 48l0 320c0 26.5-21.5 48-48 48l-48 0c0 44.2-35.8 80-80 80s-80-35.8-80-80l-64 0c0 44.2-35.8 80-80 80s-80-35.8-80-80l-16 0c-26.5 0-48-21.5-48-48L0 48zM547.1 212.9c9.4 9.4 9.4 24.6 0 33.9L491.9 302c-1.5 1.5-3.4 2.7-5.5 3.5l0 78.5c0 13.3-10.7 24-24 24l-16 0c0-44.2-35.8-80-80-80s-80 35.8-80 80l-14.1 0L432 160l67.1 0c6.4 0 12.5 2.5 17 7l31 31z"/>
            </svg>
        `,
        className: 'custom-truck-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -28]
    });

    // Constrói dinamicamente a lista lateral e os pontos no mapa
    Object.keys(pontosColeta).forEach((estado, index) => {
        const stateGroup = document.createElement('div');
        stateGroup.className = 'state-group';
        
        stateGroup.innerHTML = `
            <div class="state-title" onclick="toggleEstado(this)">
                <span>${estado}</span>
                <span class="seta">${index === 0 ? '▲' : '▼'}</span>
            </div>
            <div class="city-list" style="display: ${index === 0 ? 'block' : 'none'};"></div>
        `;
        
        const cityListContainer = stateGroup.querySelector('.city-list');
        
        pontosColeta[estado].forEach(ponto => {
            // Adiciona marcador no mapa
            const marker = L.marker(ponto.coord, { icon: greenTruckIcon }).addTo(map);
            
            const popupContent = `
                <div class="popup-conteudo">
                    <h3>🏭 ArcelorMittal - ${ponto.cidade}</h3>
                    <p><strong>Endereço:</strong> ${ponto.endereco}</p>
                    <p><em>${ponto.detalhe}</em></p>
                </div>
            `;
            marker.bindPopup(popupContent);
            
            // Adiciona item na barra lateral
            const cityItem = document.createElement('div');
            cityItem.className = 'city-item';
            cityItem.innerHTML = `
                <strong>Polo ${ponto.cidade}</strong>
                <span>📍 ${ponto.endereco}</span>
            `;
            
            // Ao clicar no item lateral, move o mapa até o local
            cityItem.addEventListener('click', function() {
                map.setView(ponto.coord, 15);
                marker.openPopup();
            });
            
            cityListContainer.appendChild(cityItem);
        });
        
        accordionContainer.appendChild(stateGroup);
    });

    // Ajuste de tamanho para evitar falhas visuais do Leaflet
    setTimeout(() => { map.invalidateSize(); }, 200);
}

// Dispara a função assim que o DOM estiver pronto
window.addEventListener('DOMContentLoaded', inicializarMapaColeta);