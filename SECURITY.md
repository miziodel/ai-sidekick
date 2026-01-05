# Security Policy

## Reporting a Vulnerability

We take the security of AI Sidekick very seriously. If you have discovered a security vulnerability, please **DO NOT** open a public issue.

Instead, please report it privately by contacting the maintainer directly:
**Maurizio Delmonte** (miziodel)

We will review your report and respond as soon as possible.

## Security Features

AI Sidekick is designed with security in mind:
- **Client-Side Storage**: API keys are stored in `chrome.storage.local` (unencrypted) or `chrome.storage.sync` (encrypted with AES-GCM + PBKDF2).
- **No Analytics**: We do not track user activity or collect personal data.
- **Content Security Policy (CSP)**: We strictly adhere to Manifest V3 CSP. We vendored `marked.js` to avoid remote code execution risks.
