# Changelog

All notable changes to FasNet AI Discord Manager are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Production-quality Discord API rate-limit handling
- Automatic retry on HTTP 429 with `retry_after` parsing
- Exponential backoff for temporary server errors (500, 502, 503, 504)
- Global rate-limit detection and queue pause/resume
- Granular operation state tracking (pending, running, waiting_rate_limit, completed, failed, skipped)
- Execution statistics (total, completed, failed, skipped, retried)
- Prevention of re-executing completed operations after restart
- Enhanced execution logging with operation timestamps
- Comprehensive rate-limit documentation in README
- Rate-limit configuration via environment variables
- 21 automated tests for rate-limit scenarios
- Request queue infrastructure for sequential mutation processing

### Changed
- Enhanced executor to track operation state and retry information
- Improved Discord API error categorization (permanent vs temporary)
- Enhanced audit logging with operation state details

### Fixed
- Application no longer stops after 4 operations due to rate limiting

## [1.0.0] - 2026-07-29

Initial public release of FasNet AI Discord Manager.

### Added
- Browser-based first-run setup wizard
- Local password-protected dashboard
- Gemini API integration for natural-language planning
- Discord REST API integration
- AES-256-GCM encrypted local credential storage
- Live Discord server inspection
- Structured AI plan generation
- Independent local validation and risk classification
- Exact typed confirmation for destructive operations
- Pre-action Discord structure snapshots
- Sequential Discord operation execution
- Local audit log and plan history
- Support for 17+ Discord operations (roles, channels, permissions, messages)
- Zero external runtime dependencies
- Node.js built-in test framework
- Safe mode, managed mode, and full mode for different risk levels

### Security
- All credentials encrypted at rest using AES-256-GCM
- Credentials managed only through the setup wizard
- Gemini API never receives Discord credentials
- All Discord operations require plan review and approval
- Destructive actions require exact phrase confirmation
- Pre-action snapshots prevent accidental data loss
- Role hierarchy validation prevents privilege escalation
- Owner and managed bot role protection

### Documentation
- Comprehensive README with quick start
- Security guidelines and threat model
- Architecture documentation
- API reference
- Discord bot setup guide
- Gemini API setup guide
- Troubleshooting guide
- Contributing guidelines
