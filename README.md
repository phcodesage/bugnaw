# Bugnaw Aircon Care

An aircon-service booking and operations app for Mandaue and Cebu, with a public storefront, customer booking and lookup, AI-assisted conversations, and an owner workspace for scheduling, inbox management, and impact reporting.


This GitHub snapshot does not establish an editor connection to Lovable or Bolt. Importing it into another platform does not change its development origin.

## Development

The app uses React, TanStack Start, Vite, Supabase, and server-side DeepSeek requests. Use Bun with the included `bun.lock`.

```sh
git clone https://github.com/phcodesage/bugnaw.git
cd bugnaw
bun install --frozen-lockfile
cp .env.example .env
# Fill in the configuration for your intended backend.
bun run dev
```

Build with `bun run build`.

## Backend and deployment

The original `.env` remains local and is excluded from Git. `.env.example` lists the public configuration and server-only secrets used by the source. Configure these through your deployment's environment settings. Keep `SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_API_KEY`, and cron secrets on the server, outside all `VITE_` variables.

The export includes Supabase schema migrations. Review the destination database's migration history before applying any missing migrations; importing source does not migrate a database. The service-role key, AI key, and cron secrets are not supplied by the archive and must be configured separately.

The application requires a server runtime for TanStack Start and its server functions. Uploading this repository alone does not deploy the app or configure backend services.
