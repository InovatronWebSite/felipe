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

    formData.append("text", text);
    formData.append("description", desc);

    const images = document.getElementById("todoImage").files;
    for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
    }

    const pdf = document.getElementById("todoPdf").files[0];
    if (pdf) formData.append("pdf", pdf);

    const word = document.getElementById("todoWord").files[0];
    if (word) formData.append("word", word);

    const res = await fetch("https://backend-production-30ee.up.railway.app/atividades", {
        method: "POST",
        body: formData
    });

    const data = await res.json();
    console.log(data);

    if (!res.ok) {
        alert("Erro ao salvar atividade");
        return;
    }

    loadTodos();
}

async function loadTodos() {
    try {
        const res = await fetch("https://backend-production-30ee.up.railway.app/atividades");

        if (!res.ok) throw new Error("Erro no servidor");

        const data = await res.json();

        renderTodos(data);

    } catch (err) {
        console.error("Erro ao carregar atividades:", err);
    }
}

function toggleImages(id) {
    const todo = myTodos.find(t => t.id === id);
    if (todo) {
        todo.showImages = !todo.showImages;
        saveAndRenderTodos();
    }
}

function toggleTodo(id) {
    const todo = myTodos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveAndRenderTodos();
    }
}

function deleteTodo(id) {
    const confirmacao = confirm("Tem certeza que deseja excluir esta atividade?");

    if (!confirmacao) return;

    myTodos = myTodos.filter(t => t.id !== id);
    saveAndRenderTodos();
}

function saveAndRenderTodos() {
    localStorage.setItem('userTodos', JSON.stringify(myTodos));
    renderTodos();
}

function renderTodos(todos) {
    const container = document.getElementById('todoListDisplay');
    container.innerHTML = "";

    todos.forEach(todo => {
        let imagesHTML = "";
        let filesHTML = "";

        if (todo.images) {
            todo.images.forEach(img => {
                imagesHTML += `<img src="https://backend-production-30ee.up.railway.app/uploads/${img}" width="100">`;
            });
        }

        if (todo.pdf) {
            filesHTML += `<a href="https://backend-production-30ee.up.railway.app/uploads/${todo.pdf}" download>📄 PDF</a>`;
        }

        if (todo.word) {
            filesHTML += `<a href="https://backend-production-30ee.up.railway.app/uploads/${todo.word}" download>📝 Word</a>`;
        }

        container.innerHTML +=
            `<div class="todo-item">
                <h3>${todo.text}</h3>
                <p>${todo.description}</p>
                <div>${imagesHTML}</div>
                <div>${filesHTML}</div>
            </div>
        `;
    });
}

let currentImages = [];
let currentIndex = 0;

function openGallery(todoId, index) {
    const todo = myTodos.find(t => t.id === todoId);
    if (!todo) return;

    currentImages = todo.images;
    currentIndex = index;

    document.getElementById('imageModal').style.display = 'flex';
    updateImage();
}

function closeGallery() {
    document.getElementById('imageModal').style.display = 'none';
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

function createNewPoll() {
    const q = document.getElementById('pollQuestion').value.trim();
    const optionInputs = document.querySelectorAll('.poll-option');
    const opts = [];

    optionInputs.forEach(input => {
        const value = input.value.trim();
        if (value !== "") {
            opts.push(value);
        }
    });

    if (!q || opts.length < 2) {
        alert("Digite a pergunta e pelo menos 2 opções válidas!");
        return;
    }

    polls.push({
        id: 'p' + Date.now(),
        question: q,
        options: opts,
        votes: new Array(opts.length).fill(0)
    });

    localStorage.setItem('myPolls', JSON.stringify(polls));
    renderPolls();

    document.getElementById('pollQuestion').value = "";

    const container = document.getElementById('optionsContainer');
    container.innerHTML = `
        <div class="option-item">
            <input type="text" class="poll-option" placeholder="Opção 1">
            <button class onclick="removeOption(this)">✖</button>
        </div>
        <div class="option-item">
            <input type="text" class="poll-option" placeholder="Opção 2">
            <button onclick="removeOption(this)">✖</button>
        </div>
    `;
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

function renderPolls() {
    const pollColors = ['#d4af37', '#333', '#888', '#b86a6a', '#9ddd37', '#8a31df', '#37b8d4', '#d4379e', '#d4b837', '#6ad437'];
    const container = document.getElementById('pollsContainer');
    container.innerHTML = polls.map(p => `
        <div class="poll-card">
            <button onclick="deletePoll('${p.id}')" style="color:red; background:none; border:none; cursor:pointer;">Excluir</button>
            <h3>${p.question}</h3>
            <div class="poll-options">
            ${p.options.map((o, i) => `
                <div class="poll-option-line">
                    <button 
                        onclick="vote('${p.id}', ${i})"
                        style="background:${pollColors[i]}; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer;"
                    >
                        ${o}
                    </button>

                    <span class="vote-info">
                        ${p.votes[i]} votos (${getPercentage(p.votes, i)}%)
                    </span>
                </div>
            `).join('')}
        </div>
            <canvas class="canvas" id="chart-${p.id}"></canvas>
            
        </div>
    `).join('');

    polls.forEach(p => {
        const ctx = document.getElementById(`chart-${p.id}`).getContext('2d');
        if (pollCharts[p.id]) pollCharts[p.id].destroy();

        pollCharts[p.id] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: p.options,
                datasets: [{
                    data: p.votes,
                    backgroundColor: pollColors.slice(0, p.options.length)
                }]
            }
        });
    });
}

function getPercentage(votes, index) {
    const total = votes.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    return ((votes[index] / total) * 100).toFixed(1);
}

function vote(id, idx) {
    const p = polls.find(x => x.id === id);
    p.votes[idx]++;
    localStorage.setItem('myPolls', JSON.stringify(polls));
    renderPolls();
}

function deletePoll(id) {
    polls = polls.filter(p => p.id !== id);
    localStorage.setItem('myPolls', JSON.stringify(polls));
    renderPolls();
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
    renderTodos();
    displayNotes();
    renderCalendar();
    renderChart();
    displaySuggestions();

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
        this.value = "";
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