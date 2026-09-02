# 🦒 GiraffyReach — upgraded

Direct-to-source job engine: real-time discovery, ATS résumé tailoring, recruiter backchannel outreach, C2C/contract detection, interview prep, and a pipeline tracker — in one product.

## Connect your own engine
The app ships working on public sample feeds (Greenhouse · Ashby · Remotive). To use your real GiraffyReach backend, open **Profile → Data source** and paste your API endpoint URL (and optional key). It is stored **only in your browser** and never transmitted anywhere else. If your API's field names differ, edit `adaptGiraffy()` in `index.html`.

## Run locally
```bash
python -m http.server 8765
# open http://localhost:8765/
```
Serve over http:// (not file://) so the browser can call the job APIs (CORS).
