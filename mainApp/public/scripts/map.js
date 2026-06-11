async function getLocation() {
    try {
        const res = await fetch('/tasks', { headers: { 'Authorization': `Bearer ${token}` } });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        location = (await res.json()).job_location ;

    } catch (err) {
        console.error(err);
    }
}

var map = L.map('map', { zoomControl: false }).setView([51.505, -0.09], 15);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
navigator.geolocation.watchPosition(success, error);

let circle;

function success(pos) {
    const address = "28E Jessopp Rd, Norwich NR2 3QB";
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`)
    .then(response => response.json())
    .then(data => {
        console.log(data)
        if (data.length > 0) {
        const lat = data[0].lat;
        const lng = data[0].lon;

        if (circle) { map.removeLayer(circle); }

        circle = L.circle([lat, lng], {
            radius: 300,
            color: '#4a90d9',
            fillColor: '#4a90d9',
            fillOpacity: 0.15,
            weight: 2,
            opacity: 0.4
        }).addTo(map);

        map.setView([lat, lng], 15);
        }})
}

function error(err) {
    if (err.code === 1) {
        alert("please allow geolocation access!");
    } else {
        alert("cannot get current location");
    }
}