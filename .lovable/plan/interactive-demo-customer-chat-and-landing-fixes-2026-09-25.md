# Interactive demo, customer chat, and landing fixes

## Outcome

Visitors can try the complete Bugnaw workflow without affecting Jun’s real records: send an inquiry, receive a language-matched reply with live slots, book from the suggested time, operate the demo owner workspace, inspect resulting messages and impact, then restore the sample state.

## Build

1. **Interactive demo sandbox**
   - Isolate demo records from owner records at the database boundary.
   - Allow the demo account to run the requested owner actions and automations only inside its sandbox.
   - Add a persistent demo banner and a protected reset action that restores the original seeded sample data.

2. **Public customer chat**
   - Add a Messenger-style section immediately after the hero with three examples and free text.
   - Reuse the existing extraction, language matching, availability ranking, and reply generation.
   - Save each inquiry as a new Inbox conversation and return booking links containing service, units, zone, date, and time.

3. **Public aggregates**
   - Serve only pre-aggregated totals to logged-out visitors.
   - Keep customer names, phone numbers, addresses, messages, and booking records private.
   - Use the same aggregate source for landing count-ups and the Impact dashboard.

4. **Story, footer, and supporting pages**
   - Insert the requested “day before Bugnaw” timeline before Process.
   - Preserve and sharpen the chaotic-inbox versus confirmed-calendar comparison.
   - Add Terms, Privacy, and Find my booking pages, including reference-plus-mobile verification before management options appear.
   - Correct the phone number, Messenger anchor, footer links, and accessible social labels.

5. **Services and booking prefill**
   - Send reminder and rainy-day feature cards to Process with “How it works”.
   - Add a real Care Plan selection and price label through the existing booking flow.
   - Carry suggested date/time from chat into booking while still revalidating availability.
   - Replace repeated landing imagery with distinct local assets while preserving the current style.

## Technical safeguards

- All demo writes will be server-authorized and scoped to demo-owned rows; the real owner workspace remains unchanged.
- Public chat input will be validated and bounded, and AI errors will surface their safe message without silent retries.
- Booking lookup will never reveal a booking until both reference and full mobile number match.
- Existing routes and owner/customer behavior remain intact; only the requested additions and demo permission changes are introduced.

## Verification

- Run the public chat in Bisaya, Taglish, and English; confirm live slots, Inbox persistence, and booking prefill.
- Sign in as the demo account; run status, time, waitlist, weather, reset, Message Center, and Impact flows.
- Verify logged-out landing stats, booking lookup privacy, Terms/Privacy pages, links, and 375px/desktop layouts.