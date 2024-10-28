function getTotalDuration() {
    // Wait for elements to load
    const waitForElements = setInterval(() => {
        const durationElements = document.querySelectorAll('span.ytd-thumbnail-overlay-time-status-renderer');
        
        if (durationElements.length > 0) {
            clearInterval(waitForElements);
            let totalSeconds = 0;

            durationElements.forEach(element => {
                const timeString = element.textContent.trim();
                const timeParts = timeString.split(':').map(part => parseInt(part));
                
                // Handle HH:MM:SS format
                if (timeParts.length === 3) {
                    totalSeconds += timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                }
                // Handle MM:SS format
                else if (timeParts.length === 2) {
                    totalSeconds += timeParts[0] * 60 + timeParts[1];
                }
            });

            chrome.runtime.sendMessage({
                action: "updateDuration",
                totalDuration: totalSeconds
            });
        }
    }, 1000); // Check every second
}

function getPlaylistDetails() {
    const videos = [];
    const videoElements = document.querySelectorAll('ytd-playlist-video-renderer');
    
    videoElements.forEach(videoEl => {
        const title = videoEl.querySelector('#video-title').textContent.trim();
        const duration = videoEl.querySelector('span.ytd-thumbnail-overlay-time-status-renderer').textContent.trim();
        
        // Convert duration to seconds
        const timeParts = duration.split(':').map(part => parseInt(part));
        let durationInSeconds = 0;
        
        if (timeParts.length === 3) { // HH:MM:SS
            durationInSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        } else if (timeParts.length === 2) { // MM:SS
            durationInSeconds = timeParts[0] * 60 + timeParts[1];
        }
        
        videos.push({
            title: title,
            duration: durationInSeconds,
            durationText: duration
        });
    });

    return videos;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTotalDuration") {
        getTotalDuration();
        // Send immediate response to keep connection alive
        sendResponse({status: "calculating"});
        return true;
    }
    if (request.action === "getPlaylistDetails") {
        const details = getPlaylistDetails();
        sendResponse({
            success: true,
            videos: details
        });
    }
    return true;
});

// Run when page loads
getTotalDuration();
getPlaylistDetails();
