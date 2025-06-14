import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

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
app.use(cors({
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization', 'Accept']
}));

// Set cookie options for development mode
if (developmentMode) {
  app.use((req, res, next) => {
    res.cookie('SameSite', 'None', {
      sameSite: 'none',
      secure: true
    });
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

// Database configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized');
} else if (developmentMode) {
  console.log('Running in development mode with mock data');
} else {
  console.error('Error: Supabase credentials not provided');
  process.exit(1);
}

// -----------------------------------------------
// GraphQL Schema Definition
// -----------------------------------------------
const typeDefs = `
  type Query {
    hello: String
    patients: [Patient]
    providers: [Provider]
    patient(id: ID!): Patient
    provider(id: ID!): Provider
    searchProviders(
      specialty: String, 
      location: String, 
      name: String, 
      pincode: String
    ): [Provider]
  }

  type Mutation {
    addPatient(name: String!, age: Int!, email: String, phone: String): Patient
    updatePatient(id: ID!, name: String, age: Int, email: String, phone: String): Patient
    deletePatient(id: ID!): Boolean
    login(email: String!, password: String!): AuthPayload
    logout: Boolean
  }
  
  type AuthPayload {
    token: String
    user: User
  }
  
  type User {
    id: ID!
    email: String!
    name: String
    role: String
  }

  type Patient {
    id: ID!
    name: String!
    age: Int!
    contactInfo: ContactInfo
  }

  type Provider {
    id: ID!
    name: String!
    specialty: String
    location: String
    pincode: String
    distance: Float
    rating: Float
    availability: [String]
    availableSlots: String
    nextAvailable: String
    languages: [String]
  }

  type ContactInfo {
    email: String
    phone: String
  }
`;

// -----------------------------------------------
// Sample data for development mode
// -----------------------------------------------
let users = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123', // In a real app, this would be hashed
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'user123',
    name: 'Regular User',
    role: 'user'
  }
];

// Simple token storage for development mode
const tokens = {};

let patients = [
  {
    id: '1',
    name: 'John Doe',
    age: 35,
    contactInfo: {
      email: 'john.doe@example.com',
      phone: '555-123-4567'
    }
  },
  {
    id: '2',
    name: 'Jane Smith',
    age: 28,
    contactInfo: {
      email: 'jane.smith@example.com',
      phone: '555-987-6543'
    }
  }
];

let providers = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    location: 'Main Hospital',
    pincode: '12345',
    distance: 2.5,
    rating: 4.8,
    availability: ['Monday', 'Wednesday', 'Friday'],
    availableSlots: 'Monday 9AM, Monday 10AM, Wednesday 2PM',
    nextAvailable: '2024-07-01 09:00 AM',
    languages: ['English', 'Spanish']
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialty: 'Pediatrics',
    location: 'West Clinic',
    pincode: '67890',
    distance: 3.8,
    rating: 4.9,
    availability: ['Tuesday', 'Thursday'],
    availableSlots: 'Tuesday 11AM, Thursday 1PM',
    nextAvailable: '2024-07-02 11:00 AM',
    languages: ['English', 'Mandarin']
  },
  {
    id: '3',
    name: 'Dr. Priya Sharma',
    specialty: 'Cardiology',
    location: 'East Medical Center',
    pincode: '45678',
    distance: 1.2,
    rating: 4.7,
    availability: ['Monday', 'Thursday', 'Friday'],
    availableSlots: 'Monday 2PM, Thursday 10AM',
    nextAvailable: '2024-07-01 02:00 PM',
    languages: ['English', 'Hindi', 'Punjabi']
  }
];

