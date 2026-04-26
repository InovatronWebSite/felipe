const logged = localStorage.getItem('loggedUser');

if (!logged) {
    window.location.href = "login.html";
}

function logout() {
    localStorage.removeItem('loggedUser');
    window.location.href = "login.html";
}




// Troca de Abas
function showSection(id) {
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

let myTodos = JSON.parse(localStorage.getItem('userTodos')) || [];
let selectedImages = [];
let selectedPdf = null;
let selectedWord = null;

async function addTodo() {

    const text = document.getElementById('todoInput').value;
    const desc = document.getElementById('todoDesc').value;

    const formData = new FormData();

    formData.append("user", logged);

    formData.append("text", text);
    formData.append("description", desc);

    const imageInput = document.getElementById("todoImage");

    for (let i = 0; i < imageInput.files.length; i++) {
        formData.append("images", imageInput.files[i]);
    }

    const pdf = document.getElementById("todoPdf").files[0];
    if (pdf) formData.append("pdf", pdf);

    const word = document.getElementById("todoWord").files[0];
    if (word) formData.append("word", word);

    const res = await fetch("https://backend-production-30ee.up.railway.app/atividades", {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        alert("Erro ao salvar");
        return;
    }

    // limpa depois de enviar
    document.getElementById('todoInput').value = "";
    document.getElementById('todoDesc').value = "";
    document.getElementById('todoPdf').value = "";
    document.getElementById('todoWord').value = "";
    document.getElementById('imagePreviewContainer').innerHTML = "";

    loadTodos();
}

async function loadTodos() {
    try {
        const logged = localStorage.getItem('loggedUser');

        const res = await fetch(
            `https://backend-production-30ee.up.railway.app/atividades?user=${logged}`
        );

        if (!res.ok) throw new Error("Erro no servidor");

        const data = await res.json();

        currentTodos = data;

        renderTodos(data);

    } catch (err) {
        console.error("Erro ao carregar atividades:", err);
    }
}

async function toggleImages(id) {
    try {
        await fetch(`https://backend-production-30ee.up.railway.app/atividades/${id}/toggle-imagens`, {
            method: "PUT"
        });

        loadTodos();
    } catch (err) {
        console.error(err);
    }
}

async function toggleTodo(id) {
    try {
        await fetch(`https://backend-production-30ee.up.railway.app/atividades/${id}/concluir`, {
            method: "PUT"
        });

        loadTodos();
    } catch (err) {
        console.error(err);
    }
}

async function deleteTodo(id) {
    const confirmacao = confirm("Tem certeza que deseja excluir?");
    if (!confirmacao) return;

    try {
        await fetch(`https://backend-production-30ee.up.railway.app/atividades/${id}`, {
            method: "DELETE"
        });

        loadTodos();
    } catch (err) {
        console.error(err);
    }
}
function saveAndRenderTodos() {
    localStorage.setItem('userTodos', JSON.stringify(myTodos));
    renderTodos();
}

function renderTodos(todos) {

    const container = document.getElementById('todoListDisplay');
    container.innerHTML = "";
    function formatFileName(name) {
        return name.replace(/^\d+-/, '');
    }

    todos.forEach(todo => {
        let imagesHTML = "";
        let filesHTML = "";

        if (todo.images && Number(todo.showImages) === 1) {
            todo.images.forEach((img, index) => {
                imagesHTML += `
                    <img 
                        src="https://backend-production-30ee.up.railway.app/uploads/${img}" 
                        width="100"
                        onclick="openGallery(${todo.id}, ${index})"
                    >
                `;
            });
        }

        if (todo.pdf) {
            filesHTML += `
                <div class="file-card pdf">
                    <a href="https://backend-production-30ee.up.railway.app/uploads/${todo.pdf}" target="_blank">
                        📄 <span>${formatFileName(todo.pdf)}</span>
                    </a>
                </div>
            `;
        }

        if (todo.word) {
            filesHTML += `
                <div class="file-card word">
                    <a href="https://backend-production-30ee.up.railway.app/uploads/${todo.word}" download>
                        📝 <span>${formatFileName(todo.word)}</span>
                    </a>
                </div>
            `;
        }

        container.innerHTML += `
            <div class="todo-item ${Number(todo.completed) === 1 ? 'completed' : ''}">
                <h3>${todo.text}</h3>
                <p>${todo.description}</p>

                <div class="todo-images">
                    ${imagesHTML}
                </div>

                <div class="files-container">
                    ${filesHTML}
                </div>

                <div class="todo-actions">
                    <button onclick="toggleImages(${todo.id})">
                        ${todo.showImages ? 'Ocultar imagens' : 'Mostrar imagens'}
                    </button>

                    <button onclick="toggleTodo(${todo.id})">
                        ${todo.completed ? 'Desmarcar' : 'Concluir'}
                    </button>

                    <button onclick="deleteTodo(${todo.id})">
                        Excluir
                    </button>
                </div>
            </div>
        `;
    });
}
let currentTodos = [];
let currentImages = [];
let currentIndex = 0;
function closeGallery() {
    document.getElementById('imageModal').style.display = 'none';
}
function openGallery(todoId, index) {
    const todo = currentTodos.find(t => t.id === todoId);
    if (!todo) return;

    currentImages = todo.images.map(img =>
        `https://backend-production-30ee.up.railway.app/uploads/${img}`
    );

    currentIndex = index;

    document.getElementById('imageModal').style.display = 'flex';
    updateImage();
}

function changeImage(direction) {
    currentIndex += direction;

    if (currentIndex < 0) {
        currentIndex = currentImages.length - 1;
    }

    if (currentIndex >= currentImages.length) {
        currentIndex = 0;
    }

    updateImage();
}

function updateImage() {
    document.getElementById('modalImage').src = currentImages[currentIndex];
}

// ENQUETES
let polls = JSON.parse(localStorage.getItem('myPolls')) || [];
let pollCharts = {};

async function createNewPoll() {
    const q = document.getElementById('pollQuestion').value.trim();
    const optionInputs = document.querySelectorAll('.poll-option');

    const opts = [];

    optionInputs.forEach(input => {
        const value = input.value.trim();
        if (value !== "") opts.push(value);
    });

    if (!q || opts.length < 2) {
        alert("Digite a pergunta e pelo menos 2 opções!");
        return;
    }

    try {
        const res = await fetch("https://backend-production-30ee.up.railway.app/polls", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user: logged,
                question: q,
                options: opts
            })
        });

        if (!res.ok) throw new Error("Erro ao criar enquete");

        document.getElementById('pollQuestion').value = "";

        loadPolls();

    } catch (err) {
        console.error(err);
        alert("Erro ao criar enquete");
    }
}

