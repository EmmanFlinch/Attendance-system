const express = require('express');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load database
const dbPath = path.join(__dirname, 'database.json');
let db = {
    lecturers: [
        {
            id: 'l1',
            username: 'v24vv',
            password: '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqOq4B.7Z7zLJ/4JN3zYt8TQ1F3aO', // 1200
            name: 'Sir Val',
            courses: ['CSC 301', 'CSC 303']
        },
        {
            id: 'l2',
            username: 'r24vv',
            password: '$2a$10$WY3U5pN.5z7v5h5JQ5ZJXe5v5Z5v5Z5v5Z5v5Z5v5Z5v5Z5v5Z5v5Z', // 13r00
            name: 'Sir Richard',
            courses: ['SOE 301', 'ICS 310']
        }
    ],
    students: [
        {
            id: '202201',
            username: '202201',
            password: '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqOq4B.7Z7zLJ/4JN3zYt8TQ1F3aO', // 1011
            name: 'Emmanuel',
            courses: ['CSC 301', 'SOE 301']
        },
        {
            id: '202202',
            username: '202202',
            password: '$2a$10$WY3U5pN.5z7v5h5JQ5ZJXe5v5Z5v5Z5v5Z5v5Z5v5Z5v5Z5v5Z5v5Z', // 1110
            name: 'Faahim',
            courses: ['CSC 303', 'ICS 310']
        },
        {
            id: '202203',
            username: '202203',
            password: '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqOq4B.7Z7zLJ/4JN3zYt8TQ1F3aO', // 0011
            name: 'Yussif',
            courses: ['CSC 301', 'ICS 310']
        }
    ],
    courses: [
        {
            code: 'CSC 301',
            name: 'Advanced Programming',
            lecturer: 'l1'
        },
        {
            code: 'CSC 303',
            name: 'Data Structures',
            lecturer: 'l1'
        },
        {
            code: 'SOE 301',
            name: 'Software Engineering',
            lecturer: 'l2'
        },
        {
            code: 'ICS 310',
            name: 'Information Systems',
            lecturer: 'l2'
        }
    ],
    attendance: []
};

// JWT Secret
const JWT_SECRET = 'your_jwt_secret_here';

// Helper functions
function findLecturerByUsername(username) {
    return db.lecturers.find(lecturer => lecturer.username === username);
}

function findStudentByUsername(username) {
    return db.students.find(student => student.username === username);
}

function getLecturerCourses(lecturerId) {
    const lecturer = db.lecturers.find(l => l.id === lecturerId);
    if (!lecturer) return [];
    
    return db.courses.filter(course => lecturer.courses.includes(course.code));
}

function getStudentsInCourse(courseCode) {
    return db.students.filter(student => student.courses.includes(courseCode));
}

// Create HTTP server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'register') {
            // Store the connection with user ID
            clients.set(data.userId, ws);
            console.log(`Registered client: ${data.userId}`);
        }
    });
    
    ws.on('close', () => {
        // Remove the connection when closed
        for (let [userId, client] of clients.entries()) {
            if (client === ws) {
                clients.delete(userId);
                console.log(`Client disconnected: ${userId}`);
                break;
            }
        }
    });
});

// Routes

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Lecturer login page
app.get('/lecturer-login', (req, res) => {
    res.

sendFile(path.join(__dirname, 'views', 'lecturer-login.html'));
});

// Lecturer courses page
app.get('/lecturer-courses', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'lecturer-courses.html'));
});

// Lecturer send form page
app.get('/lecturer-send-form', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'lecturer-send-form.html'));
});

// Student login page
app.get('/student-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'student-login.html'));
});

// Student waiting page
app.get('/student-waiting', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'student-waiting.html'));
});

// API Routes

// Lecturer login
app.post('/api/lecturer/login', async (req, res) => {
    const { username, password } = req.body;
    
    const lecturer = findLecturerByUsername(username);
    if (!lecturer) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, lecturer.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: lecturer.id, type: 'lecturer' }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({
        token,
        id: lecturer.id,
        username: lecturer.username,
        name: lecturer.name
    });
});

// Get lecturer courses
app.get('/api/lecturer/:id/courses', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'lecturer' || decoded.id !== req.params.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const courses = getLecturerCourses(req.params.id);
        res.json(courses);
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Get students in course
app.get('/api/courses/:code/students', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
        jwt.verify(token, JWT_SECRET);
        
        const students = getStudentsInCourse(req.params.code);
        res.json(students.map(student => ({
            id: student.id,
            name: student.name
        })));
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Send attendance form
app.post('/api/attendance/send-form', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'lecturer') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const { courseCode } = req.body;
        
        // Get students in this course
        const students = getStudentsInCourse(courseCode);
        
        // Send form to each student via WebSocket
        students.forEach(student => {
            const client = clients.get(student.id);
            if (client) {
                client.send(JSON.stringify({
                    type: 'attendance_form',
                    courseCode,
                    lecturerId: decoded.id
                }));
            }
        });
        
        res.json({ message: Attendance form sent to ${students.length} students });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
    });

// Student login
app.post('/api/student/login', async (req, res) => {
    const { username, password } = req.body;
    
    const student = findStudentByUsername(username);
    if (!student) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {

return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: student.id, type: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({
        token,
        id: student.id,
        username: student.username,
        name: student.name
    });
});

// Submit attendance
app.post('/api/attendance/submit', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'student') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const { studentId, courseCode, locationVerified } = req.body;
        
        // Record attendance
        db.attendance.push({
            studentId,
            courseCode,
            date: new Date().toISOString(),
            present: true,
            locationVerified
        });
        
        res.json({ message: 'Attendance recorded successfully' });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});