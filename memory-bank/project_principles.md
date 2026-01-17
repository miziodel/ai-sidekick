# Project Principles

## 1. Test Driven Development (TDD)

- **Test First**: Always write automated tests _before_ writing the implementation code.
- **Red-Green-Refactor**:
  1. Write a failing test (Red).
  2. Write the minimal code to pass the test (Green).
  3. Refactor the code while keeping tests passing.
- **Automated Verification**: Run tests frequently using `node tests/run_tests.js`.
- **Coverage**: Ensure critical logic, especially in `lib/`, is covered by unit tests.

## 2. Don't Repeat Yourself (DRY)

- **Abstraction**: Extract common logic into helper functions or classes (e.g., `ActionManager`, `Logic`).
- **Single Source of Truth**: Avoid duplicating state or configuration across multiple files.
- **Modularity**: Keep components focused and reusable.

## 3. Environment

- **Node.js**: Use `nvm` to manage Node versions.
- **Testing**: Tests must be runnable via `node tests/run_tests.js`.