function addOption() {
    const container = document.getElementById('optionsContainer');

    if (!container) {
        alert("Erro: container de opções não encontrado!");
        return;
    }

    const count = container.children.length + 1;

    const div = document.createElement('div');
    div.className = 'option-item';

    div.innerHTML = `
        <input type="text" class="poll-option" placeholder="Opção ${count}">
        <button onclick="removeOption(this)">✖</button>
    `;

    container.appendChild(div);
}

function removeOption(btn) {
    const container = document.getElementById('optionsContainer');

    if (container.children.length <= 2) {
        alert("A enquete precisa de pelo menos 2 opções!");
        return;
    }

    btn.parentElement.remove();
}

function getColor(index) {
    const colors = [
        "#4facfe", // azul
        "#43e97b", // verde
        "#f7971e", // laranja
        "#a18cd1", // roxo
        "#ff6a88", // rosa
        "#00c9a7", // turquesa
        "#ffc75f"  // amarelo
    ];

    return colors[index % colors.length];
}

function renderPolls(polls) {
    const container = document.getElementById('pollsContainer');

    if (!polls || polls.length === 0) {
        container.innerHTML = "<p>Nenhuma enquete ainda.</p>";
        return;
    }

    container.innerHTML = polls.map(p => `
        <div class="poll-card">

            <button class="deletePoll" onclick="deletePoll('${p.id}')">Excluir</button>

            <h3>${p.question}</h3>

            <div class="poll-options">
                ${p.options.map((opt, i) => `
                    <div class="poll-option-line">
                        <button 
                            class="poll-btn"
                            style="background:${getColor(i)}"
                            onclick="vote('${p.id}', ${i})">
                            ${opt}
                        </button>

                        <span>
                            ${p.votes[i]} votos (${getPercentage(p.votes, i)}%)
                        </span>
                    </div>
                `).join('')}
            </div>

            <canvas id="chart-${p.id}" class="canvas"></canvas>

        </div>
    `).join('');
    polls.forEach(p => {
    const ctx = document.getElementById(`chart-${p.id}`);

    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut', 
        data: {
            labels: p.options,
            datasets: [{
                data: p.votes,
                backgroundColor: [
                    '#ff6384',
                    '#36a2eb',
                    '#ffce56',
                    '#4bc0c0',
                    '#9966ff'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
    function createCharts(polls) {
    polls.forEach(p => {
        const ctx = document.getElementById(`chart-${p.id}`);
        if (!ctx) return;

        // evita duplicar gráfico
        if (pollCharts[p.id]) {
            pollCharts[p.id].destroy();
        }

        pollCharts[p.id] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: p.options,
                datasets: [{
                    data: p.votes
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    });
    
}
});
}

async function loadPolls() {
    try {
        const res = await fetch("https://backend-production-30ee.up.railway.app/polls");

        if (!res.ok) throw new Error("Erro ao buscar enquetes");

        const data = await res.json();

        renderPolls(data);

    } catch (err) {
        console.error(err);
    }
}

function getPercentage(votes, index) {
    const total = votes.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    return ((votes[index] / total) * 100).toFixed(1);
}

async function vote(id, index) {
    const user = localStorage.getItem("loggedUser");

    const res = await fetch(`https://backend-production-30ee.up.railway.app/polls/${id}/vote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            optionIndex: index,
            user: user
        })
    });

    if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
    }

    loadPolls();
}
async function deletePoll(id) {
    if (!confirm("Deseja excluir essa enquete?")) return;

    try {
        const res = await fetch(`https://backend-production-30ee.up.railway.app/polls/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) throw new Error("Erro ao deletar");

        loadPolls();

    } catch (err) {
        console.error(err);
    }
}

// NOTAS
let myNotes = JSON.parse(localStorage.getItem('userNotesHistory')) || [];

function saveNote() {
    const input = document.getElementById('noteInput');
    const content = input.value.trim();

    if (content === "") {
        alert("Digite algo na nota antes de salvar!");
        return;
    }

    const newNote = {
        id: Date.now(),
        text: content,
        date: new Date().toLocaleString('pt-BR')
    };

    myNotes.unshift(newNote);
    localStorage.setItem('userNotesHistory', JSON.stringify(myNotes));

    input.value = "";
    displayNotes();
}

function displayNotes() {
    const container = document.getElementById('savedNotesList');
    if (!container) return;

    container.innerHTML = "";

    if (myNotes.length === 0) {
        container.innerHTML = "<p style='color: #999;'>Nenhuma nota salva ainda.</p>";
        return;
    }

    myNotes.forEach(note => {
        container.innerHTML += `
            <div class="note-item">
                <p>${note.text}</p>
                <small style="color: #999;">${note.date}</small>
                <button class="btn-delete-note" onclick="deleteNote(${note.id})">Excluir</button>
            </div>
        `;
    });
}

function deleteNote(id) {
    myNotes = myNotes.filter(n => n.id !== id);
    localStorage.setItem('userNotesHistory', JSON.stringify(myNotes));
    displayNotes();
}

// CALENDÁRIO
let currentMonth = 0;
const year = 2026;
let events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
let selectedDate = "";

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const display = document.getElementById('monthDisplay');
    grid.innerHTML = "";

    display.innerText = `${monthNames[currentMonth]} ${year}`;

    let firstDay = new Date(year, currentMonth, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="calendar-day empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${currentMonth}-${day}`;
        let eventHtml = "";

        if (events[dateKey]) {
            eventHtml = events[dateKey]
                .map(e => `<div class="event-tag">${e.text}</div>`)
                .join("");
        }

        grid.innerHTML += `
            <div class="calendar-day" onclick="openModal('${dateKey}', ${day})">
                <span class="day-number">${day}</span>
                ${eventHtml}
            </div>
        `;
    }
}

function openModal(dateKey, day) {
    selectedDate = dateKey;

    document.getElementById('selectedDateText').innerText =
        `Dia ${day} de ${monthNames[currentMonth]}`;

    document.getElementById('eventInput').value = "";

    const list = document.getElementById('eventList');
    list.innerHTML = "";

    if (events[dateKey]) {
        events[dateKey].forEach(ev => {
            list.innerHTML += `
                <div class="event-card">
                    <div class="event-info">
                        <span class="event-text">📌 ${ev.text}</span>
                    </div>

                    <button class="event-delete"
                        onclick="deleteSingleEvent('${dateKey}', ${ev.id})">
                        ✖
                    </button>
                </div>
            `;
        });
    }

    document.getElementById('eventModal').style.display = 'block';
}

function deleteSingleEvent(dateKey, id) {
    events[dateKey] = events[dateKey].filter(e => e.id !== id);

    if (events[dateKey].length === 0) {
        delete events[dateKey];
    }

    localStorage.setItem('calendarEvents', JSON.stringify(events));
    openModal(dateKey, parseInt(dateKey.split("-")[2]));
    renderCalendar();
}

function deleteEvent() {
    if (!selectedDate) return;

    const confirmacao = confirm("Deseja excluir este evento?");
    if (!confirmacao) return;

    delete events[selectedDate];

    localStorage.setItem('calendarEvents', JSON.stringify(events));
    renderCalendar();
    closeModal();
}

function changeMonth(step) {
    currentMonth += step;
    if (currentMonth > 11) currentMonth = 0;
    if (currentMonth < 0) currentMonth = 11;
    renderCalendar();
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}

function saveEvent() {
    const text = document.getElementById('eventInput').value.trim();
    if (!text) return;

    if (!events[selectedDate]) {
        events[selectedDate] = [];
    }

    events[selectedDate].push({
        id: Date.now(),
        text: text
    });

    localStorage.setItem('calendarEvents', JSON.stringify(events));
    renderCalendar();
    closeModal();
}

// GRÁFICO
let difficultyData = {
    labels: ['Matemática', 'Ciências da Natureza', 'Ciências Humanas', 'Linguagens'],
    datasets: [{
        label: 'Quantidade de Alunos com Dificuldade',
        data: [0, 0, 0, 0],
        backgroundColor: 'rgba(212, 175, 55, 0.6)',
        borderColor: '#d4af37',
        borderWidth: 1
    }]
};

let myChart;

function renderChart() {
    const ctx = document.getElementById('difficultyChart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: difficultyData,
        options: {
            responsive: true,
            maintainAspectRatio: false, // ESSENCIAL
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function addDifficultyQuick(subject) {
    const index = difficultyData.labels.indexOf(subject);

    if (index !== -1) {
        difficultyData.datasets[0].data[index]++;
    } else {
        difficultyData.labels.push(subject);
        difficultyData.datasets[0].data.push(1);
    }

    updateDifficultyUI();
}

function renderRanking() {
    const container = document.getElementById('difficultyRanking');

    let ranking = difficultyData.labels.map((label, i) => ({
        name: label,
        value: difficultyData.datasets[0].data[i]
    }));

    ranking.sort((a, b) => b.value - a.value);

    container.innerHTML = ranking.map((item, index) => `
        <div class="ranking-item ${index === 0 ? 'top' : ''}">
            <span>${index + 1}º - ${item.name}</span>
            <strong>${item.value} votos</strong>
        </div>
    `).join('');
}

function updateDifficultyUI() {
    renderChart();
    renderRanking();
}

function resetDifficulties() {
    const confirmacao = confirm("Tem certeza que deseja apagar todos os dados?");
    if (!confirmacao) return;

    difficultyData.labels = ['Matemática', 'Ciências da Natureza', 'Ciências Humanas', 'Linguagens'];
    difficultyData.datasets[0].data = [0, 0, 0, 0];

    updateDifficultyUI();
}


// SUGESTÕES
let suggestions = JSON.parse(localStorage.getItem('userSuggestions')) || [];

function addSuggestion() {
    const input = document.getElementById('suggestionInput');
    const text = input.value.trim();

    if (text === "") return alert("Escreve algo.");

    suggestions.unshift({
        text,
        date: new Date().toLocaleString('pt-PT')
    });

    localStorage.setItem('userSuggestions', JSON.stringify(suggestions));
    input.value = "";
    displaySuggestions();
}

function displaySuggestions() {
    const container = document.getElementById('suggestionsDisplay');
    if (!container) return;

    container.innerHTML = suggestions.length === 0
        ? "<p style='color:#999;'>Ainda não há sugestões.</p>"
        : suggestions.map(s => `
            <div class="suggestion-item">
                <p>${s.text}</p>
                <span>${s.date}</span>
            </div>
        `).join('');
}

// INICIALIZAÇÃO FINAL (TUDO JUNTO)
window.addEventListener('load', () => {
    loadTodos(); // ✅ agora sim
    displayNotes();
    renderCalendar();
    renderChart();
    displaySuggestions();
    loadPolls();

    const imageInput = document.getElementById('todoImage');
    const previewContainer = document.getElementById('imagePreviewContainer');

    imageInput.addEventListener('change', function () {
        const files = Array.from(this.files);

        if (selectedImages.length + files.length > 5) {
            alert("Máximo de 5 imagens no total!");
            this.value = "";
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();

            reader.onload = function (e) {
                selectedImages.push(e.target.result);

                const img = document.createElement('img');
                img.src = e.target.result;
                img.width = 100;

                previewContainer.appendChild(img);
            };

            reader.readAsDataURL(file);
        });

        // limpa o input pra poder selecionar mais depois
    });

    const pdfInput = document.getElementById('todoPdf');
    const pdfPreview = document.getElementById('pdfPreview');

    pdfInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            selectedPdf = {
                name: file.name,
                type: file.type,
                data: e.target.result
            };

            pdfPreview.innerHTML = `<p>📄 ${file.name}</p>`;
        };

        reader.readAsDataURL(file);
    });

    const wordInput = document.getElementById('todoWord');
    const wordPreview = document.getElementById('wordPreview');

    wordInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            selectedWord = {
                name: file.name,
                type: file.type,
                data: e.target.result
            };

            wordPreview.innerHTML = `<p>📝 ${file.name}</p>`;
        };

        reader.readAsDataURL(file);
    });
});

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');

    sidebar.classList.toggle('closed');
    content.classList.toggle('full');
}