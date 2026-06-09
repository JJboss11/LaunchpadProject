const token = localStorage.getItem('token');
if(!token || token === 'undefined') {
    window.location.href = 'login.html';
}

let supabase;

async function init() {
    const configRes = await fetch('/config');
    const config = await configRes.json();

    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
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

// Image validation
const imageInput = document.getElementById('task-photo');

function validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        return 'Only JPEG or PNG allowed';
    }
    
    if (file.size > 5 * 1024 * 1024) {
        return 'Image must be under 1MB';
    }
    
    return null;
}

imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    const error = validateImage(file);
    if (error) {
        showMessage(error, 'error');
        imageInput.value = '';
        return;
    }

    // Update the label to show the filename
    document.getElementById('upload-icon').className = 'fa fa-check';
    document.getElementById('upload-text').textContent = file.name;
    document.getElementById('upload-hint').textContent = `${(file.size / 1024).toFixed(0)}KB`;
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
    } else if (address.length < 8) {
        errors.push('Please enter a valid address!');
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

    const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );

    const geoData = await geoRes.json();

    if (geoData.length === 0) {
        showMessage('Address could not be found!', 'error');
        return;
    }

    const result = geoData[0];

    if (!result.display_name.toLowerCase().includes('united kingdom')) {
        showMessage('Please enter a valid UK address!', 'error');
        return;
    }

    try {
        await init()

        const configRes = await fetch('/config');
        const config = await configRes.json();
        console.log('config:', config); // check this in devtools

        let imageUrl = null;
        const file = imageInput.files[0];

        if (file) {
            const error = validateImage(file);
            if (error) {
                showMessage(error, 'error');
                return;
            }
            
            const fileName = `${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('job-images')
                .upload(fileName, file);
            
            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from('job-images').getPublicUrl(fileName);
            imageUrl = publicUrl;
        }

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
                volunteers,
                image_location: imageUrl
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