// -----------------------------------------------
// GraphQL Resolvers
// -----------------------------------------------
const resolvers = {
  hello: () => 'Hello, Healthcare Commons API!',
  
  patients: async () => {
    if (supabase && !developmentMode) {
      const { data, error } = await supabase.from('patients').select('*');
      if (error) throw new Error(error.message);
      return data;
    }
    return patients;
  },
  
  providers: async () => {
    if (supabase && !developmentMode) {
      const { data, error } = await supabase.from('providers').select('*');
      if (error) throw new Error(error.message);
      return data;
    }
    return providers;
  },
  
  patient: async ({ id }) => {
    if (supabase && !developmentMode) {
      const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data;
    }
    return patients.find(p => p.id === id);
  },
  
  provider: async ({ id }) => {
    if (supabase && !developmentMode) {
      const { data, error } = await supabase.from('providers').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data;
    }
    return providers.find(p => p.id === id);
  },
  
  searchProviders: async ({ specialty, location, name, pincode }) => {
    if (supabase && !developmentMode) {
      let query = supabase.from('providers').select('*');
      
      if (specialty) {
        query = query.ilike('specialty', `%${specialty}%`);
      }
      
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
      
      if (name) {
        query = query.ilike('name', `%${name}%`);
      }
      
      if (pincode) {
        query = query.eq('pincode', pincode);
      }
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data.map(provider => enableIntrospection(provider, 'Provider'));
    }
    
    // Filter providers for development mode
    return providers.filter(provider => {
      let match = true;
      
      if (specialty) {
        match = match && provider.specialty && 
          provider.specialty.toLowerCase().includes(specialty.toLowerCase());
      }
      
      if (location) {
        match = match && provider.location && 
          provider.location.toLowerCase().includes(location.toLowerCase());
      }
      
      if (name) {
        match = match && provider.name && 
          provider.name.toLowerCase().includes(name.toLowerCase());
      }
      
      if (pincode) {
        match = match && provider.pincode === pincode;
      }
      
      return match;
    }).map(provider => enableIntrospection(provider, 'Provider'));
  },
  
  addPatient: async ({ name, age, email, phone }) => {
    const newPatient = {
      id: uuidv4(),
      name,
      age,
      contactInfo: {
        email,
        phone
      }
    };
    
    if (supabase && !developmentMode) {
      const { data, error } = await supabase.from('patients').insert([newPatient]).select();
      if (error) throw new Error(error.message);
      return data[0];
    }
    
    patients.push(newPatient);
    return newPatient;
  },
  
  updatePatient: async ({ id, name, age, email, phone }) => {
    if (supabase && !developmentMode) {
      const updates = {};
      if (name) updates.name = name;
      if (age) updates.age = age;
      if (email || phone) {
        updates.contactInfo = {};
        if (email) updates.contactInfo.email = email;
        if (phone) updates.contactInfo.phone = phone;
      }
      
      const { data, error } = await supabase.from('patients').update(updates).eq('id', id).select();
      if (error) throw new Error(error.message);
      return data[0];
    }
    
    const patientIndex = patients.findIndex(p => p.id === id);
    if (patientIndex === -1) throw new Error('Patient not found');
    
    const patient = patients[patientIndex];
    const updatedPatient = {
      ...patient,
      name: name || patient.name,
      age: age || patient.age,
      contactInfo: {
        ...patient.contactInfo,
        email: email || patient.contactInfo.email,
        phone: phone || patient.contactInfo.phone
      }
    };
    
    patients[patientIndex] = updatedPatient;
    return updatedPatient;
  },
  
  deletePatient: async ({ id }) => {
    if (supabase && !developmentMode) {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }
    
    const initialLength = patients.length;
    patients = patients.filter(p => p.id !== id);
    return patients.length < initialLength;
  },
  
  login: async ({ email, password }, context) => {
    if (supabase && !developmentMode) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw new Error(error.message);
      
      if (context && context.res) {
        // Set cookies or session data
        context.res.cookie('auth_token', data.session.access_token, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: developmentMode ? 'none' : 'strict',
          secure: true
        });
      }
      
      return {
        token: data.session.access_token,
        user: data.user
      };
    }
    
    // Development mode authentication
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Generate a random token
    const token = uuidv4();
    
    // Store the token
    tokens[token] = {
      userId: user.id,
      created: new Date()
    };
    
    // Set cookie if we have response object
    if (context && context.res) {
      context.res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: developmentMode ? 'none' : 'strict',
        secure: true
      });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      token,
      user: userWithoutPassword
    };
  },
  
  logout: async (args, context) => {
    try {
      if (supabase && !developmentMode) {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
      }
      
      // Clear the auth cookie if we have context
      if (context && context.res) {
        // Clear the cookie regardless of whether it exists
        context.res.clearCookie('auth_token');
        
        // If we have a req with cookies, also remove from token store
        if (context.req && context.req.cookies && context.req.cookies.auth_token) {
          const token = context.req.cookies.auth_token;
          
          // Remove from tokens store in development mode
          if (tokens[token]) {
            delete tokens[token];
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Return true anyway to ensure the frontend can proceed
      return true;
    }
  }
};

// Create the GraphQL schema with introspection enabled
const schema = buildSchema(typeDefs);

// Enable __typename introspection
const enableIntrospection = (obj, typename) => {
  if (!obj) return obj;
  // Add __typename to all objects in the response
  return {
    ...obj,
    __typename: typename
  };
};

// Install cookie parser middleware
app.use(express.urlencoded({ extended: true }));

// Add cookie-parser for authentication
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Authentication middleware
app.use((req, res, next) => {
  // Check for auth token in cookies
  const token = req.cookies.auth_token;
  
  if (token) {
    if (supabase && !developmentMode) {
      // We'll just pass the token along in production
      req.user = { token };
    } else if (tokens[token]) {
      // In development, look up the user
      const userId = tokens[token].userId;
      const user = users.find(u => u.id === userId);
      
      if (user) {
        // Add user to request (without password)
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }
    }
  }
  
  next();
});

// Create the HTTP handler for GraphQL
const graphqlHandler = createHandler({
  schema,
  rootValue: resolvers,
  context: (req) => {
    // Normalize the request object based on Express or raw format
    const request = req.raw || req;
    const response = request.res;
    
    // Pass request and response objects to resolvers
    return {
      req: request,
      res: response,
      user: request.user
    };
  },
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    
    // Special handling for logout operation
    if (error.path && error.path[0] === 'logout') {
      console.log('Intercepted logout error, returning success anyway');
      return null; // This will make it not appear in the errors array
    }
    
    return developmentMode 
      ? { message: error.message, locations: error.locations, path: error.path, stack: error.stack?.split('\n') }
      : { message: error.message };
  }
});

// Add debug middleware
app.use('/graphql', (req, res, next) => {
  console.log(`GraphQL Request: ${req.method} ${req.url}`);
  if (req.body && developmentMode) {
    console.log('Request body:', JSON.stringify(req.body).substring(0, 200) + '...');
  }
  
  // Capture the original send method
  const originalSend = res.send;
  
  // Override the send method to log the response
  res.send = function(body) {
    if (developmentMode) {
      console.log(`GraphQL Response: ${res.statusCode}`);
      if (body && typeof body === 'string') {
        try {
          const parsedBody = JSON.parse(body);
          const bodyPreview = JSON.stringify(parsedBody).substring(0, 200) + '...';
          console.log('Response body:', bodyPreview);
          
          if (parsedBody.errors) {
            console.error('GraphQL Errors:', JSON.stringify(parsedBody.errors, null, 2));
          }
        } catch (e) {
          console.log('Response body: [unparseable]');
        }
      }
    }
    
    // Call the original send method
    return originalSend.apply(this, arguments);
  };
  
  next();
});

// Intercept GraphQL requests for logout operations
app.use('/graphql', (req, res, next) => {
  // Only intercept POST requests
  if (req.method !== 'POST') {
    return next();
  }
  
  // Check if this is a logout mutation
  if (req.body && 
      (req.body.query && req.body.query.includes('mutation') && req.body.query.includes('logout')) ||
      (req.body.operationName === 'Logout')) {
    console.log('Intercepted GraphQL logout request, handling directly');
    
    // Clear the auth cookie
    res.clearCookie('auth_token');
    
    // If we have a token in cookies, also remove from token store
    if (req.cookies && req.cookies.auth_token) {
      const token = req.cookies.auth_token;
      
      // Remove from tokens store in development mode
      if (tokens[token]) {
        delete tokens[token];
      }
    }
    
    // Return a successful response
    return res.json({
      data: {
        logout: true
      }
    });
  }
  
  // Not a logout mutation, continue to regular GraphQL handling
  next();
});

// Mount the GraphQL handler
app.use('/graphql', graphqlHandler);

// Create a simple HTML page for GraphiQL
const graphiqlHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>GraphiQL</title>
  <style>
    body {
      height: 100%;
      margin: 0;
      width: 100%;
      overflow: hidden;
    }
    #graphiql {
      height: 100vh;
    }
  </style>
  <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/graphiql@2.3.0/graphiql.min.css" />
  <script src="https://unpkg.com/graphiql@2.3.0/graphiql.min.js"></script>
