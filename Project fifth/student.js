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
            
            // Store lecturerId and attendanceSessionID in hidden fields
            if (!document.getElementById('attendanceSessionIdHidden')) { // Changed ID to be more specific
                const sessionInput = document.createElement('input');
                sessionInput.type = 'hidden';
                sessionInput.id = 'attendanceSessionIdHidden';
                sessionInput.name = 'attendanceSessionID'; // Add name attribute
                form.appendChild(sessionInput);
            }
            document.getElementById('attendanceSessionIdHidden').value = data.attendanceSessionID;

            if (!document.getElementById('lecturerIdHidden')) { // Changed ID to be more specific
                const lecturerIdInput = document.createElement('input');
                lecturerIdInput.type = 'hidden';
                lecturerIdInput.id = 'lecturerIdHidden';
                lecturerIdInput.name = 'lecturerId'; // Add name attribute
                form.appendChild(lecturerIdInput);
            }
            document.getElementById('lecturerIdHidden').value = data.lecturerId;

            locationStatus.textContent = 'Form received. Click "Mark Present" to share location.'; // Update status message
            locationStatus.style.color = 'blue';
        }
    };
    
    socket.onclose = function() {
        console.log('WebSocket connection closed');
    };
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        locationStatus.textContent = 'Fetching your location...';
        locationStatus.style.color = 'orange';

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (studentPosition) => {
                    locationStatus.textContent = 'Location found. Submitting attendance...';
                    locationStatus.style.color = 'green';

                    const attendanceSessionID = document.getElementById('attendanceSessionIdHidden').value;
                    const lecturerId = document.getElementById('lecturerIdHidden').value;

                    try {
                        const response = await fetch('/api/attendance/submit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                                studentId: studentIdInput.value,
                                courseCode: attendanceCourse.textContent,
                                lecturerId: lecturerId,
                                attendanceSessionID: attendanceSessionID,
                                latitude: studentPosition.coords.latitude,
                                longitude: studentPosition.coords.longitude
                            })
                        });

                        const data = await response.json();

                        if (response.ok) {
                            alert(data.message || 'Attendance submitted successfully!');
                            // Optionally, hide form and show success message or reload
                            waitingMessage.textContent = data.message || 'Attendance recorded!';
                            waitingMessage.style.display = 'block';
                            attendanceForm.style.display = 'none';
                            // window.location.reload(); // Or update UI without reload
                        } else {
                            alert(`Error: ${data.message || 'Failed to submit attendance.'}`);
                            locationStatus.textContent = `Error: ${data.message || 'Failed to submit.'}`;
                            locationStatus.style.color = 'red';
                        }
                    } catch (error) {
                        console.error('Error submitting attendance:', error);
                        alert('An error occurred while submitting. Please try again.');
                        locationStatus.textContent = 'Submission error. Please try again.';
                        locationStatus.style.color = 'red';
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    locationStatus.textContent = `Location error: ${error.message}. Please enable location.`;
                    locationStatus.style.color = 'red';
                    alert(`Could not get your location: ${error.message}. Please ensure location services are enabled and try again.`);
                }
            );
        } else {
            locationStatus.textContent = 'Geolocation not supported by your browser.';
            locationStatus.style.color = 'red';
            alert('Geolocation is not supported by your browser.');
        }
    });
}