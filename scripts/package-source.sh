#!/usr/bin/env sh
set -eu
rm -rf node_modules apps/*/.next packages/*/dist apps/*/dist .scans
zip -r sentinel-mesh-source.zip . -x '*.git*'
