/**
 * Diagnosis Service
 * 
 * This service helps match patient symptoms with appropriate medical specialties.
 * It provides client-side symptom analysis to help guide patients to the right providers.
 */
import { useQuery } from '@apollo/client';
import { GET_DIAGNOSIS } from './graphql';

// Common symptom options for UI display
export const commonSymptoms = [
  'Headache',
  'Fever',
  'Cough',
  'Cold',
  'Rash',
  'Joint Pain',
  'Back Pain',
  'Stomach Pain',
  'Chest Pain',
  'Fatigue',
  'Anxiety',
  'Depression',
  'Insomnia',
  'Vision Problems',
  'Hearing Problems'
];

// Custom hook to get diagnosis recommendations
export const useDiagnosis = (symptoms: string[]) => {
  const { loading, error, data } = useQuery(GET_DIAGNOSIS, {
    variables: { symptoms },
    skip: !symptoms.length,
  });

  return {
    loading,
    error,
    diagnosis: data?.getDiagnosis || null,
  };
};

// Utility function to get specialty suggestions for a symptom without GraphQL
export const getSpecialtyForSymptom = (symptom: string): string[] => {
  const specialtyMap: Record<string, string[]> = {
    'headache': ['Neurologist', 'General Practitioner'],
    'fever': ['General Practitioner', 'Infectious Disease Specialist'],
    'cough': ['Pulmonologist', 'General Practitioner'],
    'cold': ['ENT Specialist', 'General Practitioner'],
    'rash': ['Dermatologist', 'Allergist'],
    'joint pain': ['Rheumatologist', 'Orthopedist'],
    'back pain': ['Orthopedist', 'Physiotherapist'],
    'stomach pain': ['Gastroenterologist', 'General Practitioner'],
    'chest pain': ['Cardiologist', 'Emergency Medicine'],
    'fatigue': ['General Practitioner', 'Endocrinologist'],
    'anxiety': ['Psychiatrist', 'Psychologist'],
    'depression': ['Psychiatrist', 'Psychologist'],
    'insomnia': ['Sleep Specialist', 'Psychiatrist'],
    'vision problems': ['Ophthalmologist', 'Neurologist'],
    'hearing problems': ['ENT Specialist', 'Audiologist']
  };
  
  const normalizedSymptom = symptom.toLowerCase();
  return specialtyMap[normalizedSymptom] || ['General Practitioner'];
};