</head>
<body>
  <div id="graphiql"></div>
  <script>
    function graphQLFetcher(graphQLParams) {
      return fetch('/graphql', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphQLParams),
        credentials: 'include',
      }).then(function (response) {
        return response.json();
      });
    }
    
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        defaultQuery: "query { \n  hello \n  searchProviders(specialty: \"Cardiology\") { \n    id \n    name \n    specialty \n    location \n    pincode \n    distance \n    rating \n    availability \n    availableSlots \n    nextAvailable \n    languages \n  } \n}",
      }),
      document.getElementById('graphiql')
    );
  </script>
</body>
</html>
`;

// Create a simple tester HTML page
const testerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GraphQL Tester</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    h1 { color: #2563eb; }
    .container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
      }
    }
    .panel {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    textarea {
      width: 100%;
      height: 300px;
      font-family: monospace;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    #response {
      height: 300px;
      overflow: auto;
      background: #f8fafc;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-family: monospace;
      white-space: pre-wrap;
    }
    button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
    button:hover {
      background: #1d4ed8;
    }
    .examples {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .example {
      background: #e0f2fe;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .example:hover {
      background: #bae6fd;
    }
  </style>
</head>
<body>
  <h1>GraphQL Tester</h1>
  <p>A simple, 100% offline tool for testing your GraphQL API.</p>
  
  <div class="container">
    <div class="panel">
      <h2>Query</h2>
      <textarea id="query">query {
  hello
}</textarea>
      <div class="examples">
        <div class="example" onclick="setExample('hello')">Hello Query</div>
        <div class="example" onclick="setExample('patients')">Get Patients</div>
        <div class="example" onclick="setExample('providers')">Get Providers</div>
        <div class="example" onclick="setExample('patient')">Get Patient</div>
        <div class="example" onclick="setExample('searchProviders')">Search Providers</div>
        <div class="example" onclick="setExample('login')">Login</div>
        <div class="example" onclick="setExample('logout')">Logout</div>
      </div>
      <button onclick="executeQuery()">Execute Query</button>
    </div>
    
    <div class="panel">
      <h2>Response</h2>
      <div id="response">// Results will appear here</div>
    </div>
  </div>
  
  <script>
    const examples = {
      hello: \`query {
  hello
}\`,
      patients: \`query {
  patients {
    id
    name
    age
    contactInfo {
      email
      phone
    }
  }
}\`,
      providers: \`query {
  providers {
    id
    name
    specialty
    location
    availability
  }
}\`,
      patient: \`query {
  patient(id: "1") {
    id
    name
    age
    contactInfo {
      email
      phone
    }
  }
}\`,
      login: \`mutation {
  login(email: "user@example.com", password: "user123") {
    token
    user {
      id
      email
      name
      role
    }
  }
}\`,
      logout: \`mutation {
  logout
}\`,
      searchProviders: \`query {
  searchProviders(specialty: "Cardiology", name: "", pincode: "") {
    id
    name
    specialty
    location
    pincode
    distance
    rating
    availability
    availableSlots
    nextAvailable
    languages
  }
}\`
    };
    
    function setExample(name) {
      document.getElementById('query').value = examples[name];
    }
    
    async function executeQuery() {
      const query = document.getElementById('query').value;
      const responseElement = document.getElementById('response');
      
      try {
        responseElement.textContent = 'Loading...';
        
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        responseElement.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        responseElement.textContent = 'Error: ' + error.message;
      }
    }
  </script>
</body>
</html>
`;

// Create a home page for navigation
const homeHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GraphQL Development Server</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background-color: #f9fafb;
      color: #1f2937;
    }
    h1 {
      color: #2563eb;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
    .container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 2rem;
      margin-bottom: 2rem;
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
      margin-top: 1rem;
    }
    .badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      margin-left: 0.5rem;
    }
    code {
      background: #f3f4f6;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: monospace;
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
        <h3>GraphiQL <span class="badge">100% OFFLINE</span></h3>
        <p>A full-featured GraphQL IDE with schema exploration, documentation, and query building.</p>
        <a href="/graphiql" class="btn">Open GraphiQL</a>
      </div>
      
      <div class="tool">
        <h3>Simple Tester <span class="badge">100% OFFLINE</span></h3>
        <p>A lightweight tool for quick GraphQL queries and mutations.</p>
        <a href="/tester" class="btn">Open Simple Tester</a>
      </div>
    </div>
    
    <h2>API Information</h2>
    <p>Your GraphQL API endpoint is available at: <code>/graphql</code></p>
    <p>This endpoint works with any GraphQL client. Send POST requests with your queries in the request body.</p>
    
    <h2>Environment</h2>
    <p>Running in <strong>Development Mode</strong> with the following features enabled:</p>
    <ul>
      <li>Detailed error messages and stack traces</li>
      <li>GraphQL schema introspection</li>
      <li>Mock data for testing</li>
      <li>100% offline development tools</li>
    </ul>
  </div>
  
  <div class="footer">
    Healthcare Commons API Server | Environment: ${developmentMode ? 'Development' : 'Production'}
  </div>
</body>
</html>
`;

// Add an endpoint to parse slots from string to JSON
app.post('/api/parse-slots', (req, res) => {
  const { slotsString } = req.body;
  
  try {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(slotsString);
      return res.json({ success: true, slots: parsed });
    } catch (e) {
      // Not JSON, try to parse as text format
      const slots = [];
      
      // Simple parser for "Monday 9AM, Monday 10AM" format
      const parts = slotsString.split(',').map(s => s.trim());
      
      for (const part of parts) {
        const [day, time] = part.split(' ');
        
        if (day && time) {
          slots.push({
            date: day,
            time: time,
            available: true
          });
        }
      }
      
      return res.json({ success: true, slots });
    }
  } catch (error) {
    console.error('Error parsing slots:', error);
    return res.status(400).json({ success: false, error: 'Could not parse slots string' });
  }
});


// Add development routes
if (developmentMode) {
  // Save files to the public directory
  fs.writeFileSync(join(__dirname, 'public', 'graphiql.html'), graphiqlHtml);
  fs.writeFileSync(join(__dirname, 'public', 'tester.html'), testerHtml);
  fs.writeFileSync(join(__dirname, 'public', 'index.html'), homeHtml);
  
  // Create route handlers
  app.get('/graphiql', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'graphiql.html'));
  });
  
  app.get('/tester', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'tester.html'));
  });
}

// Start the server
const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`
========================================================
GraphQL Server (100% OFFLINE)
--------------------------------------------------------
🚀 Server running at: http://localhost:${port}
📡 GraphQL endpoint: http://localhost:${port}/graphql
🧪 Development tools:
   - GraphiQL: http://localhost:${port}/graphiql
   - Simple tester: http://localhost:${port}/tester
🔧 Mode: ${developmentMode ? 'Development (with mock data)' : 'Production'}
========================================================
`);
});

export default server;
