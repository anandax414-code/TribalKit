# Setup Guide

## Quick Start

### 1. Fork the Template

Click **"Use this template"** on the GitHub repository page. Name your repository (e.g., `our-nation-ar`).

### 2. Configure Your Nation

Edit `layers/manifest.json`:

```json
{
  "sovereignty": {
    "nation": "Your Tribal Nation Name",
    "governing_body": "Tribal Council",
    "contact": "sovereignty@your-nation.gov",
    "jurisdiction": "Description of your territorial jurisdiction",
    "treaty_reference": "Relevant treaty or legal reference"
  }
}
```

### 3. Add Your Layers

Each layer is a GeoJSON file in the `layers/` directory. Register it in the manifest:

```json
{
  "id": "your-layer-id",
  "name": "Display Name",
  "description": "What this layer contains",
  "protocol": "public",
  "file": "your-layer.geojson",
  "no_ai_training": true,
  "color": "#4A90D9"
}
```

### 4. Create GeoJSON Files

Each file follows standard GeoJSON with protocol metadata:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "layer_id": "your-layer-id",
    "protocol": "public",
    "no_ai_training": true
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name_indigenous": "Name in your language",
        "name_colonial": "Common English name",
        "meaning": "Translation or cultural meaning",
        "description": "Full description",
        "protocol": "public"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-longitude, latitude]
      }
    }
  ]
}
```

**Note:** GeoJSON coordinates are `[longitude, latitude]` (the reverse of what most people expect).

### 5. Enable GitHub Pages

1. Go to your repository **Settings → Pages**
2. Under **Source**, select **Deploy from a branch**
3. Choose **main** branch, **/ (root)** folder
4. Click **Save**

Your site will be live at `https://your-org.github.io/your-repo/`

## Protocol Configuration

### Making a Layer Restricted

Set `protocol: "restricted"` and add an acknowledgment text:

```json
{
  "protocol": "restricted",
  "requires_acknowledgment": true,
  "acknowledgment_text": "I acknowledge that this information is shared under the authority of [Your Nation] and agree not to reproduce or extract it."
}
```

Users must accept this acknowledgment before the layer data loads.

### Making a Sacred Warning Zone

Set `protocol: "sacred"` with `file: null`:

```json
{
  "protocol": "sacred",
  "file": null,
  "warning_only": true,
  "warning_text": "You are near a site of deep cultural significance. Please be respectful."
}
```

**No data file exists.** The AR viewer shows only the warning message when users approach the area. No coordinates, descriptions, or details are published.

### Seasonal Availability

```json
{
  "protocol": "seasonal",
  "seasonal": true,
  "season_available": {
    "start": "03-21",
    "end": "06-21"
  }
}
```

## Updating robots.txt

The included `robots.txt` blocks 20+ known AI training crawlers. As new crawlers appear, add them:

```
User-agent: NewAICrawlerBot
Disallow: /
```

## Customization

### Changing Colors

Edit `style.css` root variables to match your nation's visual identity:

```css
:root {
  --color-accent: #4A90D9;    /* Primary accent */
  --color-public: #4A90D9;     /* Public layer markers */
  --color-restricted: #d4a017; /* Restricted layer markers */
  --color-sacred: #8b2500;     /* Sacred warning zones */
}
```

### Adding Audio Narratives

Include audio files in an `assets/audio/` directory and reference them in GeoJSON:

```json
{
  "properties": {
    "media_type": "audio",
    "audio_url": "assets/audio/story-name.mp3"
  }
}
```

## Security Notes

- **Private repos with public Pages:** You can make the repository private while keeping GitHub Pages public. This hides the source code and Git history while still serving the AR viewer.
- **Branch protection:** Enable branch protection on `main` to require reviews before content changes go live.
- **No analytics:** The template includes no tracking, analytics, or cookies. Add them only if your governance framework approves.

## Support

This template is open-source infrastructure. For technical questions, open an issue on the source repository. For sovereignty and governance questions, consult with your tribal legal counsel and Cultural Committee.
