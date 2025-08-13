/**
 * Database Verification Script
 * Verifies the Tahboub DIS database setup
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wlmljniorublcadvorvf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbWxqbmlvcnVibGNhZHZvcnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTc5NjEsImV4cCI6MjA3MDU5Mzk2MX0.wfPByQtAPf2WaIB-vGG8jH-A7hD_AthnwuhT8xbLH34'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabaseConnection() {
  console.log('🔍 Verifying Tahboub DIS Database Connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Database connection failed:', error.message)
      console.log('📋 Database tables may need to be created manually')
      console.log('🔗 Please visit: https://wlmljniorublcadvorvf.supabase.co/project/wlmljniorublcadvorvf/sql')
      console.log('📄 Execute the SQL script from: deploy/database-setup.sql')
      return false
    } else {
      console.log('✅ Database connection successful')
      console.log('📊 Database is ready for Tahboub DIS')
      return true
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message)
    return false
  }
}

async function testSampleOperations() {
  console.log('\n🧪 Testing sample database operations...')
  
  try {
    // Try to insert a test customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer طهبوب',
        phone: '0791234567',
        email: 'test@tahboub.com',
        language_preference: 'ar'
      })
      .select()
      .single()
    
    if (customerError) {
      console.log('⚠️ Customer insertion failed:', customerError.message)
      return false
    }
    
    console.log('✅ Customer creation successful')
    console.log('👤 Customer ID:', customer.id)
    
    // Clean up test data
    await supabase
      .from('customers')
      .delete()
      .eq('id', customer.id)
    
    console.log('🧹 Test data cleaned up')
    return true
    
  } catch (err) {
    console.log('❌ Test operations failed:', err.message)
    return false
  }
}

// Main execution
verifyDatabaseConnection()
  .then(connected => {
    if (connected) {
      return testSampleOperations()
    }
    return false
  })
  .then(success => {
    if (success) {
      console.log('\n🎉 Tahboub DIS Database is fully operational!')
      console.log('🚀 Ready to proceed with Edge Functions deployment')
    } else {
      console.log('\n🔧 Manual database setup required')
      console.log('📖 Follow instructions in deploy/SETUP-DATABASE.md')
    }
  })
  .catch(err => {
    console.log('💥 Verification failed:', err.message)
  })