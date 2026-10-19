# Demo, mobile, accessibility, and performance fixes

## Changes

- Enforce demo website-chat retention during server insertion: keep ten newest total and no more than three guided-tour conversations, then remove existing excess demo rows.
- Exclude all website-origin conversations from Impact inquiry and conversion metrics for both week and month ranges.
- Correct guided-tour step 2 on mobile so the selected slot and booking summary are highlighted and positioned above the bottom sheet.
- Add safe bottom spacing to the mobile owner navigation and page content, and remove horizontal overflow from the mobile week view.
- Raise mobile tap targets to 44px, darken blue and marquee text for WCAG AA contrast, and increase booking progress labels to at least 12px.
- Render the hero headline and supporting copy immediately while preserving later animations.
- Limit testimonial and marquee loop duplication to two copies.

## Verification

- Clean the current demo Inbox and verify its total website-chat and guided-tour caps.
- Confirm Impact excludes website and guided-tour conversations.
- Test the guided tour step 2, owner navigation, week view, booking progress, and tap targets at 375px, plus desktop regression checks.
- Confirm the preview remains error-free, then publish.
