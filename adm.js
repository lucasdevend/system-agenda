import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// ===== Configuração do Firebase =====
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_ID",
    appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elemento da lista de agendamentos
const listaAgendamentos = document.getElementById("lista-agendamentos");

// ===== Função para carregar agendamentos =====
async function carregarAgendamentos() {
    listaAgendamentos.innerHTML = ""; // Limpa a lista

    const querySnapshot = await getDocs(collection(db, "agendamentos"));

    if (querySnapshot.empty) {
        const li = document.createElement("li");
        li.textContent = "Nenhum agendamento encontrado.";
        listaAgendamentos.appendChild(li);
        return;
    }

    querySnapshot.forEach((docSnap) => {
        const agendamento = docSnap.data();

        // Se os serviços estiverem armazenados como array
        const servicos = Array.isArray(agendamento.servicos) 
            ? agendamento.servicos.join(", ") 
            : agendamento.servicos;

        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.justifyContent = "space-between";
        li.style.padding = "6px 10px";
        li.style.marginBottom = "6px";
        li.style.border = "1px solid #ddd";
        li.style.borderRadius = "6px";
        li.style.backgroundColor = "#fff";

        // Texto do agendamento
        const span = document.createElement("span");
        span.textContent = `${agendamento.data} — ${agendamento.horario} — ${servicos}`;

        // Botão de cancelar
        const btn = document.createElement("button");
        btn.textContent = "Cancelar";
        btn.style.backgroundColor = "#ff4fa1";
        btn.style.color = "#fff";
        btn.style.border = "none";
        btn.style.borderRadius = "6px";
        btn.style.padding = "4px 10px";
        btn.style.cursor = "pointer";
        btn.style.marginLeft = "10px";
        btn.onclick = async () => {
            btn.disabled = true; // previne múltiplos cliques
            try {
                await deleteDoc(doc(db, "agendamentos", docSnap.id));
                carregarAgendamentos(); // atualiza lista
            } catch (error) {
                alert("Erro ao cancelar agendamento!");
                console.error(error);
                btn.disabled = false;
            }
        };

        li.appendChild(span);
        li.appendChild(btn);
        listaAgendamentos.appendChild(li);
    });
}

// Carrega os agendamentos ao abrir a página
carregarAgendamentos();
