const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://owalvxcjyzvqvfntjzyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93YWx2eGNqeXp2cXZmbnRqenlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODg5ODAsImV4cCI6MjA4NzE2NDk4MH0.5FiEJAszaoorYLZ-1qtu0k0lHNz6Eg2bUZNxpN04tgg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  console.log('Testing Supabase Connection & Update...');
  
  // Try to update a non-existent UUID just to see what error RLS or schema throws
  const { data, error } = await supabase
    .from('profiles')
    .update({
      phone: "+1234567890",
      dob: "1990-01-01",
      gender: "male",
      blood_group: "O+",
      emergency_contact: { name: "Test", phone: "123", relationship: "Friend" },
      medical_history: { allergies: "None", currentMedications: "None", chronicConditions: "None" },
      is_verified: true
    })
    .eq('id', '00000000-0000-0000-0000-000000000000')
    .select('*');
    
  if (error) {
    console.error('SUPABASE ERROR:', error);
  } else {
    console.log('SUPABASE SUCCESS (0 rows usually if UUID not found):', data);
  }
}

testUpdate();
