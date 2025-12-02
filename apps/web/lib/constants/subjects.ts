/**
 * Liste complète des matières/catégories d'étude disponibles
 * Utilisée pour catégoriser les cardz publics
 */

export const SUBJECTS = [
  // Matières scolaires classiques
  { value: 'histoire', label: 'Histoire' },
  { value: 'geographie', label: 'Géographie' },
  { value: 'francais', label: 'Français' },
  { value: 'anglais', label: 'Anglais' },
  { value: 'espagnol', label: 'Espagnol' },
  { value: 'allemand', label: 'Allemand' },
  { value: 'italien', label: 'Italien' },
  { value: 'portugais', label: 'Portugais' },
  { value: 'chinois', label: 'Chinois' },
  { value: 'japonais', label: 'Japonais' },
  { value: 'arabe', label: 'Arabe' },
  { value: 'mathematiques', label: 'Mathématiques' },
  { value: 'physique', label: 'Physique' },
  { value: 'chimie', label: 'Chimie' },
  { value: 'svt', label: 'SVT (Sciences de la Vie et de la Terre)' },
  { value: 'biologie', label: 'Biologie' },
  { value: 'philosophie', label: 'Philosophie' },
  { value: 'litterature', label: 'Littérature' },
  { value: 'economie', label: 'Économie' },
  { value: 'sociologie', label: 'Sociologie' },
  { value: 'psychologie', label: 'Psychologie' },
  { value: 'droit', label: 'Droit' },
  { value: 'sciences-politiques', label: 'Sciences Politiques' },
  { value: 'art', label: 'Art' },
  { value: 'histoire-art', label: 'Histoire de l\'Art' },
  { value: 'musique', label: 'Musique' },
  { value: 'theatre', label: 'Théâtre' },
  { value: 'cinema', label: 'Cinéma' },
  { value: 'sport', label: 'Sport' },
  { value: 'eps', label: 'EPS (Éducation Physique et Sportive)' },
  
  // Études supérieures - Sciences
  { value: 'medecine', label: 'Médecine' },
  { value: 'pharmacie', label: 'Pharmacie' },
  { value: 'dentaire', label: 'Chirurgie Dentaire' },
  { value: 'kinesitherapie', label: 'Kinésithérapie' },
  { value: 'infirmier', label: 'Infirmier' },
  { value: 'sages-femme', label: 'Sage-femme' },
  { value: 'veterinaire', label: 'Vétérinaire' },
  { value: 'ingenierie', label: 'Ingénierie' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'genie-civil', label: 'Génie Civil' },
  { value: 'genie-mecanique', label: 'Génie Mécanique' },
  { value: 'genie-electrique', label: 'Génie Électrique' },
  { value: 'genie-industriel', label: 'Génie Industriel' },
  { value: 'aeronautique', label: 'Aéronautique' },
  { value: 'astronomie', label: 'Astronomie' },
  { value: 'geologie', label: 'Géologie' },
  { value: 'environnement', label: 'Environnement' },
  
  // Études supérieures - Commerce & Gestion
  { value: 'marketing', label: 'Marketing' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'gestion', label: 'Gestion' },
  { value: 'comptabilite', label: 'Comptabilité' },
  { value: 'finance', label: 'Finance' },
  { value: 'banque', label: 'Banque' },
  { value: 'assurance', label: 'Assurance' },
  { value: 'audit', label: 'Audit' },
  { value: 'ressources-humaines', label: 'Ressources Humaines' },
  { value: 'management', label: 'Management' },
  { value: 'entrepreneuriat', label: 'Entrepreneuriat' },
  { value: 'logistique', label: 'Logistique' },
  { value: 'supply-chain', label: 'Supply Chain' },
  
  // Études supérieures - Communication & Médias
  { value: 'communication', label: 'Communication' },
  { value: 'journalisme', label: 'Journalisme' },
  { value: 'publicite', label: 'Publicité' },
  { value: 'relations-publiques', label: 'Relations Publiques' },
  { value: 'medias', label: 'Médias' },
  { value: 'multimedia', label: 'Multimédia' },
  { value: 'web-design', label: 'Web Design' },
  { value: 'graphisme', label: 'Graphisme' },
  
  // Études supérieures - Sciences Humaines
  { value: 'anthropologie', label: 'Anthropologie' },
  { value: 'archeologie', label: 'Archéologie' },
  { value: 'linguistique', label: 'Linguistique' },
  { value: 'pedagogie', label: 'Pédagogie' },
  { value: 'education', label: 'Éducation' },
  { value: 'orthophonie', label: 'Orthophonie' },
  { value: 'orthoptie', label: 'Orthoptie' },
  
  // Études supérieures - Architecture & Design
  { value: 'architecture', label: 'Architecture' },
  { value: 'urbanisme', label: 'Urbanisme' },
  { value: 'design', label: 'Design' },
  { value: 'design-produit', label: 'Design Produit' },
  { value: 'design-interieur', label: 'Design d\'Intérieur' },
  { value: 'mode', label: 'Mode' },
  
  // Études supérieures - Hôtellerie & Tourisme
  { value: 'hotellerie', label: 'Hôtellerie' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'tourisme', label: 'Tourisme' },
  { value: 'evenementiel', label: 'Événementiel' },
  
  // Études supérieures - Autres
  { value: 'bts', label: 'BTS' },
  { value: 'dut', label: 'DUT' },
  { value: 'prepa', label: 'Classes Préparatoires' },
  { value: 'concours', label: 'Concours' },
  { value: 'permis', label: 'Permis de Conduire' },
  { value: 'code-route', label: 'Code de la Route' },
  
  // Autres catégories
  { value: 'culture-generale', label: 'Culture Générale' },
  { value: 'actualite', label: 'Actualité' },
  { value: 'developpement-personnel', label: 'Développement Personnel' },
  { value: 'langues', label: 'Langues (Autres)' },
  { value: 'autre', label: 'Autre' },
] as const;

export type SubjectValue = typeof SUBJECTS[number]['value'];

/**
 * Trouve une matière par sa valeur
 */
export function getSubjectByValue(value: string | null | undefined): typeof SUBJECTS[number] | undefined {
  if (!value) return undefined;
  return SUBJECTS.find(s => s.value === value);
}

/**
 * Trouve le label d'une matière par sa valeur
 */
export function getSubjectLabel(value: string | null | undefined): string {
  const subject = getSubjectByValue(value);
  return subject?.label || value || 'Non spécifié';
}

