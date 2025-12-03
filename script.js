/* ===================== FIREBASE CONFIG ===================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, setDoc, doc,
    addDoc, query, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const horarioSelect = document.getElementById("horario"); // substitui horariosContainer
const nomeInput = document.getElementById("nome"); // certifique-se de ter <input id="nome">
const confirmarBtn = document.querySelector(".cta-btn"); // botão "Confirmar no WhatsApp"

let horarioSelecionado = null;
let horariosOcupados = [];

const horariosFixos = [
    "09:00","09:30","10:00","10:30",
    "11:00","11:30","13:00","13:30",
    "14:00","14:30","15:00","15:30",
    "16:00","16:30"
];

// 🔥 OUVE EM TEMPO REAL TODOS AGENDAMENTOS DA DATA
function ouvirHorariosOcupados(dataSelecionada) {
    const q = query(
        collection(db, "agendamentos"),
        where("data", "==", dataSelecionada)
    );

    onSnapshot(q, (snapshot) => {
        horariosOcupados = snapshot.docs.map(doc => doc.data().horario);
        renderizarHorarios();
    });
}

// Atualiza <select> com horários disponíveis
function renderizarHorarios() {
    horarioSelect.innerHTML = '<option value="">Selecione...</option>';

    horariosFixos.forEach(hora => {
        const option = document.createElement("option");
        option.value = hora;
        option.textContent = hora;

        if (horariosOcupados.includes(hora)) {
            option.disabled = true;
        }

        if (horarioSelecionado === hora) {
            option.selected = true;
        }

        horarioSelect.appendChild(option);
    });
}

// Atualiza horarioSelecionado ao escolher no <select>
horarioSelect.addEventListener("change", () => {
    horarioSelecionado = horarioSelect.value;
});

// Atualiza ao mudar data
dataInput.addEventListener("change", () => {
    const data = dataInput.value;
    horarioSelecionado = null;
    horariosOcupados = [];

    if (data) {
        ouvirHorariosOcupados(data);
    }
});

// Confirmar agendamento e salvar no Firebase
confirmarBtn.addEventListener("click", async () => {
    const data = dataInput.value;
    const nome = nomeInput.value;

    if (!data || !horarioSelecionado || !nome) {
        alert("Preencha todos os campos!");
        return;
    }

    const q = query(
        collection(db, "agendamentos"),
        where("data", "==", data),
        where("horario", "==", horarioSelecionado)
    );

    const resultado = await getDocs(q);

    if (!resultado.empty) {
        alert("Esse horário acabou de ser ocupado. Escolha outro.");
        return;
    }

    await addDoc(collection(db, "agendamentos"), {
        nome: nome,
        data: data,
        horario: horarioSelecionado
    });

    alert("Agendado com sucesso!");
    renderizarHorarios(); // atualiza select imediatamente
});


/* ===================== ENVIAR PARA WHATSAPP ===================== */

window.enviarWhatsApp = async function () {

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

    // Verifica novamente se o horário já está ocupado (atualizado em tempo real)
    const q = query(
        collection(db, "agendamentos"),
        where("data", "==", data),
        where("horario", "==", horarioSelecionado)
    );

    const resultado = await getDocs(q);

    if (!resultado.empty) {
        alert("Esse horário acabou de ser ocupado. Escolha outro.");
        renderizarHorarios(); // atualiza a lista imediatamente
        return;
    }

    // Salva no Firebase antes de abrir WhatsApp
    await addDoc(collection(db, "agendamentos"), {
        nome: nome,
        data: data,
        horario: horarioSelecionado
    });

    // Monta a mensagem de WhatsApp
    let listaServicos = "";
    let total = 0;

    selecionados.forEach(item => {
        listaServicos += `• ${item.nome} — R$ ${item.preco.toFixed(2)}\n`;
        total += item.preco;
    });

    const endereco = "📍 Endereço: Rua Chile, n°32, Bairro Crispim, Itapecerica da Serra";

    const msg = encodeURIComponent(
        `Olá! Meu nome é ${nome} e gostaria de agendar:\n` +
        `📅 *Data:* ${data}\n` +
        `⏰ *Horário:* ${horarioSelecionado}\n\n` +
        `Resumo dos serviços:\n${listaServicos}\n` +
        `Total: R$ ${total.toFixed(2)}\n\n${endereco}`
    );

    // Abre WhatsApp
    window.open(`https://wa.me/5511991421107?text=${msg}`, "_blank");

    // Limpa seleção para evitar duplicidade visual
    horarioSelecionado = null;
    horarioSelect.value = "";
    selecionados = [];
    atualizarResumo();
    renderizarHorarios();
}

// Liga botão WhatsApp ao JS
const btnWhatsApp = document.querySelector(".cta-btn");
btnWhatsApp.addEventListener("click", enviarWhatsApp)

