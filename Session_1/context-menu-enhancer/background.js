// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  const searchEngines = [
    { id: "searchYouTube", title: "YouTube", url: "https://www.youtube.com/results?search_query=" },
    { id: "searchWikipedia", title: "Wikipedia", url: "https://en.wikipedia.org/wiki/Special:Search?search=" },
    { id: "searchReddit", title: "Reddit", url: "https://www.reddit.com/search/?q=" },
    { id: "searchStackOverflow", title: "Stack Overflow", url: "https://stackoverflow.com/search?q=" },
    { id: "searchPerplexity", title: "Perplexity", url: "https://www.perplexity.ai/search?q=" }
  ];

  searchEngines.forEach(engine => {
    chrome.contextMenus.create({
      id: engine.id,
      title: engine.title,
      contexts: ["selection"]
    });
  });

  chrome.contextMenus.create({
    id: "saveToGoogleDrive",
    title: "Save to Google Drive",
    contexts: ["page", "link", "image"]
  });

  chrome.contextMenus.create({
    id: "translateText",
    title: "Translate",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const searchEngines = {
    searchYouTube: "https://www.youtube.com/results?search_query=",
    searchWikipedia: "https://en.wikipedia.org/wiki/Special:Search?search=",
    searchReddit: "https://www.reddit.com/search/?q=",
    searchStackOverflow: "https://stackoverflow.com/search?q=",
    searchPerplexity: "https://www.perplexity.ai/search?q="
  };

  if (searchEngines[info.menuItemId]) {
    const query = encodeURIComponent(info.selectionText);
    chrome.tabs.create({ url: `${searchEngines[info.menuItemId]}${query}` });
  } else {
    switch (info.menuItemId) {
      case "saveToGoogleDrive":
        // Implement Google Drive save functionality (requires additional setup and OAuth)
        alert("Save to Google Drive functionality not implemented in this example.");
        break;
      case "translateText":
        const textToTranslate = encodeURIComponent(info.selectionText);
        chrome.tabs.create({ url: `https://translate.google.com/?text=${textToTranslate}` });
        break;
    }
  }
});
