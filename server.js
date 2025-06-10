import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not set');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
