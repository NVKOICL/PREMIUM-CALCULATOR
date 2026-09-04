# OICL Premium Calculator

Single-file, offline premium calculator for Oriental Insurance lines of business:
Motor (all classes), Health (OSSS, YEC, Mediclaim, Group, HFFP), Fire (Sookshma, Laghu, SFSP),
Employees' Compensation (WC) and Engineering (CAR / EAR).

Everything lives in `index.html` - rate tables, rating engines, the shared quotation PDF engine
(jsPDF inlined), embedded fonts and artwork - so it runs from a phone or laptop with no server
and no internet connection. Open the file in a browser, or install it to the home screen.

## Features
- Quotation PDFs in one house design for every product, with benefit / cover schedules appended
  (Health benefit schedules, Motor add-on scope and conditions, Fire scope of cover).
- WhatsApp share of the PDF, saved quotes, draft auto-save, agent details panel.
- Referral and authority flags per product circular, discount-cap grids, self-test.

## Verification
Click the build stamp at the bottom-right of the page to run the built-in self-test:
700 golden regression cases plus document-verified checks drawn from circulars and
office computation sheets. A green result means nothing has moved since the last baseline.

## Working on the code
- Each product is a `.product-section`; module CSS is scoped under its section id and module
  JavaScript lives in an IIFE that publishes only the handlers the markup calls.
- Add new document-verified checks next to the module's `VERIFIED` list whenever a rate is
  confirmed against a circular or an office computation sheet.
- Internal circulars and pre-merge backups are intentionally not committed (see `.gitignore`).

App design and build by NeelamVinod Krishna.

Health products: OSSS, Youth Eco Care, Oriental Mediclaim (Individual), Mediclaim (Group), Happy Family Floater, Overseas Mediclaim, Super Health Top-Up. Health, Motor, Fire and CAR/EAR quote PDFs append customer-facing cover schedules summarised from the product prospectuses and endorsement wordings.
