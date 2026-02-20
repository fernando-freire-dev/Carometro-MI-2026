const conteudo = document.getElementById("conteudo");

const turmas = {
    "Fundamental": ["6A","6B","6C","7A","7B","7C","8A","8B","9A","9B","9C"],
    "Medio": ["1A","1B","1C","2A","2B","2C","3A","3B","3C"]
};

let dados = JSON.parse(localStorage.getItem("alunos")) || {};
let alunoSelecionado = null;
let filtroStatus = "ativo";

function salvarDados() {
    localStorage.setItem("alunos", JSON.stringify(dados));
}

function mostrarEnsinos() {
    conteudo.innerHTML = `
        <h2>Escolha o tipo de ensino</h2>
        <div class="grid">
            <div class="card" onclick="mostrarTurmas('Fundamental')">Ensino Fundamental</div>
            <div class="card" onclick="mostrarTurmas('Medio')">Ensino Médio</div>
        </div>
    `;
}

function mostrarTurmas(tipo) {
    let html = `<h2>Turmas do ${tipo}</h2><div class="grid">`;

    turmas[tipo].forEach(turma => {
        html += `<div class="card" onclick="mostrarTurma('${tipo}','${turma}')">${turma}</div>`;
    });

    html += `</div>
        <button class="botao-voltar" onclick="mostrarEnsinos()">Voltar</button>
    `;

    conteudo.innerHTML = html;
}

function mostrarTurma(tipo, turma) {

    if (!dados[tipo]) dados[tipo] = {};
    if (!dados[tipo][turma]) dados[tipo][turma] = [];

    alunoSelecionado = null;

    let html = `
        <div class="topo-turma">
            <button class="botao-voltar" onclick="mostrarTurmas('${tipo}')">← Voltar</button>
            <h2>Turma ${turma}</h2>
            <div></div>
        </div>

        <div class="upload-box">
            <input type="file" id="upload" accept=".xlsx, .xls"/>
            <button onclick="lerPlanilha('${tipo}','${turma}')">Carregar Planilha</button>
        </div>

        <div class="filtros">
            <button onclick="mudarFiltro('ativo')" class="${filtroStatus === 'ativo' ? 'ativo' : ''}">Ativos</button>
            <button onclick="mudarFiltro('inativo')" class="${filtroStatus === 'inativo' ? 'ativo' : ''}">Inativos</button>
        </div>

        <div class="conteudo-turma">
            <div class="lista-container">
                <div class="campo-busca">
                    <input type="text" id="buscaAluno" placeholder="Buscar aluno..." onkeyup="filtrarAlunos()">
                </div>
                <div id="listaAlunos">
    `;

    dados[tipo][turma].forEach(aluno => {
        if (aluno.status !== filtroStatus) return;

        html += `
            <div class="aluno" 
                data-nome="${aluno.nome.toLowerCase()}"
                id="aluno-${aluno.id}"
                onclick="toggleFoto('${turma}', ${aluno.id}, '${aluno.nome}')">
                ${aluno.nome}
            </div>
        `;
    });

    html += `
                </div>
            </div>
            <div class="foto-container" id="fotoContainer"></div>
        </div>
    `;

    conteudo.innerHTML = html;
}

function mudarFiltro(status) {
    filtroStatus = status;
    const botoes = document.querySelectorAll(".filtros button");
    botoes.forEach(btn => btn.classList.remove("ativo"));
    event.target.classList.add("ativo");

    const tipoAtual = document.querySelector(".topo-turma h2").innerText.includes("Turma")
        ? document.querySelector(".topo-turma button").getAttribute("onclick").match(/'(.*?)'/)[1]
        : null;

    mostrarTurma(tipoAtual, document.querySelector(".topo-turma h2").innerText.replace("Turma ",""));
}

function lerPlanilha(tipo, turma) {

    const input = document.getElementById("upload");
    const file = input.files[0];

    if (!file) {
        alert("Selecione uma planilha.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {

        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, {header: 1});

        const alunos = json
            .filter(linha => linha[0] && linha[1])
            .map(linha => ({
                id: linha[0],
                nome: linha[1],
                status: linha[2] ? linha[2].toLowerCase() : "ativo"
            }));

        dados[tipo][turma] = alunos;

        salvarDados();
        mostrarTurma(tipo, turma);
    };

    reader.readAsArrayBuffer(file);
}

function toggleFoto(turma, id, nome) {

    const fotoContainer = document.getElementById("fotoContainer");

    if (alunoSelecionado === id) {
        fotoContainer.innerHTML = "";
        document.getElementById(`aluno-${id}`).classList.remove("selecionado");
        alunoSelecionado = null;
        return;
    }

    if (alunoSelecionado) {
        const anterior = document.getElementById(`aluno-${alunoSelecionado}`);
        if (anterior) anterior.classList.remove("selecionado");
    }

    alunoSelecionado = id;

    document.getElementById(`aluno-${id}`).classList.add("selecionado");

    const caminho = `fotos/${turma}/${id}.jpg`;

    fotoContainer.innerHTML = `
        <div class="foto-box">
            <h3>${nome}</h3>
            <img src="${caminho}" onerror="this.src='semfoto.jpg'">
        </div>
    `;
}

function filtrarAlunos() {
    const termo = document.getElementById("buscaAluno").value.toLowerCase();
    const alunos = document.querySelectorAll("#listaAlunos .aluno");

    alunos.forEach(aluno => {
        const nome = aluno.getAttribute("data-nome");
        aluno.style.display = nome.includes(termo) ? "block" : "none";
    });
}

mostrarEnsinos();
