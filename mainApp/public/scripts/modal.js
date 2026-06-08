const modal          = document.getElementById('taskModal');
const modalClose     = document.getElementById('modalClose');
const modalTitle     = document.getElementById('modalTitle');
const modalDesc      = document.getElementById('modalDesc');
const modalImg       = document.getElementById('modalImg');
const modalLocation  = document.getElementById('modalLocation');

let currentJobId = null;

function getUserId() {
    const token = localStorage.getItem('token');
    if(!token || token === 'undefined') return null;
    try {
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(b64 + '='. repeat((4 - b64.length % 4) % 4 )));
        return payload.id
    }catch {
        return null;
    }
}

const currentUserId = getUserId();

function openModal(card) {
    const title = card.querySelector('.task-title')?.textContent.trim() || 'Task';
    const desc  = card.querySelector('.task-description')?.textContent.trim() || '';
    const img   = card.querySelector('.task-image img')?.src || 'assets/Placeholder.png';

    currentJobId = card.dataset.id;

    const volunteerBtn = document.getElementById('volunteerBtn');
    if (volunteerBtn) {
        const posterId = parseInt(card.dataset.poster, 10)
        if (currentUserId && posterId === currentUserId) {
            volunteerBtn.disabled = true;
            volunteerBtn.textContent = 'Your Task';
            volunteerBtn.className = 'volunteer-btn own-task';
        } else if (card.dataset.claimed === 'true') {
            volunteerBtn.disabled = true;
            volunteerBtn.textContent = 'Volunteering';
            volunteerBtn.className = 'volunteer-btn claimed';
        } else {
            volunteerBtn.disabled = false;
            volunteerBtn.textContent = 'Volunteer Now';
            volunteerBtn.className = 'volunteer-btn';
        }
    }

    modalTitle.textContent    = title;
    modalDesc.textContent     = desc;
    modalImg.src              = img;
    modalLocation.textContent = card.dataset.location || 'Location TBC';

    modal.classList.add('open');

    setTimeout(() => {
    map.invalidateSize();
}, 100);
}

function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
}


document.addEventListener('click', (e) => {
    const card = e.target.closest('.task-card');
    if (card) openModal(card);
});

if (modalClose) modalClose.addEventListener('click', closeModal);

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

const volunteerBtn = document.getElementById('volunteerBtn');
if (volunteerBtn) {
    volunteerBtn.addEventListener('click', () => {
        if (!currentJobId) return;

        const token = localStorage.getItem('token');
        volunteerBtn.disabled = true;
        volunteerBtn.textContent = 'Volunteering';

        fetch(`/tasks/${currentJobId}/claim`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`}
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                volunteerBtn.textContent = 'Volunteering';
                volunteerBtn.className = 'volunteer-btn claimed';
                const card = document.querySelector(`.task-card[data-id="${currentJobId}"]`);
                if (card) card.dataset.claimed = 'true';
                showToast(data.message);
            }else {
                showToast(data.message, 'error');
                volunteerBtn.disabled = false;
                volunteerBtn.textContent = 'Volunteer Now'
            }
        })
        .catch((err) => {
            console.error(err);
            showToast('Something went wrong please try again.', 'error');
            volunteerBtn.disabled = false;
            volunteerBtn.textContent = 'Volunteer now'
        });
    });
}
