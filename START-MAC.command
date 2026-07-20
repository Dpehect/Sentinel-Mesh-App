#!/bin/bash
cd "$(dirname "$0")"
PORT=8080
open "http://localhost:${PORT}/app/" 2>/dev/null
python3 -m http.server ${PORT}
