# Verification

The public demo was built and checked independently on 8 October 2026.

- 34 automated tests: product geometry, limits, translations, geography, workflow transitions, synthetic workbook contents, all model/mount price variants, posts, LED, dealer discounts and customer quotation calculations.
- Independent ZIP/XML parsing of all 14 Excel workbooks; 26 price grids and seven post tariffs.
- Browser checks: five dealer scopes, three roles, manager quotation creation/revision/export, dealer acceptance, internal-note filtering, admin user and tariff edits, browser persistence after reload, uploaded-file downloads after reload, notification/order views, all seven languages, mobile layouts, dark/light themes, demo reset and isolated visitor data.
- Generated production and customer PDFs with 3D illustrations and synthetic prices; manager PDF exports its actual edited line items.
- Public-source scan for workstation paths, environment files and private keys; no copied commercial workbooks.
- The original project's 261 tracked source, asset, documentation, test and artifact files were fingerprinted before copying and found unchanged after implementation. The demo has independent source, package lock and installed dependencies.

Role controls are intentionally available to every demo visitor. Tests validate the demonstration workflows, not a production authentication system. Browser data remains local and is excluded from the shareable archive.
