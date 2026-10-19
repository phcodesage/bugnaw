# Booking Step 1 Redesign

## Scope
Redesign only “What does your unit need?” on `/book`. Keep service data, prices, quantities, navigation, and all later booking steps unchanged.

## Changes
- Replace the old booking thumbnails with the four existing Jun service photos used on the landing page; use the separate Care Plan photo for that card.
- Present every photo in a stable 4:3 frame with centered cover positioning.
- Widen the booking panel on step 1 and use an equal-height responsive grid: one column on phones, two from 640px, and three from 1024px.
- Restructure each service card into image, service details, price/duration, and a full-width quantity-control row.
- Give selected services a blue border, light-blue surface, and quantity badge over the photo.
- On phones, replace the step-1 summary/footer controls with one fixed bottom action bar showing selected service count, total, and Continue. Keep the existing summary and Continue placement on larger screens and on all other steps.
- Add safe bottom spacing so mobile content and controls clear both the sticky action bar and the Lovable badge.

## Verification
Check `/book` at 375px, 768px, and 1280px for image framing, equal card layout, selection states, quantity controls, sticky action access, and horizontal overflow. Confirm Continue still advances through the unchanged booking flow.
