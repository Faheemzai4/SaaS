const blockedDomains = [
  "cqc.org.uk",
  "healthgrades.com",
  "yelp.com",
  "facebook.com",
];

export function isBusinessWebsite(url: string) {
  return !blockedDomains.some(domain =>
    url.includes(domain)
  );
}