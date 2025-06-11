import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { ApolloServer } from 'apollo-server-express';
import { gql } from 'apollo-server-express';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Import GraphQL Playground middleware (works 100% offline!)
import pkg from 'graphql-playground-middleware-express';
const { default: expressPlayground } = pkg;

// Load environment variables
dotenv.config();

// ES Module equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Development mode configuration
const developmentMode = process.env.DEVELOPMENT_MODE === 'true';

const app = express();

// Get frontend URL from environment or use default
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

// Configure environment-specific CORS middleware
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  
  // Configure CORS based on environment
  let corsOptions;
  
  if (developmentMode) {
    // In development mode, be permissive with CORS to make development easier
    corsOptions = {
      // Allow requests from any origin in development
      // This makes it easier to test with various tools
      origin: function(origin, callback) {
        // Allow any origin in development mode
        // This includes undefined origins (like curl or Postman requests)
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization', 'Accept', 'Apollo-Require-Preflight']
    };
    
    // Log the request origin in development mode for debugging
    if (requestOrigin) {
      console.log(`CORS: Request from ${requestOrigin}`);
    }
  } else {
    // In production, we're more restrictive
    // Only allow specified origins
    const allowedOrigins = [
      frontendUrl,
      // Add any additional allowed origins for production
      ...process.env.ADDITIONAL_ALLOWED_ORIGINS ? 
        process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',') : 
        []
    ];
    
    corsOptions = {
      origin: function(origin, callback) {
        // Check if the origin is in our allowed list
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS: Origin not allowed'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization'],
      // Add security headers for production
      exposedHeaders: ['Content-Length', 'X-Request-Id']
    };
  }
  
  // Apply CORS for this request
  cors(corsOptions)(req, res, next);
});

// Set cookie options for Apollo Studio compatibility in development mode
if (developmentMode) {
  app.use((req, res, next) => {
    // Add a hook to modify cookie settings before they're sent
    const originalSetCookie = res.setHeader;
    res.setHeader = function(name, value) {
      if (name === 'Set-Cookie' && req.headers.origin === 'https://studio.apollographql.com') {
        // Process each cookie in the array
        const cookies = Array.isArray(value) ? value : [value];
        const processedCookies = cookies.map(cookie => {
          // Add SameSite=None; Secure if not already present
          if (!cookie.includes('SameSite=None')) {
            return cookie + '; SameSite=None; Secure';
          }
          return cookie;
        });
        return originalSetCookie.call(this, name, processedCookies);
      }
      return originalSetCookie.call(this, name, value);
    };
    next();
  });
  
  console.log('Development mode: Cookie settings configured for cross-site usage');
}

app.use(express.json());

// Add debugging endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'API server is running correctly',
    developmentMode,
    environment: {
      frontendUrl: process.env.FRONTEND_URL,
      port: process.env.PORT
    },
    requestOrigin: req.headers.origin || 'not available'
  });
});

// Serve static files from the public directory
app.use(express.static(join(__dirname, 'public')));

