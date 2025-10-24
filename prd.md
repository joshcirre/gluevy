PRD: Gluevy — Customizable Live Streaming Studio
1. Overview

Gluevy is a modern live streaming studio that combines the simplicity of StreamYard with the customizability of OBS. It gives creators one-click guest invites, an easy-to-use Studio UI, and a server-hosted canvas that pushes a polished program feed to multiple streaming destinations.

Guests join with a link (no installs).

Hosts edit layouts, overlays, and control the show.

LiveKit handles real-time video/audio routing and egress.

Laravel + Inertia (React) powers the control plane and UI.

Tauri wraps the Studio for desktop distribution.

2. Goals

Customizable but simple: creators get control without complexity.

One link guest flow: frictionless entry for participants.

Server-hosted canvas: no OBS dependency; runs even if host disconnects.

Multistream out of the box: YouTube, Twitch, Facebook, custom RTMP.

Laravel-first: leverage Inertia/React for reactive Studio UI, Laravel for auth, rooms, egress orchestration.

Scalable architecture: clean seams so future microservices (in Go/Rust) can slot in.

3. Core Features
Guests

Join via secure invite link (gluevy.com/join/{room}/{token}).

Browser-based device picker (cam/mic).

Controls: mute/unmute, leave.

Host Studio

Access Studio at gluevy.com/studio/{room} (auth required).

Preview all participants.

Layouts: Solo, 2-Up, Grid (3–4).

Overlays: logo bug, lower-thirds (text input).

Per-participant controls: mute, solo, spotlight.

Stream controls:

Start/Stop Stream (multistream to selected destinations).

Start/Stop Recording (program MP4).

Destinations

Add/edit RTMP destinations (YouTube, Twitch, Facebook, Custom).

Encrypted storage of stream keys.

Toggle destinations before “Go Live.”

4. Architecture

Media Plane (LiveKit Cloud initially):

WebRTC SFU for rooms.

Egress API for:

Room Composite (quick layouts).

Web Egress (custom Gluevy Studio layouts).

Control Plane (Laravel + Inertia/React):

Auth, rooms, participants, scenes, overlays.

API routes to call LiveKit (token creation, start/stop egress).

Inertia+React for real-time Studio UI.

Desktop (Tauri):

Wraps Studio UI in native desktop app.

Future: add hotkeys, local GPU encode, ISO capture helpers.

5. Data Model (Laravel)

rooms

id

name

slug

status (active/ended)

participants

id

room_id

name

role (host/guest)

destinations

id

room_id

type (youtube, twitch, rtmp)

config (encrypted JSON: url/key)

recordings

id

room_id

type (program)

file_url

started_at / ended_at

scenes

id

room_id

layout (solo, 2up, grid)

overlays (JSON: logo, lower-third text)

6. API Endpoints

POST /api/rooms → create room + LiveKit room.

POST /api/rooms/{id}/token → issue access token.

GET /studio/{id} → Inertia Studio page.

POST /api/destinations → add RTMP config.

POST /api/egress/start → start LiveKit egress (RTMP + MP4).

POST /api/egress/stop → stop streaming.

POST /api/recordings/start → start recording.

POST /api/recordings/stop → stop recording.

7. UI Sketch (Studio)

Left panel: participant thumbnails, drag to assign slots.

Main canvas preview: live layout (Solo/2-Up/Grid).

Bottom toolbar: layout selector, overlay editor, mute/solo toggles.

Right panel: streaming controls, destinations toggle, record button.

8. Implementation Phases

Phase 1 (Weekend MVP):

Guest join page with tokens.

Studio page: participant list, Solo layout.

Laravel API: start/stop LiveKit Room Composite Egress → YouTube RTMP.

Record MP4.

Phase 2:

Add 2-Up/Grid layouts.

Add overlays (logo, lower-third).

Multi-destination RTMP toggles.

Phase 3:

Recording library (list/play downloads).

Scene persistence.

Overlay editor.

9. Tech Stack

Backend: Laravel 11, MySQL/Postgres, Redis (queues).

Frontend: Inertia.js + React, Tailwind, shadcn/ui.

Desktop: Tauri wrapper.

Media: LiveKit Cloud (MVP), option to self-host later.

Storage: Local disk/S3 for recordings.

10. Tagline

Gluevy — Where Streams Come Together.
