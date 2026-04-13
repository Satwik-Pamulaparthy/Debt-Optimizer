/**
 * POST /api/strategy
 * Accepts debts + budget + strategy, returns full PayoffPlan.
 * Stateless — all computation done server-side.
 */
import { NextRequest, NextResponse } from 'next/server';
import { compareStrategies, simulateExtraPayment } from '@/lib/algorithm/engine';
import { Debt, Strategy } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { debts, monthlyBudget, strategy, extraPayment } = body as {
      debts: Debt[];
      monthlyBudget: number;
      strategy?: Strategy;
      extraPayment?: number;
    };

    if (!debts || !Array.isArray(debts)) {
      return NextResponse.json({ error: 'debts array is required' }, { status: 400 });
    }
    if (typeof monthlyBudget !== 'number' || monthlyBudget <= 0) {
      return NextResponse.json({ error: 'monthlyBudget must be a positive number' }, { status: 400 });
    }

    const activeDebts = debts.filter(d => d.isActive && d.balance > 0);
    const plans = compareStrategies(activeDebts, monthlyBudget);

    const response: Record<string, unknown> = { plans };

    // Optional: scenario simulation
    if (typeof extraPayment === 'number' && extraPayment > 0 && strategy) {
      response.scenario = simulateExtraPayment(activeDebts, monthlyBudget, strategy, extraPayment);
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('[/api/strategy]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
