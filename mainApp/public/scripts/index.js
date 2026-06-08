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
        <article class="task-card" data-id="${task.id}">
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

    grid.querySelectorAll('.task-card').forEach(card => {
        const task = allTasks.find(t => t.id == card.dataset.id);
        card.addEventListener('click', () => openModal(task));
    });
}

// filters
function applyFilters() {

    let filtered = [...allTasks];

    // search
    const search = document.getElementById('search-input').value.toLowerCase().trim();

    if (search) {
        filtered = filtered.filter(task =>
            (task.title || '').toLowerCase().includes(search) ||
            (task.description || '').toLowerCase().includes(search) ||
            (task.category || '').toLowerCase().includes(search)
        );
    }

    // status filters
    const statusFilters = [];

    if (document.getElementById('open').checked)
        statusFilters.push('open');

    if (document.getElementById('closed').checked)
        statusFilters.push('closed');

    if (document.getElementById('Progress').checked)
        statusFilters.push('in progress');

    if (statusFilters.length > 0) {
        filtered = filtered.filter(task =>
            statusFilters.includes((task.status || '').toLowerCase())
        );
    }

    // category filters
    const categoryFilters = [];

    if (document.getElementById('repair').checked)
        categoryFilters.push('repair');

    if (document.getElementById('education').checked)
        categoryFilters.push('education');

    if (document.getElementById('leisure').checked)
        categoryFilters.push('leisure');

    if (categoryFilters.length > 0) {
        filtered = filtered.filter(task =>
            categoryFilters.includes((task.category || '').toLowerCase())
        );
    }

    // volunteer filters
    const one = document.getElementById('1person').checked;
    const twoToFour = document.getElementById('4person').checked;
    const fivePlus = document.getElementById('5person').checked;

    if (one || twoToFour || fivePlus) {
        filtered = filtered.filter(task => {
            const v = task.volunteers_needed;

            return (
                (one && v === 1) ||
                (twoToFour && v >= 2 && v <= 4) ||
                (fivePlus && v >= 5)
            );
        });
    }

    // sorts
    const sort = document.getElementById('sort-select').value;

    if (sort === "Newest") {
        filtered.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );
    } else {
        filtered.sort((a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
        );
    }

    renderTasks(filtered);
}

document.getElementById('search-input').addEventListener('input', applyFilters);

document.getElementById('sort-select').addEventListener('change', applyFilters);

[
    'open',
    'closed',
    'Progress',
    'repair',
    'education',
    'leisure',
    '1person',
    '4person',
    '5person'
].forEach(id => {
    document.getElementById(id).addEventListener('change', applyFilters);
});

loadTasks();
