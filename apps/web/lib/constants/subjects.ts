export interface Subject {
  value: string;
  label: string;
}

export const SUBJECTS: Subject[] = [
  { value: 'mathematiques', label: 'Mathématiques' },
  { value: 'francais', label: 'Français' },
  { value: 'anglais', label: 'Anglais' },
  { value: 'histoire', label: 'Histoire' },
  { value: 'geographie', label: 'Géographie' },
  { value: 'sciences', label: 'Sciences' },
  { value: 'physique', label: 'Physique' },
  { value: 'chimie', label: 'Chimie' },
  { value: 'biologie', label: 'Biologie' },
  { value: 'philosophie', label: 'Philosophie' },
  { value: 'economie', label: 'Économie' },
  { value: 'droit', label: 'Droit' },
  { value: 'medecine', label: 'Médecine' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'gestion', label: 'Gestion' },
  { value: 'psychologie', label: 'Psychologie' },
  { value: 'sociologie', label: 'Sociologie' },
  { value: 'art', label: 'Art' },
  { value: 'musique', label: 'Musique' },
  { value: 'sport', label: 'Sport' },
  { value: 'langues', label: 'Langues étrangères' },
  { value: 'litterature', label: 'Littérature' },
  { value: 'autre', label: 'Autre' },
];

export function getSubjectLabel(value: string): string {
  const subject = SUBJECTS.find((s) => s.value === value);
  return subject?.label || value;
}

