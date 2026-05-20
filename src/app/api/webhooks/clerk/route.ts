import { Webhook }  from 'svix';
import { headers }  from 'next/headers';
import { db }       from '@/server/db';
import { users }    from '@/server/db/schema';
import { eq }       from 'drizzle-orm';

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET!;
  const wh     = new Webhook(secret);
  const body   = await req.text();
  const heads  = await headers();

  let event: { type: string; data: Record<string, unknown> };

  try {
    event = wh.verify(body, {
      'svix-id':        heads.get('svix-id')!,
      'svix-timestamp': heads.get('svix-timestamp')!,
      'svix-signature': heads.get('svix-signature')!,
    }) as typeof event;
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'user.created') {
    const d = event.data;
    await db.insert(users).values({
      clerkId:  d.id as string,
      email: (d.email_addresses as { email_address: string }[])[0]?.email_address ?? '',
      name:     `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || null,
      imageUrl: (d.image_url ?? null) as string | null,
      plan:     'free',
      credits:  10,
    }).onConflictDoNothing();
  }

  if (event.type === 'user.deleted') {
    await db.delete(users).where(eq(users.clerkId, event.data.id as string));
  }

  return new Response('OK');
}
