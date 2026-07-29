# FasNet AI Discord Manager

**A zero-dependency local web application for safely managing a Discord server using natural-language prompts.**

The application runs on your own computer, opens in a browser, connects to Gemini for understanding your intent, and uses a Discord bot to inspect and modify your server. Every action plan is generated locally and requires your explicit approval before execution.

**⚠️ Important:** This application can create, update, move, and delete Discord resources. Always test plans on a separate Discord server before using on a production community. Review every plan carefully.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Setup Guides](#setup-guides)
- [Usage](#usage)
- [Rate-Limit Handling](#rate-limit-handling)
- [Security](#security)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

FasNet AI Discord Manager enables a Discord server administrator to:

1. **Connect** a Discord bot to a server
2. **Describe** what you want to do in plain English
3. **Review** an AI-generated action plan
4. **Approve** safe operations or confirm destructive changes
5. **Execute** sequentially with automatic rate-limit handling
6. **Audit** all changes in a local log

The application:
- Runs entirely on your local machine (not cloud-hosted)
- Never sends your Discord bot token to external services
- Encrypts credentials locally with AES-256-GCM
- Preserves all safety confirmations and approval flows
- Stores plans, audit logs, and server snapshots locally
- Supports 17+ Discord operations (roles, channels, permissions, messages)
- Requires **zero external runtime dependencies**

This is a **single-admin local tool**, not a multi-user SaaS platform.

---

## Features

### Core Capabilities

- 🤖 **Natural-language planning** via Gemini API
- 🔐 **Encrypted local credentials** (AES-256-GCM, password-derived key)
- 📋 **Structured action plans** with risk classification
- ✅ **Approval + confirmation** required before execution
- 🔄 **Automatic Discord rate-limit handling** (HTTP 429 recovery)
- 📊 **Live server inspection** and state tracking
- 💾 **Pre-action server snapshots** for safety
- 📝 **Comprehensive audit log** of all operations
- 🎯 **Sequential execution** with proper Discord permissions validation
- 🔁 **Resumable state** - completed operations never repeat after restart

### Supported Discord Operations

- Create, update, delete roles
- Create, update, move, delete categories
- Create, update, move, delete text and voice channels
- Set channel permissions
- Send, edit, delete messages
- Assign and remove member roles

### Security Features

- ✓ Approval layer - user reviews before execution
- ✓ Typed confirmation - destructive actions require exact phrase
- ✓ Permission validation - checks bot role hierarchy
- ✓ Protected resources - prevents managing @everyone role
- ✓ Pre-action snapshots - preserve server state
- ✓ No Administrator assignment - enforced safety block
- ✓ Audit logging - track all operations
- ✓ No secret logging - credentials never appear in logs

---

## Requirements

Before you begin:

- **Node.js 22 or newer** — [Download](https://nodejs.org/)
- **A Discord account** with a server you own or manage
- **Discord bot application & token** — See [DISCORD_BOT_SETUP.md](docs/DISCORD_BOT_SETUP.md)
- **Gemini API key** — See [GEMINI_SETUP.md](docs/GEMINI_SETUP.md)
- **Git** (optional, only for cloning or contributing)

Verify Node.js:

```bash
node --version  # Should show v22.x.x or higher
```

---

## Quick Start

### 1. Get the Code

**Clone:**
```bash
git clone https://github.com/YOUR_USERNAME/fasnet-ai-discord-manager.git
cd fasnet-ai-discord-manager
```

**Or download:** Download and extract the ZIP from GitHub.

### 2. Start the Application

No `npm install` required (zero runtime dependencies).

**Windows:**
```cmd
start.bat
```

**macOS/Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Or any OS:**
```bash
npm start
```

### 3. Open the Dashboard

Open your browser to:

```
http://127.0.0.1:8787
```

You'll see the first-run setup wizard.

### 4. Complete Setup

1. Enter your **Gemini API key** and model
2. Enter your **Discord bot token**
3. Enter your Discord **Client ID**, **Guild ID**, and **User ID**
4. Create a **local admin password**
5. Choose a **management mode** (Safe, Managed, or Full)
6. Complete connection tests

**First-time setup takes ~5 minutes.**

See [Setup Guides](#setup-guides) for detailed steps.

---

## Setup Guides

### Discord Bot Creation

Complete guide: [**docs/DISCORD_BOT_SETUP.md**](docs/DISCORD_BOT_SETUP.md)

Quick summary:
1. Create app in [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a bot user
3. Copy the bot token securely
4. Configure OAuth2 scopes and permissions
5. Install the bot in your server
6. Move the bot role above the roles it needs to manage
7. Enable Discord Developer Mode and copy your IDs

### Gemini API Key Setup

Complete guide: [**docs/GEMINI_SETUP.md**](docs/GEMINI_SETUP.md)

Quick summary:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Keep it secure (treat like a password)
4. Free tier includes 60 requests/min, 1,500 requests/day
5. Upgrade to paid for higher limits

---

## Usage

### Typical Workflow

#### Step 1: Inspect Your Server

Start with a read-only prompt:

```
Inspect the current Discord server.

Show me:
- All categories and their channels
- All roles and their permissions
- Bot permissions
- Role hierarchy

Do not make any changes.
```

#### Step 2: Request a Plan

Describe what you want to create:

```
Create a new category called DEVELOPMENT.

Inside it, create these text channels:
- architecture
- frontend
- backend
- database
- api-design

Create these roles:
- Technical Lead
- Senior Developer
- Junior Developer

Do not modify any existing resources.
```

#### Step 3: Review the Plan

Before approving, check:

- ✓ Number of operations (is this what you wanted?)
- ✓ Risk level (are destructive operations included?)
- ✓ Target resources (are the names/IDs correct?)
- ✓ Permission changes (do they make sense?)
- ✓ Any unresolved questions (are they acceptable?)

#### Step 4: Approve & Execute

1. **Safe operations:** Click approve
2. **Destructive operations:** Type the exact confirmation phrase
3. Execution happens sequentially
4. The app handles rate limits automatically
5. Watch the execution log

#### Step 5: Review the Report

After execution, check:

- ✓ Completed count
- ✓ Failed count (if any)
- ✓ Retry count (rate-limit waits)
- ✓ Final status

All operations are logged in the audit log.

### Management Modes

Choose during setup:

**Safe Mode**
- Inspection and read-only operations only
- Destructive operations blocked
- Good for initial testing

**Managed Mode** (Recommended)
- Full operation support
- Destructive actions require exact confirmation
- Suitable for normal use

**Full Mode**
- Same broad operation set
- Same approval and confirmation requirements
- Use only on servers you fully control

### Rate-Limit Behavior

Discord limits API requests. FasNet handles this automatically:

1. **Detects** HTTP 429 responses
2. **Reads** `retry_after` timing from Discord
3. **Waits** for the required duration + 500ms safety buffer
4. **Retries** the same operation
5. **Continues** with remaining operations

**You do not need to:**
- Resubmit the plan
- Click approve again
- Do anything while waiting

Waiting is shown in the execution log as normal progress.

See [Rate-Limit Handling](#rate-limit-handling) section below.

---

## Rate-Limit Handling

Discord applies rate limits to protect its infrastructure. FasNet handles them transparently.

### Automatic Recovery

When Discord returns HTTP 429 (rate limited):

```
Operation 5 of 30: DELETE_CHANNEL old-feature

Discord rate limit reached.
Waiting 22.3 seconds...
Retry attempt 1 of 8

[After wait...]
Operation resumed successfully.
```

**How it works:**
1. Parse `retry_after` from Discord response
2. Add 500ms safety buffer
3. Wait the total duration
4. Automatically retry the same approved operation
5. Continue with next operation

**Key points:**
- Same operation is retried (never modified)
- Approved plan is never changed
- User approval stands for all retries
- Max 8 attempts per operation
- Complete plans with many operations are supported

### Global Rate Limits

If Discord sets a global rate limit:

1. **All** Discord requests pause (not just one endpoint)
2. Queue resumes automatically after wait expires
3. No manual action needed

### Temporary Server Errors

FasNet retries with exponential backoff:

- HTTP 500 (Internal Server Error)
- HTTP 502 (Bad Gateway)
- HTTP 503 (Service Unavailable)
- HTTP 504 (Gateway Timeout)
- Network timeouts
- Connection resets

Backoff formula: `base * 2^attempt + jitter`, capped at 30s

### Non-Retryable Errors

These are not retried:

- 400 Bad Request - fix the plan or permissions
- 401 Unauthorized - check bot token
- 403 Forbidden - check bot role hierarchy
- 404 Not Found - resource may already be deleted

### Configuration

Optional environment variables:

```bash
# Delay between successful requests (default: 1500)
DISCORD_REQUEST_DELAY_MS=1500

# Maximum retry attempts per operation (default: 8)
DISCORD_MAX_RETRIES=8

# Maximum exponential backoff delay (default: 30000)
DISCORD_MAX_BACKOFF_MS=30000

# Safety buffer after rate-limit response (default: 500)
DISCORD_RETRY_BUFFER_MS=500
```

Example - increase delay for stability:

```bash
DISCORD_REQUEST_DELAY_MS=2000 npm start
```

Or on Windows PowerShell:

```powershell
$env:DISCORD_REQUEST_DELAY_MS="2000"
npm start
```

---

## Security

### Local Credential Storage

All credentials are stored in `.local-data/secrets.enc.json`:

- **Encryption:** AES-256-GCM
- **Key derivation:** Password + scrypt
- **Never transmitted:** Credentials never leave your computer
- **Gemini never sees** Discord bot token
- **Discord never receives** Gemini API key

### What's Encrypted

- Discord bot token
- Gemini API key
- Your Discord Guild ID
- Your User ID (with timestamp for multi-user safety)

### What's NOT Encrypted

- Local application settings (port, data directory)
- Plan text and execution logs
- Server structure snapshots
- Audit logs

### Never Commit These Files

```
.local-data/              # All runtime data
.env                      # Environment variables
secrets.enc.json          # Encrypted credentials
plans.json                # Plan history
audit.json                # Operation audit log
backups/                  # Server snapshots
```

A `.gitignore` file is provided to prevent accidents.

### Secret Scanning

Before publishing the repository:

```bash
git grep -n -I -E "AIza|Bot |DISCORD_BOT_TOKEN|GEMINI_API_KEY|token"
```

If secrets are ever committed:

1. **Revoke immediately** via Discord Developer Portal or Google AI Studio
2. Generate new credentials
3. Remove from Git history (or consider the repo compromised)

### Recommended Practices

- ✓ Use a strong local password (12+ characters, mixed case & symbols)
- ✓ Store credentials in a password manager
- ✓ Regenerate bot token if accidentally exposed
- ✓ Keep `.local-data/` private and backed up
- ✓ Review each plan before approval
- ✓ Test destructive operations on a separate server first

---

## Project Structure

```
fasnet-ai-discord-manager/
├── src/                    # Application source code
│   ├── index.js           # HTTP server entry point
│   ├── router.js          # API routes
│   ├── config.js          # Configuration
│   ├── storage.js         # Local file I/O
│   ├── security.js        # Encryption/password
│   ├── sessions.js        # Session management
│   ├── discord/           # Discord integration
│   │   ├── api.js         # Discord REST API client
│   │   ├── service.js     # Discord operations
│   │   ├── rate-limit-manager.js  # Rate-limit handling
│   │   ├── request-queue.js       # Sequential queue
│   │   └── permissions.js # Permission utilities
│   ├── ai/                # AI integration
│   │   └── gemini.js      # Gemini API client
│   └── planner/           # Plan generation & execution
│       ├── schema.js      # Action schema
│       ├── safety.js      # Safety validation
│       ├── executor.js    # Plan executor
│       └── plans.js       # Plan storage
├── public/                # Browser UI
│   ├── index.html         # Dashboard HTML
│   ├── app.js             # Frontend JavaScript
│   └── styles.css         # Dashboard styling
├── test/                  # Test files
│   ├── rate-limit.test.js # Rate-limit tests
│   ├── safety.test.js     # Safety validation tests
│   ├── security.test.js   # Encryption tests
│   └── server-smoke.test.js # Integration tests
├── docs/                  # Documentation
│   ├── DISCORD_BOT_SETUP.md
│   ├── GEMINI_SETUP.md
│   ├── TROUBLESHOOTING.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   └── API.md
├── templates/             # Prompt templates
│   └── FASNET_V2_SETUP_PROMPT.md
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── package.json           # Node.js configuration
├── LICENSE                # MIT License
├── README.md              # This file
├── CONTRIBUTING.md        # Contributing guidelines
├── CODE_OF_CONDUCT.md     # Community standards
└── CHANGELOG.md           # Version history

Runtime data (created on first run):
.local-data/
├── settings.json          # Configuration
├── secrets.enc.json       # Encrypted credentials
├── plans.json             # Plan history
├── audit.json             # Operation log
└── backups/               # Server snapshots (JSON)
```

---

## Validation

Before using on a production server, validate everything works:

```bash
# Check syntax
npm run check

# Run automated tests
npm test
```

All tests should pass.

Test against a **separate, non-production Discord server** first.

---

## Troubleshooting

See **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** for comprehensive troubleshooting.

Quick links:

- **Node.js version error?** → [Install Node.js 22+](https://nodejs.org/)
- **Port already in use?** → Change with `PORT=8788 npm start`
- **Discord 401 error?** → Check bot token in [Developer Portal](https://discord.com/developers/applications)
- **Gemini key rejected?** → Verify at [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Rate limit stuck?** → Read [Rate-Limit Handling](#rate-limit-handling) section

---

## Limitations

This application is designed with intentional constraints:

- Does not transfer server ownership
- Does not generate public invite links
- Requires categories to be empty before deletion
- Bot can only edit messages it authored
- Deleted channels cannot be perfectly restored from backups
- Backups preserve structure, not complete message history
- Not a replacement for Discord's native audit log
- Gemini availability and quotas controlled by Google
- Local single-admin tool (not multi-user SaaS)
- Requires explicit setup for each bot/server pair

---

## Contributing

We welcome contributions!

**Before you contribute, please:**

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Preserve the approval and confirmation flows
3. Add tests for new Discord operations
4. Update documentation
5. Run `npm run check && npm test`
6. Never commit credentials or test secrets

Contributions that improve safety, error handling, or documentation are especially valuable.

---

## Architecture

For a detailed architecture explanation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

High-level flow:

```
User Browser
    ↓
Node.js Local Server (127.0.0.1:8787)
    ├─→ Gemini API (structured planning)
    │
    ├─→ Local Validator (risk & permission checks)
    │
    ├─→ User Approval (required before execution)
    │
    └─→ Discord Bot (sequential operations with rate-limit handling)
        ├─→ Pre-action snapshot
        ├─→ Execute operations sequentially
        ├─→ Handle 429 rate limits automatically
        ├─→ Save audit log
        └─→ Final execution report
```

---

## Testing

Run the full test suite:

```bash
npm test
```

Tests include:

- ✓ Permission validation
- ✓ Safety rules enforcement
- ✓ Rate-limit handling (21 scenarios)
- ✓ Encryption/decryption
- ✓ Destructive confirmation
- ✓ Server integration (smoke test)

All tests use mocked Discord API - no live Discord server needed.

---

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

**Disclaimer:** This software can perform destructive Discord operations. Users are responsible for reviewing plans carefully. The authors are not liable for deleted resources, permission errors, quota usage, or service interruptions.

---

## Support

- **Read first:** [Troubleshooting](docs/TROUBLESHOOTING.md)
- **Setup help:** [DISCORD_BOT_SETUP.md](docs/DISCORD_BOT_SETUP.md) | [GEMINI_SETUP.md](docs/GEMINI_SETUP.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/fasnet-ai-discord-manager/issues)

---

## Roadmap

Potential future improvements:

- [ ] Web-based bot token and key generation
- [ ] Plan history and comparison
- [ ] Batch operation retry dashboard
- [ ] Role template library
- [ ] Channel templates for common setups
- [ ] Webhook integration for notifications
- [ ] Multi-server support (advanced mode)
- [ ] Custom action types

---

## Acknowledgments

Built with:
- **Node.js** - JavaScript runtime
- **Discord REST API** - Server management
- **Gemini API** - Natural-language planning
- Zero external runtime dependencies

---

**Ready to get started?**

1. [Setup Discord Bot](docs/DISCORD_BOT_SETUP.md) (5 min)
2. [Setup Gemini API](docs/GEMINI_SETUP.md) (2 min)
3. `npm start` and complete first-run wizard (5 min)
4. Test on a separate Discord server first!

Questions? Check [Troubleshooting](docs/TROUBLESHOOTING.md).
