// Shared inline SVG icons (static, trusted markup) and the contact channels
// that use them, so the hero icons and the "Find me" list never drift apart.

const stroke = (paths) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const solid = (path) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`;

const pixel = (path) =>
  `<svg viewBox="0 0 11 11" width="22" height="22" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="${path}"/></svg>`;

export const ICONS = Object.freeze({
  email: stroke('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/>'),
  phone: stroke('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
  linkedin: solid("M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.5H3.5V9h3.6v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z"),
  github: solid("M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"),
  instagram: stroke('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/>'),
  // Navigation icons: an original set (not the usual house/person/briefcase).
  home: stroke('<path d="M4 11.5 12 5l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><circle cx="12" cy="14.5" r="2.2"/>'),
  about: stroke('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2"/><path d="M5.8 16c.6-1.3 1.8-2 3.2-2s2.6.7 3.2 2"/><path d="M14.5 10h4M14.5 13.5h3"/>'),
  experience: stroke('<path d="M6 4v16"/><circle cx="6" cy="7" r="2" fill="currentColor"/><circle cx="6" cy="17" r="2" fill="currentColor"/><path d="M10.5 7H20M10.5 12H17M10.5 17H19"/>'),
  projects: stroke('<path d="m12 3 9 4.8-9 4.8-9-4.8z"/><path d="m3 12.2 9 4.8 9-4.8"/><path d="m3 16.6 9 4.8 9-4.8"/>'),
  contact: stroke('<path d="M21.5 2.5 10.5 13.5"/><path d="m21.5 2.5-7 19-4-8-8-4z"/>'),
  // Theme switch: pixel art on an 11x11 grid, matching the pixel transition.
  sun: pixel("M5 0h1v1h-1zM1 1h1v1h-1zM5 1h1v1h-1zM9 1h1v1h-1zM2 2h1v1h-1zM8 2h1v1h-1zM4 3h3v1h-3zM3 4h5v1h-5zM0 5h2v1h-2zM3 5h5v1h-5zM9 5h2v1h-2zM3 6h5v1h-5zM4 7h3v1h-3zM2 8h1v1h-1zM8 8h1v1h-1zM1 9h1v1h-1zM5 9h1v1h-1zM9 9h1v1h-1zM5 10h1v1h-1z"),
  moon: pixel("M3 1h2v1h-2zM2 2h2v1h-2zM1 3h3v1h-3zM1 4h3v1h-3zM1 5h4v1h-4zM1 6h4v1h-4zM1 7h6v1h-6zM9 7h1v1h-1zM2 8h7v1h-7zM3 9h5v1h-5z"),
  writing: stroke('<path d="M12 20.5h8.5"/><path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7.2 18.8 3 20l1.2-4.2z"/><path d="m14.5 5.5 3 3"/>'),
});

/** Contact channels in display order. `hero: true` ones also appear as hero icons. */
export function contactChannels(contact) {
  const { email, phone, linkedin, github, instagram } = contact;
  const bare = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const handle = (url) => `@${bare(url).split("/").pop()}`;
  // Channels left null in the profile are skipped.
  return [
    email && { id: "email", label: "Email", href: `mailto:${email}`, text: email, hero: true },
    phone && { id: "phone", label: "Phone", href: `tel:${phone.replace(/[^+\d]/g, "")}`, text: phone },
    linkedin && { id: "linkedin", label: "LinkedIn", href: linkedin, text: bare(linkedin), hero: true },
    github && { id: "github", label: "GitHub", href: github, text: bare(github), hero: true },
    instagram && { id: "instagram", label: "Instagram", href: instagram, text: handle(instagram), hero: true },
  ].filter(Boolean);
}
