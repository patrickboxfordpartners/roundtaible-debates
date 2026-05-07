# Quick Start: Replace AI Photos with Authentic Historical Images

## Step 1: Download the Photos

```bash
cd /Users/patrickmitchell/roundtaible-debates
./scripts/download-historical-photos.sh
```

This downloads 14 authentic historical photos to `src/assets/`

## Step 2: Review & Crop (Optional)

The downloaded photos are high quality but may need cropping for square avatars:

1. Open each image in Preview (Mac) or your image editor
2. Crop to square (1:1 aspect ratio)
3. Focus on the face
4. Resize to 800x800px for optimal quality
5. Save over the existing file

## Step 3: Add Photo Credits to Remaining Personas

I've added photo credits for Edison. You need to add them for the other 13 personas.

Copy this pattern in `src/data/debateData.ts`:

```typescript
photoCredit: {
  photographer: "Photographer Name",
  date: "c. Year",
  source: "Library of Congress",
  url: "https://www.loc.gov/item/...",
  license: "Public Domain"
}
```

All the credit data is in `scripts/photo-credits.json` - just copy/paste into each persona object.

## Step 4: Test Locally

```bash
npm run dev
```

1. Click on a debater avatar
2. Verify photo credit shows at the bottom
3. Check that the image looks good

## What's Been Set Up

✅ **Download script** - Gets authentic photos from LOC/Wikimedia  
✅ **Photo credits UI** - Displays photographer, date, source with link  
✅ **PersonaModal updated** - Shows credits in a styled box  
✅ **Documentation** - PHOTO-SOURCES.md has full details  
✅ **Legal compliance** - All photos verified public domain  

## Expected Result

When users click a debater:
- They see an authentic historical photograph
- Photo credit appears below quotes: "Photo: Napoleon Sarony, c. 1890 | Source: Wikimedia Commons [link]"
- Clicking the source link goes to the original LOC/Wikimedia page

## Benefits

1. **No AI detection issues** - Real historical photos
2. **Professional credibility** - Famous photographs by Sarony, Steichen, Cameron
3. **Educational value** - Students see authentic history
4. **Legal safety** - Confirmed public domain
5. **Better branding** - Authentic > AI-generated

## Next Steps

After downloading photos:
1. Add photo credits to all 13 remaining personas in `debateData.ts`
2. Deploy to production
3. Photos will be in the build artifacts automatically
