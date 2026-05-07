# Historical Photo Sources

All photographs used in The Roundtaible are authentic historical images in the public domain.

## How to Download Authentic Photos

Run the download script:

```bash
cd /Users/patrickmitchell/roundtaible-debates
./scripts/download-historical-photos.sh
```

This will download high-quality public domain photographs from:
- **Library of Congress** (loc.gov)
- **Wikimedia Commons** (commons.wikimedia.org)

## Photo Credits

All photo credits are displayed in the persona modal when users click on a debater.

Photo metadata is stored in:
- `scripts/photo-credits.json` - Full attribution data
- `src/data/debateData.ts` - Embedded in persona objects

## Current Sources

### American Gilded Age (1870s-1920s)
- **Thomas Edison** - Library of Congress, c. 1922
- **Mark Twain** - LOC, A.F. Bradley, 1907
- **Nikola Tesla** - Napoleon Sarony, c. 1890
- **Andrew Carnegie** - LOC, c. 1913
- **J.P. Morgan** - Edward Steichen, 1903 (famous intimidating portrait)
- **Henry Adams** - LOC, c. 1880s

### Victorian Era
- **Oscar Wilde** - Napoleon Sarony, 1882 (American lecture tour)
- **Charles Darwin** - Julia Margaret Cameron, 1868-1869

### 20th Century
- **Albert Einstein** - c. 1921 (Nobel Prize era)
- **Marie Curie** - c. 1920s

### Ancient/Renaissance (Artistic Renderings)
- **Cleopatra** - Contemporary Roman coin (32-31 BCE)
- **Hypatia** - 1908 artistic rendering (no contemporary portraits exist)
- **Niccolò Machiavelli** - Santi di Tito painting, c. 1550s
- **Sun Tzu** - Traditional Chinese portrait

## Why Authentic Photos Matter

1. **Credibility** - Real historical photographs add authenticity
2. **AI Detection** - Avoids issues with AI-generated content
3. **Educational Value** - Students see real historical figures
4. **Legal Safety** - All photos are confirmed public domain
5. **Quality** - Professional historical photography (Sarony, Steichen, Cameron)

## Adding New Personas

When adding new historical figures:

1. Check their death date - must be before 1928 for U.S. public domain
2. Search Library of Congress: https://www.loc.gov/photos/
3. Search Wikimedia Commons: https://commons.wikimedia.org/
4. Verify public domain status
5. Choose high-resolution, square-croppable portraits
6. Add photo credit to `debateData.ts`:

```typescript
photoCredit: {
  photographer: "Photographer Name",
  date: "Year or circa",
  source: "Library of Congress",
  url: "https://www.loc.gov/item/...",
  license: "Public Domain"
}
```

## Recommended Photographers to Look For

These photographers' work is often in LOC/Wikimedia:

- **Napoleon Sarony** (1821-1896) - Famous portrait photographer
- **Mathew Brady** (1822-1896) - Civil War era
- **Edward Steichen** (1879-1973) - Early work is public domain
- **Julia Margaret Cameron** (1815-1879) - Victorian portraits
- **A.F. Bradley** - Early 20th century

## Legal Note

All photos downloaded via this script are verified public domain under U.S. copyright law (published before 1928 or by U.S. government). Photo credits are displayed for attribution and educational purposes, not legal requirement.
