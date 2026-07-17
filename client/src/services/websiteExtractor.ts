import type { WebsiteData } from "../types/website";

function extractEmails(pageText: string): string[] {
  // Emails from mailto: links
  const mailtoEmails = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]'),
  )
    .map((link) => link.href.replace("mailto:", "").split("?")[0])
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  // Emails from visible text
  const regexEmails =
    pageText
      .match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)
      ?.map((email) => email.trim().toLowerCase()) ?? [];

  return [...new Set([...mailtoEmails, ...regexEmails])].filter(
    (email) => email.length <= 254,
  );
}

function extractPhones(pageText: string): string[] {
  // Phones from tel: links
  const telPhones = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]'),
  )
    .map((link) => link.href.replace("tel:", "").split("?")[0])
    .map((phone) => phone.trim())
    .filter(Boolean);

  // Phones from visible text
  const regexPhones =
    pageText
      .match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g)
      ?.map((phone) => phone.trim()) ?? [];

  return [...new Set([...telPhones, ...regexPhones])];
}

export function extractWebsiteData(): WebsiteData {
  const title = document.title;
  const url = window.location.href;
  const pageText = document.body.innerText;

  const description =
    document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content") || "";

  const h1 = Array.from(document.querySelectorAll("h1")).map(
    (heading) => heading.textContent?.trim() || "",
  );

  const emails = extractEmails(pageText);
  const phones = extractPhones(pageText);

  const images = document.images.length;
  const buttons = document.querySelectorAll("button").length;
  const forms = document.querySelectorAll("form").length;

  const links = Array.from(document.links).map((link) => link.href);

  const socialLinks = {
    facebook: links.filter((link) => link.includes("facebook.com")),
    instagram: links.filter((link) => link.includes("instagram.com")),
    linkedin: links.filter((link) => link.includes("linkedin.com")),
    x: links.filter(
      (link) => link.includes("twitter.com") || link.includes("x.com"),
    ),
    whatsapp: links.filter(
      (link) => link.includes("wa.me") || link.includes("whatsapp.com"),
    ),
  };

  return {
    title,
    url,
    description,
    h1,
    emails,
    phones,
    images,
    buttons,
    forms,
    socialLinks,
  };
}
