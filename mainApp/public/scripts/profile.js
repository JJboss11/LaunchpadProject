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

    //helper function for rendering user rating stars
    function renderStars(rating, count) {
        const stars = [1,2,3,4,5].map(i => 
            `<span class="fa fa-star${i <= Math.round(rating || 0) ? ' checked' : ''}"></span>`
        ).join('');
        return `${stars} <span class="rating-count">(${count || 0})</span>`;
    }

    //render star rating
    async function loadProfile() {
        const res = await fetch('/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        const { user } = await res.json();
        console.log(user);
        document.getElementById('star-display').innerHTML = renderStars(user.avg_rating, user.total_ratings);
    }

    loadProfile();

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
            const helpElement = document.getElementById('stat-helped');
            if(completedELement) completedELement.textContent = data.stats.completed;
            if(activeElement) activeElement.textContent = data.stats.active;
            if(helpElement) helpElement.textContent = data.stats.volunteersHelp;
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

            const address = document.createElement('p');
            address.className = 'card-address';
            address.textContent = `Address: ${tasks.job_location}` || 'Location not provide'

            const time = document.createElement('span');
            time.className = 'card-status active';
            time.textContent = formatDateTime(tasks.task_date, tasks.task_time);

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-cancel-claim';
            cancelBtn.textContent = 'X Cancel';
            cancelBtn.addEventListener('click', () => {
                const conformation = confirm('Withdraw from volutneering for this task? It will be removed from your active task.');
                if (!conformation) return;

                cancelBtn.disabled = true;
                fetch(`/tasks/${tasks.id}/claim`, {
                    method: `DELETE`,
                    headers: { 'Authorization': `Bearer ${token}`}
                })
                .then((res) => res.json())
                .then((d) => {
                    if (d.success) {
                        card.remove();
                        showToast('Removed from your active tasks');
                    }else {
                        showToast(d.message, 'error')
                        cancelBtn.disabled = false;
                    }
                })
                .catch((err) => {
                    console.error(err);
                    showToast('Something went wrong, please try again', 'error');
                    cancelBtn.disabled = false;
                });
            });

            card.append(h3, p, address, time, cancelBtn) ;
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
                        openRatingModal(task.id, d.claim.id, d.claim.user_id, d.claim.volunteer_name);
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

            const volunteersContainer = document.createElement('div');
            volunteersContainer.className = 'volunteer-list'

            const volunteerHeading = document.createElement('h4');
            volunteerHeading.textContent = 'Volunteers';
            volunteersContainer.appendChild(volunteerHeading);

            if (!task.volunteers || task.volunteers.length === 0) {
                const none = document.createElement('p');
                none.textContent = 'No Volunteers yet';
                volunteersContainer.appendChild(none);
            }else {
                const ul = document.createElement('ul');
                task.volunteers.forEach((v) => {
                    const li = document.createElement('li');
                    li.textContent = `${v.firstname} ${v.lastname} - ${v.email}`;
                    ul.appendChild(li);
                });
                volunteersContainer.appendChild(ul)
            }
            
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

            card.append(h3, p, time, volunteersContainer, taskBtn);
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
