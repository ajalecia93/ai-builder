import {
  pgTable, text, timestamp, integer, jsonb, pgEnum, boolean
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const projectStatusEnum = pgEnum('project_status', [
  'idle', 'building', 'ready', 'error'
]);

export const users = pgTable('users', {
  id:         text('id').primaryKey().$defaultFn(() => createId()),
  clerkId:    text('clerk_id').unique().notNull(),
  email:      text('email').notNull(),
  name:       text('name'),
  imageUrl:   text('image_url'),
  plan:       text('plan').default('free').notNull(),
  stripeId:   text('stripe_customer_id'),
  credits:    integer('credits').default(10).notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id:          text('id').primaryKey().$defaultFn(() => createId()),
  userId:      text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name:        text('name').notNull(),
  description: text('description'),
  status:      projectStatusEnum('status').default('idle').notNull(),
  previewUrl:  text('preview_url'),
  isPublic:    boolean('is_public').default(false).notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  role:      text('role').notNull(), // 'user' | 'assistant'
  content:   text('content').notNull(),
  metadata:  jsonb('metadata'),       // { fragmentId?, toolCalls? }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const fragments = pgTable('fragments', {
  id:         text('id').primaryKey().$defaultFn(() => createId()),
  projectId:  text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  messageId:  text('message_id').references(() => messages.id),
  sandboxId:  text('sandbox_id'),
  files:      jsonb('files').notNull().$type<{ path: string; content: string }[]>(),
  previewUrl: text('preview_url'),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});

// Type exports for use across the codebase
export type User     = typeof users.$inferSelect;
export type Project  = typeof projects.$inferSelect;
export type Message  = typeof messages.$inferSelect;
export type Fragment = typeof fragments.$inferSelect;