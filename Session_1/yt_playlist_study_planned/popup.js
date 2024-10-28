document.addEventListener('DOMContentLoaded', function() {
    const dailyTimeInput = document.getElementById('daily-time');
    const generatePlanButton = document.getElementById('generate-plan');
    const planResultElement = document.getElementById('plan-result');
    const exportButtons = document.getElementById('export-buttons');
    const exportTxtButton = document.getElementById('export-txt');
    const exportExcelButton = document.getElementById('export-excel');
    const preferredTimeInput = document.getElementById('preferred-time');
    const includeWeekendsCheckbox = document.getElementById('include-weekends');
    const startDateInput = document.getElementById('start-date');
    const exportCalendarButton = document.getElementById('export-calendar');

    // Set default start date to today
    const today = new Date();
    startDateInput.value = today.toISOString().split('T')[0];

    let playlistVideos = [];
    let totalDuration = 0;
    let currentPlan = null;

    // Request playlist details
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        if (activeTab.url.includes('youtube.com')) {
            chrome.tabs.sendMessage(activeTab.id, {action: "getPlaylistDetails"}, function(response) {
                if (response && response.success) {
                    playlistVideos = response.videos;
                    totalDuration = playlistVideos.reduce((acc, video) => acc + video.duration, 0);
                }
            });
        }
    });

    generatePlanButton.addEventListener('click', function() {
        const dailyTime = parseInt(dailyTimeInput.value);
        if (isNaN(dailyTime) || dailyTime <= 0) {
            planResultElement.textContent = "Please enter a valid daily study time.";
            return;
        }

        const studyPlan = createStudyPlan(playlistVideos, dailyTime * 60);
        currentPlan = studyPlan;
        const totalDays = studyPlan.length;
        displayStudyPlan(studyPlan, totalDays, totalDuration);
        exportButtons.style.display = 'flex';
    });

    exportTxtButton.addEventListener('click', () => {
        if (!currentPlan) return;
        exportAsTxt(currentPlan, totalDuration);
    });

    exportExcelButton.addEventListener('click', () => {
        if (!currentPlan) return;
        exportAsExcel(currentPlan, totalDuration);
    });

    exportCalendarButton.addEventListener('click', () => {
        if (!currentPlan) return;
        createCalendarEvents(currentPlan);
    });

    function createStudyPlan(videos, dailyTimeInSeconds) {
        const plan = [];
        let currentDay = [];
        let remainingTimeForDay = dailyTimeInSeconds;

        videos.forEach((video, index) => {
            if (remainingTimeForDay >= video.duration) {
                currentDay.push(video);
                remainingTimeForDay -= video.duration;
            } else {
                if (currentDay.length > 0) {
                    plan.push([...currentDay]);
                }
                currentDay = [video];
                remainingTimeForDay = dailyTimeInSeconds - video.duration;
            }

            if (index === videos.length - 1 && currentDay.length > 0) {
                plan.push([...currentDay]);
            }
        });

        return plan;
    }

    function displayStudyPlan(plan, totalDays, totalDuration) {
        let html = `
            <div class="summary-info">
                <div class="summary-item">
                    <span class="summary-label">Total Duration:</span>
                    <span class="summary-value">${formatDuration(totalDuration)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Days:</span>
                    <span class="summary-value">${totalDays} days</span>
                </div>
            </div>
            <div class="study-plan-container">
        `;
        
        plan.forEach((day, index) => {
            const dayDuration = day.reduce((acc, video) => acc + video.duration, 0);
            
            html += `
                <div class="day-plan">
                    <h3>Day ${index + 1}</h3>
                    <p class="day-duration">Total duration: ${formatDuration(dayDuration)}</p>
                    <ul class="video-list">
                        ${day.map(video => `
                            <li class="video-item">
                                <span class="video-duration">[${video.durationText}]</span>
                                <span class="video-title">${video.title}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        });

        html += '</div>';
        planResultElement.innerHTML = html;
    }

    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours} hours and ${minutes} minutes`;
    }

    function exportAsTxt(plan, totalDuration) {
        let content = 'YouTube Playlist Study Plan\n\n';
        content += `Total Duration: ${formatDuration(totalDuration)}\n`;
        content += `Total Days: ${plan.length}\n\n`;

        plan.forEach((day, index) => {
            content += `\nDay ${index + 1}\n`;
            content += `Duration: ${formatDuration(day.reduce((acc, video) => acc + video.duration, 0))}\n`;
            content += 'Videos:\n';
            day.forEach(video => {
                content += `- [${video.durationText}] ${video.title}\n`;
            });
            content += '\n';
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'study_plan.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportAsExcel(plan, totalDuration) {
        let content = '<table>';
        content += '<tr><th colspan="3">YouTube Playlist Study Plan</th></tr>';
        content += `<tr><td colspan="3">Total Duration: ${formatDuration(totalDuration)}</td></tr>`;
        content += `<tr><td colspan="3">Total Days: ${plan.length}</td></tr>`;
        content += '<tr><td colspan="3"></td></tr>';

        plan.forEach((day, index) => {
            content += `<tr><th colspan="3">Day ${index + 1}</th></tr>`;
            content += `<tr><td colspan="3">Duration: ${formatDuration(day.reduce((acc, video) => acc + video.duration, 0))}</td></tr>`;
            content += '<tr><th>Duration</th><th>Title</th></tr>';
            day.forEach(video => {
                content += `<tr><td>${video.durationText}</td><td>${video.title}</td></tr>`;
            });
            content += '<tr><td colspan="3"></td></tr>';
        });

        content += '</table>';

        const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'study_plan.xls';
        a.click();
        URL.revokeObjectURL(url);
    }

    function createCalendarEvents(plan) {
        const startDate = new Date(startDateInput.value);
        const [preferredHours, preferredMinutes] = preferredTimeInput.value.split(':').map(Number);
        const includeWeekends = includeWeekendsCheckbox.checked;
        
        let currentDate = new Date(startDate);
        let events = [];

        plan.forEach((day, index) => {
            // Skip weekends if not included
            while (!includeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
                currentDate.setDate(currentDate.getDate() + 1);
            }

            const dayDuration = day.reduce((acc, video) => acc + video.duration, 0);
            const durationInMinutes = Math.ceil(dayDuration / 60);

            // Create event description
            let description = 'Study Plan - Day ' + (index + 1) + '\n\n';
            description += 'Videos to watch:\n';
            day.forEach(video => {
                description += `• [${video.durationText}] ${video.title}\n`;
            });

            // Create calendar event
            const event = createOutlookEvent({
                startDate: new Date(currentDate.setHours(preferredHours, preferredMinutes)),
                durationMinutes: durationInMinutes,
                subject: `Study Session - Day ${index + 1}`,
                description: description
            });

            events.push(event);
            currentDate.setDate(currentDate.getDate() + 1);
        });

        // Combine all events into one ICS file
        downloadICSFile(events, 'study_schedule.ics');
    }

    function createOutlookEvent({ startDate, durationMinutes, subject, description }) {
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        
        return `BEGIN:VEVENT
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${subject}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
END:VEVENT`;
    }

    function formatDateForICS(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    function downloadICSFile(events, filename) {
        const calendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YouTube Playlist Study Planner//EN
${events.join('\n')}
END:VCALENDAR`;

        const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
});
