# CI/CD & Deployment Pipeline Strategy

Your system relies on GitHub serving as the "Content Management System" where users submit JSON files. You need a document mapping out the automated pipeline that protects the `main` branch from bad data.

* **JSON Validation Pipeline:** A flowchart showing how GitHub Actions will use Zod to scan incoming Pull Requests for missing required fields (like `estimatedHours` or `url`).
* **Preview Environments:** How Vercel will spin up a temporary URL for every PR so maintainers can visually check the new skill tree before merging.