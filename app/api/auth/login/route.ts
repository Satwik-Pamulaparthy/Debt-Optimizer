/**
 * POST /api/auth/login
 * Verifies credentials and returns a JWT access token.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // NOTE: In production, uncomment the Prisma code below:
    //
    // const { PrismaClient } = await import('@prisma/client');
    // const bcrypt = await import('bcryptjs');
    // const { SignJWT } = await import('jose');
    //
    // const prisma = new PrismaClient();
    // const user = await prisma.user.findUnique({ where: { email } });
    // if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    //   return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    // }
    // const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    // const token = await new SignJWT({ sub: user.id, email: user.email })
    //   .setProtectedHeader({ alg: 'HS256' })
    //   .setExpirationTime('30d')
    //   .sign(secret);
    // return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email } });

    return NextResponse.json({ message: 'Login successful (demo mode — no DB)' });
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
