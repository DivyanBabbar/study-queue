# Study Queue

A responsive, keyboard-friendly study task queue built with HTML, CSS, and vanilla JavaScript. Tasks are saved in the current browser using versioned local storage. No account, server, package dependencies, or network connection is needed to use the app.

## Features

- Add, edit, complete, and delete tasks.
- Add notes, a priority, and an optional due date.
- Filter by all, to do, or done; search titles and notes.
- See completion progress and clear completed tasks.
- Accessible labels, keyboard focus styles, live announcements, and a responsive layout.
- Keep user text out of HTML parsing by rendering it with `textContent`.
- Versioned local storage with validation when saved tasks are loaded.

## Run locally

Open a terminal in this repository and start a static file server:

```bash
python -m http.server 4173
```

Open <http://localhost:4173>. You can also use the Live Server extension in VS Code. The app stores tasks in the browser profile for that local address. Clearing that browser's site data removes the saved queue.

## Tests

Node.js 20 or newer is needed for the dependency-free unit tests:

```bash
npm run check
npm test
```

## Data and privacy

Tasks remain in local storage in your browser. This app does not sync, encrypt, or back up data. Avoid storing sensitive information in task notes. Export and cross-device sync are possible future exercises.

## Learning notes

This project practices semantic HTML, CSS layout, DOM events, state updates, forms, browser storage, input validation, keyboard interaction, and splitting pure logic from browser code. Try bad dates, long titles, corrupted local storage, empty search results, keyboard-only use, and a narrow viewport. Add tests before changing the state rules.

## License

MIT.
