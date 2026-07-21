const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('c:\\Users\\Asus\\OneDrive\\Desktop\\SMS\\.env.local', 'utf8');
let supabaseUrl, supabaseAnonKey;
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', data);
  }
}

checkData();
