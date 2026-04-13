import { NextRequest, NextResponse } from 'next/server';
import { CountryCode } from 'plaid';
import { createClient } from '@/lib/supabase/server';
import { getPlaidClient } from '@/lib/plaid';

// Map Plaid account subtype → our AccountType
function mapAccountType(subtype: string | null): 'checking' | 'savings' | 'investment' {
  if (subtype === 'checking')                                    return 'checking';
  if (['savings', 'money market', 'cd', 'hsa'].includes(subtype ?? '')) return 'savings';
  return 'investment';
}

export async function POST(req: NextRequest) {
  try {
    const { public_token } = await req.json();
    if (!public_token) {
      return NextResponse.json({ error: 'Missing public_token' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plaid = getPlaidClient();

    // ── 1. Exchange public token ───────────────────────────────────────────
    const exchangeRes = await plaid.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchangeRes.data;

    // ── 2. Resolve institution name ────────────────────────────────────────
    const itemRes     = await plaid.itemGet({ access_token });
    const instId      = itemRes.data.item.institution_id ?? '';
    let   instName    = 'Unknown Bank';
    if (instId) {
      try {
        const instRes = await plaid.institutionsGetById({
          institution_id: instId,
          country_codes: [CountryCode.Us],
        });
        instName = instRes.data.institution.name;
      } catch { /* non-fatal */ }
    }

    // ── 3. Persist Plaid item (access token) ──────────────────────────────
    await supabase.from('plaid_items').upsert(
      { user_id: user.id, item_id, access_token, institution_name: instName, institution_id: instId },
      { onConflict: 'item_id' },
    );

    // ── 4. Fetch all accounts ─────────────────────────────────────────────
    const accountsRes   = await plaid.accountsGet({ access_token });
    const allAccounts   = accountsRes.data.accounts;
    const creditAccts   = allAccounts.filter(a => a.type === 'credit');
    const depAccts      = allAccounts.filter(a => a.type === 'depository');

    // ── 5. Fetch liabilities for credit cards ─────────────────────────────
    const liabMap: Record<string, any> = {};
    if (creditAccts.length > 0) {
      try {
        const liabRes = await plaid.liabilitiesGet({ access_token });
        for (const l of liabRes.data.liabilities.credit ?? []) {
          liabMap[l.account_id] = l;
        }
      } catch { /* liabilities not available for all institutions */ }
    }

    // ── 6. Build rows ──────────────────────────────────────────────────────
    const bankRows = depAccts.map(a => ({
      id:               `plaid_${a.account_id}`,
      user_id:          user.id,
      name:             a.name,
      institution:      instName,
      type:             mapAccountType(a.subtype),
      balance:          a.balances.current ?? 0,
      mask:             a.mask ?? null,
      plaid_account_id: a.account_id,
      plaid_item_id:    item_id,
      last_updated:     new Date().toISOString(),
    }));

    const debtRows = creditAccts.map(a => {
      const liab        = liabMap[a.account_id];
      const purchaseApr = liab?.aprs?.find((x: any) => x.apr_type === 'purchase_apr')?.apr_percentage ?? 0;
      const minPayment  = liab?.minimum_payment_amount
        ?? Math.max(25, Math.round((a.balances.current ?? 0) * 0.02 * 100) / 100);
      const rawDue      = liab?.next_payment_due_date as string | undefined;
      const dueDate     = rawDue ? parseInt(rawDue.split('-')[2], 10) : 15;
      const balance     = Math.abs(a.balances.current ?? 0);

      return {
        id:               `plaid_${a.account_id}`,
        user_id:          user.id,
        name:             a.name,
        institution:      instName,
        type:             'credit_card',
        balance,
        original_balance: balance,
        minimum_payment:  Math.round(minPayment * 100) / 100,
        apr:              purchaseApr,
        due_date:         dueDate,
        late_fee:         35,
        credit_limit:     a.balances.limit ?? null,
        plaid_account_id: a.account_id,
        is_active:        true,
      };
    });

    // ── 7. Upsert to Supabase ─────────────────────────────────────────────
    if (bankRows.length > 0) {
      await supabase
        .from('bank_accounts')
        .upsert(bankRows, { onConflict: 'plaid_account_id' });
    }
    if (debtRows.length > 0) {
      await supabase
        .from('debts')
        .upsert(debtRows, { onConflict: 'plaid_account_id' });
    }

    // ── 8. Return normalised payloads for client store ─────────────────────
    return NextResponse.json({
      institution: instName,
      accounts: bankRows.map(r => ({
        id:          r.id,
        name:        r.name,
        institution: r.institution,
        type:        r.type,
        balance:     r.balance,
        mask:        r.mask,
        lastUpdated: r.last_updated,
      })),
      debts: debtRows.map(r => ({
        id:              r.id,
        name:            r.name,
        institution:     r.institution,
        type:            r.type,
        balance:         r.balance,
        originalBalance: r.original_balance,
        minimumPayment:  r.minimum_payment,
        apr:             r.apr,
        dueDate:         r.due_date,
        lateFee:         r.late_fee,
        creditLimit:     r.credit_limit,
        isActive:        r.is_active,
        createdAt:       new Date().toISOString(),
      })),
    });
  } catch (err: any) {
    const detail = err?.response?.data ?? err?.message ?? 'Unknown error';
    console.error('[plaid/exchange]', detail);
    return NextResponse.json({ error: 'Failed to exchange Plaid token' }, { status: 500 });
  }
}
