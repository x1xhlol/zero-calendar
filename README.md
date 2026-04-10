# Zero Calendar

AI-powered scheduling with natural language event creation, Google Calendar sync, invite emails, and analytics built on Next.js, Convex, and Better Auth.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/x1xhlol/zero-calendar&project-name=zero-calendar&repository-name=zero-calendar)

## Features

- Natural-language scheduling and calendar actions
- Google Calendar sync and webhook-based updates
- Invite flows with email delivery through Resend
- Calendar analytics, conflict detection, and free-time discovery
- Better Auth + Convex-backed authentication and user data
- Modern Next.js App Router UI

## Stack

- Next.js 16
- React 19
- Bun
- Convex
- Better Auth
- OpenRouter AI SDK
- Resend

## Quick start

### 1. Install dependencies

```bash
bun install
```

### 2. Create your environment file

Create `.env.local` and set the values your deployment needs:

```bash
BETTER_AUTH_SECRET=
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_CONVEX_URL=
CONVEX_URL=
CONVEX_SITE_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=x-ai/grok-4.1-fast

RESEND_API_KEY=
RESEND_FROM_EMAIL="Zero Calendar <email@here.com>"
```

### 3. Start Convex

If you need to regenerate Convex types or run the backend locally:

```bash
bunx convex dev
```

### 4. Start the app

```bash
bun dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Yes | Shared secret used by Better Auth and server-side Convex access control. Set the same strong random value in both your Next.js and Convex environments. |
| `SITE_URL` | Yes | Canonical server-side site URL used by auth flows. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL used by the client and invitation links. |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Public Convex deployment URL for the frontend client. |
| `CONVEX_URL` | Usually | Server-side Convex URL. If omitted, server code falls back to `NEXT_PUBLIC_CONVEX_URL`. |
| `CONVEX_SITE_URL` | Yes | Convex site URL used by Better Auth server integration. |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Optional | Public override for `CONVEX_SITE_URL` when you need separate client/server values. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID for sign-in and calendar access. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
| `OPENROUTER_API_KEY` | Yes | API key for AI-powered scheduling features. |
| `OPENROUTER_MODEL` | Optional | Override the default OpenRouter model. |
| `RESEND_API_KEY` | Yes | API key used to send invitation emails. |
| `RESEND_FROM_EMAIL` | Optional | Sender identity for invitation emails. |

## Deploying to Vercel

The deploy button above clones this repository into a new Vercel project. Before the app is usable, make sure you also:

1. Create or connect a Convex deployment.
2. Add the environment variables listed above in Vercel.
3. Configure Google OAuth for your deployed domain and Better Auth routes.
4. Set a real `BETTER_AUTH_SECRET` for production.
5. Configure Resend if you want invitation emails enabled.
   

## License

MIT
