// Adiciona um "ouvinte de eventos" que espera todo o conteúdo HTML da página ser carregado antes de executar o código dentro dele.
// Isso garante que elementos como '.card-container' já existam quando o script tentar manipulá-los.
document.addEventListener("DOMContentLoaded", () => {
    // Exemplo de como acessar a chave de API do arquivo config.js
    // ATENÇÃO: Chaves de API no lado do cliente (frontend) podem ser vistas por qualquer pessoa.
    // Use isso apenas para chaves que são seguras para serem expostas ou que possuem restrições
    // de uso (por exemplo, restritas ao seu domínio no painel do Google Cloud).
    console.log("Chave de API carregada:", GOOGLE_API_KEY);

    // Inicia o carregamento das ferramentas
    carregarFerramentas();

    // Configura os eventos para o campo de busca
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", aplicarFiltros);
    // Adiciona um evento de clique para o botão de busca
    const searchButton = document.getElementById("botao-busca");
    searchButton.addEventListener("click", aplicarFiltros);

    // Configura os eventos para o botão "Voltar ao topo"
    setupBackToTopButton();
});

// Declara uma variável global para armazenar a lista de todas as ferramentas depois de carregadas do JSON.
let todasAsFerramentas = [];
// Declara uma variável global para armazenar o filtro de tag ativo.
let filtroTagAtivo = "Todas";

// Função assíncrona (async) para buscar os dados do arquivo data.json.
async function carregarFerramentas() {
    // O bloco 'try...catch' é usado para tratar possíveis erros durante a busca do arquivo.
    try {
        // 'fetch' busca o arquivo. 'await' pausa a execução até que a busca seja concluída.
        const resposta = await fetch("data.json");
        // Converte a resposta em formato JSON. 'await' pausa até que a conversão termine.
        todasAsFerramentas = await resposta.json();
        // Chama a função para criar os botões de filtro de tags.
        renderizarTags();
        // Chama a função para criar os cards na tela, passando a lista de ferramentas como argumento.
        renderizarCards(todasAsFerramentas);
    } catch (error) {
        // Se ocorrer um erro no bloco 'try', ele será capturado aqui e exibido no console do navegador.
        console.error("Erro ao carregar o arquivo data.json:", error);
    }
}

// Função responsável por criar e exibir os cards na página.
function renderizarCards(ferramentas) {
    // Seleciona o elemento HTML que tem a classe '.card-container'. É aqui que os cards serão inseridos.
    const cardContainer = document.querySelector(".card-container");
    // Limpa qualquer conteúdo que já exista dentro do contêiner. Isso evita duplicatas se a função for chamada mais de uma vez.
    cardContainer.innerHTML = "";

    // Inicia uma variável para controlar o atraso da animação de cada card.
    let animationDelay = 0;

    // Inicia um loop 'for...of' para percorrer cada 'ferramenta' dentro da lista 'ferramentas'.
    for (const ferramenta of ferramentas) {
        // Cria um novo elemento HTML <article> na memória.
        const article = document.createElement("article");
        // Adiciona a classe 'card' ao elemento <article>, para que ele receba os estilos definidos no CSS.
        article.classList.add("card");
        // Aplica a animação 'fadeIn' ao card com um atraso escalonado.
        // 'forwards' garante que o card permaneça visível após a animação.
        article.style.animation = `fadeIn 0.4s ease-out ${animationDelay}s forwards`;
        // Define o conteúdo HTML interno do <article> usando uma template string (delimitada por crases ``).
        // Isso permite inserir as variáveis (como ${ferramenta.nome}) diretamente no texto.

        // Cria o HTML para as tags da ferramenta.
        const tagsHtml = ferramenta.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('');

        article.innerHTML = `
            <h2>${ferramenta.nome}</h2>
            <p>${ferramenta.introdução}</p>
            <p>${ferramenta.descrição}</p>
            <div class="card-tags">${tagsHtml}</div>
            <a href="${ferramenta.link}" target="_blank">Saiba mais</a>
        `;
        // Adiciona o <article> recém-criado como um filho do 'cardContainer', tornando-o visível na página.
        cardContainer.appendChild(article);

        // Aumenta o atraso para o próximo card, criando o efeito cascata.
        animationDelay += 0.08;
    }

    // Se, após o loop, nenhum card foi renderizado (lista de ferramentas vazia), exibe uma mensagem.
    if (ferramentas.length === 0) {
        cardContainer.innerHTML = `<p class="no-results">Nenhuma ferramenta encontrada.</p>`;
    }
}

