// FUNÇÃO DE PESQUISA

function fazerBusca() {

    var termo =
    document.getElementById("input-pesquisa").value;

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
    var botao =
    document.getElementById("botao-tema");


    // ALTERA O TEXTO DO BOTÃO
    if (corpoDoSite.classList.contains("modo-escuro")) {

        botao.innerText = "Modo Claro";

    } else {

        botao.innerText = "Mudar Clima";

    }

}