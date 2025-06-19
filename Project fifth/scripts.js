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