# ComplianceHub

**Status: retired as a web/API service.**

This repository is a historical codebase and a technology donor for a future **local** e-invoice validation engine. It is not a production SaaS, not a hosted validator, and not a current checkout product.

## What is retired

- The public web UI on [vida.bauklar.com](https://vida.bauklar.com) no longer accepts uploads.
- The Worker API (`compliancehub-api`) answers `/health` with `retired` and returns `410 service_retired` on product routes.
- Monthly API plans, API keys, and the former Stripe Payment Link are not a live product offering from this repo.

Do not use this tree as an EN 16931 / XRechnung / Peppol conformity engine. The shipped rules were heuristic. Official Schematron/XSD artefacts are not in this product.

## Role of this repo

| Role | Meaning |
| --- | --- |
| Historical codebase | Source and deploy history of the former ViDA UBL web validator |
| Technology donor | Engine work may be reused later inside a local product |
| Future local engine | Planned; not implemented as a working hosted validator here |

`002` contract repair and `005` Worker retirement are containment checkpoints. They are not a relaunch of a working public validator.

## Related products

- [DIN 5008 Studio](https://din5008.bauklar.com) is a separate product and is not this service.
- BauKlar OS marketing: [bauklar.com](https://bauklar.com)

## License

MIT License — see [LICENSE](LICENSE).
