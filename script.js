// ==========================================
// 1. FUNÇÕES GLOBAIS ORIGINAIS
// ==========================================

// FUNÇÃO DE PESQUISA COM NAVEGAÇÃO POR ENTER
let searchResults = [];
let currentResultIndex = -1;
let lastSearchTerm = '';

function fazerBusca() {
    var termo = document.getElementById("input-pesquisa").value.toLowerCase().trim();

    if (termo == "") {
        return;
    }

    // Se o termo mudou, reinicia a busca
    if (termo !== lastSearchTerm) {
        lastSearchTerm = termo;
        currentResultIndex = -1;
        
        // Remove highlighting anterior
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
            el.classList.add('search-found');
        });

        // Busca em todo o body
        searchResults = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentNode;
        const nodesToReplace = [];
        
        while (currentNode = walker.nextNode()) {
            if (currentNode.textContent.toLowerCase().includes(termo)) {
                nodesToReplace.push(currentNode);
            }
        }

        // Substitui o texto e destaca
        nodesToReplace.forEach(node => {
            const regex = new RegExp(`(${termo})`, 'gi');
            const fragment = document.createElement('div');
            fragment.innerHTML = node.textContent.replace(regex, '<span class="search-found" style="background-color: #ffd700; padding: 2px 4px; border-radius: 3px; cursor: pointer;">$1</span>');
            
            while (fragment.firstChild) {
                node.parentNode.insertBefore(fragment.firstChild, node);
            }
            node.parentNode.removeChild(node);
            
            // Armazena os spans destacados
            const spans = fragment.querySelectorAll('.search-found');
            spans.forEach(span => searchResults.push(span));
        });
    }

    // Move para o próximo resultado
    if (searchResults.length > 0) {
        currentResultIndex = (currentResultIndex + 1) % searchResults.length;
        
        // Remove destaque anterior
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
            el.classList.add('search-found');
        });

        // Adiciona destaque ao resultado atual
        searchResults[currentResultIndex].classList.add('search-highlight');
        searchResults[currentResultIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// ==========================
// 3. LÓGICA DO SAC (FEEDBACK)
// ==========================
function inicializarSAC() {
    const textarea = document.getElementById('sac-text');
    if (!textarea) return; // não é a página de contato

    const counter = document.getElementById('sac-counter');
    const form = document.getElementById('sac-form');
    const submitBtn = document.getElementById('sac-submit');
    const clearBtn = document.getElementById('sac-clear');
    const messageBox = document.getElementById('sac-message');
    const list = document.getElementById('sac-list');
    const MAX = parseInt(textarea.getAttribute('maxlength') || '1000', 10);

    function updateCounter() {
        const len = textarea.value.trim().length;
        counter.innerText = len + ' / ' + MAX;
    }

    function loadList() {
        const saved = JSON.parse(localStorage.getItem('sacFeedbacks') || '[]');
        list.innerHTML = '';
        if (saved.length === 0) {
            list.innerHTML = '<div style="color:#666;font-size:13px;padding:8px;">Nenhuma mensagem enviada ainda.</div>';
            return;
        }
        saved.slice().reverse().forEach(entry => {
            const div = document.createElement('div');
            div.className = 'sac-entry';
            const dt = new Date(entry.ts);
            div.innerHTML = `<div style="font-size:13px;color:#666;margin-bottom:4px;">${dt.toLocaleString()}</div><div>${escapeHtml(entry.text)}</div>`;
            list.appendChild(div);
        });
    }

    function escapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    textarea.addEventListener('input', updateCounter);
    updateCounter();

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const value = textarea.value.trim();
        if (value.length < 5) {
            alert('Por favor escreva uma mensagem mais detalhada (mínimo 5 caracteres).');
            return;
        }

        // salva no localStorage
        const saved = JSON.parse(localStorage.getItem('sacFeedbacks') || '[]');
        saved.push({ text: value, ts: Date.now() });
        localStorage.setItem('sacFeedbacks', JSON.stringify(saved));

        // feedback visual
        messageBox.style.display = 'block';
        setTimeout(() => { messageBox.style.display = 'none'; }, 3500);

        textarea.value = '';
        updateCounter();
        loadList();
    });

    clearBtn.addEventListener('click', function() {
        textarea.value = '';
        updateCounter();
    });

    // carrega lista ao iniciar
    loadList();
}

window.addEventListener('DOMContentLoaded', inicializarSAC);

// Listener para Enter no input de pesquisa
window.addEventListener('DOMContentLoaded', function() {
    const inputPesquisa = document.getElementById('input-pesquisa');
    if (inputPesquisa) {
        inputPesquisa.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                fazerBusca();
            }
        });
    }
});


// ==========================
// 5. BOTÃO VOLTAR AO TOPO + LAZY LOADING + ANIMAÇÕES
// ==========================
function initScrollFeatures() {
    const scrollBtn = document.getElementById('scrollToTop');
    
    // Mostrar/ocultar botão ao scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollBtn?.classList.add('show');
        } else {
            scrollBtn?.classList.remove('show');
        }
    });
    
    // Clique no botão
    scrollBtn?.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Lazy loading de imagens com Intersection Observer
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    if (images.length === 0) return;
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '50px' });
    
    images.forEach(img => imageObserver.observe(img));
}

// Animações ao scroll com Intersection Observer
function initScrollAnimations() {
    const elements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
    if (elements.length === 0) return;
    
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                animationObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => animationObserver.observe(el));
}

window.addEventListener('DOMContentLoaded', function() {
    initScrollFeatures();
    initLazyLoading();
    initScrollAnimations();
});

// Garante que os elementos apareçam
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".fade-in, .slide-in-left, .slide-in-right")
        .forEach(el => {
            el.classList.add("visible");
        });
});