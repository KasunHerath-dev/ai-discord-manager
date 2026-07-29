# Contributing to FasNet AI Discord Manager

Thank you for your interest in contributing to FasNet AI Discord Manager! This guide will help you make safe, valuable contributions.

## Code of Conduct

Please review [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Before You Contribute

### No Secrets

**Never commit:**
- Discord bot tokens
- Gemini API keys
- Real Guild IDs
- Real User IDs
- Local passwords or passphrases
- Encrypted secret files
- Plans containing real server data
- Audit logs with personal information
- Screenshots containing credentials

Use `.env.example` for configuration placeholders only.

### Safety First

The application can create, update, move, and delete Discord resources. Contributions must:

1. **Preserve the approval layer** - Users must review and approve every plan before execution
2. **Preserve typed confirmation** - Destructive actions (delete) require exact phrase confirmation
3. **Preserve snapshots** - Pre-action structure snapshots are saved before execution
4. **Preserve sequential execution** - Never use `Promise.all()` for mutations
5. **Preserve rate-limit handling** - All Discord API calls must respect rate limits
6. **Never bypass safety checks** - Never weakens validation, permission checks, or hierarchy validation
7. **Never auto-assign Administrator** - This is explicitly blocked

## Testing Requirements

### Write Tests For:

- New Discord operation types
- New safety validations
- Rate-limit scenarios
- Error handling and recovery
- Encryption/decryption of secrets
- Permission verification

### Run Tests Before Submitting:

```bash
npm run check
npm test
```

All tests must pass.

### Test Destructive Operations Safely

1. Create a separate Discord test server
2. Deploy and test on that server only
3. Do not test on production servers
4. Document your testing steps in the PR

## Code Style

- Use modern JavaScript (ES2020+)
- Use `const` by default, `let` for reassignment, avoid `var`
- Use arrow functions where appropriate
- Format code with consistent indentation (2 spaces)
- Add JSDoc comments for public functions
- Keep functions focused and testable

Example:

```javascript
/**
 * Resolve a Discord role by name or ID
 * @param {string} name - Role name
 * @param {string} [id] - Role ID (optional)
 * @returns {Promise<Object>} Role object
 */
async function resolveRole(name, id) {
  const snapshot = await discord.snapshot();
  // ... implementation
}
```

## Central Discord Request Layer

All Discord API calls must go through `src/discord/api.js` via the `DiscordApi` class:

```javascript
// ✓ Correct
const api = new DiscordApi(token);
const role = await api.post(`/guilds/${guildId}/roles`, { name: "new-role" });

// ✗ Incorrect
const res = await fetch(`https://discord.com/api/v10/...`);
```

This ensures:
- Rate-limit handling is consistent
- Retries work automatically
- All requests are logged
- Errors are standardized

## Documentation Updates

When you add a feature or fix a bug:

1. **Update README.md** if it affects user-facing behavior
2. **Update docs/** if it affects architecture or operations
3. **Update .env.example** if new environment variables are added
4. **Update CHANGELOG.md** with a description in the `[Unreleased]` section

Example CHANGELOG entry:

```markdown
## [Unreleased]

### Added
- Support for creating text channels with custom topics

### Fixed
- Rate limit handling now respects global rate limits correctly

### Changed
- Increased default request delay to 1500ms for stability
```

## Commit Messages

Use clear, descriptive commit messages:

```
Add rate-limit retry support for HTTP 500 errors

- Implement exponential backoff with jitter
- Retry up to 8 times for temporary server errors
- Add logging for retry attempts
- Add tests for backoff calculation
```

Bad:

```
fix stuff
update code
```

## Pull Request Process

1. **Fork** the repository
2. **Create a feature branch** from `main`: `git checkout -b feature/your-feature`
3. **Make your changes** with meaningful commits
4. **Add tests** for new functionality
5. **Run checks** and tests: `npm run check && npm test`
6. **Update documentation** if needed
7. **Push to your fork**
8. **Create a Pull Request** with a clear description

## Reporting Security Issues

**Do not open a public issue for security vulnerabilities.**

Instead, email the maintainer directly with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

## Reporting Bugs

1. Check existing issues to avoid duplicates
2. Provide:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Node.js version
   - Operating system
   - Relevant logs (redact any credentials)

Example:

```
## Bug: Plans fail after 4 operations

### Steps to Reproduce
1. Create a plan with 30 operations
2. Approve the plan
3. Wait for execution

### Actual Behavior
Execution stops after 4 operations with HTTP 429 error.

### Expected Behavior
Execution should wait and retry, completing all operations.

### Environment
- Node.js v22.0.0
- Ubuntu 22.04
- FasNet AI Discord Manager v1.0.0
```

## Feature Requests

1. Check existing issues and discussions
2. Describe the use case
3. Explain why it's valuable
4. Suggest an implementation approach if possible

Remember: contributions that add safety, improve error handling, or fix bugs are always welcome. Features that bypass safety layers will not be accepted.

## Questions?

- Check [docs/](docs/) for architecture details
- Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues
- Open a discussion in GitHub Issues

Thank you for helping make Discord server management safer and easier!
