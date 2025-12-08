# Analytics Setup Guide

This guide explains how to set up Google Analytics 4 (GA4) and Microsoft Clarity for PansGPT.

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# Google Analytics 4 Measurement ID
# Get this from analytics.google.com
# Format: G-XXXXXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-910NGP259N

# Microsoft Clarity Project ID
# Get this from clarity.microsoft.com
# Format: A string of random letters/numbers (e.g., j1k2l3m4n5)
NEXT_PUBLIC_CLARITY_PROJECT_ID=uhttbjmgq6
```

## Getting Your IDs

### Google Analytics 4 (GA4) Measurement ID

1. Go to [analytics.google.com](https://analytics.google.com) and sign in
2. Click "Start measuring" or select your property
3. Go to Admin → Data Streams → Web
4. Copy your Measurement ID (starts with `G-`)

### Microsoft Clarity Project ID

1. Go to [clarity.microsoft.com](https://clarity.microsoft.com)
2. Sign up/Login
3. Click "+ New Project"
4. Name: PansGPT
5. Website URL: Your live URL
6. Click "Get tracking code" → "Install manually"
7. Copy the Project ID from the script (the string in the code)

## Verification

After setting up:

1. Deploy your site or run locally
2. Visit your website
3. **Google Analytics**: Go to Reports → Realtime. You should see "Users in last 30 minutes: 1"
4. **Microsoft Clarity**: Dashboard might take 1-2 hours to populate

## Tracked Events

The following events are automatically tracked:

- `click_start_studying` - Hero CTA button clicks
- `click_download` - Download button clicks (with source label)
- `click_signup` - Sign up button clicks (with source label)
- `click_login` - Login button clicks (with source label)
- `generate_quiz` - Quiz generation events
- `send_chat_message` - Chat message events

## Weekly Check-Up Routine

1. **Growth Check (GA4)**: Reports > Acquisition > Traffic Acquisition - Check if Users chart is going up
2. **Confusion Check (Clarity)**: Recordings - Watch 5 random sessions to see user behavior
3. **Conversion Check (GA4)**: Reports > Engagement > Events - Check `click_start_studying` conversion rate


