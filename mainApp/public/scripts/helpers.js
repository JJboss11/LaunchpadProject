function showToast(message, type = 'success') {
    const toast = document.getElementById('ConfirmMessage');
    if (!toast) {
        console.warn('showToast: no #ConfirmMessage element on this page')
        return
    }
    toast.textContent = message;
    toast.classList.remove('show', 'error');
    
    if (type === 'error') {
        toast.classList.add('error');
    }

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show', 'error');
    }, 2000);
}

//signout button that deletes JWT token
const signoutBtn = document.getElementById('signout-btn');
if (signoutBtn) {
    signoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
}

//show pswrd func for login and signup pages
function showPswrd() {
    var x = document.getElementById("password");
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}

//get stats for navbar
function loadStats() {
    fetch('/stats')
        .then(res => res.json())
        .then(data => {
            const users = document.getElementById('stat-users');
            const jobs = document.getElementById('stat-jobs');
            if (users) {
                users.textContent = data.users;
            }

            if (jobs) {
                jobs.textContent = data.jobs;
            }
        })
        .catch(err => console.error(err));
}

loadStats();

const hamburger = document.getElementById('hamburger');
const navRight = document.getElementById('nav-right');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navRight.classList.toggle('open');
        const icon = hamburger.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });
}

