#!/bin/sh
set -eu

if [ -z "${PRISMA_QUERY_ENGINE_LIBRARY:-}" ]; then
  for engine in "$PWD"/src/generated/prisma/libquery_engine-*.so.node; do
    if [ -f "$engine" ]; then
      PRISMA_QUERY_ENGINE_LIBRARY="$engine"
      export PRISMA_QUERY_ENGINE_LIBRARY
      break
    fi
  done
fi

exec node server.js
