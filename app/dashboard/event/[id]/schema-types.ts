export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';

export interface RegistrationField {
  id: string;          // Unik ID (f.eks 'allergies')
  label: string;       // Spørsmålet (f.eks "Har du allergier?")
  type: FieldType;     // Hva slags input?
  options?: string[];  // Valgmuligheter for select/radio
  required: boolean;   // Er det obligatorisk?
  enabled: boolean;    // Er feltet aktivert for dette eventet?
  section: 'contact' | 'logistics' | 'food' | 'legal' | 'custom'; // For gruppering
  description?: string; // Hjelpetekst
}

// Standardoppsettet som admin kan starte med
export const DEFAULT_SCHEMA: RegistrationField[] = [
  // LOGISTIKK
  { id: 'accommodation', label: 'Behov for overnatting?', type: 'select', options: ['Nei', 'Ja, enkeltrom', 'Ja, dobbeltrom'], required: true, enabled: false, section: 'logistics' },
  { id: 'transport', label: 'Transportbehov', type: 'select', options: ['Ingen', 'Tog/Buss', 'Trenger parkering'], required: false, enabled: false, section: 'logistics' },
  
  // MAT
  { id: 'dietary', label: 'Matpreferanser / Allergier', type: 'textarea', required: false, enabled: false, section: 'food', description: 'Vegetar, gluten, nøtter osv.' },
  
  // JUS / MARKEDSFØRING
  { id: 'photo_consent', label: 'Jeg samtykker til at det tas bilder av meg som kan brukes i SoMe', type: 'checkbox', required: false, enabled: false, section: 'legal' },
  { id: 'newsletter', label: 'Jeg vil motta nyhetsbrev og invitasjoner', type: 'checkbox', required: false, enabled: false, section: 'legal' }
];