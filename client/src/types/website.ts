export interface WebsiteData {
  title: string;
  url: string;
  description: string;
  h1: string[];

  emails: string[];
  phones: string[];

  images: number;
  buttons: number;
  forms: number;

  socialLinks: {
    facebook: string[];
    instagram: string[];
    linkedin: string[];
    x: string[];
    whatsapp: string[];
  };
}
