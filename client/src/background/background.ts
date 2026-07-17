console.log("🚀 Background Service Worker Started");

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "ANALYZE_WEBSITE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      if (!tab.id) return;

      chrome.tabs.sendMessage(
        tab.id,
        {
          type: "GET_WEBSITE_DATA",
        },
        (response) => {
          sendResponse(response);
        },
      );
    });

    return true;
  }
});