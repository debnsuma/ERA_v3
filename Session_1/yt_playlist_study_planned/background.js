chrome.action.onClicked.addListener((tab) => {
    if (tab.url.includes("youtube.com/playlist")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: getTotalDuration,
        });
    }
});
