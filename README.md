# Weekly Calendar Summary Email

An automated Node.js script that sends weekly calendar summaries from Google Calendar via email every Monday morning.

## Features

- Automatically fetches upcoming week's events from Google Calendar
- Sends formatted email summaries with event details
- Runs every Monday morning at 8:00 AM
- Uses OAuth2 for secure Google API authentication

## Prerequisites

- Node.js installed
- Google Calendar API enabled
- Gmail account with OAuth2 credentials
- Google Cloud Console project with Calendar API enabled

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/calendar-summary.git
cd calendar-summary
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and fill in your credentials:
```bash
cp .env.example .env
```

4. Update the timezone in the script if needed (default is "America/New_York")

## Running the Application

### Development
```bash
node index.js
```

### Production
It's recommended to use PM2 for production:
```bash
npm install -g pm2
pm2 start index.js --name "calendar-summary"
```
Just in case you have to stop the instance (receiving emails every minute) use:
List all running processes
```bash
pm2 list

# Stop the calendar summary process
pm2 stop calendar-summary

# Delete it from PM2
pm2 delete calendar-summary

# To be thorough, list all processes again to verify
pm2 list
```

## Environment Variables

- `GOOGLE_CLIENT_ID`: Your Google OAuth2 client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth2 client secret
- `GOOGLE_REDIRECT_URI`: OAuth2 redirect URI
- `GOOGLE_REFRESH_TOKEN`: OAuth2 refresh token
- `EMAIL_USER`: Gmail address sending the emails
- `EMAIL_RECIPIENT`: Email address receiving the summaries
