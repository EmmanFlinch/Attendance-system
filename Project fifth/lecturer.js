Emman Flinch, [3/26/2025 4:43 PM]
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const auth = checkAuth();
    if (!auth || auth.userType !== 'lecturer') {
        window.location.href = '/lecturer-login';
        return;
    }

    // Current page
    const path = window.location.pathname;

    if (path === '/lecturer-login') {
        setupLecturerLogin();
    } else if (path === '/lecturer-courses') {
        setupLecturerCourses();
    } else if (path === '/lecturer-send-form') {
        setupSendAttendanceForm();
    }
});

function setupLecturerLogin() {
    const loginForm = document.getElementById('lecturerLoginForm');
    const errorElement = document.getElementById('loginError');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/lecturer/login', {
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
                localStorage.setItem('userType', 'lecturer');
                localStorage.setItem('userId', data.id);
                localStorage.setItem('username', data.username);
                
                // Redirect to courses page
                window.location.href = '/lecturer-courses';
            } else {
                errorElement.textContent = data.message || 'Login failed';
            }
        } catch (error) {
            errorElement.textContent = 'An error occurred. Please try again.';
            console.error('Login error:', error);
        }
    });
}

function setupLecturerCourses() {
    const lecturerName = document.getElementById('lecturerName');
    const coursesContainer = document.getElementById('coursesContainer');
    const userId = localStorage.getItem('userId');

    // Display lecturer name
    lecturerName.textContent = localStorage.getItem('username') || 'Lecturer';

    // Fetch lecturer's courses
    fetch(`/api/lecturer/${userId}/courses`, {
        headers: {
            'Authorization': Bearer ${localStorage.getItem('token')}
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error(data.message);
            return;
        }

        // Display courses
        data.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.innerHTML = `
                <h3>${course.code}</h3>
                <p>${course.name}</p>
            `;
            courseCard.addEventListener('click', () => {
                window.location.href = /lecturer-send-form?course=${course.code};
            });
            coursesContainer.appendChild(courseCard);
        });
    })
    .catch(error => {
        console.error('Error fetching courses:', error);
    });
}

function setupSendAttendanceForm() {
    const courseName = document.getElementById('courseName');
    const sendFormBtn = document.getElementById('sendFormBtn');
    const statusMessage = document.getElementById('statusMessage');
    const studentsContainer = document.getElementById('studentsContainer');
    
    // Get course code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get('course');
    
    if (!courseCode) {
        window.location.href = '/lecturer-courses';
        return;
    }
    
    // Display course name
    courseName.textContent = courseCode;
    
    // Fetch students in this course
    fetch(`/api/courses/${courseCode}/students`, {
        headers: {

Emman Flinch, [3/26/2025 4:43 PM]
'Authorization': Bearer ${localStorage.getItem('token')}
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error(data.message);
            return;
        }
        
        // Display students
        data.forEach(student => {
            const studentCard = document.createElement('div');
            studentCard.className = 'student-card';
            studentCard.innerHTML = `
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <p>${student.id}</p>
                </div>
                <div class="attendance-status waiting">Waiting</div>
            `;
            studentsContainer.appendChild(studentCard);
        });
    })
    .catch(error => {
        console.error('Error fetching students:', error);
    });
    
    // Send attendance form
    sendFormBtn.addEventListener('click', async function() {
        try {
            const response = await fetch('/api/attendance/send-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': Bearer ${localStorage.getItem('token')}
                },
                body: JSON.stringify({ courseCode })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                statusMessage.innerHTML = <div class="success-message">${data.message}</div>;
                
                // Update student statuses after a delay to allow for WebSocket updates
                setTimeout(() => {
                    const statusElements = document.querySelectorAll('.attendance-status');
                    statusElements.forEach(el => {
                        el.textContent = 'Form Sent';
                        el.className = 'attendance-status present';
                    });
                }, 1000);
            } else {
                statusMessage.innerHTML = <div class="error-message">${data.message}</div>;
            }
        } catch (error) {
            console.error('Error sending form:', error);
            statusMessage.innerHTML = <div class="error-message">An error occurred. Please try again.</div>;
        }
    });
}