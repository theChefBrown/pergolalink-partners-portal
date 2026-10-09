# PergolaLink

A standalone public B2B portal demonstration: 3D product configuration, dealer orders, manager quotations, administration, and two PDF formats. English is the default language, with Romanian, Italian, Spanish, German, Hungarian and French. Dark and light themes work on desktop and mobile.

**All companies, contacts, projects, prices and commercial terms in this repository are fictional. This is a demonstration, not a production ordering service.**

## Run locally

Requires Node.js 24 and npm. No database, API key, account or environment variables are needed.

```sh
npm ci
npm run dev -- --port 3100
```

Open `http://localhost:3100`. For a production build:

```sh
npm run build
npm run start -- --port 3100
```

Use the role selector for **Dealer**, **Manager** and **Administrator**. Use **Demo dealer** to switch between five independent fictional companies. Changes and uploaded files are stored in this browser using IndexedDB. **Reset demo** restores the seed data after confirmation. Each visitor gets their own data; nothing is submitted to a company or shared with other visitors. Private browsing/storage limits can disable persistence; the application reports this and continues in memory.

## Try the workflows

- **Dealer:** choose a company, configure one or more systems, change dimensions/options, view the 3D model and technical drawing, attach files, export a production report or a customer quotation, submit an order, request changes, message staff, review/accept an offer, and manage notification read status.
- **Manager:** see orders across dealers, change production status and scheduling, request information, add internal notes, respond to requests, create/edit/revise/send quotations, and export the actual quotation line items as PDF.
- **Administrator:** add/edit/activate dealers, users and products, set dealer discounts and extra-post tariffs, manage shared documents, review activity, and use the manager/dealer views.

The role selector is intentionally open. UI role and company filters demonstrate workflows; they are **not authentication or a security boundary**. Do not enter confidential information. A real application would need a backend, authenticated authorization, server-side price validation and secure file storage.

## Synthetic Excel prices

`docs/prices/` contains **14 real .xlsx workbooks**: one for each of the 12 systems, one for LED lighting and one for extra posts. The three retractable workbooks have five mounting sheets each; the lifting-glass workbook has separate two/three-panel sheets. This gives 26 size-based price grids plus seven post tariffs.

Systems: Eira, Aeris, Liniar, Imperium, Arcodia, Majestic, Runglass, Thermoglass, Tripleglass, Wintergarden, Screen Zip and Sky Zip. Product labels identify demo configurations and do not imply a manufacturer price list or certified production specification.

The generator uses invented coefficients and this published formula:

`round((base + area_m2 * rate + (row_m + column_m) * 9) * mounting_factor, 2)`

It never reads external commercial workbooks. All prices use simulated EUR amounts, excluding simulated VAT. Extra posts and LED are priced separately; other finish, fabric, glass and motor choices are included in the fictional base tariff. The next higher dimension tier is used. Customer markup is added to the dealer's net price, followed by the independent customer discount. Both support percentage or fixed EUR amount. The customer PDF contains no markup breakdown or dealer purchase discount.

```sh
npm run generate:prices  # Recreate the fictional workbooks; replaces manual demo edits
npm run import:prices    # Import edited demo workbook values into the application
npm run check:public     # Check repository contents before sharing
npm test
npm run typecheck
npm run lint
npm run build
```

Keep workbook sheet order/dimension headers consistent with `docs/prices/catalog.json`. The importer validates positive, nondecreasing grids and stores source SHA-256/cell references. Rebuild after changing prices. No Windows-specific software or Microsoft Excel installation is required for generation or import.

## Publish your own copy

Create a GitHub repository and upload **this folder's contents**, including `package-lock.json`, `docs/prices`, `src` and `public`. Exclude `node_modules`, `.next`, generated QA artifacts and personal uploads; `.gitignore` is included. An optional GitHub Actions workflow runs tests, validation and a build. No secrets are needed.

The app is a static export, so it deploys to **GitHub Pages** with the included workflow (`.github/workflows/pages.yml`). In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**; every push to `main` then builds and publishes the site at `https://<user>.github.io/<repository-name>/`. The base path is taken from the repository name automatically, so renaming the repository needs no code change.

To preview the Pages build locally, run `NEXT_PUBLIC_BASE_PATH=/<repository-name> npm run build` and serve the `out` folder under that sub-path. Orders created in the browser get new IDs; opening one of those URLs directly works through the `404.html` fallback.

## Structure and portability

- `src/features/configurator`: reusable React/Three.js configurator, pricing, drawings, reports and translations.
- `src/components/demo`: portal workflows and browser state.
- `src/lib/mock-data`: the five fictional dealers and seeded scenarios.
- `scripts`: cross-platform synthetic workbook generator/importer and public-copy check.
- `public/configurator`: demo branding, licensed PDF font and public geographic lookup data.

Copy the project as a complete independent folder. It has no links or runtime dependencies on another project. See `THIRD_PARTY_NOTICES.md` for font/data attribution. The project is proprietary: see [LICENSE](./LICENSE). Copyright © 2026 Chef Brown. All rights reserved.

## Brand assets

PergolaLink uses a geometric pergola mark with linked frames and a warm gold wordmark accent. Transparent SVG and PNG assets for light/dark backgrounds are in `public/configurator/pergolalink-logo-*`; `src/app/icon.svg` supplies the browser icon. The SVG lettering is outlined, so no installed font is needed. Production and manager PDFs use the light logo; customer quotations keep the dealer’s own identity.

Developed by [Chef Brown](https://thechefbrown.github.io/).
