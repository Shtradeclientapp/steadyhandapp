#!/bin/bash
cd ~/Documents/steadyhand-app

PROMPTS=(
  "Find all places where onboarding_complete is checked or set, and trace the full logic flow that determines when the client setup modal shows"
  "Find every signUp and signInWithPassword call and check whether the welcome email firing could fail silently and leave a user in a broken state"
  "Search for all localStorage.getItem and localStorage.setItem calls related to onboarding or dismissal and check if any could be lost between sessions"
  "Find all places where is_demo is read or written and check whether any queries that return jobs, profiles, or tradies could accidentally return demo data to real users"
  "Trace the DemoSwitcher component from mount to render and identify any async timing issue that would cause it not to appear"
  "Find every place the match route filters tradies and check whether demo tradies are excluded in all paths"
  "Find all columns referenced in the jobs table insert across the codebase and check which ones might not exist in the production schema"
  "Trace the full job request submission flow from the form submit button to the database insert and identify any silent failure points"
  "Find all Stripe payment intent creation calls and check whether GST is consistently applied"
  "Search for all webhook handlers and check whether the idempotency check on processed_stripe_events is applied to every event type"
  "Find all PDF generation routes and check whether job.state is always available when etaNotice is called"
  "Search for all snapshot field reads and check whether there is a fallback when the snapshot is null"
  "Find the ob-reminders cron route and check whether any reminder queries could return the same user multiple times"
  "Search for all fetch api/email calls and check whether any fire without a try/catch"
  "Search the entire codebase for hardcoded WA, Western Australia, and Perth strings that were not updated during the national expansion"
  "Find all places where state is read from a job record and check whether any assume it defaults to WA without an explicit fallback"
)

OUTPUT_FILE="debug-scan-$(date +%Y%m%d-%H%M).md"
echo "# Steadyhand Debug Scan — $(date)" > $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

for i in "${!PROMPTS[@]}"; do
  PROMPT="${PROMPTS[$i]}"
  echo "## Scan $((i+1)): $PROMPT" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "Running scan $((i+1)) of ${#PROMPTS[@]}: $PROMPT"
  npx @anthropic-ai/claude-code --allowedTools "Read,Grep,Glob,LS" --print "$PROMPT" >> $OUTPUT_FILE 2>&1
  echo "" >> $OUTPUT_FILE
  echo "---" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  sleep 2
done

echo "Done. Results saved to $OUTPUT_FILE"
