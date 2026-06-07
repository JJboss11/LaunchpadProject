document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');

    if (!token || token === 'undefinec') {
        window.location.href = 'login.html';
        return;
    }

    fetch('/profile',  {
        headers: { 'Authorization' : `Bearer ${token}`}
    })
    .then((res) => {
        if (!res.ok) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
        return res.json();
    })
    .then((data) => {
        const fullName = `${data.user.firstname} ${data.user.lastname}`;

        const nameElement = document.querySelector('.profile-name');
        if (nameElement) {
            nameElement.textContent = fullName;
        }

        const banner = document.querySelector('.profile-banner h1');
        if (banner) {
            banner.textContent = `Welcome back ${data.user.firstname}!`;
        }
    })
    .catch((err) => console.error(err));
});