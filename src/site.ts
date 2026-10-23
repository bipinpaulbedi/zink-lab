/** The five portal sections in menu sequence. Each entry belongs to exactly one section. */
export const SECTIONS = {
  note: {
    path: 'notes',
    label: 'Notes',
    title: 'Notes',
    blurb:
      'Short form notes capturing observations, ideas, and mental models that help make sense of complex topics, explore different perspectives, and develop a deeper understanding.',
  },
  experiment: {
    path: 'experiments',
    label: 'Experiments',
    title: 'Experiments',
    blurb:
      'A collection of ideas, hypotheses, and assumptions put to the test through exploration and experimentation.',
  },
  concept: {
    path: 'concepts',
    label: 'Concepts',
    title: 'Concepts',
    blurb:
      'Essays about mental models, frameworks, and principles for understanding complex system, recognizing patterns, and approaching recurring problems with clarity and structured thinking.',
  },
  miscellaneous: {
    path: 'miscellaneous',
    label: 'Miscellaneous',
    title: 'Miscellaneous',
    blurb: 'More, misc, meta',
  },
  vault: {
    path: 'vault',
    label: 'Vault',
    title: 'Vault',
    blurb:
      'Reference material: sources, recorded talks, and entries that no longer receive updates.',
  },
} as const;
export type Section = keyof typeof SECTIONS;
export const SECTION_IDS = Object.keys(SECTIONS) as [Section, ...Section[]];

/** Portal source location. Entries link to their Git history and discussions here. */
export const REPO = 'https://github.com/bipinpaulbedi/zink-lab'; // replace before publishing
export const AUTHOR_NAME = 'Bipin Paul Bedi'; // sole author until an authors collection is added

/** Replace these placeholder URLs with the author's profiles before publishing. */
export const SOCIAL_PROFILES = {
  twitter: 'https://x.com/bipinpaulbedi',
  linkedin: 'https://www.linkedin.com/in/bipinpaulbedi/',
} as const;

export const historyUrl = (id: string) =>
  `${REPO}/commits/main/src/content/portal/${id}/index.md`;
export const discussUrl = (title: string) =>
  `${REPO}/discussions?discussions_q=${encodeURIComponent(title)}`;
