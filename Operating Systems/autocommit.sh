#!/bin/bash
# Auto commit + push every 5 minutes until stopped (Ctrl + C)
# cd "/Users/nikhil/Downloads/Operating Systems"
# bash autocommit.sh start
# bash autocommit.sh stop
# bash autocommit.sh restart

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
        "updated logic"
        "improved error handling"
        "Nothing important"
        "rewrote a few things"
        "added comments"
        "improved inline documentation"
        "clarified code sections"
        "documented helper functions"
        "prototyped a function"
        "fixed null pointer issue"
        "improved comments"
        "resolved prior bugs"
        "reduced API response time"
        "Updated Review Session Files"
        "Experimenting"
      )

      msg=${msgs[$RANDOM % ${#msgs[@]}]}

      # Only commit if there are changes
      if ! git diff --quiet || ! git diff --cached --quiet; then
        git commit -m "$msg"
        git push
        echo "✅ Auto commit done with message: $msg at $(date)"
      else
        echo "ℹ️ No changes to commit at $(date)"
      fi

      delay=300   # 5 minutes
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
