export interface DiagnosisService {
  suggestSpecialties(symptoms: string): Promise<string[]>;
}

const symptomSpecialtyData: Record<string, string[]> = {
  fever: ['General Physician', 'Pediatrician'],
  cough: ['General Physician', 'Pulmonologist'],
  cold: ['General Physician', 'ENT Specialist'],
  headache: ['Neurologist', 'General Physician'],
  rash: ['Dermatologist'],
  stomach: ['Gastroenterologist'],
  chest: ['Cardiologist'],
  child: ['Pediatrician'],
  baby: ['Pediatrician'],
  pain: ['General Physician'],
};

export const diagnosisService: DiagnosisService = {
  async suggestSpecialties(symptoms: string): Promise<string[]> {
    if (!symptoms) return [];
    const tokens = symptoms.toLowerCase().split(/[,\s]+/);
    const specialties = new Set<string>();
    tokens.forEach((token) => {
      const matches = symptomSpecialtyData[token];
      if (matches) {
        matches.forEach((m) => specialties.add(m));
      }
    });
    return Array.from(specialties);
  },
};
