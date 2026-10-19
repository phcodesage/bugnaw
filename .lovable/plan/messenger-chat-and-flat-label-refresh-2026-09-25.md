# Messenger chat and flat-label refresh

## Outcome

The landing chat looks and behaves like a conversation with Jun’s business, while all existing message, AI, booking, Inbox, and tour behavior remains unchanged. Landing and owner page labels lose the bordered “AI pill” treatment.

## Build

1. Restyle the existing chat header with Jun’s portrait, online status, business identity, and an accessible information tip.
2. Recompose the existing messages into Messenger-style grouped bubbles, typing state, timestamps, slot quick replies, message suggestions, composer, and Inbox handoff note.
3. Replace landing section eyebrows, the hero label, and the owner workspace label with flat line-and-uppercase typography.
4. Preserve `#chat`, tour targets, server calls, reply cleaning, slot navigation, and existing IDs and routes.
5. Verify initial, loading, and replied chat states on desktop and 375px, check overflow and keyboard submission, then publish.

## Technical details

- Continue using the installed AI Elements message and prompt-input primitives.
- Use existing semantic colors and Jun’s existing portrait asset.
- Keep reduced-motion behavior and existing metadata unchanged.
