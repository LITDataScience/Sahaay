# Sahaay Listing Geo UI Blueprint

## Objective
Build a premium, addictive, high-trust listing experience where a user can:

1. Sign in quickly.
2. Add an item under their profile with minimal friction.
3. Select the location from which the item should be discoverable.
4. Choose a visibility radius so only nearby borrowers can see it.
5. Understand exactly how much they earn with the `90% lender / 10% platform` split.
6. Feel like they are using a luxury-grade marketplace, not a generic classifieds app.

## Product Direction
Sahaay should feel like a high-trust "borrow genius" marketplace:

- Elegant, quiet-luxury visuals.
- Zero clutter.
- Strong spacing and premium surface layering.
- Warm white and bhasm neutrals with restrained gold accents.
- Financial clarity everywhere.
- Listing creation fast enough to feel effortless.

## Visual Language
The UI direction should feel:

- expensive
- smooth
- calm
- high intent
- confidence-inducing

### Core Rules
- White and soft ivory in light mode.
- Deep charcoal, warm ash, and gold in dark mode.
- Gold is an accent, not a flood fill.
- Cards should feel sculpted with subtle borders and soft elevation.
- Big rounded corners and breathing room.
- Motion should feel soft and springy, never noisy.

## Palette
### Light
- Background: `#FAF7F2`
- Surface: `#FFFFFF`
- Surface Alt: `#F3EEE6`
- Primary Text: `#181411`
- Secondary Text: `#6F655C`
- Accent Gold: `#C9A227`
- Accent Gold Deep: `#A17F17`
- Border: `#E8DEC9`
- Bhasm: `#8C8277`

### Dark
- Background: `#0F0D0B`
- Surface: `#171411`
- Surface Alt: `#211C17`
- Primary Text: `#F8F3EB`
- Secondary Text: `#B8AEA3`
- Accent Gold: `#D4AF37`
- Accent Gold Deep: `#8B6B16`
- Border: `#3A3027`
- Bhasm: `#A89C8D`

## Listing Flow
### User Journey
1. Profile or Home FAB -> `Create Listing`
2. Add photos + title + category + condition
3. Choose location
4. Choose visibility radius
5. Set pricing and deposit
6. Review earnings and split
7. Publish

### Screen Stack
- `frontend/app/listing/create.tsx`
- `frontend/app/listing/location.tsx`
- `frontend/app/listing/pricing.tsx`
- `frontend/app/listing/review.tsx`

### Required UX Features
- Photo picker
- Elegant form cards
- Radius selector chips
- Earnings preview
- Local-first draft persistence
- Clear payout language

## Geo Visibility Model
Each listing must carry:

- `lat`
- `lng`
- `locality`
- `city`
- `state`
- `radiusKm`

### Visibility Rule
A borrower should only see an item if they fall within the listing's visibility radius.

## Revenue Model
The split must be explicit in UI and ledger logic.

### Formula
```ts
const rentalAmount = days * pricePerDay;
const platformFee = Math.round(rentalAmount * 0.10);
const lenderNetAmount = rentalAmount - platformFee;
const totalCollected = rentalAmount + depositAmount;
```

### Principle
- Split the rental fee.
- Do not split the refundable deposit.
- Show lender earnings before publish.

## Architecture Direction
### Immediate Build
- Premium semantic theme system.
- Listing draft store.
- Local-first listing creation UX.
- Geo-aware draft model.
- Better Home/Profile/Create surfaces.

### Next Backend Step
- Unify listing creation and booking under Firebase/tRPC.
- Add geo indexing to Typesense.
- Replace local publish with secure backend mutation.
- Add payout onboarding and release states.

## File-By-File Build Order
1. Theme foundation
   - `frontend/src/theme/tokens.ts`
   - `frontend/src/theme/provider.tsx`
   - `frontend/src/theme/useTheme.ts`
   - `frontend/src/app/store.ts`
   - `frontend/app/_layout.tsx`
   - `frontend/app/(tabs)/_layout.tsx`

2. Listing model and local-first flow
   - `frontend/src/features/listings/types.ts`
   - `frontend/src/features/listings/store/useListingDraftStore.ts`
   - `frontend/src/features/listings/storage.ts`

3. Premium listing screens
   - `frontend/app/(tabs)/create.tsx`
   - `frontend/app/listing/create.tsx`
   - `frontend/app/listing/location.tsx`
   - `frontend/app/listing/pricing.tsx`
   - `frontend/app/listing/review.tsx`

4. Surface upgrades
   - `frontend/src/shared/ui/SearchBar.tsx`
   - `frontend/src/features/listings/ui/CategoryChips.tsx`
   - `frontend/src/features/listings/ui/ItemCard.tsx`
   - `frontend/app/(tabs)/index.tsx`
   - `frontend/app/(tabs)/profile.tsx`

5. Routing
   - `frontend/src/types/navigation.ts`
   - `frontend/app/_layout.tsx`

## Quality Bar
Every screen and function should satisfy:

- Is it visually premium?
- Is it easy to understand in under 2 seconds?
- Does it increase trust?
- Does it clarify earnings?
- Does it reduce effort?
- Does it move the app toward a world-class lending product instead of another marketplace clone?
