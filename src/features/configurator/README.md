# Reusable demo configurator

This folder is a portable React 19 + TypeScript component. It needs Three.js, pdf-lib and @pdf-lib/fontkit, plus `public/configurator` assets. It does not depend on the portal router or a backend.

Mount `OrderConfigurator` with `locale`, `dealer`, `discountPercent`, `onExit` and `onComplete`. Completed results include the configuration, browser Files, 3D snapshots, the production PDF, the price snapshot and optional customer-quotation settings/logo. The host owns persistence.

All tariffs shipped here are synthetic. Generate/import with the root npm scripts. Every system has a demo price, including sliding glass and Wintergarden. The pricing engine checks dimension limits and positive monotonic grids. The customer quotation calculator keeps markup and the dealer discount out of the public PDF DTO.

Scenes are loaded lazily. Browser requirements: WebGL2, canvas, createImageBitmap, native dialogs and BigInt. Styles use the `ac-*` and `customer-*` namespaces. Fonts and geography attribution are recorded in the root third-party notices. Use these models as visual demonstrations, not certified production geometry.
