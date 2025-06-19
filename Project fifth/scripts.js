// Function to get the user's location
function getLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                callback(null, { latitude, longitude });
            },
            (error) => {
                callback(error, null);
            }
        );
    } else {
        callback(new Error("Geolocation is not supported by this browser."), null);
    }
}

// Function to calculate distance using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius of the Earth in meters
    const φ1 = (lat1 * Math.PI) / 180; // Convert latitude to radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Lecturer sends the attendance form
document.getElementById('sendAttendanceForm')?.addEventListener('click', function () {
    getLocation((error, lecturerLocation) => {
        if (error) {
            alert("Error getting lecturer location: " + error.message);
            return;
        }

        // Store lecturer's location (you can send it to the server)
        localStorage.setItem('lecturerLocation', JSON.stringify(lecturerLocation));
        alert('Attendance form sent to students within 100 meters.');
    });
});

// Student waits for the form and checks location
window.addEventListener('load', function () {
    getLocation((error, studentLocation) => {
        if (error) {
            alert("Error getting student location: " + error.message);
            return;
        }

        // Display student's location
        const studentLocationElement = document.getElementById('studentLocation');
        if (studentLocationElement) {
            studentLocationElement.innerText =
                `Your location: Latitude ${studentLocation.latitude}, Longitude ${studentLocation.longitude}`;
        }

        // Retrieve lecturer's location (from localStorage or server)
        const lecturerLocation = JSON.parse(localStorage.getItem('lecturerLocation'));
        if (!lecturerLocation) {
            alert("Lecturer location not found.");
            return;
        }

        // Calculate distance
        const distance = calculateDistance(
            lecturerLocation.latitude,
            lecturerLocation.longitude,
            studentLocation.latitude,
            studentLocation.longitude
        );

        if (distance <= 100) {
            alert("You are within 100 meters of the lecturer. You can submit the attendance form.");
            // Allow the student to submit the form
        } else {
            alert("You are not within 100 meters of the lecturer. Cannot submit the form.");
        }
    });
});