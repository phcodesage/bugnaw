# Impact dashboard and visitor landing page

## What will change

- Make `/` a concise public before/after story for judges and visitors, using Bugnaw’s real technician image and the requested proof points.
- Move the complete customer booking flow to `/book` without changing its service, availability, payment, or lead-prefill behavior.
- Add prominent **Try it as a customer** and **See Jun’s side** actions.
- Add an authenticated `/impact` owner page with weekly and monthly views, large outcome numbers, and clear charts.
- Add **Impact** to Jun’s owner navigation while keeping mobile controls readable.

## Impact calculations

- **Inquiry conversion:** conversations received versus conversations marked booked, with conversion percentage.
- **Messages avoided:** automated replies and automated outbox messages; owner-written replies are excluded.
- **Estimated hours saved:** 3 minutes per automated message plus 10 minutes per completed self-service reschedule.
- **No-shows prevented:** previously at-risk bookings later confirmed, plus bookings refilled from waitlist when the recorded data supports it.
- **Deposit revenue protected:** deposits retained for confirmed bookings and forfeited deposits, shown transparently rather than inventing revenue.
- **Travel saved:** zone-clustering savings calculated from actual booking sequences using the existing 15-minute same-zone and 40-minute cross-zone assumptions.

## Demo access

- Add a separate limited demo login account and a public demo-login entry point.
- The visitor button opens the sign-in page with demo credentials already filled and clearly labeled.
- The demo role may view Jun’s seeded dashboard data but cannot change job statuses, settings, messages, or bookings.
- Enforce demo restrictions in the database and protected server actions, not only by hiding buttons.

## Technical details

- Add a `demo` role alongside `owner`, with read-only policies for the dashboard tables and server-side role checks on all write actions.
- Add an owner-only server function that aggregates period metrics; no private customer details will be exposed publicly.
- Use the existing chart system and semantic color tokens for compact bar/area visuals.
- Update all moved-route links, booking links, weather/no-show links, metadata, and confirmation navigation to point to `/book`.
- Seed or provision the demo account safely through the existing authentication system; no real owner credential will be exposed.
- Verify the visitor story, customer booking entry, demo sign-in, Impact period switching, and owner write restrictions in the browser.
