import { NextRequest, NextResponse } from 'next/server';
import { Products, CountryCode } from 'plaid';
import { createClient } from '@/lib/supabase/server';
import { getPlaidClient } from '@/lib/plaid';

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plaid = getPlaidClient();
    const res = await plaid.linkTokenCreate({
      user:         { client_user_id: user.id },
      client_name:  'Debt Optimizer',
      products:     [Products.Auth, Products.Liabilities],
      country_codes:[CountryCode.Us],
      language:     'en',
    });

    return NextResponse.json({ link_token: res.data.link_token });
  } catch (err: any) {
    const detail = err?.response?.data ?? err?.message ?? 'Unknown error';
    console.error('[plaid/link-token]', detail);
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
  }
}
