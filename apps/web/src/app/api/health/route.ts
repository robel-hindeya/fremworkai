import { NextResponse } from 'next/server';
import { DatabaseSync } from 'node:sqlite';

export const runtime = 'nodejs';

export async function GET() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE ping (msg TEXT)');
  db.prepare('INSERT INTO ping VALUES (?)').run('pong');
  const res = db.prepare('SELECT msg FROM ping').get() as { msg: string };
  return NextResponse.json({ status: 'ok', data: res.msg });
}
