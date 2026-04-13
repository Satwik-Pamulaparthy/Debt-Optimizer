import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[DELETE /api/accounts/:id]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const dbPatch: Record<string, unknown> = {};
  if (body.name != null) dbPatch.name = body.name;
  if (body.institution != null) dbPatch.institution = body.institution;
  if (body.type != null) dbPatch.type = body.type;
  if (body.balance != null) dbPatch.balance = body.balance;
  dbPatch.last_updated = new Date().toISOString();

  const { error } = await supabase
    .from('bank_accounts')
    .update(dbPatch)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[PATCH /api/accounts/:id]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ updated: true });
}
