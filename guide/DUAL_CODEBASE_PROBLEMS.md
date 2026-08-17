# Dual Codebase Architecture — Problem Analysis & Documentation

> **Project:** 7Hive  
> **Setup:** Frontend A + Backend A (primary) · Frontend B + Backend B (at `/beta`)  
> **Deployed at:** Single URL, single Nginx, single Docker Compose

---

## 1. Current Architecture

```
USER BROWSER
     │
     ▼
[ yourdomain.com ] ── HTTPS ──► [ Nginx (EC2) ]
                                      │
                       ┌──────────────┼──────────────┐
                       │              │               │
                   /api/*         /uploads/        / and all others
                       │              │               │
                       ▼              ▼               ▼
                  [ Backend A ]  [ Backend A ]  [ Frontend A ]
                   FastAPI :8000   /uploads/     Angular SPA
                   (only one)      volume         index.html
```

### What `/beta` would require:

```
USER BROWSER
     │
     ▼
[ yourdomain.com ] ── HTTPS ──► [ Nginx ]
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                  │
                  /beta/*           /api/*            / (root)
                    │                 │                  │
              ┌─────┴──────┐         │                  │
         /beta/api/*   /beta (SPA)    │                  │
              │              │        │                  │
         [ Backend B ]  [ Frontend B ] [ Backend A ] [ Frontend A ]
          separate DB?   separate      FastAPI A       Angular A
                          index.html
```

**Problem:** This requires TWO completely separate runtime environments that have NO awareness of each other.

---

## 2. Problem Diagrams

### 2.1 — Runtime Isolation (Core Problem)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser Tab — User visits yourdomain.com                           │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Frontend A JavaScript Runtime (loaded from /)                 │ │
│  │                                                                │ │
│  │  ✔ Angular app bootstrapped                                    │ │
│  │  ✔ Auth token in memory / localStorage (Frontend A)           │ │
│  │  ✔ Notification service running                                │ │
│  │  ✔ User state, router, HTTP interceptors active               │ │
│  │                                                                │ │
│  │  ✘ Frontend B code = NOT LOADED, NOT RUNNING, DOES NOT EXIST  │ │
│  │  ✘ Frontend B notifications = invisible                        │ │
│  │  ✘ Frontend B auth state = invisible                           │ │
│  │  ✘ Frontend B components = inaccessible                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  /beta route is a STRING in the URL — it does NOT load Frontend B   │
│  Frontend B only loads if the user NAVIGATES to /beta (full reload) │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 — Auth Flow Problem (Two Separate Login Systems)

```
USER
 │
 ├──► visits yourdomain.com ──► Frontend A loads ──► Login Page A
 │                                                         │
 │                                              JWT Token A stored
 │                                              in Frontend A memory
 │
 ├──► navigates to yourdomain.com/beta ──► FULL PAGE RELOAD
 │                                              │
 │                                         Frontend B loads (fresh)
 │                                              │
 │                                         Token A = GONE from JS memory
 │                                              │
 │                                         ┌────┴───────────────────────┐
 │                                         │ Even if Token A is valid   │
 │                                         │ for Backend B — Frontend B │
 │                                         │ has NO knowledge of it     │
 │                                         │ → User must LOGIN AGAIN    │
 │                                         └────────────────────────────┘
 │
 └──► goes back to yourdomain.com ──► FULL PAGE RELOAD again
                                           │
                                      Frontend A loads fresh
                                      Token B = GONE
                                      → Login again (if not in localStorage)
```

**Even with shared token validity:** The token is only "shared" if manually persisted in `localStorage`/cookie with the **exact same key name** in both frontends. Each frontend's auth interceptor, auth guard, and user session are completely independent.

---

### 2.3 — Local Development — Impossibility Diagram

```
DEVELOPER MACHINE — Local Dev

What you want:
┌─────────────────┐    ┌─────────────────┐
│  Frontend A     │    │  Frontend B     │
│  ng serve :4200 │    │  ng serve :4201 │
│  → hits /api    │    │  → hits /beta/api│
└────────┬────────┘    └────────┬────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Backend A      │    │  Backend B      │
│  uvicorn :8000  │    │  uvicorn :8001  │
└─────────────────┘    └─────────────────┘
         │                      │
         ▼                      ▼
   ┌───────────┐         ┌───────────┐
   │  DB A     │         │  DB B     │
   │ postgres  │         │ postgres  │
   └───────────┘         └───────────┘

ACTUAL REALITY — You have ONE docker-compose.yml:

services:
  db:       ← ONE database
  backend:  ← ONE backend (Backend A only)
  frontend: ← ONE frontend (Frontend A only)

Problems:
  ✘ Backend B has no local run config
  ✘ No /beta/api proxy rule in local nginx.conf
  ✘ No docker-compose service for Backend B
  ✘ Frontend B has no ng serve target
  ✘ You cannot test /beta locally at all
  ✘ Any feature in Backend B cannot be tested without production deployment
  ✘ CI/CD pipeline (GitHub Actions) only knows about one codebase
```

---

### 2.4 — Feature Cross-Contamination Impossibility

```
SCENARIO: Notification created in Frontend B needs to appear in Frontend A

Frontend B (user on /beta)
     │
     │  creates notification via Backend B API
     ▼
  Backend B
     │
     │  saves to Backend B database
     ▼
  DB B (or same DB, different table/schema)

                        Frontend A (user on /)
                               │
                               │  polls Backend A for notifications
                               ▼
                           Backend A
                               │
                               │  reads from Backend A database
                               ▼
                            DB A ← notification from B NEVER arrives here
                                   (different backend, different queries)

Result: The notification is LOST across the boundary.
```

