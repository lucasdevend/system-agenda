/* ===================== SELEÇÃO DE SERVIÇOS ===================== */

const servicoCards = document.querySelectorAll(".servico-card");
const resumoBox = document.getElementById("resumo-box");
const listaResumo = document.getElementById("lista-resumo");
const totalResumo = document.getElementById("total-resumo");


let selecionados = [];

// clique nos cards
servicoCards.forEach(card => {
    card.addEventListener("click", () => {
        const nome = card.dataset.nome;
        const preco = Number(card.dataset.preco);

        // selecionado ↔ des-selecionado
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

// resumo dos serviços
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

document.addEventListener("DOMContentLoaded", () => {

    // horários fixos
    const horarios = [
        "09:00", "10:00", "11:00",
        "13:00", "14:00", "15:00",
        "16:00", "17:00"
    ];

    // carregar do localStorage
    let ocupados = JSON.parse(localStorage.getItem("agendamentos")) || [];

    const selectHorario = document.getElementById("horario");
    const listaOcupados = document.getElementById("ocupados");
    const inputData = document.getElementById("data");

    if (!selectHorario || !listaOcupados || !inputData) {
        console.error("ERRO: Elementos do agendamento não foram encontrados!");
        return;
    }

    /* ===== Bloquear datas antigas ===== */
    function bloquearDatasPassadas() {
        const hoje = new Date().toISOString().split("T")[0];
        inputData.setAttribute("min", hoje);
    }
    bloquearDatasPassadas();

                    /* ===== Atualizar lista de horários ===== */
    inputData.addEventListener("change", atualizarHorarios);

    function atualizarHorarios() {
        selectHorario.innerHTML = `<option value="">Selecione...</option>`;
        listaOcupados.innerHTML = "";

        const dataEscolhida = inputData.value;
        if (!dataEscolhida) return;

        const hoje = new Date().toISOString().split("T")[0];
        const agora = new Date();

        const ocupadosNoDia = ocupados.filter(o => o.data === dataEscolhida);

        horarios.forEach(h => {
            const jaOcupado = ocupadosNoDia.some(o => o.horario === h);

            let horarioPassado = false;
            if (dataEscolhida === hoje) {
                const [hh, mm] = h.split(":");
                const horaDate = new Date();
                horaDate.setHours(hh, mm, 0);

                if (horaDate.getTime() < agora.getTime()) {
                    horarioPassado = true;
                }
            }

            if (jaOcupado || horarioPassado) {
                const li = document.createElement("li");

                if (jaOcupado) {
                    li.textContent = `${h} — Ocupado (Data: ${dataEscolhida})`;
                    li.classList.add("ocupado");
                } else {
                    li.textContent = `${h} — Indisponível (Horário já passou)`;
                    li.classList.add("passado");
                }

                li.classList.add("animar-item");
                listaOcupados.appendChild(li);
            } else {
            selectHorario.innerHTML += `<option value="${h}">${h}</option>`;
        }
    });
}



    /* ===== Enviar WhatsApp + bloquear horário ===== */

    window.enviarWhatsApp = function () {
        const data = inputData.value;
        const hora = selectHorario.value;

        if (!data || !hora) {
            alert("Selecione data e horário.");
            return;
        }

        if (selecionados.length === 0) {
            alert("Selecione pelo menos um serviço!");
            return;
        }

        ocupados.push({ data, horario: hora });
        atualizarHorarios();

        // ===== RESUMO DOS SERVIÇOS =====
        let listaServicos = "";
        let total = 0;

        selecionados.forEach(item => {
            listaServicos += `• ${item.nome} — R$ ${item.preco.toFixed(2)}\n`;
            total += item.preco;
        });

        const endereco = "📍 Endereço: Rua Chile, n°32, Bairro Crispim, Itapecerica da Serra";

        const resumoFinal = `Resumo do Pedido:\n${listaServicos}\nTotal: R$ ${total.toFixed(2)}`;

        // ===== MENSAGEM COMPLETA =====
        const msg = encodeURIComponent(
            `Olá! Gostaria de agendar:\n` +
            `📅 *Data:* ${data}\n` +
            `⏰ *Horário:* ${hora}\n\n` +
            `${resumoFinal}\n\n${endereco}`
        );

        const numero = "5511991421107";

        window.open(`https://wa.me/${numero}?text=${msg}`, "_blank");
        
    };
});