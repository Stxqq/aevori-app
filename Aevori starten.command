#!/bin/zsh
# AEVORI local browser launcher. No downloads or global installations at startup.
set -e
cd -- "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [[ -x runtime/bin/node ]]; then
  AEVORI_NODE="$PWD/runtime/bin/node"
elif command -v node >/dev/null 2>&1; then
  AEVORI_NODE="$(command -v node)"
else
  print 'Node.js 22.13+ is required for the source edition: https://nodejs.org/en/download'
  read -r '?Press Enter to close.'
  exit 1
fi
if [[ ! -f dist/index.html ]]; then
  print 'This is the source edition. Run npm ci and npm run build first, or download the ready-to-run release.'
  read -r '?Press Enter to close.'
  exit 1
fi
"$AEVORI_NODE" scripts/launch.mjs || { print 'AEVORI could not start.'; read -r '?Press Enter to close.'; exit 1; }
