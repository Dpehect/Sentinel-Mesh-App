#!/bin/sh
printf "Sentinel Mesh klasorunu bu pencereye surukleyip Enter'a basin: "
read TARGET
node "$(dirname "$0")/install-phase-11a.mjs" "$TARGET"
printf "Tamamlandi. Enter'a basin."
read _
