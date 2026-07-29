# Discord Bot Setup Guide

This guide walks you through creating a Discord bot and installing it in your server.

## Prerequisites

- A Discord account
- Administrator access to a Discord server (or own a test server)

## Step 1: Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Enter a name (e.g., "FasNet AI Manager") and click **"Create"**
4. You're now on the application's **General Information** tab

Keep this page open; you'll need the **Client ID** later.

## Step 2: Create a Bot User

1. Click the **"Bot"** tab in the left sidebar
2. Click **"Add Bot"**
3. A new bot has been created with the name matching your application

Your bot is now created. You'll see a **TOKEN** button. This is your bot token.

## Step 3: Copy Your Bot Token

⚠️ **WARNING:** Your bot token is a secret. Never share it, commit it to Git, or post it online.

1. Click **"Copy"** under the **TOKEN** section
2. Save it securely (password manager or temporary secure file)
3. You'll need this token during FasNet's first-run setup

If you accidentally expose your token:
1. Return to the Developer Portal
2. Click **"Regenerate"** next to the TOKEN
3. The old token becomes invalid immediately

## Step 4: Configure OAuth2 Scopes

1. Click the **"OAuth2"** tab in the left sidebar
2. Click **"URL Generator"** in the left submenu
3. Under **SCOPES**, select:
   - ✓ `bot`
4. Under **PERMISSIONS**, select:
   - ✓ View Channels
   - ✓ Send Messages
   - ✓ Read Message History
   - ✓ Manage Channels
   - ✓ Manage Roles
   - ✓ Manage Messages
   - ✓ Manage Guild (for server settings)

5. Copy the generated URL at the bottom of the page

## Step 5: Install the Bot in Your Server

1. Paste the URL you copied into your browser
2. Select your server from the dropdown
3. Click **"Authorize"**
4. Complete the CAPTCHA
5. The bot is now in your server

## Step 6: Configure Bot Role Hierarchy

⚠️ **Important:** The bot can only manage roles that are *below* its own role in the hierarchy.

1. Go to your Discord server
2. Open **Server Settings** → **Roles**
3. Find the **"FasNet AI Manager"** role (or your application name)
4. Drag this role to be:
   - **Above** all roles the bot needs to create, edit, or delete
   - **Below** your admin/owner roles
5. Save

Example hierarchy:

```
Server Owner (human)
├── Admin (human)
├── FasNet AI Manager (bot) ← Must be here
├── Moderator (manageable by bot)
├── Member (manageable by bot)
└── Guest (manageable by bot)
```

## Step 7: Enable Developer Mode

To get Discord IDs (needed in FasNet's setup):

1. Open Discord and go to **User Settings**
2. Click **"Advanced"** in the left sidebar
3. Toggle **"Developer Mode"** ON

Now you can right-click any channel, user, or role and select "Copy ID".

## Step 8: Get Your Guild ID and User ID

In your server:

1. Right-click the server name (top left)
2. Click **"Copy Server ID"**
3. Save this as your **Guild ID**

For your user ID:

1. Right-click your username in the member list
2. Click **"Copy User ID"**
3. Save this as your **Owner User ID**

## Step 9: Run FasNet Setup

You now have all the credentials needed:

- ✓ Discord bot token
- ✓ Discord Client ID (from Developer Portal, General tab)
- ✓ Guild ID (your server)
- ✓ Owner User ID (you)

Start FasNet and enter these during the first-run setup.

## Troubleshooting

### 401 Unauthorized

**Problem:** "Discord API 401 Unauthorized"

**Causes:**
- Bot token is incorrect
- Token was regenerated and the old one no longer works
- Token contains spaces or special characters

**Solution:**
1. Verify the token is copied correctly from the Developer Portal
2. If you regenerated it recently, use the new token
3. Check that no whitespace was accidentally added

### 403 Forbidden

**Problem:** "Discord API 403: Missing Permissions"

**Causes:**
- Bot doesn't have the required permissions
- Bot role is positioned below the roles it needs to manage
- Bot doesn't have permission for that specific channel

**Solution:**
1. Check that you selected all required permissions during OAuth2 setup
2. Verify the bot role is above the roles it needs to manage
3. Check channel-specific permission overwrites

### 404 Not Found

**Problem:** "Discord API 404: Unknown Channel/Role/Guild"

**Causes:**
- Guild ID is incorrect
- Channel or role was deleted
- Role hierarchy validation failed

**Solution:**
1. Verify the Guild ID is correct (right-click server, Copy Server ID)
2. Check that the channel/role still exists
3. Try refreshing by going back to the dashboard and clicking "Refresh Server"

### Bot Not Appearing in Server

**Problem:** The bot doesn't show up as a member in the server

**Causes:**
- Authorization failed during OAuth2
- Bot token is incorrect
- Server ID is wrong

**Solution:**
1. Re-run the OAuth2 authorization process
2. Verify the server ID is correct
3. Check the Developer Portal to confirm the bot exists

## Next Steps

Now you're ready to:

1. Start the FasNet application
2. Go through the first-run setup
3. Enter your Discord credentials
4. Test the connection
5. Start creating plans

See the main [README.md](../README.md) for next steps.

## Security Reminders

✓ **Do:**
- Store your bot token in a password manager
- Regenerate the token if you accidentally expose it
- Keep Discord in Developer Mode for convenience
- Monitor bot activity in the audit log

✗ **Don't:**
- Commit bot tokens to Git or any version control
- Share tokens in screenshots, messages, or emails
- Use the same token across multiple applications
- Leave your server's Discord Developer Portal session open on shared computers
