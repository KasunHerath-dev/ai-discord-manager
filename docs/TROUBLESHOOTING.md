# Troubleshooting Guide

Common problems and solutions for FasNet AI Discord Manager.

## Installation & Startup

### Node.js version too old

**Problem:** `Error: Node.js 22 or newer is required`

**Solution:**
1. Check your Node.js version: `node --version`
2. Download and install [Node.js 22 or newer](https://nodejs.org/)
3. Verify: `node --version` (should show v22.x.x or higher)

### Port already in use

**Problem:** `Error: listen EADDRINUSE :::8787`

**Cause:** Another application is using port 8787.

**Solutions:**

Option 1: Stop the other application
Option 2: Use a different port
```bash
PORT=8788 npm start
```

Option 3: Find and kill the process using the port
```bash
# macOS/Linux
lsof -i :8787
kill -9 <PID>

# Windows
netstat -ano | findstr :8787
taskkill /PID <PID> /F
```

### Browser won't connect to localhost

**Problem:** Cannot reach `http://127.0.0.1:8787` or `http://localhost:8787`

**Causes:**
- Server didn't start
- Using the wrong URL
- Firewall blocking the connection

**Solutions:**
1. Check the terminal - does it show `http://127.0.0.1:8787`?
2. Try `http://localhost:8787` instead of `127.0.0.1`
3. Try `http://127.0.0.1:8787` (not `http://localhost:8787`)
4. Check your firewall settings
5. Disable VPN temporarily
6. Try a different browser

### `.local-data` permission denied

**Problem:** `Error: EACCES: permission denied, mkdir .local-data`

**Solution:**
```bash
# Give yourself permission to create files
chmod u+w .

# Try starting again
npm start
```

## First-Run Setup

### Gemini API key rejected

**Problem:** "Invalid Gemini API key" or connection test fails

**Solutions:**
1. Verify the key is copied correctly (no extra spaces)
2. Check that it's a valid key from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Ensure the key hasn't been deleted
4. Try creating a new key and regenerating

See [GEMINI_SETUP.md](GEMINI_SETUP.md) for detailed steps.

### Discord bot token rejected

**Problem:** "Invalid Discord token" or "401 Unauthorized"

**Solutions:**
1. Verify the token is from the correct bot
2. Check that you have Developer Mode enabled
3. Ensure the token hasn't been regenerated (old tokens expire)
4. Copy the token again directly from [Developer Portal](https://discord.com/developers/applications)

See [DISCORD_BOT_SETUP.md](DISCORD_BOT_SETUP.md) for detailed steps.

### Guild ID not found

**Problem:** "Guild not found" or "404 Not Found"

**Solutions:**
1. Verify the Guild ID is correct
   - In Discord, right-click your server name
   - Click "Copy Server ID"
   - Paste in FasNet setup
2. Ensure you're using the correct Guild ID (not channel or user ID)
3. Verify the bot is installed in that server
4. Try refreshing Discord (`Ctrl+R` or `Cmd+R`)

### Owner User ID rejected

**Problem:** "User not found" or 404 error during setup

**Solutions:**
1. Verify your User ID is correct
   - Enable Developer Mode in Discord
   - Right-click your username in the member list
   - Click "Copy User ID"
2. Ensure you're a member of the server
3. Check that you haven't accidentally used a channel or role ID

### Local password too short

**Problem:** "Password must be at least 8 characters"

**Solution:** Use a longer password or passphrase.

Recommended:
- At least 12 characters
- Mix of letters, numbers, and symbols
- Avoid common words or patterns

### Setup test connection fails

**Problem:** "Connection test failed" at the end of setup

**Causes:**
- Discord token is invalid
- Bot doesn't have required permissions
- Guild ID is incorrect
- Network connection issue

**Solutions:**
1. Double-check all credentials (use copy-paste, not manual typing)
2. Verify the bot has the required permissions
3. Ensure the bot is installed in the server
4. Check your internet connection
5. Try again in 30 seconds (might be temporary)

## Application Usage

### Application shows "Not Initialized"

**Problem:** Dashboard says "Please complete setup"

**Solution:**
This is expected on first startup. Complete the first-run wizard.

If you completed setup and still see this:
1. Check that `.local-data/settings.json` exists
2. Try restarting the application
3. If settings.json is corrupted, delete it and re-run setup

### Locked out (wrong password)

**Problem:** "Invalid password" after 3-5 attempts

**Solution:**
1. Restart the application
2. Password attempts reset when the app restarts
3. Re-enter the correct password

If you forgot the password:
1. Delete `.local-data/secrets.enc.json` (credentials file)
2. Keep `.local-data/settings.json` and `.local-data/plans.json` (your history)
3. Restart the application
4. Go through first-run setup again

⚠️ After deleting `secrets.enc.json`, your Discord credentials are lost and must be re-entered. Your plans and history remain.

## Discord Operations

### HTTP 429: Rate limited

**Problem:** "Discord API 429" or "You are being rate limited"

**Expected behavior:**
FasNet automatically waits and retries. This is normal for large plans.

**Verification:**
1. Check the execution log - it should show "Waiting X seconds..."
2. Operations continue automatically after the wait
3. This is not an error - it's working as designed

**If stuck:**
1. Wait 5+ minutes before restarting
2. Try with a smaller plan (fewer operations)
3. Increase the request delay:
   ```bash
   DISCORD_REQUEST_DELAY_MS=2000 npm start
   ```

### HTTP 401: Unauthorized

**Problem:** "Discord API 401 Unauthorized"

**Causes:**
- Bot token is invalid
- Token was regenerated
- Token contains typos

**Solutions:**
1. Regenerate your bot token in Discord Developer Portal
2. Go back to settings and update the Discord token
3. Re-test the connection

### HTTP 403: Missing Permissions

**Problem:** "Discord API 403: Missing Permissions"

**Causes:**
- Bot doesn't have required permissions
- Bot role is below the roles it needs to manage
- Channel-specific permissions block the bot

**Solutions:**
1. Check bot permissions in Discord:
   - Server Settings → Roles
   - Find the bot role
   - Ensure it has: View Channels, Send Messages, Manage Channels, Manage Roles, etc.
2. Check role hierarchy:
   - Bot role must be above roles it needs to manage
   - Move the bot role higher
3. Check channel permissions:
   - Right-click channel → Edit Channel
   - Ensure the bot role isn't denied permissions

### HTTP 404: Not Found

**Problem:** "Discord API 404: Unknown Channel" or "Unknown Role"

**Causes:**
- Channel/role was deleted
- ID is incorrect
- Channel/role doesn't exist in that category

**Solutions:**
1. Verify the resource exists (check Discord manually)
2. Refresh the server snapshot:
   - Dashboard → Refresh Server
3. If creating a channel, verify the parent category exists
4. Try the operation again

### "Missing Permissions" for role operations

**Problem:** "Bot cannot manage this role"

**Cause:** Bot role is not above the role it needs to manage.

**Solution:**
1. In Discord, go to Server Settings → Roles
2. Find the bot's role (e.g., "FasNet AI Manager")
3. Drag it above all roles the bot needs to create/edit/delete
4. Save and try again

### Cannot edit message: "Unknown Message"

**Problem:** "Discord API 404: Unknown Message"

**Causes:**
- Message was deleted
- Message ID is incorrect
- Message was sent by a different bot

**Solution:**
1. Verify the message still exists
2. Ensure the message was sent by FasNet's bot
3. Try in a different message if that one was deleted

## Plans & Execution

### Plan generates but won't approve

**Problem:** "Plan contains issues" or buttons are disabled

**Cause:** Plan failed safety validation.

**Solutions:**
1. Check the plan details for error messages
2. Common issues:
   - Trying to assign `Administrator` role (blocked)
   - Trying to delete @everyone role (blocked)
   - Deleting role above bot's role (blocked)
   - Invalid permission names
3. Edit your prompt to avoid these issues
4. Try again with a modified prompt

### Execution stops partway

**Problem:** Plan stops after a few operations

**Causes:**
- Rate limit (expected, should auto-retry)
- Permanent error (403, 404, etc.)
- Connection lost

**Solutions:**
1. Check execution log for error message
2. If rate limit (429):
   - Wait for automatic retry (shown in log)
   - Do not restart the app
   - Operations resume automatically
3. If permission error (403):
   - Fix permissions
   - Re-run the plan from scratch
4. If connection error:
   - Check internet connection
   - Try again

### Execution resume after restart

**Problem:** "Do I need to resubmit the plan?"

**Answer:** No. Completed operations are skipped, pending operations resume.

**How it works:**
1. Each operation is tracked as it completes
2. Restarting the app preserves this state
3. Previously failed operations can be retried
4. Completed operations are never repeated

**If you want to clear history:**
1. Delete the plan from the Plans page
2. Regenerate a new plan

## Logs & Debugging

### Enable verbose logging

Add this environment variable:

```bash
DEBUG=* npm start
```

This logs all operations. Be careful - logs may contain server structure details.

### View audit log

The audit log tracks all completed operations:

1. Dashboard → Audit Log
2. Or check `.local-data/audit.json` (if accessible)

### View execution history

All executed plans are saved:

1. Dashboard → Plans
2. Click a past plan to see its execution log
3. Or check `.local-data/plans.json` (if accessible)

### Check server snapshots

Before each execution, a snapshot is saved:

```
.local-data/backups/
├── 2026-01-15T10-23-45Z-plan-id.json
├── 2026-01-15T10-25-10Z-plan-id.json
└── ...
```

These files are unencrypted and contain your server structure (no messages or member data).

## Data & Backup

### Where is my data stored?

All local data is in `.local-data/`:

```
.local-data/
├── settings.json          # Configuration (encrypted password)
├── secrets.enc.json       # Encrypted Discord + Gemini credentials
├── plans.json             # Plan history
├── audit.json             # Execution audit log
└── backups/               # Pre-execution server snapshots
```

### Can I delete .local-data?

Yes, but:
- You'll lose all local settings and history
- You'll need to re-enter credentials in setup
- Previously completed operations won't be tracked
- Plans and audit logs are lost

### How to backup

1. `.local-data/` is your full backup
2. Copy it to a secure location
3. To restore, paste it back in the repository root

⚠️ **Never share `.local-data`** - it contains encrypted credentials.

### How to reset

1. Delete `.local-data/`
2. Restart the application
3. Go through first-run setup again

## Network & Firewall

### Application won't reach Discord API

**Problem:** "Failed to fetch" or "Connection timeout"

**Causes:**
- No internet connection
- Firewall blocking Discord API
- Discord API is down

**Solutions:**
1. Check your internet connection: `ping discord.com`
2. Check firewall settings
3. Try disabling VPN temporarily
4. Check [Discord status page](https://discordstatus.com/)
5. Wait a few minutes and try again

### Application won't reach Gemini API

**Problem:** "Failed to reach Gemini API"

**Causes:**
- No internet connection
- Firewall blocking Google APIs
- API key is invalid
- Rate limit exceeded

**Solutions:**
1. Check your internet connection
2. Verify firewall settings
3. Check Google Cloud status
4. Verify API key is valid
5. Check if you've exceeded rate limits

## Still Having Issues?

1. **Check docs:** [DISCORD_BOT_SETUP.md](DISCORD_BOT_SETUP.md), [GEMINI_SETUP.md](GEMINI_SETUP.md)
2. **Review logs:** Check `.local-data/audit.json` and execution logs
3. **Search issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/fasnet-ai-discord-manager/issues)
4. **Open issue:** If not found, [create a new issue](https://github.com/YOUR_USERNAME/fasnet-ai-discord-manager/issues/new)

When opening an issue, include:
- Error message (exact text)
- Steps to reproduce
- Node.js version (`node --version`)
- Operating system
- Relevant logs (redact credentials)
