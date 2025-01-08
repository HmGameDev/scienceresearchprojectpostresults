let map, userMarker, userCircle;
let obstacleLayer = L.layerGroup();
let obstacles = JSON.parse(localStorage.getItem('obstacles')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [];
let currentClickLatLng = null;
let allowObstacleClick = false;
let proximityAlertTriggered = false;
let userName = '';

// Initialize the map
function initMap() {
    console.log("Initializing map...");

    map = L.map('map').setView([40.712776, -74.005974], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    obstacleLayer.addTo(map);

    map.on('click', function(e) {
        if (allowObstacleClick) {
            currentClickLatLng = e.latlng;
            alert(`Clicked at ${e.latlng.lat}, ${e.latlng.lng}. Click 'Add Obstacle' to confirm.`);
            allowObstacleClick = false;
        } else {
            getAddress(e.latlng);
        }
    });

    if (navigator.geolocation) {
        console.log("Geolocation supported. Watching position...");
        navigator.geolocation.watchPosition(updateLocation, locationError, {
            enableHighAccuracy: true,
            maximumAge: 1000, // Update location every second
            timeout: 5000
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }

    loadObstacles();
    populateCategoryDropdown();
}

// Update user location on the map
function updateLocation(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    console.log(`Updating location to ${latitude}, ${longitude}`);

    if (userMarker) {
        userMarker.setLatLng([latitude, longitude]);
        userCircle.setLatLng([latitude, longitude]);
    } else {
        userMarker = L.marker([latitude, longitude], {
            icon: L.icon({
                iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Location_dot_blue.svg/1024px-Location_dot_blue.svg.png',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(map);

        userCircle = L.circle([latitude, longitude], {
            color: '#1e90ff',
            fillColor: '#1e90ff',
            fillOpacity: 0.2,
            radius: 2.13
        }).addTo(map);
    }

    checkProximityToObstacles(latitude, longitude);
}

function checkProximityToObstacles(lat, lng) {
    obstacles.forEach(obstacle => {
        const distance = map.distance([lat, lng], obstacle.latlng);
        if (distance <= 2.13 && !proximityAlertTriggered) {
            proximityAlertTriggered = true;
            alert(`Warning: You are within 7 feet of the obstacle "${obstacle.name}"!`);
            setTimeout(() => proximityAlertTriggered = false, 5000);
        }
    });
}

function locationError(error) {
    console.error(`Error getting location: ${error.message}`);
    if (error.code === error.PERMISSION_DENIED) {
        alert("Geolocation permission denied. Please allow location access in your browser settings.");
    } else {
        alert(`Error getting location: ${error.message}`);
    }
}

function getAddress(latlng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1&extratags=1`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const address = data.display_name;
            const business = data.extratags.name || "No business information available";
            const popupContent = `<b>Address:</b> ${address}<br><b>Business:</b> ${business}`;
            L.popup()
                .setLatLng(latlng)
                .setContent(popupContent)
                .openOn(map);
        })
        .catch(error => console.error('Error fetching address:', error));
}

// Add obstacle to the map
function addObstacle(latlng, name, categories, size) {
    let radius;
    switch (size) {
        case 'small':
            radius = 1.52;
            break;
        case 'medium':
            radius = 2.13;
            break;
        case 'large':
            radius = 3.05;
            break;
        default:
            radius = 2.13;
    }

    console.log(`Adding obstacle at ${latlng.lat}, ${latlng.lng} with radius ${radius}`);

    const obstacle = L.circle(latlng, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: radius
    }).addTo(obstacleLayer).bindPopup(name);

    obstacles.push({ latlng, name, categories, size });
    localStorage.setItem('obstacles', JSON.stringify(obstacles));
    updateObstacleList();
    filterObstaclesByCategory();
}

function addObstacleFromForm(event) {
    event.preventDefault();
    const name = document.getElementById('obstacleName').value;
    const categories = Array.from(document.getElementById('obstacleCategory').selectedOptions).map(option => option.value);
    const size = document.getElementById('obstacleSize').value;
    if (currentClickLatLng && categories.length > 0) {
        addObstacle(currentClickLatLng, name, categories, size);
        currentClickLatLng = null;
        document.getElementById('obstacleName').value = '';
        document.getElementById('obstacleCategory').value = '';
    } else {
        alert("Please click on the map to set the obstacle location and select at least one category.");
    }
}

function enableObstacleClick() {
    allowObstacleClick = true;
    alert("Click on the map to set the obstacle location.");
}

function setCurrentLocationAsObstacle() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const name = prompt('Enter the name for the current location obstacle:');
            const categories = Array.from(document.getElementById('obstacleCategory').selectedOptions).map(option => option.value);
            const size = document.getElementById('obstacleSize').value;

            if (name && categories.length > 0) {
                addObstacle({ lat: latitude, lng: longitude }, name, categories, size);
            } else {
                alert("Please select at least one category.");
            }
        }, locationError, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function loadObstacles() {
    obstacleLayer.clearLayers();
    obstacles.forEach(obstacle => {
        L.circle(obstacle.latlng, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: obstacle.size === 'small' ? 1.52 : obstacle.size === 'large' ? 3.05 : 2.13
        }).addTo(obstacleLayer).bindPopup(obstacle.name);
    });
}

function updateObstacleList() {
    const obstacleList = document.getElementById('obstacleList');
    obstacleList.innerHTML = '';

    obstacles.forEach(obstacle => {
        const listItem = document.createElement('li');
        listItem.textContent = `${obstacle.name} - (${obstacle.latlng.lat.toFixed(5)}, ${obstacle.latlng.lng.toFixed(5)}) [${obstacle.categories.join(', ')}] - ${obstacle.size}`;
        obstacleList.appendChild(listItem);
    });

    obstacleList.style.display = 'block'; // Ensure the list is visible
}

function clearObstacles() {
    obstacleLayer.clearLayers();
    obstacles = [];
    localStorage.removeItem('obstacles');
    updateObstacleList();
    alert('All obstacles cleared!');
}

function setUserName(event) {
    event.preventDefault();
    userName = document.getElementById('userName').value;
    document.getElementById('userNameForm').style.display = 'none';
    document.getElementById('obstacleForm').style.display = 'flex';
    document.getElementById('setCurrentLocationButton').style.display = 'block';
    document.getElementById('clearObstaclesButton').style.display = 'block';
}

function openDestinationPage() {
    window.location.href = 'destination.html';
}

function openNavigationPage() {
    window.location.href = 'navigation.html';
}

document.getElementById('toggleDarkMode').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const button = document.getElementById('toggleDarkMode');
    if (document.body.classList.contains('dark-mode')) {
        button.textContent = 'L';
        localStorage.setItem('dark-mode', 'true');
    } else {
        button.textContent = 'D';
        localStorage.setItem('dark-mode', 'false');
    }
});

if (localStorage.getItem('dark-mode') === 'true') {
    document.body.classList.add('dark-mode');
    document.getElementById('toggleDarkMode').textContent = 'L';
}

function populateCategoryDropdown() {
    const dropdown = document.getElementById('categoryDropdown');
    dropdown.innerHTML = '<option value="">All Obstacles</option>';

    categories.sort((a, b) => a.localeCompare(b));

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        dropdown.appendChild(option);
    });

    const obstacleCategoryDropdown = document.getElementById('obstacleCategory');
    obstacleCategoryDropdown.innerHTML = '';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        obstacleCategoryDropdown.appendChild(option);
    });
}

function showCategoryModal() {
    document.getElementById('categoryModal').style.display = 'block';
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

function addNewCategory() {
    const newCategoryName = document.getElementById('newCategoryName').value.trim();
    if (newCategoryName && !categories.includes(newCategoryName)) {
        categories.push(newCategoryName);
        localStorage.setItem('categories', JSON.stringify(categories));
        populateCategoryDropdown();
        closeCategoryModal();
    } else {
        alert('Category name is empty or already exists.');
    }
}

function filterObstaclesByCategory() {
    const selectedCategory = document.getElementById('categoryDropdown').value;

    obstacleLayer.clearLayers();

    obstacles.forEach(obstacle => {
        if (selectedCategory === '' || obstacle.categories.includes(selectedCategory)) {
            const listItem = document.createElement('li');
            listItem.textContent = `${obstacle.name} - (${obstacle.latlng.lat.toFixed(5)}, ${obstacle.latlng.lng.toFixed(5)}) [${obstacle.categories.join(', ')}] - ${obstacle.size}`;
            document.getElementById('obstacleList').appendChild(listItem);
            L.circle(obstacle.latlng, {
                color: 'green',
                fillColor: '#0f0',
                fillOpacity: 0.5,
                radius: obstacle.size === 'small' ? 1.52 : obstacle.size === 'large' ? 3.05 : 2.13
            }).addTo(obstacleLayer);
        }
    });

    document.getElementById('obstacleList').style.display = 'block'; // Ensure the list is visible
}

// Periodically update obstacles
setInterval(loadObstacles, 1000); // Update obstacles every second

// Event Listeners
document.getElementById('addCategoryButton').addEventListener('click', showCategoryModal);
document.getElementById('closeCategoryModal').addEventListener('click', closeCategoryModal);
document.getElementById('saveCategoryButton').addEventListener('click', addNewCategory);
document.getElementById('categoryDropdown').addEventListener('change', filterObstaclesByCategory);
document.getElementById('addObstacleButton').addEventListener('click', enableObstacleClick);
document.getElementById('addObstacleForm').addEventListener('submit', addObstacleFromForm);
document.getElementById('setCurrentLocationButton').addEventListener('click', setCurrentLocationAsObstacle);
document.getElementById('clearObstaclesButton').addEventListener('click', clearObstacles);
document.getElementById('userNameForm').addEventListener('submit', setUserName);

// Initialize the map on page load
window.onload = initMap;