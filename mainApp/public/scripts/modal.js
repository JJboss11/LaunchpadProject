const modal          = document.getElementById('taskModal');
const modalClose     = document.getElementById('modalClose');
const modalTitle     = document.getElementById('modalTitle');
const modalDesc      = document.getElementById('modalDesc');
const modalImg       = document.getElementById('modalImg');
const modalLocation  = document.getElementById('modalLocation');

function openModal(card) {
    const title = card.querySelector('.task-title')?.textContent.trim() || 'Task';
    const desc  = card.querySelector('.task-description')?.textContent.trim() || '';
    const img   = card.querySelector('.task-image img')?.src || 'assets/Placeholder.png';

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
