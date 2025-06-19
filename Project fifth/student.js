Emman Flinch, [3/26/2025 4:44 PM]
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const auth = checkAuth();
    if (!auth || auth.userType !== 'student') {
        window.location.href = '/student-login';
        return;
    }

    // Current page
    const path = window.location.pathname;

    if (path === '/student-login') {
        setupStudentLogin();
    } else if (path === '/student-waiting') {
        setupStudentWaiting();
    }
});

function setupStudentLogin() {
    const loginForm = document.getElementById('studentLoginForm');
    const errorElement = document.getElementById('loginError');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/student/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('userType', 'student');
                localStorage.setItem('userId', data.id);
                localStorage.setItem('username', data.username);
                
                // Redirect to waiting page
                window.location.href = '/student-waiting';
            } else {
                errorElement.textContent = data.message || 'Login failed';
            }
        } catch (error) {
            errorElement.textContent = 'An error occurred. Please try again.';
            console.error('Login error:', error);
        }
    });
}

function setupStudentWaiting() {
    const studentName = document.getElementById('studentName');
    const waitingMessage = document.getElementById('waitingMessage');
    const attendanceForm = document.getElementById('attendanceFormContainer');
    const form = document.getElementById('attendanceForm');
    const studentIdInput = document.getElementById('studentId');
    const studentNameInput = document.getElementById('studentNameInput');
    const locationStatus = document.getElementById('locationStatus');
    const attendanceCourse = document.getElementById('attendanceCourse');
    
    // Display student name
    studentName.textContent = localStorage.getItem('username') || 'Student';
    
    // Register with WebSocket server
    const socket = new WebSocket(`ws://${window.location.host}/ws/attendance`);
    
    socket.onopen = function() {
        console.log('WebSocket connection established');
        socket.send(JSON.stringify({
            type: 'register',
            userId: localStorage.getItem('userId')
        }));
    };
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        if (data.type === 'attendance_form') {
            // Show attendance form
            waitingMessage.style.display = 'none';
            attendanceForm.style.display = 'block';
            attendanceCourse.textContent = data.courseCode;
            
            // Set form values
            studentIdInput.value = localStorage.getItem('userId');
            studentNameInput.value = localStorage.getItem('username');
            
            // Check geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // In a real app, you would verify this against the lecturer's location
                        // For this demo, we'll just assume they're in range
                        locationStatus.value = 'Within range (verified)';
                        locationStatus.style.color = 'green';
                    },
                    (error) => {
                        locationStatus.

Emman Flinch, [3/26/2025 4:44 PM]
value = 'Location access denied';
                        locationStatus.style.color = 'red';
                    }
                );
            } else {
                locationStatus.value = 'Geolocation not supported';
                locationStatus.style.color = 'red';
            }
        }
    };
    
    socket.onclose = function() {
        console.log('WebSocket connection closed');
    };
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/attendance/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': Bearer ${localStorage.getItem('token')}
                },
                body: JSON.stringify({
                    studentId: studentIdInput.value,
                    courseCode: attendanceCourse.textContent,
                    locationVerified: locationStatus.value.includes('verified')
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Attendance submitted successfully!');
                window.location.reload();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error submitting attendance:', error);
            alert('An error occurred. Please try again.');
        }
    });
}