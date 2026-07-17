import { extractWebsiteData } from "../services/websiteExtractor";

console.log("📄 Content Script Loaded");

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_WEBSITE_DATA") {
    sendResponse(extractWebsiteData());
  }

  return true;
});