const token = localStorage.getItem('token');
if (!token || token === 'undefined') {
    window.location.href = 'login.html';
}

let allTasks = [];

async function loadTasks() {
    try {
        const res = await fetch('/tasks', { headers: { 'Authorization': `Bearer ${token}` } });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        allTasks = (await res.json()).tasks;
        renderTasks(allTasks);

    } catch (err) {
        console.error(err);
    }
}

function renderTasks(tasks) {
    const grid = document.getElementById('task-grid');

    if (!tasks.length) {
        grid.innerHTML = '<p>No tasks found</p>';
        document.querySelector('.results-count').textContent = 'Showing 0 results';
        return;
    }

    grid.innerHTML = tasks.map(task => `
        <article class="task-card" data-id="${task.id}" data-poster="${task.poster_id}" data-claimed="${task.claimed}">
            <div class="task-image">
                <img src="${task.image_location || 'assets/Placeholder.png'}" alt="${task.title}">
            </div>
            <div class="task-content">
                <h3 class="task-title">${task.title}</h3>
                <p class="task-description">${task.description}</p>
            </div>
            <div class="task-meta">
                <span class="task-category">${task.category}</span>
                <span class="task-volunteers">${task.volunteers_needed} volunteer(s) needed</span>
                <span class="task-status ${task.status}">${task.status}</span>
            </div>
        </article>
    `).join('');

    document.querySelector('.results-count').textContent = `Showing ${tasks.length} results`;
}

document.getElementById('search-input').addEventListener('input', e => {
    const input_ = e.target.value.toLowerCase().trim();
    renderTasks(allTasks.filter(t =>
        (t.title || '').toLowerCase().includes(input_) ||
        (t.description || '').toLowerCase().includes(input_) ||
        (t.category || '').toLowerCase().includes(input_)
    ));
});

loadTasks();