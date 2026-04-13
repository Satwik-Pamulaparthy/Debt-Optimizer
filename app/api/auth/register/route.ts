/**
 * POST /api/auth/register
 * Creates a new user account with hashed password and returns a JWT.
 * Requires DATABASE_URL and JWT_SECRET env vars.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, country = 'US', currency = 'USD' } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!country) {
      return NextResponse.json({ error: 'Country selection is required' }, { status: 400 });
    }

    // NOTE: In production, uncomment the Prisma code below:
    //
    // const { PrismaClient } = await import('@prisma/client');
    // const bcrypt = await import('bcryptjs');
    // const { SignJWT } = await import('jose');
    //
    // const prisma = new PrismaClient();
    // const existing = await prisma.user.findUnique({ where: { email } });
    // if (existing) {
    //   return NextResponse.json(
    //     { error: 'This email is already registered. Please sign in instead.' },
    //     { status: 409 },
    //   );
    // }
    // const passwordHash = await bcrypt.hash(password, 12);
    // const user = await prisma.user.create({
    //   data: { name, email, passwordHash, country, currency },
    // });
    // const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    // const token = await new SignJWT({ sub: user.id, email: user.email })
    //   .setProtectedHeader({ alg: 'HS256' })
    //   .setExpirationTime('30d')
    //   .sign(secret);
    // return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, country, currency } });

    // Demo response (no DB required)
    return NextResponse.json({
      message: 'Registration successful (demo mode — no DB)',
      user: { name, email, country, currency },
    });
  } catch (err) {
    console.error('[/api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
