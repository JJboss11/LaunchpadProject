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

    fetch('/profile/stats', {
        headers: { 'Authorization': `Bearer ${token}`}
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {
            const completedELement = document.getElementById('stat-completed');
            const activeElement = document.getElementById('stat-active');
            if(completedELement) completedELement.textContent = data.stats.completed;
            if(activeElement) activeElement.textContent = data.stats.active;
        }
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
    
    // Delete Account Button
    const deleteButton = document.getElementById('deleteAccount');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            const conformation = confirm('Your account will be permanently deleted. This cannot be undone. Press OK if you would like to continue');
            if (!conformation) return;

            fetch('/profile', {
                method: 'DELETE',
                headers: { 'Authorization' : `Bearer ${token}`}
            })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    localStorage.removeItem("token");
                    window.location.href = 'login.html';
                }else {
                    showToast(data.message, 'error');
                }
            })
            .catch((err) => {
                console.error(err);
                showToast('Something went wrong please try again.', 'error')
            });   
        });
    }

    function formatDateTime(date, time) {
        if (!date && !time) return 'Date or Time not provided'
        let out = '';
        if (date) {
            out = new Date(date).toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'short'
            });
        }
        if (time) {
            out += (out ? ' at ' : '') + time.slice(0, 5); // format 00:00
        }
        return out;
    }

    fetch('/profile/active-tasks', {
        headers: { 'Authorization' : `Bearer ${token}`}
    })
    .then((res) => res.json())
    .then((data) => {
        if(!data.success) return;

        const list = document.getElementById('activeTaskList');
        if(!list) return;
        list.innerHTML = ''; // ensures its clear before rendering
        
        if(data.tasks.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'NO active task yet';
            list.appendChild(empty);
            return;
        }

        data.tasks.forEach((tasks) => {
            const card = document.createElement('div');
            card.className = 'dashboard-card';
            
            const h3 = document.createElement('h3');
            h3.textContent = tasks.title;

            const p = document.createElement('p');
            p.textContent = tasks.description;

            const status = document.createElement('span');
            status.className = 'card-status active';
            status.textContent = formatDateTime(tasks.task_date, tasks.task_time);

            card.append(h3, p, status);
            list.appendChild(card);
        })
    })
    .catch((err) => console.error(err)) ;

    fetch('/profile/reported-tasks', {
        headers: {'Authorization' : `Bearer ${token}` } 
    })
    .then((res) => res.json())
    .then((data) => {
        if(!data.success) return;

        const list = document.getElementById('reportedTaskList');
        if(!list) return;
        list.innerHTML = '';

        if(data.tasks.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'You have not reported any tasks yet';
            list.appendChild(empty);
            return;
        }

        data.tasks.forEach((task) => {
            const card = document.createElement('div');
            card.className = 'dashboard-card';

            const h3 = document.createElement('h3');
            h3.textContent = task.title;

            const p = document.createElement('p');
            p.textContent = task.description;

            const time = document.createElement('span');
            time.className = 'card-status active';
            time.textContent = formatDateTime(task.task_date, task.task_time);
            
            //Completed Button
            const completedBtn = document.createElement('button');
            completedBtn.className = 'btn btn-complete';
            completedBtn.textContent = 'Completed';
            completedBtn.addEventListener('click', () => {
                const conformation = confirm('Mark this task as compeleted? Volunteers will see it in their completed tasks.');
                if(!conformation) return;

                completedBtn.disabled = true;

                fetch(`/tasks/${task.id}/complete`, {
                    method: 'POST',
                    headers: {'Authorization' : `Bearer ${token}`}
                })
                .then((res) => res.json())
                .then((d) => {
                    if (d.success) {
                        card.remove();
                        showToast('Task marked complete');
                    }else {
                        showToast(d.message, 'error');
                        completedBtn.disabled = false;
                    }
                })
                .catch((err) => {
                    console.error(err);
                    showToast('Something went wrong, please try again', 'error');
                    completedBtn.disabled = false;
                });
            })
            
            //Cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-delete';
            cancelBtn.textContent = 'Cancel task';
            cancelBtn.addEventListener('click', () =>{
                const conformation = confirm('Cancel this task? Your posted will be removed. This cannot be undone');
                if (!conformation) return;

                cancelBtn.disabled = true;
                fetch(`/tasks/${task.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization' : `Bearer ${token}`}
                })
                .then((res) => res.json())
                .then((d) => {
                    if(d.success) {
                        card.remove();
                        showToast('Task cancelled')
                    }else {
                        showToast(d.message, 'error');
                        cancelBtn.disabled = false;
                    }
                })
                .catch((err)=> {
                    console.error(err);
                    showToats('Something went wrong, please try agian', 'error');
                    cancelBtn.disabled = false;
                })
            });

            const taskBtn = document.createElement('div')
            taskBtn.className = 'card-actions';
            taskBtn.append(completedBtn, cancelBtn);

            card.append(h3, p, time, taskBtn);
            list.appendChild(card);
        });
    })
    .catch((err) => console.error(err));

    fetch('/profile/completed-tasks', {
        headers: { 'Authorization': `Bearer ${token}`}
    })
    .then((res) => res.json())
    .then((data) => {
        if (!data.success) return;

        const list = document.getElementById('completedTaskList');
        if (!list) return;
        list.innerHTML = '';

        if (data.tasks.length === 0 ) {
            const empty = document.createElement('p');
            empty.textContent = 'No completed tasks yet';
            list.appendChild(empty);
            return;
        }

        data.tasks.forEach((task) => {
            const card = document.createElement('div');
            card.className = 'dashboard-card';

            const h3 = document.createElement('h3');
            h3.textContent = task.title;

            const p = document.createElement('p');
            p.textContent = task.description;

            const time = document.createElement('span');
            time.className = 'card-status completed';
            time.textContent = formatDateTime(task.task_date, task.task_time);

            card.append(h3, p, time);
            list.appendChild(card)
        });
    })
    .catch((err) => console.error(err));

});
