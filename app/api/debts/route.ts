import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { data: debts, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[GET /api/debts]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ debts: debts.map(toClientDebt) });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await req.json();
  const {
    id, name, institution = '', type = 'other',
    balance, originalBalance, minimumPayment, apr,
    dueDate = 15, lateFee = 0, creditLimit,
  } = body;

  if (!name?.trim() || balance == null || minimumPayment == null || apr == null) {
    return NextResponse.json({ error: 'name, balance, minimumPayment and apr are required' }, { status: 400 });
  }

  const { data: debt, error } = await supabase
    .from('debts')
    .insert({
      id,
      user_id: user.id,
      name: name.trim(),
      institution,
      type,
      balance: Number(balance),
      original_balance: Number(originalBalance ?? balance),
      minimum_payment: Number(minimumPayment),
      apr: Number(apr),
      due_date: Number(dueDate),
      late_fee: Number(lateFee),
      credit_limit: creditLimit != null ? Number(creditLimit) : null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/debts]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ debt: toClientDebt(debt) }, { status: 201 });
}

function toClientDebt(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    type: row.type,
    balance: row.balance,
    originalBalance: row.original_balance,
    minimumPayment: row.minimum_payment,
    apr: row.apr,
    dueDate: row.due_date,
    lateFee: row.late_fee,
    creditLimit: row.credit_limit,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}
