# Testing & QA Strategy

Interactive canvases (like React Flow) are notoriously difficult to test because they rely heavily on mouse events and dragging.

* **End-to-End (E2E) Testing:** Define how you will use a tool like Cypress or Playwright to simulate a user logging in, opening a tree, clicking a node, and marking it as complete.
* **Unit Testing:** Defining that helper functions (like the math used to calculate overall completion percentage) must be tested using Jest.