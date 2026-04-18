#!/bin/sh
set -eu

PATH="/usr/local/bin:/usr/bin:/bin"
export PATH

instance="${1:-demo}"

case "$instance" in
  *[!A-Za-z0-9_.-]*|"")
    echo "instance must contain only letters, numbers, dot, underscore, or hyphen" >&2
    exit 1
    ;;
esac

env_file="/etc/default/craftguild/jscalendar-tasks/$instance"

if [ ! -r "$env_file" ]; then
  echo "$env_file is missing or unreadable" >&2
  exit 1
fi

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
project_dir="$(CDPATH= cd -- "$script_dir/.." && pwd)"

set -a
. "$env_file"
set +a

cd "$project_dir"
npm run db:reset-demo
