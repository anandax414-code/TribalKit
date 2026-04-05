# Data Sovereignty Governance Framework

## Purpose

This repository implements **tribal digital sovereignty** at the infrastructure level. Every file, every coordinate, every narrative published through this system is subject to the governing authority of the tribal nation that owns this repository.

This is not a platform. It is a template. The tribe that forks it owns every aspect of what gets published, how it's classified, and when it's revoked.

## Principles

This framework aligns with the **CARE Principles for Indigenous Data Governance** ([Global Indigenous Data Alliance](https://www.gida-global.org/care)):

- **Collective Benefit** — AR layers serve community education, cultural preservation, and land stewardship, not commercial extraction
- **Authority to Control** — The repository owner (tribal governing body) has complete authority over all content, classifications, and access rules
- **Responsibility** — Protocol tiers ensure sensitive knowledge is shared responsibly, with sacred content never exposed
- **Ethics** — No-AI-training stance is enforced at every technical layer; consent is ongoing and revocable

## Protocol Tiers

### Public
Content approved for open sharing. Place names, general history, educational ecological information. Viewable by anyone who accesses the AR viewer. Attribution to the tribal nation is always required. AI training is always prohibited.

### Restricted
Cultural sites and sensitive knowledge. Visitors must acknowledge tribal protocols before viewing. GPS precision is reduced to ~500 meters to prevent exact location mapping. Content is not cached and cannot be extracted.

### Sacred
**No content is ever published at this tier.** The manifest contains only a warning message and an approximate warning radius (~1 kilometer). When visitors approach a sacred zone, they receive a respectful notice. No coordinates, descriptions, or cultural details are disclosed. There is literally no data file for a crawler to extract.

### Seasonal
Content governed by the cultural calendar. Available only during seasons specified by the Cultural Committee. Requires acknowledgment. Can be revoked at any time by removing the date window from the manifest.

## AI Decoupling

### Technical Enforcement

1. **robots.txt** — Blocks 20+ known AI training crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended, Meta-ExternalAgent, Bytespider, etc.)
2. **HTML Meta Tags** — `noai`, `noimageai`, `data-sovereignty: tribal` signals in page headers
3. **Protocol Metadata** — Every GeoJSON feature carries `no_ai_training: true` in its properties
4. **No Raw Sacred Data** — Sacred-tier content has no GeoJSON file; warning text is hard-coded in the manifest
5. **Client-Side Only** — No server-side API means no endpoint for bots to query
6. **Revocable** — Delete a file, push to GitHub, content is gone from the live site

### Limitations

Robots.txt and meta tags are advisory — they rely on crawlers respecting the signals. However:

- The static-file architecture means there are no API endpoints to scrape
- Sacred content literally does not exist as downloadable data
- The GitHub repository can be made private (with GitHub Pages still serving the viewer)
- Content can be revoked instantly by removing files and pushing

## Revocation

To revoke any content:

1. Delete the GeoJSON file from `layers/`
2. Remove the layer entry from `layers/manifest.json`
3. `git push`

GitHub Pages updates within minutes. There is no cached API, no CDN to purge, no third-party database retaining the data. Git history provides a complete audit trail of what was published and when.

## Authority

The governing body listed in `layers/manifest.json` under `sovereignty.governing_body` has sole authority to:

- Add, modify, or remove any layer
- Change protocol classifications
- Grant or revoke access to restricted content
- Define seasonal availability windows
- Determine what constitutes appropriate use

This authority is **not delegated** to any platform, developer, or automated system.

## References

- [CARE Principles for Indigenous Data Governance](https://www.gida-global.org/care)
- [Tribal Digital Sovereignty — Brookings Institution (2026)](https://www.brookings.edu/articles/avoiding-the-next-digital-divide-defining-digital-sovereignty-for-tribal-nations-in-the-ai-age/)
- [Center for Tribal Digital Sovereignty — ASU / NCAI](https://www.fordfoundation.org/news-and-stories/stories/tribal-digital-sovereignty-how-native-communities-are-powering-their-own-tech-future/)
- [Tribes and AI: Possibilities for Tribal Sovereignty — Duke Law (2024)](https://scholarship.law.duke.edu/dltr/vol25/iss1/1/)
