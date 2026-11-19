# masrifprototype

Interactive web prototype of the Masrif app (powered by Atlas from Bank Muamalat). No real money moves.

Built with React and Vite. It has two views, switched from the settings icon at the top right:

- **Prototype**: the clickable app inside a phone frame.
- **All screens**: every screen laid out by flow. Select one to open it live.

## Run it

```bash
npm install
npm run dev       # local development
npm run build     # production build into dist/
npm run screens   # rebuild and regenerate the "All screens" thumbnails
```

Run `npm run screens` after changing how any screen looks, then commit `public/screens`.
The list of screens is in `src/screens.js`.

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages). Deploy the `dist` folder from `npm run build`.
It must be served from the site root, because assets use `/masrif/...` paths.
