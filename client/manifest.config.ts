import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,

  name: "AI Website Sales Agent",

  description: "Analyze websites using AI.",

  version: "1.0.0",
 
  action: {
    default_popup: "popup.html",
    default_title: "AI Website Sales Agent",
  },

  permissions: ["activeTab", "tabs", "storage", "scripting"],

  host_permissions: ["<all_urls>"],

  background: {
    service_worker: "src/background/background.ts",
    type: "module",
  },

  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/content.ts"],
      run_at: "document_idle",
    },
  ],

  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
});