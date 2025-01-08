const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const cron = require('node-cron');
require('dotenv').config();

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Configure Google Calendar API
const calendar = google.calendar('v3');

// Email transporter configuration with OAuth2
async function createTransporter() {
  try {
    const accessToken = await oauth2Client.getAccessToken();
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    // Verify the transporter configuration
    await transporter.verify();
    console.log('Transporter verified successfully');
    
    return transporter;
  } catch (error) {
    console.error('Error creating transporter:', error);
    throw error;
  }
}

async function getCalendarEvents() {
  try {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const response = await calendar.events.list({
      auth: oauth2Client,
      calendarId: 'primary',
      timeMin: startOfWeek.toISOString(),
      timeMax: endOfWeek.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

function createWeeklySummary(events) {
  if (!events || events.length === 0) {
    return 'No events scheduled for this week.';
  }

  const currentDate = new Date();
  const summary = [
    '📅 Weekly Calendar Summary',
    `\nSent on ${currentDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`,
    '\n'
  ];
  const eventsByDay = new Map();

  events.forEach(event => {
    const startDate = new Date(event.start.dateTime || event.start.date);
    const dayKey = startDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!eventsByDay.has(dayKey)) {
      eventsByDay.set(dayKey, []);
    }
    
    eventsByDay.get(dayKey).push({
      time: event.start.dateTime ? 
        new Date(event.start.dateTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : 'All Day',
      title: event.summary || 'Untitled Event',
      location: event.location || '',
      description: event.description || '',
    });
  });

  for (const [day, dayEvents] of eventsByDay) {
    summary.push(`\n\n📌 ${day}:`);
    dayEvents.forEach(event => {
      summary.push(`\n ${event.time}: ${event.title}`);
      if (event.location) {
        summary.push(`   📍 Location: ${event.location}`);
      }
    });
  }

  return summary.join('\n');
}

async function sendEmail(summary) {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"Calendar Summary" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT,
      subject: `📅 Weekly Calendar Summary - ${new Date().toLocaleDateString()}`,
      text: summary,
      html: summary.replace(/\n/g, '<br>')
        .replace(/📅/g, '📅&nbsp;')
        .replace(/📌/g, '📌&nbsp;')
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function weeklyCalendarSummary() {
  try {
    console.log('Starting weekly calendar summary...');
    const events = await getCalendarEvents();
    console.log(`Found ${events.length} events`);
    const summary = createWeeklySummary(events);
    await sendEmail(summary);
    console.log('Weekly summary completed successfully');
  } catch (error) {
    console.error('Error in weekly calendar summary:', error);
  }
}

// Schedule the task to run every Monday at 8:00 AM
// Cron format: Minute Hour Day-of-Month Month Day-of-Week
cron.schedule('0 8 * * 1', weeklyCalendarSummary, {
  scheduled: true,
  timezone: "America/New_York" // Change this to your timezone
});

console.log('Calendar summary scheduler started. Waiting for next scheduled run...');

// Keep the process running
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});