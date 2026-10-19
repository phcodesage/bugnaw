# Landing and owner sign-in consistency pass

## Goal
Make Jun visually consistent across the landing page and owner sign-in, fix the comparison and Why Us presentation, remove repeated imagery, and tighten the requested copy without changing any data flow, routes, or behavior.

## Build
- Use Jun’s existing portrait as the identity reference to create a cohesive set of branded work photos: hero booking card, four core service scenes, and owner sign-in. Keep the same face, navy Bugnaw polo, small snowflake logo, and no third-party branding.
- Replace only the affected image references, then redistribute existing and new imagery so Services, Why Us, Recent Jobs, Process, hero, and sign-in do not visibly repeat the same photos.
- Make “Jun’s inbox” the default comparison tab. Recompose the comparison so Before reads on the left and After reads on the right at the default 50% split, with clear label spacing and no empty top area.
- Display the Why Us unanswered count as a demo-safe zero with correct singular/plural wording, and rebalance the right-side collage to remove the visual gap.
- Present Recent Jobs with friendly household-oriented titles and relative dates while leaving the underlying completed-booking query untouched.
- Update hero copy to “Bisaya, Taglish, or English” and add a mobile-only “Try the chat” pill that scrolls to the existing chat section.

## Technical details
- Keep all edits in landing/sign-in presentation code and local image assets.
- Derive friendly recent-job text and relative dates at render/aggregation time without changing booking records or business logic.
- Preserve existing Framer Motion behavior, reduced-motion support, booking links, demo login, and responsive layout.

## Verification
- Check the landing page and owner sign-in at desktop and 375px.
- Confirm the same Jun appears in every new branded image, no foreign company names remain, both inbox comparison halves read at 50%, image repetition is removed, and no horizontal overflow or runtime errors appear.
