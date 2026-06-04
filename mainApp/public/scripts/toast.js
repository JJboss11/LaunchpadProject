function showToast(message, type = 'success') {
    const toast = document.getElementById('ConfirmMessage');
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