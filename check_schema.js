const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local file to get the Supabase credentials
const envFile = fs.readFileSync('c:\\Users\\Asus\\OneDrive\\Desktop\\SMS\\.env.local', 'utf8');
let supabaseUrl, supabaseAnonKey;
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', data.length > 0 ? Object.keys(data[0]) : 'No data, cannot infer columns without pg_meta');
  }
}

checkSchema();
