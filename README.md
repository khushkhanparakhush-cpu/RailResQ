<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# RailResQ — Fix It Before It Breaks

Metro Hacks PS-02: Predictive Metro Asset Maintenance & Night-Shift Operations Dashboard.

## Overview

RailResQ bridges the gap between historical fault registers and night-shift preventive maintenance execution:
1. **Historical Fault Logs**: Deterministic logging of defect codes, timestamps, and severities for Ticket Gates, Ticket Vending Machines, Lifts, and Escalators.
2. **Next-7-Day Asset Risk Ranking**: Reproducible 0–100 heuristic scoring based on 30-day fault frequency (35%), repeated failure modes (25%), 14-day velocity acceleration (20%), and overdue maintenance cycles (20%).
3. **Prioritized Night-Shift Roster**: Automated generation of technician task assignments for the 00:30–04:30 track access window with team skillset constraints and travel buffers.
4. **Technician Task Execution**: Step-by-step checklist sign-off and preventive maintenance recording.

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   `npm install`
2. Run the development server:
   `npm run dev`
3. Build for production:
   `npm run build`
