# 7HIVE Content Upload and Admin Guide

This guide explains how to add and manage all website content from the admin system, so other teams can use the same process safely.

## 1. What This Guide Covers

- Adding portfolio projects in categories like Architecture and Interior
- Uploading project images
- Uploading team introduction content
- Uploading team gallery images
- Adding team members with photo and role
- Adding or replacing the "Our Leader" section
- Viewing contact enquiries
- Common mistakes and troubleshooting

## 2. Admin Access

### Admin panel URL

- Open the website and go to `/admin`
- Example: `https://your-domain.com/admin`

### Enquiry viewer URL

- Go to `/viewenquiry`
- Example: `https://your-domain.com/viewenquiry`

### Notes

- The admin page currently has no login protection in frontend routing.
- Enquiry API access uses Basic Auth credentials configured in the app.

## 3. Category Rules (Important)

When creating or updating a portfolio project, category must be one of these exact values:

- `architecture`
- `interior`
- `turnkey`
- `siteexecution`

Important clarification:

- Use `interior` for interior/exterior style work.
- `exterior` is **not** a valid backend category value and will fail validation.

## 4. Portfolio Projects Workflow

This is the recommended order for project uploads.

### Step 1: Create the project first

In Admin -> "Portfolio Projects" -> "Create New Project":

Required fields:

- Project Title
- Category
- Short Description

Optional fields:

- Full Description
- Location
- Area
- Client Name
- Year

Click `Create Project`.

What happens in backend:

- A unique `portfolioProjectId` is auto-generated (format like `P001`, `P002`, ...).
- Project is stored in the portfolio table.

### Step 2: Upload project images

In "Existing Projects", click `Upload Images` for that project and select one or more files.

What happens in backend:

- Files are stored in:
  - `uploads/portfolio/<portfolioProjectId>/main/<filename>`
- Each uploaded image is attached as a main frame image.
- If cover image is empty, the first uploaded image becomes cover image.

### Step 3: Update project category later (if needed)

Use the category dropdown on each project card.

Rules:

- Category cannot be blank when updating through dropdown flow.
- Must still be one of valid values listed in Section 3.

### Step 4: Delete project (if needed)

Click `Delete` on project row.

Important:

- This removes project records from database.
- Team should treat delete as permanent content removal.

## 5. Project Images (General Section)

Admin -> "Project Images"

Use this section when you need to upload generic project images outside portfolio project records.

Process:

1. Click `Select Project Images`
2. Choose one or multiple files
3. Click `Upload`

Backend storage:

- `uploads/projectimages/<filename>`

Delete flow:

- Click `Delete` under any image card to remove both DB entry and file.

## 6. Team Introduction

Admin -> "Team Introduction"

Fields:

- Title (required)
- Description (required)

Click `Save Team Intro`.

Important behavior:

- Every save creates a new row in database.
- It does **not** replace old entries automatically.
- Content team should maintain version discipline (avoid repeated duplicate saves).

## 7. Team Members (Name + Role + Photo)

Admin -> "Team Members"

Required:

- Member Name
- Role / Description
- Photo file

Process:

1. Fill name
2. Fill role/description
3. Select photo
4. Click `Add Member`

Backend storage:

- `uploads/teammembers/<filename>`

Delete flow:

- Use `Delete` on member card
- Removes DB record and image file

## 8. Team Images (Gallery Style)

Admin -> "Team Images"

Process:

1. Click `Select Team Images`
2. Choose multiple images
3. Click `Upload`

Backend storage:

- `uploads/teamimages/<filename>`

Delete flow:

- Use `Delete` on image card
- Removes DB record and image file

## 9. Our Leader Section

Admin -> "Our Leader"

Required:

- Name/Title
- Description/Bio
- Photo

Process:

1. Fill all required fields
2. Click `Save Leader` (or `Replace Leader` if one exists)

Behavior:

- System keeps only one leader entry.
- On replace, old leader record and old photo file are deleted first.

Storage path:

- `uploads/ourleader/<filename>`

Delete:

- Click `Remove` to clear current leader entry.

## 10. Contact Enquiries

### Submit enquiry (public form)

- Enquiries are created through Contact page form.
- Backend validates:
  - Name not empty
  - Email format contains `@` and `.`
  - Message not empty

### View enquiry (admin team)

- Open `/viewenquiry`
- Records are shown newest first.

## 11. File Upload Best Practices

Follow these before upload:

- Use clear file names, for example: `project-villa-living-01.jpg`
- Avoid special characters in file names
- Prefer optimized images for faster loading
- Keep consistent aspect ratios per section for cleaner UI
- Do not reuse same filename for different content unless intentional

## 12. Common Mistakes and Fixes

### Mistake: Category set to "exterior"

- Symptom: project create/update fails
- Fix: use one of:
  - `architecture`
  - `interior`
  - `turnkey`
  - `siteexecution`

### Mistake: Clicking Save Team Intro multiple times

- Symptom: duplicate intro entries in DB
- Fix: save once, verify on frontend, then update only when needed

### Mistake: Upload button disabled

- Symptom: cannot submit
- Fix: check required fields are filled and file is selected where needed

### Mistake: Images not visible after upload

- Symptom: upload success but not shown immediately
- Fix: wait for auto-refresh; if needed, refresh page once

## 13. Quick Checklist for Content Teams

Before handing over content release:

1. All projects have correct category values
2. Each portfolio project has at least one main image
3. Cover image appears correctly on listing
4. Team intro title and description are finalized
5. Team members include correct name, role, and photo
6. Leader section has latest details
7. No accidental duplicate content entries

## 14. Backend API Reference (Operational)

The system currently uses these key routes:

- `POST /upload-images/`
- `GET /images/`
- `DELETE /images/{image_id}`

- `POST /teamintro`
- `GET /teamintro`

- `POST /teamimages`
- `GET /teamimages`
- `DELETE /teamimages/{image_id}`

- `POST /team-members`
- `GET /team-members`
- `DELETE /team-members/{member_id}`

- `GET /ourleader`
- `POST /ourleader`
- `DELETE /ourleader`

- `POST /portfolio`
- `GET /portfolio`
- `PUT /portfolio/{portfolio_project_id}`
- `DELETE /portfolio/{portfolio_project_id}`
- `POST /portfolio/{portfolio_project_id}/main-images`

- `POST /enquiries`
- `GET /enquiries`

## 15. Handover Recommendation

For cross-team operations, keep this as the standard process:

1. Create/update content in staging first
2. Verify frontend output (home, team, portfolio pages)
3. Capture screenshots for approval
4. Repeat same content operation in production
5. Log what changed (project IDs, member names, date, operator)

This reduces accidental data loss and keeps content operations auditable.