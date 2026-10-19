# Unify the full app with Bugnaw’s landing-page design

## Goal
Apply the landing page’s exact visual language to every customer and owner page without changing routes, data, permissions, or behavior. Preserve the solid-blue pill style and make all screens polished at 375px and desktop widths.

## Build
- Create a reusable Bugnaw interface layer for page headers, cards, badges, fields, selects, steppers, dialogs, notices, loading skeletons, empty states, and animated page/list transitions.
- Restyle the existing shared controls so buttons, inputs, selects, switches, tabs, accordions, and feedback states consistently use the landing page’s Oswald/Inter typography, blue/black/light-gray palette, restrained shadows, and rounded card system.
- Redesign the customer booking flow with an animated progress tracker, horizontally transitioning steps, image-backed service cards, date/time pills, sticky live summary, polished deposit state, and animated confirmation details.
- Redesign booking management, rescheduling, cancellation, and presence confirmation using the same customer-page shell and clear success/error states.
- Redesign owner sign-in as a photo-led split screen while retaining demo autofill and all sign-in behavior.
- Replace the owner shell with a desktop sidebar and mobile bottom navigation, including Bugnaw branding, Jun’s portrait, consistent page headings, and existing demo-time/read-only notices.
- Restyle Today, Inbox/thread, Calendar, Message Center, Impact, and Settings to match the landing system while preserving every action and query.
- Add distinct real portrait assets for Jun, the trust stack, About, and every testimonial, with circular crops, subtle rings, lazy loading, and initials fallbacks.

## Page-specific treatment
- **Today:** spacious route and job cards, zone chips, pill action controls, skeleton/empty/error presentation.
- **Inbox:** responsive conversation list and Messenger-style thread, editable extraction chips, highlighted AI draft panel.
- **Calendar:** clean six-day grid on desktop and stacked day view on mobile, preserving zone colors.
- **Messages:** vertical timeline with channel icons and delivery/status badges.
- **Impact:** animated count-up metrics and brand-restyled charts.
- **Settings:** clearly grouped panels, consistent fields/toggles, and polished save feedback.

## Verification
- Check all routes and central interactions at 375px and desktop widths.
- Confirm no horizontal overflow, missing images, inaccessible contrast, runtime errors, or broken links.
- Confirm the existing booking, demo sign-in, owner actions, inbox, rescheduling, messages, Impact, and Settings behaviors remain unchanged.
