const token = localStorage.getItem('token');

let ratingData = {};
let selectedRating = null;

const stars = document.querySelectorAll('#submit-star-rating .fa-star');

stars.forEach(star => {
    star.addEventListener('mouseover', () => {
        stars.forEach(s => s.classList.remove('checked'));
        for (let s of stars) {
            s.classList.add('checked');
            if (s === star) break;
        }
    });

    star.addEventListener('mouseout', () => {
        stars.forEach(s => s.classList.remove('checked'));
        if (selectedRating) {
            stars.forEach(s => {
                if (parseInt(s.dataset.value) <= selectedRating) s.classList.add('checked');
            });
        }
    });

    star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.value);
    });
});

function openRatingModal(job_id, claim_id, ratee_id, volunteerName) {
    ratingData = { job_id, claim_id, ratee_id };
    selectedRating = null;
    stars.forEach(s => s.classList.remove('checked'));
    document.getElementById('rating-volunteer-name').textContent = volunteerName;
    document.getElementById('ratingModal').classList.add('open');
}

document.getElementById('submit-rating-btn').addEventListener('click', async () => {
    if (!selectedRating) {
        showToast('Please select a star rating', 'error');
        return;
    }

    const review = document.getElementById('rating-review').value.trim();

    const res = await fetch('/ratings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...ratingData, score: selectedRating, review })
    });

    if (res.ok) {
        document.getElementById('ratingModal').classList.remove('open');
        showToast('Rating submitted!');
    } else {
        showToast('Failed to submit rating', 'error');
    }
});

document.getElementById('skip-rating-btn').addEventListener('click', () => {
    document.getElementById('ratingModal').classList.remove('open');
});
