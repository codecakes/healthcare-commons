import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Determine if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development';

// Get GraphQL endpoint from environment or use default
const graphqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:3001/graphql';

console.log(`Apollo Client connecting to: ${graphqlEndpoint} in ${isDevelopment ? 'development' : 'production'} mode`);

// Create an HTTP link to your GraphQL server
const httpLink = createHttpLink({
  uri: graphqlEndpoint,
  // In development with different ports, using 'include' can cause CORS issues
  // In production or when same-origin, 'include' is fine for auth
  credentials: isDevelopment ? 'omit' : 'include'
});

// Create the Apollo Client instance
const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Don't cache by default for healthcare data
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient;