import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { createHandler } from 'graphql-http/lib/use/express';
import { buildSchema } from 'graphql';
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
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  
  // Configure CORS based on environment
  let corsOptions;
  
  if (developmentMode) {
    // In development mode, be permissive with CORS to make development easier
    corsOptions = {
      // Allow requests from any origin in development
      origin: function(origin, callback) {
        // Allow any origin in development mode
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization', 'Accept']
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
  }

  type Mutation {
    addPatient(name: String!, age: Int!, email: String, phone: String): Patient
    updatePatient(id: ID!, name: String, age: Int, email: String, phone: String): Patient
    deletePatient(id: ID!): Boolean
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
    availability: [String]
  }

  type ContactInfo {
    email: String
    phone: String
  }
`;

// -----------------------------------------------
// Sample data for development mode
// -----------------------------------------------
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
    availability: ['Monday', 'Wednesday', 'Friday']
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialty: 'Pediatrics',
    location: 'West Clinic',
    availability: ['Tuesday', 'Thursday']
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
  }
};

// Create the GraphQL schema
const schema = buildSchema(typeDefs);

// Create the HTTP handler for GraphQL
const graphqlHandler = createHandler({
  schema,
  rootValue: resolvers,
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return developmentMode 
      ? { message: error.message, locations: error.locations, path: error.path, stack: error.stack?.split('\n') }
      : { message: error.message };
  }
});

// Mount the GraphQL handler
app.use('/graphql', graphqlHandler);

// -----------------------------------------------
// Add offline GraphiQL - a pure HTML/JS GraphQL IDE
// -----------------------------------------------
const graphiqlHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>GraphiQL - Offline GraphQL IDE</title>
  <style>
    body {
      height: 100%;
      margin: 0;
      width: 100%;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    #graphiql {
      height: 100vh;
    }
    
    .graphiql-container {
      height: 100vh;
    }
    
    #toolbar {
      background-color: #f3f4f6;
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .title {
      font-weight: 600;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .badge {
      background-color: #dcfce7;
      color: #166534;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 9999px;
    }
  </style>
  <!-- Load the React, ReactDOM and GraphiQL libraries -->
  <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/graphiql@2.3.0/graphiql.min.css" />
  <script src="https://unpkg.com/graphiql@2.3.0/graphiql.min.js"></script>
  <script src="https://unpkg.com/graphql-ws/umd/graphql-ws.js"></script>
</head>
<body>
  <div id="toolbar">
    <div class="title">
      GraphiQL <span class="badge">Offline Mode</span>
    </div>
    <div>
      Endpoint: <code>/graphql</code>
    </div>
  </div>
  <div id="graphiql"></div>
  <script>
    // Parse the search string to get url parameters
    const parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      const eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });
    
    // If the query and variables are present in the URL,
    // use them to populate the editor
    let defaultQuery = parameters.query || `# Welcome to GraphiQL
#
# This is a simple offline GraphQL IDE for exploring your API
# Press the play button (or press Ctrl+Enter) to execute your query
#
# Try this query to get started:

query {
  hello
  patients {
    id
    name
    age
    contactInfo {
      email
      phone
    }
  }
}`;

    let defaultVariables = parameters.variables || "{}";
    
    // Create a fetcher that uses the fetch API to call the GraphQL server
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
    
    // Render the GraphiQL interface
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        defaultQuery: defaultQuery,
        defaultVariables: defaultVariables,
        headerEditorEnabled: true,
        shouldPersistHeaders: true,
      }),
      document.getElementById('graphiql')
    );
  </script>
</body>
</html>
`;

// Add a simple GraphQL test UI for development
if (developmentMode) {
  // Create the GraphiQL HTML file if it doesn't exist
  fs.writeFileSync(join(__dirname, 'public', 'graphiql.html'), graphiqlHTML);
  
  // Serve GraphiQL interface
  app.get('/graphiql', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'graphiql.html'));
  });
  
  // Create a simple offline GraphQL tester
  const testerHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple GraphQL Tester</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f7fa;
    }
    h1, h2 {
      color: #2563eb;
    }
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
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    textarea {
      width: 100%;
      height: 300px;
      font-family: monospace;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    #response {
      background: #f8fafc;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      min-height: 300px;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      font-family: monospace;
    }
    button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin: 10px 0;
    }
    button:hover {
      background: #1d4ed8;
    }
    .examples {
      margin-top: 20px;
    }
    .example {
      background: #e0f2fe;
      border-radius: 4px;
      padding: 8px 12px;
      margin: 5px 0;
      cursor: pointer;
      display: inline-block;
      margin-right: 10px;
    }
    .example:hover {
      background: #bae6fd;
    }
  </style>
</head>
<body>
  <h1>Simple GraphQL Tester</h1>
  <p>Use this tool to test your GraphQL API without any external dependencies.</p>
  
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
  
  fs.writeFileSync(join(__dirname, 'public', 'tester.html'), testerHTML);
  
  // Serve the simple tester
  app.get('/tester', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'tester.html'));
  });
  
  // Create an index page with links to all tools
  app.get('/', (req, res) => {
    res.send(`
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
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #f5f7fa;
          }
          h1 { color: #2563eb; }
          .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 2rem;
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
            background: #f8fafc;
          }
          h3 { 
            margin-top: 0;
            color: #2563eb;
          }
          .btn {
            display: inline-block;
            background: #2563eb;
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            margin-top: 1rem;
          }
          .badge {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            font-size: 0.75rem;
            padding: 2px 8px;
            border-radius: 9999px;
            margin-left: 0.5rem;
            vertical-align: middle;
          }
          pre {
            background: #f1f5f9;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>GraphQL Development Server</h1>
          <p>Welcome to your 100% offline GraphQL development server. Choose a tool to interact with your GraphQL API:</p>
          
          <div class="tools">
            <div class="tool">
              <h3>GraphiQL <span class="badge">100% OFFLINE</span></h3>
              <p>A full-featured GraphQL IDE with schema exploration, history, and documentation.</p>
              <a href="/graphiql" class="btn">Open GraphiQL</a>
            </div>
            
            <div class="tool">
              <h3>Simple Tester <span class="badge">100% OFFLINE</span></h3>
              <p>A lightweight GraphQL query tool for quick testing.</p>
              <a href="/tester" class="btn">Open Simple Tester</a>
            </div>
          </div>
          
          <h2>API Information</h2>
          <p>Your GraphQL endpoint is available at: <code>/graphql</code></p>
          
          <h3>Example Query</h3>
          <pre>
fetch('/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: \`
      query {
        hello
        patients {
          id
          name
        }
      }
    \`
  })
}).then(res => res.json())
  .then(console.log)
          </pre>
          
          <h2>Development Mode: Active</h2>
          <ul>
            <li>Mock data is being used</li>
            <li>GraphQL introspection is enabled</li>
            <li>Detailed error messages are displayed</li>
          </ul>
        </div>
      </body>
      </html>
    `);
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

🧪 Development Tools:
  - GraphiQL IDE: http://localhost:${port}/graphiql
  - Simple Tester: http://localhost:${port}/tester
  - API Documentation: http://localhost:${port}

🔧 Mode: ${developmentMode ? 'Development (with mock data)' : 'Production'}
========================================================
`);
});

export default server;