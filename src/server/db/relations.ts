import { relations } from 'drizzle-orm';
import { users, projects, messages, fragments } from './schema';

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user:      one(users, { fields: [projects.userId], references: [users.id] }),
  messages:  many(messages),
  fragments: many(fragments),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, { fields: [messages.projectId], references: [projects.id] }),
}));

export const fragmentsRelations = relations(fragments, ({ one }) => ({
  project: one(projects, { fields: [fragments.projectId], references: [projects.id] }),
}));