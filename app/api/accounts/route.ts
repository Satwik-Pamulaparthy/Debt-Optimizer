import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { data: accounts, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[GET /api/accounts]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ accounts: accounts.map(toClientAccount) });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await req.json();
  const { id, name, institution = '', type = 'checking', balance, mask } = body;

  if (!name?.trim() || balance == null) {
    return NextResponse.json({ error: 'name and balance are required' }, { status: 400 });
  }

  const { data: account, error } = await supabase
    .from('bank_accounts')
    .insert({
      id,
      user_id: user.id,
      name: name.trim(),
      institution,
      type,
      balance: Number(balance),
      mask: mask ?? null,
      last_updated: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/accounts]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ account: toClientAccount(account) }, { status: 201 });
}

function toClientAccount(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    type: row.type,
    balance: row.balance,
    mask: row.mask,
    lastUpdated: row.last_updated,
  };
}
