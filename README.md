# skeb-pro-prototype

Interactive web prototype of the SKEB-Pro app (powered by Atlas from Bank Muamalat). No real money moves.

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

## Profile, privacy and store submission

The web prototype provides these public routes without sign-in.

| Route | Prototype behavior |
| --- | --- |
| `/privacy` | Describes browser storage, optional permissions, external content requests and privacy choices. |
| `/account-deletion` | Confirms and clears SKEB-Pro demo data for the current browser profile and tab. It also provides the published ATLAS contact options for real accounts. |
| `/support` | Provides ATLAS customer care contact options. |

The in-app route is **Profile ? App settings ? Delete account**. It checks the current demo PIN before opening the final confirmation. **Reset demo account** remains available under Demo controls for starting over with sample data.

### Before submitting a live banking build

- Connect in-app and external deletion to a bank-approved service that verifies identity, accepts deletion requests, removes eligible records and explains retention and processing timelines. Confirm how a linked ATLAS account is handled.
- Publish the approved SKEB-Pro privacy policy and live support and deletion URLs. Review notices and native permissions against the release build's actual data collection, sharing, retention and consent practices. Replace the prototype routes in listings when the live pages are ready.
- Replace simulated PIN, Face ID, recovery and device removal with production authentication, secure storage and session revocation.
- Complete Apple App Privacy and Google Play Data safety and Financial features declarations in the applicable publisher accounts. Provide working review access and instructions. Check the final iOS build for required-reason APIs and applicable SDK manifests. Confirm the login-services requirement if any third-party login is added.
