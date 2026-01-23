#!/bin/bash

# Crop game screenshots - removes top 450px and bottom 700px
# Used for processing iPhone screenshots to remove status bar and home indicator area

GAMES_DIR="public/games"

if [ ! -d "$GAMES_DIR" ]; then
  echo "Error: $GAMES_DIR directory not found"
  exit 1
fi

count=0
for img in "$GAMES_DIR"/*.PNG "$GAMES_DIR"/*.png; do
  [ -e "$img" ] || continue
  magick "$img" -gravity North -chop 0x450 -gravity South -chop 0x700 "$img"
  echo "Cropped: $img"
  ((count++))
done

if [ $count -eq 0 ]; then
  echo "No PNG images found in $GAMES_DIR"
else
  echo "Done! Cropped $count image(s)"
fi
