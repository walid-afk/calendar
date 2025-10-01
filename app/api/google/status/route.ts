import { NextResponse } from 'next/server';
import { isGoogleConnected, pingGoogle } from '@/lib/google';
import { getTokens } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tokens = await getTokens();
    const hasTokens = !!tokens;
    const hasRefreshToken = !!(tokens?.refresh_token);
    
    let pingOk = false;
    let expiresInSeconds = 0;
    
    if (hasTokens) {
      try {
        pingOk = await pingGoogle();
        
        if (tokens.expiry_date) {
          expiresInSeconds = Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000));
        }
      } catch (error) {
        console.error('Erreur ping Google:', error);
        pingOk = false;
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      connected: hasTokens && pingOk,
      hasTokens,
      hasRefreshToken,
      pingOk,
      expiresInSeconds
    });
  } catch (e: any) {
    console.error('Erreur /api/google/status:', e);
    return NextResponse.json({ 
      ok: false, 
      connected: false, 
      hasTokens: false, 
      hasRefreshToken: false,
      pingOk: false,
      expiresInSeconds: 0,
      error: e?.message 
    }, { status: 500 });
  }
}