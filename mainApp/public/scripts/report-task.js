const token = localStorage.getItem('token');
if(!token || token === 'undefined') {
    window.location.href = 'login.html';
}

// Category selection

let selectedCategory = null;
const categoryBtn = document.querySelectorAll('.cat-btn');

categoryBtn.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtn.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.dataset.category;
    });
});

// Form submission
const form = document.getElementById('reportForm');
const messageBox = document.getElementById('formMessage');

function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = type;  // success or error
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = form.elements['title'].value.trim();
    const description = form.elements['description'].value.trim();
    const address = form.elements['address'].value.trim();
    const time = form.elements['time'].value;
    const date = form.elements['date'].value;
    const volunteers = form.elements['volunteers'].value;

    const errors = [];

    if (!title) {
        errors.push("Title is required");
    }

    if (!description) {
        errors.push('Description is required');
    }

    if (!address || address.trim() === '') {
        errors.push('Address is required');
    }

    if (!selectedCategory) {
        errors.push('Category is required')
    }

    const volunteering = parseInt(volunteers, 10);
    if (!Number.isInteger(volunteering) || volunteering < 1 || volunteering > 15) {
        errors.push('Volunteers needed must be between 1 and 15')
    }

    if (errors.length > 0) {
        showMessage(errors.join(' '), 'error');
        return;
    }

    try {
        const res = await fetch('/tasks' , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                category: selectedCategory,
                address,
                time, 
                date,
                volunteers
            })
        });

        const data = await res.json();

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        if (!res.ok) {
            showMessage((data.errors || [data.message || 'Something went wrong']).join(' '), 'error');
            return;
        }

        showMessage('Task posted! Taking you to the home page', 'success');
        form.reset();
        categoryBtn.forEach(b => b.classList.remove('active'));
        selectedCategory = null;

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }catch (err) {
        console.error(err);
        showMessage('Could not reach the server. Please try again', 'error')
    }
})

