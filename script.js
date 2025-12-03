/* ===================== FIREBASE CONFIG ===================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDrkxJHq0zmjTdTBGyCNSVdxanECvD7gh8",
    authDomain: "emillyfirfebase.firebaseapp.com",
    projectId: "emillyfirfebase",
    storageBucket: "emillyfirfebase.firebasestorage.app",
    messagingSenderId: "24875221884",
    appId: "1:24875221884:web:ebae868d5fcc109d8cdaf9",
    measurementId: "G-J2BPH5TRGB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===================== SELEÇÃO DE SERVIÇOS ===================== */
const servicoCards = document.querySelectorAll(".servico-card");
const resumoBox = document.getElementById("resumo-box");
const listaResumo = document.getElementById("lista-resumo");
const totalResumo = document.getElementById("total-resumo");

let selecionados = [];

servicoCards.forEach(card => {
    card.addEventListener("click", () => {
        const nome = card.dataset.nome;
        const preco = Number(card.dataset.preco);

        if (card.classList.contains("selected")) {
            card.classList.remove("selected");
            selecionados = selecionados.filter(item => item.nome !== nome);
        } else {
            card.classList.add("selected");
            selecionados.push({ nome, preco });
        }

        atualizarResumo();
    });
});

function atualizarResumo() {
    listaResumo.innerHTML = "";
    if (selecionados.length === 0) {
        resumoBox.style.display = "none";
        return;
    }
    resumoBox.style.display = "block";

    let total = 0;
    selecionados.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.nome} — R$ ${item.preco.toFixed(2)}`;
        listaResumo.appendChild(li);
        total += item.preco;
    });
    totalResumo.textContent = `Total: R$ ${total.toFixed(2)}`;
}
/* ===================== AGENDAMENTO ===================== */
const dataInput = document.getElementById("data");
const horarioSelect = document.getElementById("horario");
const nomeInput = document.getElementById("nome");
const ocupadosList = document.getElementById("ocupados"); // NOVO: lista de horários ocupados
let horarioSelecionado = null;
let horariosOcupados = [];

const horariosFixos = [
    "08:00","09:00","10:00",
    "11:00","12:00","13:00","13:30",
    "14:00"
];

function ouvirHorariosOcupados(dataSelecionada) {
    const q = query(collection(db, "agendamentos"), where("data", "==", dataSelecionada));
    onSnapshot(q, snapshot => {
        horariosOcupados = snapshot.docs.map(doc => doc.data().horario);
        renderizarHorarios();
    });
}

function renderizarHorarios() {
    // Limpa select e lista de ocupados
    horarioSelect.innerHTML = '<option value="">Selecione...</option>';
    ocupadosList.innerHTML = "";

    horariosFixos.forEach(hora => {
        const option = document.createElement("option");
        option.value = hora;
        option.textContent = hora;

        if (horariosOcupados.includes(hora)) {
            option.disabled = true;

            // Adiciona horário ocupado na lista de baixo
            const li = document.createElement("li");
            li.textContent = hora;
            ocupadosList.appendChild(li);
        }

        if (horarioSelecionado === hora) option.selected = true;
        horarioSelect.appendChild(option);
    });
}

horarioSelect.addEventListener("change", () => horarioSelecionado = horarioSelect.value);

const avisoDias = document.getElementById("aviso-dias");

dataInput.addEventListener("change", () => {
    if (!dataInput.value) return;

    const partes = dataInput.value.split("-"); // ["YYYY","MM","DD"]
    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // JS: 0 = Janeiro
    const dia = parseInt(partes[2], 10);

    const data = new Date(ano, mes, dia);
    const diaSemana = data.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça...

    if (diaSemana !== 0 && diaSemana !== 2) {
        alert("Somente terças e domingos estão disponíveis para agendamento.");
        avisoDias.style.display = "block"; // mostra aviso
        dataInput.value = "";
        horarioSelecionado = null;
        horariosOcupados = [];
        renderizarHorarios();
        return;
    }

    // dia válido: atualiza horários ocupados
    avisoDias.style.display = "none"; // esconde aviso se dia válido
    horarioSelecionado = null;
    horariosOcupados = [];
    ouvirHorariosOcupados(dataInput.value);
});


/* ===================== FUNÇÃO WHATSAPP ===================== */
function enviarWhatsApp() {
    const data = dataInput.value;
    const nome = nomeInput.value;

    if (!data || !horarioSelecionado || !nome) {
        alert("Preencha todos os campos!");
        return;
    }
    if (selecionados.length === 0) {
        alert("Selecione pelo menos um serviço!");
        return;
    }

    // Monta mensagem WhatsApp
    let listaServicos = "";
    let total = 0;
    selecionados.forEach(item => {
        listaServicos += `• ${item.nome} — R$ ${item.preco.toFixed(2)}\n`;
        total += item.preco;
    });

    const endereco = "📍 Endereço: Rua Chile, n°32, Bairro Crispim, Itapecerica da Serra";
    const msg = encodeURIComponent(
        `Olá! Meu nome é ${nome} e gostaria de agendar:\n📅 Data: ${data}\n⏰ Horário: ${horarioSelecionado}\n\nResumo dos serviços:\n${listaServicos}Total: R$ ${total.toFixed(2)}\n\n${endereco}`
    );

    // Abre WhatsApp imediatamente
    window.open(`https://wa.me/5511991421107?text=${msg}`, "_blank");

    // Salva no Firebase depois, sem bloquear o popup
    addDoc(collection(db,"agendamentos"), { nome, data, horario: horarioSelecionado })
        .then(() => {
            horarioSelecionado = null;
            horarioSelect.value = "";
            selecionados = [];
            atualizarResumo();
            renderizarHorarios();
        })
        .catch(err => console.error("Erro ao salvar agendamento:", err));
}

/* ===================== LIGA BOTÃO ===================== */
document.addEventListener("DOMContentLoaded", () => {
    const btnWhatsApp = document.getElementById("btn-whatsapp");
    if (btnWhatsApp) {
        btnWhatsApp.addEventListener("click", enviarWhatsApp);
    }
});
