#!/bin/bash

# copy me to output/hidden_traits and execute
# make sure *.svg are generated
# install librsvg2-bin and ImageMagick

for f in *.svg; do
  ff="${f/.svg/.png}"
  rsvg-convert -w 96 -h 96 "$f" -o "$ff"
done

for f in traits_*.png; do
  ff="${f/.png/}"
  fff="${ff/traits/trait}"
  fff="${fff/-*/}"
  compare "${ff}.png" "${fff}.png" -compose src "${ff}_c.png"
done
