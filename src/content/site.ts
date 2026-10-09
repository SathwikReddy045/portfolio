/**
 * Single source of truth for personal details.
 * Replace the bracketed placeholders with real values before launch.
 */
export const site = {
  name: "Sathwik Reddy",
  role: "Software Engineer · Creative Technologist",
  roleLong: "Software Engineer, Technical Architect & Creative Technologist",
  statement: ["I BUILD WORLDS", "BETWEEN DIGITAL", "AND PHYSICAL."],
  intro:
    "Software engineer and technical architect building spatial experiences, real-time visualization systems, AR/VR applications and unconventional digital products. From the pipeline to the pixel.",
  availability: "Available for select projects",
  location: {
    city: "Hyderabad",
    country: "India",
    lat: "17.3850° N",
    lng: "78.4867° E",
    timeZone: "Asia/Kolkata",
  },
  focus: ["Software engineering", "Spatial technology", "Real-time 3D", "Interactive experiences"],
  links: {
    email: "sathwikreddy045@gmail.com",
    github: "https://github.com/SathwikReddy045",
  },
  year: 2026,
  nav: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Experiments", href: "#experiments" },
    { label: "Contact", href: "#contact" },
  ],
} as const;

export const isPlaceholder = (v: string) => v.startsWith("[") && v.endsWith("]");
