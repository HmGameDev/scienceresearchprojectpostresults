// Function to load users from localStorage
function loadUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

// Function to save users to localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function login() {
    // Retrieve username and password from the form
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    // Load users from localStorage
    let users = loadUsers();

    // Validate username and password
    let user = users.find(user => user.username === username && user.password === password);
    if (user) {
        // Redirect to the main page (index.html) after successful login
        localStorage.setItem('username', username);
        window.location.href = "index.html";
        return false; // Prevent the form from submitting
    } else {
        // Display an error message
        alert("Invalid username or password. Please try again.");
        return false; // Prevent the form from submitting
    }
}

function signup() {
    // Retrieve new username and password from the form
    var newUsername = document.getElementById("newUsername").value;
    var newPassword = document.getElementById("newPassword").value;

    // Load users from localStorage
    let users = loadUsers();

    // Check if username already exists
    if (users.find(user => user.username === newUsername)) {
        alert("Username already exists. Please choose a different username.");
    } else {
        // Add new user to the users array and save to localStorage
        users.push({ username: newUsername, password: newPassword });
        saveUsers(users);
        alert("Account created successfully! You can now log in.");
        window.location.href = "login.html";
    }
}

function addObstacle(latlng, name) {
    const obstacle = L.circle(latlng, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 2.13 // 7 feet in meters
    }).addTo(obstacleLayer);

    obstacles.push({ latlng, name });
    localStorage.setItem('obstacles', JSON.stringify(obstacles));
    updateObstacleList();
}

// Event listener for login form submission
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        login();
    });
}

// Event listener for signup form submission
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', function (e) {
        e.preventDefault();
        signup();
    });
}