// Add development routes and tools
if (developmentMode) {
  // Route that serves our offline GraphQL tester
  app.get('/graphql-test', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'graphql-test.html'));
  });
  
  // Landing page with offline GraphQL tools
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GraphQL Development Server</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.5;
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
              background-color: #f9fafb;
              color: #1f2937;
            }
            .container { 
              background: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              padding: 2rem;
              margin-bottom: 2rem;
            }
            h1 { 
              color: #1f2937;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 0.5rem;
            }
            code { 
              background: #f3f4f6;
              padding: 0.2rem 0.4rem;
              border-radius: 3px;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 0.9em;
            }
            .tools {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 1rem;
              margin: 2rem 0;
            }
            .tool {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 1.5rem;
              background-color: #f9fafb;
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .tool:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            h3 {
              margin-top: 0;
              color: #2563eb;
            }
            a.btn {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 0.5rem 1rem;
              border-radius: 0.375rem;
              text-decoration: none;
              font-weight: 500;
              margin-top: 1rem;
              transition: background-color 0.2s;
            }
            a.btn:hover {
              background: #1d4ed8;
            }
            .tag {
              display: inline-block;
              font-size: 0.75rem;
              font-weight: 600;
              padding: 0.25rem 0.5rem;
              border-radius: 9999px;
              margin-left: 0.5rem;
              vertical-align: middle;
            }
            .tag.offline {
              background-color: #dcfce7;
              color: #166534;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 0.875rem;
              margin-top: 3rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>GraphQL Development Server</h1>
            <p>Welcome to your GraphQL API server. Choose one of the tools below to interact with your GraphQL API.</p>
            
            <div class="tools">
              <div class="tool">
                <h3>GraphQL Playground <span class="tag offline">100% OFFLINE</span></h3>
                <p>A full-featured GraphQL IDE with schema exploration, documentation, and query building.</p>
                <p>Perfect for development and exploring your API schema.</p>
                <a href="/playground" class="btn">Open GraphQL Playground</a>
              </div>
              
              <div class="tool">
                <h3>Simple GraphQL Tester <span class="tag offline">100% OFFLINE</span></h3>
                <p>A lightweight tool for quick GraphQL queries and mutations.</p>
                <p>Ideal for simple testing without any external dependencies.</p>
                <a href="/graphql-test" class="btn">Open Simple Tester</a>
              </div>
            </div>
            
            <h2>API Information</h2>
            <p>Your GraphQL API endpoint is available at: <code>http://localhost:${process.env.PORT || 3001}/graphql</code></p>
            <p>This endpoint works with any GraphQL client. Send POST requests with your queries in the request body.</p>
            
            <h2>Environment</h2>
            <p>Running in <strong>Development Mode</strong> with the following features enabled:</p>
            <ul>
              <li>Detailed error messages and stack traces</li>
              <li>GraphQL schema introspection</li>
              <li>Permissive CORS for local development</li>
              <li>Offline development tools</li>
            </ul>
          </div>
          
          <div class="footer">
            Healthcare Commons API Server | Environment: ${developmentMode ? 'Development' : 'Production'}
          </div>
        </body>
      </html>
    `);
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client or use mock if in development mode
let supabase;

if (developmentMode) {
  console.log('Running in development mode with mock data');
  // Create a mock Supabase client with methods we need
  supabase = {
    from: (table) => {
      // Mock provider data
      const mockProviders = [
        {
          id: '1',
          name: 'Dr. Amit Sharma',
          specialty: 'Cardiologist',
          licenseNumber: 'MH12345',
          location: 'Sunshine Hospital, Mumbai',
          pincode: '400001',
          distance: '2.3 km',
          rating: 4.8,
          availableSlots: 7,
          nextAvailable: 'Today',
          languages: ['English', 'Hindi', 'Marathi'],
          status: 'verified',
          verifiedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Dr. Priya Patel',
          specialty: 'Pediatrician',
          licenseNumber: 'DL54321',
          location: 'Children\'s Clinic, Delhi',
          pincode: '110001',
          distance: '1.5 km',
          rating: 4.9,
          availableSlots: 4,
          nextAvailable: 'Tomorrow',
          languages: ['English', 'Hindi', 'Gujarati'],
          status: 'verified',
          verifiedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Dr. Rajesh Kumar',
          specialty: 'Orthopedist',
          licenseNumber: 'KA98765',
          location: 'Joint Care Center, Bangalore',
          pincode: '560001',
          distance: '3.1 km',
          rating: 4.6,
          availableSlots: 3,
          nextAvailable: 'Thursday',
          languages: ['English', 'Hindi', 'Kannada'],
          status: 'verified',
          verifiedAt: new Date().toISOString()
        }
      ];

      return {
        select: () => ({
          eq: (field, value) => ({
            ilike: (field, pattern) => ({
              data: mockProviders.filter(p => 
                p[field].toLowerCase().includes(pattern.replace(/%/g, '').toLowerCase())
              ),
              error: null
            }),
            data: mockProviders.filter(p => p[field] === value),
            error: null
          }),
          ilike: (field, pattern) => ({
            eq: (field, value) => ({
              data: mockProviders.filter(p => 
                p[field] === value && 
                p[field].toLowerCase().includes(pattern.replace(/%/g, '').toLowerCase())
              ),
              error: null
            }),
            data: mockProviders.filter(p => 
              p[field].toLowerCase().includes(pattern.replace(/%/g, '').toLowerCase())
            ),
            error: null
          }),
          data: mockProviders,
          error: null
        }),
        insert: (provider) => {
          console.log('Mock insert:', provider);
          return { error: null };
        }
      };
    }
  };
} else {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not set');
  }
  supabase = createClient(supabaseUrl, supabaseKey);
}

// GraphQL Schema Definition
const typeDefs = gql`
  type Provider {
    id: ID!
    name: String!
    specialty: String!
    licenseNumber: String
    location: String
    pincode: String
    distance: String
    rating: Float
    availableSlots: Int
    nextAvailable: String
    languages: [String!]
    status: String
    verifiedAt: String
  }
  
  type DiagnosisResult {
    symptoms: [String!]!
    recommendedSpecialties: [String!]!
  }
  
  type VerificationResult {
    verified: Boolean!
    provider: Provider
  }
  
  type Query {
    searchProviders(name: String, specialty: String, pincode: String): [Provider!]!
    getDiagnosis(symptoms: [String!]!): DiagnosisResult!
  }
  
  type Mutation {
    verifyProvider(name: String!, specialty: String!, licenseNumber: String!, location: String, pincode: String): VerificationResult!
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    searchProviders: async (_, { name, specialty, pincode }) => {
      // Build query based on provided filters
      let query = supabase.from('providers').select('*').eq('status', 'verified');
      
      if (name) {
        query = query.ilike('name', `%${name}%`);
      }
      
      if (specialty) {
        query = query.ilike('specialty', `%${specialty}%`);
      }
      
      if (pincode) {
        query = query.eq('pincode', pincode);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error searching providers:', error);
        throw new Error('Failed to search providers');
      }
      
      return data || [];
    },
    
    getDiagnosis: async (_, { symptoms }) => {
      // Simple diagnosis service that maps symptoms to recommended specialties
      const specialtyMap = {
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
      
      const recommendedSpecialties = new Set();
      
      symptoms.forEach(symptom => {
        const specialties = specialtyMap[symptom.toLowerCase()] || ['General Practitioner'];
        specialties.forEach(s => recommendedSpecialties.add(s));
      });
      
      return {
        symptoms,
        recommendedSpecialties: Array.from(recommendedSpecialties)
      };
    }
  },
  
  Mutation: {
    verifyProvider: async (_, { name, specialty, licenseNumber, location, pincode }) => {
      const verified = !!licenseNumber;
      
      const provider = {
        id: uuidv4(),
        name,
        specialty,
        licenseNumber,
        location,
        pincode,
        status: verified ? 'verified' : 'rejected',
        verifiedAt: verified ? new Date().toISOString() : null,
        // Default values for new providers
        rating: 4.5,
        availableSlots: 5,
        nextAvailable: 'Tomorrow',
        languages: ['English', 'Hindi'],
        distance: '2.5 km'
      };
      
      const { error } = await supabase.from('providers').insert(provider);
      
      if (error) {
        console.error('Failed to insert provider', error);
        throw new Error('Failed to save provider');
      }
      
      return { verified, provider };
    }
  }
};

// Keep REST endpoint for backward compatibility
app.post('/providers/verify', async (req, res) => {
  const data = req.body || {};
  const verified = !!data.licenseNumber;

  const provider = {
    id: uuidv4(),
    ...data,
    status: verified ? 'verified' : 'rejected',
    verifiedAt: verified ? new Date().toISOString() : null
  };

  const { error } = await supabase.from('providers').insert(provider);
  if (error) {
    console.error('Failed to insert provider', error);
    return res.status(500).json({ error: 'Failed to save provider' });
  }

  res.json({ verified, provider });
});

// Initialize Apollo Server
async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Context for each request, could include authentication etc.
      return { supabase };
    }
  });

  await server.start();
  
  // Apply middleware with environment-specific GraphQL configuration
  server.applyMiddleware({ 
    app,
    // Let our custom CORS middleware handle this
    cors: false,
    // Configure based on environment
    ...developmentMode ? {
      // Development-specific options
      path: '/graphql',
      introspection: true,
      // Enable debugging features
      debug: true,
      // Better error formatting in development
      formatError: (err) => {
        console.error('GraphQL Error:', err);
        return {
          message: err.message,
          locations: err.locations,
          path: err.path,
          extensions: err.extensions,
          stack: err.originalError && err.originalError.stack ? 
            err.originalError.stack.split('\n') : []
        };
      }
    } : {
      // Production-specific options
      path: '/graphql',
      introspection: process.env.ENABLE_INTROSPECTION === 'true', // Can be controlled via env var
      debug: false,
      // Limited error information in production
      formatError: (err) => {
        // Log error on server but don't expose details to client
        console.error('GraphQL Error:', err);
        return {
          message: err.message,
          // Don't include stack traces or detailed internals in production
          path: err.path
        };
      }
    }
  });
  
  // Set up development tools
  if (developmentMode) {
    // Add GraphQL Playground route - a 100% offline GraphQL IDE
    app.get('/playground', expressPlayground({ 
      endpoint: '/graphql',
      settings: {
        'request.credentials': 'include',
        'editor.theme': 'dark',
        'editor.cursorShape': 'line',
        'editor.reuseHeaders': true,
        'tracing.hideTracingResponse': false,
        'tracing.tracingSupported': true
      }
    }));

    console.log(`
========================================================
GraphQL Development Environment:
--------------------------------------------------------
🚀 GraphQL Endpoint: http://localhost:${process.env.PORT || 3001}/graphql
🧪 GraphQL Playground (offline IDE): http://localhost:${process.env.PORT || 3001}/playground
🔧 Development Mode: ENABLED
   - Introspection: ENABLED
   - Detailed Errors: ENABLED
   - CORS: Permissive for local development
========================================================
`);
  }
  
  const port = process.env.PORT || 3001;
  
  // Check if running in test-only mode
  const testOnly = process.argv.includes('--test-only');
  
  const httpServer = app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
    console.log(`GraphQL endpoint: http://localhost:${port}${server.graphqlPath}`);
    
    if (testOnly) {
      console.log('Test-only mode: Server will shut down automatically');
      setTimeout(() => {
        httpServer.close();
        process.exit(0);
      }, 1000);
    }
  });
  
  return { server, httpServer };
}

startApolloServer();
