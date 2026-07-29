# Security notes

- Keep `.local-data` private and excluded from source control.
- Use a unique local password of at least eight characters; a longer passphrase is preferable.
- Revoke and regenerate the Discord token or Gemini key immediately if exposed.
- Give the bot explicit permissions rather than `Administrator`.
- Keep the bot role below human owner roles and above only roles it must manage.
- Review every permission overwrite and every high-risk action.
- Backups are structural and do not guarantee recovery of deleted messages or channels.
- The application is designed for one trusted local administrator.
