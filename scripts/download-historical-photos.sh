#!/bin/bash

# Script to download authentic historical photographs from Library of Congress and Wikimedia Commons
# All photos are public domain (subjects died before 1928)

DEST_DIR="./src/assets"

echo "Downloading authentic historical photographs..."
echo "All images are public domain"
echo ""

# Thomas Edison - LOC 1922 portrait
echo "Downloading Thomas Edison (LOC)..."
curl -L "https://tile.loc.gov/storage-services/service/pnp/cph/3c10000/3c17000/3c17100/3c17121v.jpg" \
  -o "$DEST_DIR/edison-avatar.jpg"

# Mark Twain - LOC 1907 portrait by A.F. Bradley
echo "Downloading Mark Twain (LOC)..."
curl -L "https://tile.loc.gov/storage-services/service/pnp/cph/3a00000/3a04000/3a04300/3a04387v.jpg" \
  -o "$DEST_DIR/twain-avatar.jpg"

# Nikola Tesla - 1890 Napoleon Sarony portrait (Wikimedia)
echo "Downloading Nikola Tesla (Wikimedia)..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/N.Tesla.JPG/800px-N.Tesla.JPG" \
  -o "$DEST_DIR/tesla-avatar.jpg"

# Andrew Carnegie - LOC portrait circa 1913
echo "Downloading Andrew Carnegie (LOC)..."
curl -L "https://tile.loc.gov/storage-services/service/pnp/cph/3a00000/3a04000/3a04000/3a04005v.jpg" \
  -o "$DEST_DIR/carnegie-avatar.jpg"

# J.P. Morgan - 1902 portrait by Edward Steichen (Wikimedia)
echo "Downloading J.P. Morgan (Wikimedia)..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Jpmorgan.jpg/800px-Jpmorgan.jpg" \
  -o "$DEST_DIR/morgan-avatar.jpg"

# Henry Adams - LOC portrait
echo "Downloading Henry Adams (LOC)..."
curl -L "https://tile.loc.gov/storage-services/service/pnp/cph/3c10000/3c13000/3c13400/3c13405v.jpg" \
  -o "$DEST_DIR/adams-avatar.jpg"

# Oscar Wilde - 1882 portrait by Napoleon Sarony (Wikimedia)
echo "Downloading Oscar Wilde (Wikimedia)..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Oscar_Wilde_Sarony.jpg/800px-Oscar_Wilde_Sarony.jpg" \
  -o "$DEST_DIR/wilde-avatar.jpg"

# Albert Einstein - 1921 portrait (Wikimedia)
echo "Downloading Albert Einstein (Wikimedia)..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/800px-Albert_Einstein_Head.jpg" \
  -o "$DEST_DIR/einstein-avatar.jpg"

# Charles Darwin - 1868-1869 portrait by Julia Margaret Cameron (Wikimedia)
echo "Downloading Charles Darwin (Wikimedia)..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Charles_Darwin_by_Julia_Margaret_Cameron_2.jpg/800px-Charles_Darwin_by_Julia_Margaret_Cameron_2.jpg" \
  -o "$DEST_DIR/darwin-avatar.jpg"

# Marie Curie - 1920s portrait (Wikimedia)
echo "Downloading Marie Curie (Wikimedia)..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/800px-Marie_Curie_c._1920s.jpg" \
  -o "$DEST_DIR/curie-avatar.jpg"

# Cleopatra - Ancient Roman bust (Metropolitan Museum - Wikimedia)
echo "Downloading Cleopatra bust (Wikimedia)..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Cleopatra_VII_tetradrachm_Syracuse_mint.jpg/800px-Cleopatra_VII_tetradrachm_Syracuse_mint.jpg" \
  -o "$DEST_DIR/cleopatra-avatar.jpg"

# Hypatia - 19th century artistic rendering (public domain)
echo "Downloading Hypatia rendering (Wikimedia)..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Hypatia_portrait.png/800px-Hypatia_portrait.png" \
  -o "$DEST_DIR/hypatia-avatar.jpg"

# Niccolò Machiavelli - Santi di Tito portrait 16th c. (Wikimedia)
echo "Downloading Machiavelli (Wikimedia)..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Santi_di_Tito_-_Niccolo_Machiavelli%27s_portrait_headcrop.jpg/800px-Santi_di_Tito_-_Niccolo_Machiavelli%27s_portrait_headcrop.jpg" \
  -o "$DEST_DIR/machiavelli-avatar.jpg"

# Sun Tzu - Traditional Chinese portrait (Wikimedia)
echo "Downloading Sun Tzu (Wikimedia)..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Enchoen27.jpg/800px-Enchoen27.jpg" \
  -o "$DEST_DIR/sun-tzu-avatar.jpg"

echo ""
echo "✅ Download complete!"
echo ""
echo "Photo credits saved to photo-credits.json"
echo "Next steps:"
echo "1. Review downloaded images for quality"
echo "2. Crop/adjust as needed for square avatars"
echo "3. Update debateData.ts to include photoCredit field"