// --- LÓGICA DE FILTROS (TAGS E BUSCA) ---

// Função para criar e exibir os botões de filtro de tags.
function renderizarTags() {
    const tagContainer = document.getElementById("tag-container");
    // Extrai todas as tags de todas as ferramentas, cria um Set para obter valores únicos, e converte de volta para um array.
    const todasAsTags = [...new Set(todasAsFerramentas.flatMap(ferramenta => ferramenta.tags))];
    todasAsTags.sort(); // Ordena as tags em ordem alfabética.

    // Cria o botão "Todas" e o adiciona ao contêiner.
    let tagsHtml = `<button class="tag-btn active" data-tag="Todas">Todas</button>`;
    // Cria um botão para cada tag única.
    tagsHtml += todasAsTags.map(tag => `<button class="tag-btn" data-tag="${tag}">${tag}</button>`).join('');

    tagContainer.innerHTML = tagsHtml;

    // Adiciona ouvintes de evento a todos os botões de tag.
    document.querySelectorAll('.tag-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            filtroTagAtivo = e.target.dataset.tag;
            // Atualiza a classe 'active' para o botão clicado.
            document.querySelector('.tag-btn.active').classList.remove('active');
            e.target.classList.add('active');
            aplicarFiltros();
        });
    });
}

// Função central que aplica tanto o filtro de tag quanto o de busca.
function aplicarFiltros() {
    // Pega o texto digitado, remove espaços em branco no início/fim e converte para minúsculas.
    const termoBusca = searchInput.value.trim().toLowerCase();

    let ferramentasFiltradas = todasAsFerramentas;

    // 1. Filtra por tag (se não for "Todas")
    if (filtroTagAtivo !== "Todas") {
        ferramentasFiltradas = ferramentasFiltradas.filter(ferramenta =>
            ferramenta.tags.includes(filtroTagAtivo)
        );
    }

    // 2. Filtra por termo de busca (se houver algum)
    if (termoBusca) {
        ferramentasFiltradas = ferramentasFiltradas.filter(ferramenta =>
            (
                ferramenta.nome.toLowerCase().includes(termoBusca) ||
                ferramenta.introdução.toLowerCase().includes(termoBusca) ||
                ferramenta.descrição.toLowerCase().includes(termoBusca) ||
                ferramenta.tags.some(tag => tag.toLowerCase().includes(termoBusca)) // Também busca nas tags
            )
        );
    }

    // Chama a função 'renderizarCards' novamente, mas desta vez com a lista já filtrada.
    renderizarCards(ferramentasFiltradas);
};

// --- LÓGICA PARA O BOTÃO "VOLTAR AO TOPO" ---

function setupBackToTopButton() {
    // Seleciona o botão no documento HTML pelo seu ID.
    const backToTopButton = document.getElementById("back-to-top-btn");

    // Função que decide se o botão deve ser mostrado ou escondido.
    const scrollFunction = () => {
        // Se a rolagem vertical for maior que 300 pixels...
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            backToTopButton.style.display = "block"; // ...mostra o botão.
        } else {
            backToTopButton.style.display = "none"; // ...senão, esconde o botão.
        }
    };

    // Adiciona um "ouvinte de eventos" que observa a rolagem da janela.
    window.addEventListener("scroll", scrollFunction);

    // Adiciona um "ouvinte de eventos" para o clique no botão.
    backToTopButton.addEventListener("click", () => {
        // Rola a página para o topo (posição 0) com uma animação suave.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}