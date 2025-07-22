import { NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseService = SupabaseService.getInstance();
    
    // Test database connection by getting mint stats
    const mintStats = await supabaseService.getMintStats();
    
    // Get additional stats from the service
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    // Get database health info
    const { data: healthData, error: healthError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (healthError) {
      throw new Error(`Database health check failed: ${healthError.message}`);
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        provider: 'supabase',
        profiles_count: healthData || 0
      },
      stats: mintStats,
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasThirdwebKey: !!process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID
      }
    });
    
  } catch (error) {
    console.error('Stats API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        database: {
          status: 'error',
          provider: 'supabase'
        }
      },
      { status: 500 }
    );
  }
}