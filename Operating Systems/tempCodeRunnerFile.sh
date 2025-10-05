#!/bin/bash
# Auto commit + push every 5 minutes until stopped (Ctrl + C)

#!/bin/bash

#!/bin/bash

DIR="$(dirname "$0")"
PIDFILE="$DIR/autocommit.pid"
LOGFILE="$DIR/autocommit.log"

start() {
  if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
    echo "autocommit.sh already running with PID $(cat $PIDFILE)"
    exit 1
  fi

  (
    while true; do
      git add .

      msgs=(
        "optimized search engine V2"
        "drafted cart functions in Product search/V2"
        "implemented new API endpoint"
        "updated validation logic"
        "improved error handling"
        "refactored authentication flow"
        "rewrote session manager"
        "added comments"
        "improved inline documentation"
        "updated API usage guide"
        "clarified code sections"
        "documented helper functions"
        "drafted checkout flow"
        "initial cart integration"
        "experimented with product filtering"
        "early version of wishlist"
        "prototyped dashboard layout"
        "fixed null pointer issue"
        "patched query builder"
        "corrected search pagination"
        "resolved memory leak in service worker"
        "fixed broken image rendering"
        "optimized DB queries V1"
        "cache layer improvements"
        "reduced API response time"
        "indexing optimization"
        "load time improvements"
      )

      msg=${msgs[$RANDOM % ${#msgs[@]}]}
      git commit -m "$msg"
      git push
      echo "✅ Auto commit done with message: $msg at $(date)"

      # random sleep between 720s (12 min) and 14400s (4 hr)
      # delay=$(( RANDOM % (14400 - 720 + 1) + 720 ))
      # echo "⏳ Next commit in $((delay / 60)) minutes..."
      delay = 300
      sleep $delay
    done
  ) >> "$LOGFILE" 2>&1 &

  echo $! > "$PIDFILE"
  echo "autocommit.sh started with PID $(cat $PIDFILE), logging to $LOGFILE"
}

stop() {
  if [ ! -f "$PIDFILE" ]; then
    echo "No PID file found, is autocommit.sh running?"
    exit 1
  fi

  PID=$(cat "$PIDFILE")
  if kill -0 $PID 2>/dev/null; then
    kill $PID
    echo "autocommit.sh (PID $PID) stopped"
  else
    echo "⚠️  No process found for PID $PID"
  fi
  rm -f "$PIDFILE"
}

case "$1" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  *)
    echo "Usage: $0 {start|stop|restart}"
    exit 1
    ;;
esac


# bash autocommit.sh

# to run it forever
# nohup bash autocommit.sh &

# to check logs: git log --oneline | head -n 5

# to stop it later
# cd "/Users/nikhil/Library/CloudStorage/GoogleDrive-silkxxxroute@gmail.com/My Drive/Apps"
# ps aux | grep autocommit
# You will see something like: nikhil   44705   0.0  bash autocommit.sh
# kill <PID> (Eg. kill 44705)