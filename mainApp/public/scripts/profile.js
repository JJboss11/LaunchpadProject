document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');

    if (!token || token === 'undefined') {
        window.location.href = 'login.html';
        return;
    }

    function renderName(user) {
        const nameElement = document.querySelector('.profile-name');
        if (nameElement) {
            nameElement.textContent = `${user.firstname} ${user.lastname}`;
        }
        const banner = document.querySelector('.profile-banner h1');
        if (banner) {
            banner.textContent = `Welcome back, ${user.firstname}!`;
        }
    }

    function fillForm(user) {
        document.getElementById('firstname').value = user.firstname || '';
        document.getElementById('lastname').value  = user.lastname  || '';
        document.getElementById('email').value     = user.email     || '';
        document.getElementById('Address').value   = user.address   || '';
    }

    fetch('/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then((res) => {
        if (!res.ok) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            throw new Error('Not authenticated');
        }
        return res.json();
    })
    .then((data) => {
        renderName(data.user);
        fillForm(data.user);
    })
    .catch((err) => console.error(err));

    const myForm = document.getElementById('myForm');
    if (myForm) {
        myForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const updated = {
                firstname: document.getElementById('firstname').value,
                lastname:  document.getElementById('lastname').value,
                email:     document.getElementById('email').value,
                address:   document.getElementById('Address').value,
            };

            fetch('/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updated)
            })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    renderName(data.user);
                    fillForm(data.user);
                    showToast('Changes saved!');
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch((err) => {
                console.error(err);
                showToast('Something went wrong, please try again.', 'error');
            });
        });
    }
});
