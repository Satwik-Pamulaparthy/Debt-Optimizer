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
    .from('debts')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[DELETE /api/debts/:id]', error);
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

  // Map camelCase client fields to snake_case DB columns
  const dbPatch: Record<string, unknown> = {};
  if (body.balance != null) dbPatch.balance = body.balance;
  if (body.minimumPayment != null) dbPatch.minimum_payment = body.minimumPayment;
  if (body.apr != null) dbPatch.apr = body.apr;
  if (body.dueDate != null) dbPatch.due_date = body.dueDate;
  if (body.lateFee != null) dbPatch.late_fee = body.lateFee;
  if (body.creditLimit != null) dbPatch.credit_limit = body.creditLimit;
  if (body.name != null) dbPatch.name = body.name;
  if (body.institution != null) dbPatch.institution = body.institution;
  if (body.isActive != null) dbPatch.is_active = body.isActive;

  const { error } = await supabase
    .from('debts')
    .update(dbPatch)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[PATCH /api/debts/:id]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ updated: true });
}
