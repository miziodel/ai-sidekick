# Contributing to AI Sidekick

Thank you for your interest in contributing to AI Sidekick! We welcome contributions from everyone and are grateful for your effort to make this extension better.

We want to make contributing as easy and transparent as possible.

## 🤝 Code of Conduct

Please be respectful and kind to others. We are a community of developers helping each other. Harassment or abusive behavior will not be tolerated.

## 🐛 Reporting Bugs

If you find a bug, please create a new issue. Be sure to include:
- A clear description of the issue.
- Steps to reproduce.
- Your browser and OS version.
- Any error messages in the console.

**Security Vulnerabilities**: If you discover a security vulnerability, please do NOT open a public issue. See [SECURITY.md](SECURITY.md) for reporting instructions.

## 🛠 How to Contribute

1.  **Fork the repository** to your own GitHub account.
2.  **Clone** your fork to your local machine:
    ```bash
    git clone https://github.com/YOUR_USERNAME/ai-sidekick.git
    ```
3.  **Create a branch** for your feature or bugfix:
    ```bash
    git checkout -b feature/amazing-new-feature
    ```
4.  **Make your changes**. Please follow the existing coding style (Standard JS, pure functions where possible).
5.  **Test your changes**. Run the existing tests:
    ```bash
    node tests/run_tests.js
    ```
6.  **Commit** your changes with a descriptive message.
7.  **Push** to your fork:
    ```bash
    git push origin feature/amazing-new-feature
    ```
8.  **Open a Pull Request**. Describe what you did and why.

## 📝 Coding Standards

- **Pure Logic**: Isolate core logic in `lib/` as pure functions to keep it testable.
- **No Build Step**: We use standard ES Modules. Avoid adding compile steps (Webpack, etc.) unless absolutely necessary.
- **Privacy First**: Always respect user privacy. Do not introduce analytics or data collection.

Thank you for contributing! 🚀
