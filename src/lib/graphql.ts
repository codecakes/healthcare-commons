import { gql } from '@apollo/client';

// Query to search for providers
export const SEARCH_PROVIDERS = gql`
  query SearchProviders($name: String, $specialty: String, $pincode: String) {
    searchProviders(name: $name, specialty: $specialty, pincode: $pincode) {
      id
      name
      specialty
      location
      pincode
      distance
      rating
      availableSlots
      nextAvailable
      languages
    }
  }
`;

// Query to get diagnosis based on symptoms
export const GET_DIAGNOSIS = gql`
  query GetDiagnosis($symptoms: [String!]!) {
    getDiagnosis(symptoms: $symptoms) {
      symptoms
      recommendedSpecialties
    }
  }
`;

// Mutation to verify a provider
export const VERIFY_PROVIDER = gql`
  mutation VerifyProvider(
    $name: String!
    $specialty: String!
    $licenseNumber: String!
    $location: String
    $pincode: String
  ) {
    verifyProvider(
      name: $name
      specialty: $specialty
      licenseNumber: $licenseNumber
      location: $location
      pincode: $pincode
    ) {
      verified
      provider {
        id
        name
        specialty
        status
        verifiedAt
      }
    }
  }
`;