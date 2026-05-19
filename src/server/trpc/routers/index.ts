import { router }          from '../trpc';
import { projectsRouter }  from './projects';
import { messagesRouter }  from './messages';
import { billingRouter }   from './billing';

export const appRouter = router({
  projects: projectsRouter,
  messages: messagesRouter,
  billing:  billingRouter,
});

export type AppRouter = typeof appRouter;