# Alpha Testing Feedback Collection System

## Overview

A feedback collection system for Second Saturday's 2-week alpha test with 5-10 testers across 2-3 circles. The system captures bug reports and product feedback via a self-hosted form, automatically creates issues in Plane, and sends alerts to Mattermost — all orchestrated through N8N.

## Goals

- Provide testers with a single, persistent URL to submit bugs and feedback at any time
- Automatically triage submissions into Plane with appropriate labels and priority
- Alert the team in real-time via Mattermost so nothing gets missed
- Require zero manual processing — every submission flows end-to-end without intervention

## Non-Goals

- Building an in-app feedback widget
- Analytics or dashboards over feedback data
- Automated bug reproduction or testing

## System Components

### 1. Feedback Form (N8N Form Trigger)

Hosted on the self-hosted N8N instance using the built-in Form Trigger node. Testers receive the form URL in their onboarding email and can bookmark it for repeat submissions.

#### Form Fields

**Required:**

| Field | Type | Options |
|-------|------|---------|
| Name | Text | Tester's name (for follow-up) |
| Type | Select | Bug Report, Feature Request, General Feedback, Confusion |
| Description | Text area | Free text — what happened or what's on your mind |
| Platform | Select | iOS, Android, Web |

**Conditional (shown when Type = Bug Report):**

| Field | Type | Options |
|-------|------|---------|
| Severity | Select | Blocking (can't continue), Annoying (workaround exists), Minor (cosmetic) |
| Steps to reproduce | Text area | What were you doing when this happened? |
| Screenshot/Recording | File upload | Optional attachment |

**Optional (always shown):**

| Field | Type | Options |
|-------|------|---------|
| Page/Feature | Select | Onboarding, Dashboard, Circle Settings, Submitting a Response, Newsletter, Profile, Other |
| Additional context | Text area | Anything else |

### 2. N8N Automation Workflow

#### Node 1: Form Trigger
- Built-in N8N Form Trigger node
- Hosts the form and receives submissions directly (no external webhook glue needed)
- Handles file uploads natively

#### Node 2: Router (Switch Node)
Branches based on the `Type` field to determine labels and priority mapping:

| Submission Type | Plane Label | Priority Mapping |
|----------------|-------------|-----------------|
| Bug Report | `bug` | Blocking → Urgent, Annoying → High, Minor → Low |
| Feature Request | `feature-request` | Medium (default) |
| General Feedback | `feedback` | Medium (default) |
| Confusion | `ux-confusion` | Medium (default) |

#### Node 3: Plane (Create Issue)
Creates an issue in the alpha testing Plane project:

- **Title:** `[{Type}] {first ~60 chars of description}`
- **Description:** Full form payload formatted as markdown:
  ```
  **Platform:** {platform}
  **Page/Feature:** {page_feature}

  ## Description
  {description}

  ## Steps to Reproduce
  {steps_to_reproduce}

  ## Additional Context
  {additional_context}
  ```
- **Labels:** Auto-assigned per router mapping
- **Priority:** Auto-assigned per severity mapping (or Medium default)
- **Attachments:** Screenshot/recording uploaded if provided. Note: Plane's API requires a separate attachment upload call (`POST /api/v1/workspaces/{slug}/projects/{id}/issues/{issue_id}/assets/`) after issue creation — chain a second HTTP Request node for this

#### Node 4: Mattermost (Post Alert)
Posts to a dedicated `#alpha-feedback` channel after the Plane issue is created:

- **Message format:**
  ```
  **[{Type}]** {severity if bug, omitted otherwise} | {platform}
  {description truncated to ~200 chars}
  Submitted by: {name}
  [View in Plane]({plane_issue_url})
  ```

### 3. Data Flow Diagram

```
Tester fills out form
        |
        v
N8N Form Trigger (receives submission)
        |
        v
Switch Node (routes by Type)
        |
   +---------+---------+---------+
   |         |         |         |
   v         v         v         v
  Bug    Feature   Feedback  Confusion
   |         |         |         |
   +----+----+----+----+
        |
        v
Plane: Create Issue
(title, description, labels, priority, attachments)
        |
        v
Mattermost: Post Alert
(summary + link to Plane issue)
```

## Implementation Notes

- **N8N version:** Conditional form fields (show/hide based on Type) require N8N v1.64+
- **Error handling:** Enable N8N's built-in retry (2 retries, exponential backoff) on the Plane and Mattermost nodes. Optionally add an Error Trigger workflow that posts to Mattermost if the main workflow fails, so no submission is silently lost.

## Setup Checklist

1. **Plane:** Create an "Alpha Feedback" project with labels: `bug`, `feature-request`, `feedback`, `ux-confusion`
2. **Mattermost:** Create `#alpha-feedback` channel
3. **N8N workflow:**
   - Form Trigger node with all fields defined above
   - Switch node routing on Type field
   - Plane HTTP/API node to create issues (requires Plane API token)
   - Mattermost node to post alerts (requires Mattermost webhook or bot token)
4. **Test:** Submit a test entry through each type and verify it lands in Plane with correct labels/priority and triggers a Mattermost alert
5. **Distribute:** Include the form URL in the onboarding email sent with circle invite links

## Testing the Automation

Before distributing to alpha testers, verify:

- [ ] Bug Report submission creates a Plane issue with `bug` label and correct priority
- [ ] Feature Request submission creates a Plane issue with `feature-request` label
- [ ] General Feedback submission creates a Plane issue with `feedback` label
- [ ] Confusion submission creates a Plane issue with `ux-confusion` label
- [ ] File upload attaches correctly to the Plane issue
- [ ] Mattermost alert fires for every submission type with correct formatting
- [ ] Plane issue link in Mattermost message is clickable and correct
