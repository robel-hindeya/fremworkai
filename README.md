# Fremwork — app frontend

The authenticated Fremwork app: an AI financial assistant workspace for business owners and finance teams. Frontend only, built with Next.js (App Router) and TypeScript. All figures are demo data for **Harbor & Pine Co.**; there is no backend yet.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. It redirects to the AI assistant at `/chat`.

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

## Screens

| Area | Routes |
| --- | --- |
| Auth | `/sign-in`, `/sign-up`, `/verify`, `/forgot-password`, `/reset-password` |
| First run | `/onboarding` (company → connect data → preferences → ready) |
| AI assistant | `/chat` (new chat), `/chat/[id]` (conversation) |
| Workspace | `/search`, `/projects`, `/projects/[id]`, `/reports`, `/scheduled` |
| Financial tools | `/overview`, `/transactions`, `/analytics`, `/budgets`, `/goals`, `/data-sources` |
| Account | `/settings` (`?tab=profile·company·finance·ai·notifications·security·billing`), `/help` |
| System | 404 page, app error page, global error page, loading skeleton, offline banner |

Desktop uses a collapsible sidebar (groups fold, state is remembered). Below 860px the sidebar is replaced by a bottom tab bar: Chat · Overview · Activity · Reports · More.

## Demo behaviour

| Try this | What happens |
| --- | --- |
| Sign in with any email and `demo1234` | Opens the app. Any other password shows an error; 3 wrong tries pause sign-in. |
| Sign up with `selam@harborpine.co` | “Account already exists” error. |
| Verification code `482913` | Continues to onboarding. Other codes show an error; 5 wrong codes expire it. |
| Onboarding → Bank feed → Connect | Fails the first time, then connects on retry. |
| Chat: include the word “fail” | The answer fails with a Retry button. |
| Chat: ask about “March 2025” | Fremwork explains it has no data for that period. |
| Chat: ask about “usage limit” | Shows the monthly limit reached state. |
| Chat: attach a `.docx` or a file over 25 MB | Upload error message. |
| Reports → Export a “Year to date” period | Fails once, then succeeds on Try again. |
| Data sources → Xero → Connect | Fails once with an access error. |
| Scheduled → run “Revenue report” | Fails because the bank feed is disconnected. |
| Overview → “Preview: no data connected yet” | Shows the empty state. |
| Settings → Security → Change password | Current password is `demo1234`. |

Every form (add transaction, create budget, create goal, new project, new scheduled task, export, delete, sign out, change password, delete workspace) validates on submit with inline messages, a summary, and a success state.

## Structure

```
src/
  app/
    (auth)/        sign-in, sign-up, verify, forgot-password, reset-password
    (app)/         sidebar + tab bar layout, all workspace pages, loading/error
    onboarding/
    layout.tsx     fonts (Geist), toasts
    globals.css    design tokens and components (Fremwork design system)
  components/      shell, chat store, composer, answers, charts, dialogs, forms, ui
  lib/             demo data, formatting and validation helpers
public/brand/      Fremwork logo files
```

## Next steps for the backend

- Replace `src/lib/data.ts` with API calls (NestJS) and Supabase auth.
- Swap the simulated answers in `src/components/chat-store.tsx` for streaming responses.
- Wire uploads, exports, connections and scheduled tasks to real services.
