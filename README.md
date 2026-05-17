# Resources

A clean, local-first web application for curating links and articles.

## How It Works

**Local Management (Adding/Editing)**
You must run the local server to add, edit, or delete items. The Python server handles saving your changes directly to `resources.json`.
```bash
python server.py
# Open http://localhost:8000 in your browser
```

**Live Deployment (Read-Only)**
The site is built entirely with static files (HTML/CSS/JS). When deployed (e.g., to GitHub Pages), it functions as a public, read-only list. The `server.py` backend is ignored by static hosts, naturally protecting your data from being modified on the live site.

**URL:** 🌐 https://este6an13.github.io/resources/