**Other features with the same problem:**
- Shopping cart / session state
- User profile updates
- Real-time chat or WebSocket connections
- Upload files (separate `/uploads/` volumes)
- Admin dashboard data
- Any feature touching shared data

---

### 2.5 — File Upload / Storage Isolation

```
docker-compose.prod.yml defines ONE volume:

  volumes:
    uploads-data: ← mounted to Backend A only

Backend A: /app/uploads/file-from-A.jpg  ✔ accessible at /uploads/file-from-A.jpg
Backend B: /app/uploads/file-from-B.jpg  ✘ NOT accessible — separate process, separate volume
                                             URL would 404 when Frontend A tries to display it
```

---

### 2.6 — Deployment & CI/CD Complexity

```
CURRENT (Frontend A + Backend A):

GitHub Push ──► GitHub Actions ──► Build ──► Docker Hub ──► EC2 ──► docker-compose up

1 pipeline · 1 Dockerfile · 1 docker-compose · 1 nginx.conf

WITH DUAL CODEBASE:

GitHub Push (repo A) ──► Pipeline A ──► Image A ──► EC2 ──► compose up (service A only?)
GitHub Push (repo B) ──► Pipeline B ──► Image B ──► EC2 ──► compose up (service B only?)

Problems:
  ✘ Two pipelines that can conflict on same EC2
  ✘ nginx.conf must route /beta/** differently — who manages it?
  ✘ docker-compose now has 6 services (db, backend-a, frontend-a, backend-b, frontend-b, nginx)
  ✘ Rolling deploy of A cannot know state of B
  ✘ DB migrations from A and B could conflict if sharing same Postgres
  ✘ Two separate SECRET sets in GitHub Secrets
  ✘ Health check endpoints need to cover both stacks
```

---

## 3. Full Disadvantage List

### 3.1 Runtime

| Issue | Impact |
|---|---|
| Frontend B JS never loads on `/` | Critical — no shared UI possible |
| Full page reload required to switch A ↔ B | Poor UX, loses all in-memory state |
| No shared Angular services or state | Any shared feature must be rebuilt twice |
| No shared component library | UI inconsistency, double maintenance |

### 3.2 Authentication

| Issue | Impact |
|---|---|
| Two separate login flows | User must authenticate twice (once per SPA) |
| Token not automatically transferred across SPAs | Even "shared" tokens require explicit localStorage sync |
| Auth interceptors are per-frontend | Backend B gets no token from Frontend A requests |
| Route guards are per-frontend | Protected routes on B have no awareness of A's session |

### 3.3 Local Development

| Issue | Impact |
|---|---|
| Only one backend in docker-compose | Cannot test B features locally |
| No `/beta` proxy in local nginx | `/beta` routes 404 in local dev |
| No angular.json config for Frontend B | Cannot `ng serve` Frontend B in this repo |
| Two DBs or shared DB decision unmade | Risk of schema conflicts |
| Debugging cross-codebase bugs | Impossible without full dual-stack local setup |

### 3.4 Data & Storage

| Issue | Impact |
|---|---|
| Separate upload volumes | Files uploaded in B not visible in A |
| Separate backend queries | Notifications, messages, posts don't cross the boundary |
| Potential schema drift | Backend A and B evolve separately, DB conflicts |
| No shared caching layer | Redis/in-memory cache not shared |

### 3.5 Operations & Deployment

| Issue | Impact |
|---|---|
| Two CI/CD pipelines | Double maintenance, double failure points |
| nginx config complexity doubles | Routing bugs harder to diagnose |
| Two sets of environment variables | Secrets management complexity |
| No atomic deploy of A+B together | Version mismatch between A and B in production |
| EC2 resource contention | Two backends + two frontends on same instance |

---

## 4. The Only Correct Solutions

### Option A — Merge into One Codebase (Recommended)
- One Angular app with feature-flagged routes (e.g. `/beta/**` inside the same app)
- One FastAPI backend with versioned routers (`/api/v1/` and `/api/v2/`)
- One DB, one auth system, one token
- Full local dev works immediately
- Notifications, uploads, state all shared naturally

### Option B — Micro-Frontend Architecture (Complex but Scalable)
- Module Federation (Angular 14+) to load Frontend B as a remote module inside Frontend A's shell
- Shared auth token via shared `localStorage` key with agreed contract
- Backend A and B stay separate but share the same DB
- API Gateway (or nginx upstream config) handles routing
- Requires significant setup but solves all isolation problems

### Option C — Subdomain Separation (Clean Isolation)
- `beta.yourdomain.com` → Frontend B + Backend B (completely separate)
- `yourdomain.com` → Frontend A + Backend A
- Cookie-based shared auth (`.yourdomain.com` domain cookie)
- Explicitly separate — no false expectation of sharing

---

## 5. Summary

```
Root cause: Two SPAs on the same URL with path-based routing
            creates an illusion of one app but delivers two
            completely isolated, non-communicating systems.

/beta is not a route inside Frontend A.
/beta is a completely different application
      that happens to share a domain name.

Every feature that needs to "cross" this boundary
(auth, notifications, uploads, state, navigation)
requires a completely separate engineering solution
rather than working naturally out of the box.
```

---

*Document generated for 7Hive architecture review — July 2026*
