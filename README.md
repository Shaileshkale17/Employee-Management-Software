# Employee Management Software

## Email Configuration

The backend sends transactional emails (employee welcome, attendance notifications, password-reset / OTP codes, leave status, meeting invitations, calendar reminders) using **Nodemailer**. All credentials are read from environment variables and stay **server-side only** — they are never exposed to the frontend, API responses, or logs.

### Required environment variables

| Variable                  | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `EMAIL_ADDRESS`           | SMTP username / sender account                                       |
| `EMAIL_PASSWORD`          | SMTP password or app password for `EMAIL_ADDRESS`                    |
| `YOURSELF_EMAIL_ADDRESS`  | Admin/system recipient for operational notifications (e.g. absent-employee digest) |

### Optional environment variables

| Variable           | Purpose                                                                                          | Default              |
| ------------------ | ------------------------------------------------------------------------------------------------ | -------------------- |
| `EMAIL_HOST`       | SMTP server hostname                                                                             | `smtp.gmail.com`     |
| `EMAIL_PORT`       | SMTP server port (465 = SSL, 587 = STARTTLS)                                                     | `465`                |
| `FRONTEND_URL`     | Base URL used to build links inside emails (login, reset, meeting join)                          | `http://localhost:5173` |

> Note: `URL` is used as the **MongoDB connection string** in this project and must not be used for email link building. Application links in emails use `FRONTEND_URL`.

### Configuring in Vercel

Add the variables above under **Project → Settings → Environment Variables** in Vercel, then redeploy. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your account password. If you use another SMTP provider (Outlook, Zoho, SES, etc.), set `EMAIL_HOST` and `EMAIL_PORT` accordingly.

### Behavior

- Emails are sent **after** the critical database operation succeeds; a temporary email provider failure is logged and never rolls back the database change.
- At startup the backend validates that `EMAIL_ADDRESS`, `EMAIL_PASSWORD`, and `YOURSELF_EMAIL_ADDRESS` are configured and logs a clear server-side warning if any are missing (it does not crash and does not print values).
- If SMTP is not configured, email sending is skipped (`[mail-skip]` log) and the rest of the application keeps working.
- The SMTP transporter is created lazily and reused per process, making it safe for serverless (Vercel) deployments.

## Cloudinary Configuration (Image / Media Uploads)

All file uploads (company logos, resumes, calendar attachments, meeting messages, recordings) are uploaded to **Cloudinary** instead of the server disk. This keeps them working on serverless (Vercel) where a local filesystem is ephemeral.

### Required environment variables

| Variable                  | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary cloud name                     |
| `CLOUDINARY_API_KEY`      | Cloudinary API key                        |
| `CLOUDINARY_API_SECRET`   | Cloudinary API secret                     |

### Behavior

- Files are read into memory via multer and streamed to Cloudinary; the returned secure URL (and public ID) is stored in the database.
- If Cloudinary is **not configured**, uploads fall back to the local `Server/uploads` directory (served at `/uploads`) so local development still works.
- Media is grouped under the `ems-uploads` Cloudinary folder.

## Calendar Invites & Microsoft Teams Meetings

Calendar events support **attendees** (invited by email) and an optional **Microsoft Teams meeting**.

- In the event form, toggle **"Microsoft Teams meeting"** and add attendee emails. On save the backend reuses the existing meeting engine to create a real online meeting, exposes a join link, and emails every attendee an invitation (update/cancel emails follow on changes).
- Attendees are stored per-event; matching company employees are also added as participants automatically.
- Cancelling an event notifies attendees, closes the linked meeting, and marks attendees as cancelled. Deleting an event cleans up its linked meeting too.
- The join link is built from `FRONTEND_URL` (e.g. `${FRONTEND_URL}/meeting/<id>`) and requires the **same** `MEETING_SECRET` used by the regular meeting/join flow, so no separate configuration is needed. Email sending follows the [Email Configuration](#email-configuration) rules — SMTP is optional and never blocks event creation.

## Demo Credentials

Use the following credentials to test the system:

- **HR Login**  
  Email: `hr@example.com`  
  Password: `hr@1234`

- **Employee Login**  
  Email: `employee@example.com`  
  Password: `employee@1234`

---
## Overview

Employee Management Software is a comprehensive solution designed to manage employees, attendance, shifts, leave requests, notifications, reports, and other core HR functionalities. The system ensures efficient management, real-time updates, and scalable architecture using modern web technologies.

## High-Level Flow of the System

### 1. User Interface (Frontend)

This is where users interact with the system.

**User Actions:**

- Logging in and authentication
- Managing employees and departments
- Tracking attendance and shift scheduling
- Requesting and reviewing reports
- Applying for and approving leaves

**Technology:** React.js (Web) / React Native (Mobile)

---

### 2. Authentication Service

Handles user authentication and role-based access control.

**Functionality:**

- Users authenticate using credentials (email/password)
- JWT-based authentication for secure session management
- Role-based access control for different user levels (Admin, Manager, Employee)

**Technology:** Node.js, JWT

---

### 3. Core Services

These are the key components responsible for business logic.

#### **Attendance Service**

- Employees can mark check-in/check-out.
- Attendance status (Present, Absent, Leave) is recorded.
- Sends notifications for missing or delayed check-ins.
- Stores data in MongoDB for reporting and analysis.

**Technology:** Node.js, MongoDB, WebSocket

#### **Shift Management Service**

- Assigns and updates shifts for employees.
- Stores shift schedules in MongoDB.
- Sends real-time notifications for shift changes.

**Technology:** Node.js, MongoDB, WebSocket

#### **Leave Management Service**

- Employees can apply for leave (Sick, Casual, Paid, Unpaid).
- Managers approve or reject leave requests.
- Leave status updates are stored and notified.

**Technology:** Node.js, MongoDB

#### **Notification Service**

- Sends real-time alerts for attendance, shifts, and leave updates.
- Supports WebSocket for live notifications and scheduled email/SMS alerts.

**Technology:** Node.js, WebSockets, Twilio

#### **Report Generation Service**

- Generates reports on attendance, shift schedules, leave records, and salary details.
- Data is fetched from MongoDB and formatted for viewing or export.

**Technology:** Node.js, MongoDB

#### **Testing Service**

- Ensures all services function correctly before deployment.
- Implements unit, integration, and end-to-end tests.

**Technology:** Jest, Mocha, Chai

---

### 4. Load Balancer

Distributes requests across multiple backend instances to improve scalability and fault tolerance.

**Technology:** Nginx, Node.js Cluster module

---

### 5. Queue System (Asynchronous Processing)

Handles background tasks such as report generation and notifications asynchronously.

**Technology:** RabbitMQ, Kafka

---

### 6. Database (MongoDB)

Stores all system data efficiently for fast retrieval and scalability.

**Technology:** MongoDB, MongoDB Atlas

---

### 7. Caching (Redis)

Speeds up frequently accessed data and session management.

**Technology:** Redis

---

### 8. Monitoring and Logging

Monitors system health, performance, and error tracking.

**Technology:** Prometheus, ELK Stack (Elasticsearch, Logstash, Kibana)

---

## System Diagram

```
                  +-------------------+
                  |     User UI       |
                  | (Web/Mobile App)  |
                  +-------------------+
                          |
                          v
              +---------------------------+
              |   Authentication Service  |
              |  (JWT, User Role)         |
              +---------------------------+
                          |
                          v
        +----------------------------------------+
        |               Load Balancer          |
        |    (Distributes requests to servers)  |
        +----------------------------------------+
                          |
                          v
        +---------------------------+        +---------------------------+
        |  Attendance Service       |        |  Shift Management Service |
        | (Check-in, Check-out)     |        | (Shift Assignments)        |
        +---------------------------+        +---------------------------+
                          |                            |
                          v                            v
                  +----------------+          +------------------------+
                  |   Notification |          |   Report Generation    |
                  |   Service      |          |     Service            |
                  +----------------+          +------------------------+
                          |                            |
                          v                            v
                 +----------------+           +--------------------------+
                 |  MongoDB (DB)  | <------> |   Queue System (RabbitMQ) |
                 |  (Data Store)  |           |  (Async Background Tasks) |
                 +----------------+           +--------------------------+
                          |
                          v
                     +------------+
                     |   Redis    |
                     | (Caching)  |
                     +------------+
                          |
                          v
                     +--------------------+
                     | Monitoring & Logging|
                     | (Prometheus, ELK)  |
                     +--------------------+
```

---

## Scalability Considerations

- **Horizontal Scaling:** Node.js servers can be scaled horizontally to handle more users.
- **MongoDB Scaling:** Supports sharding and replica sets for high availability.
- **Caching with Redis:** Reduces database load for frequently accessed queries.
- **Asynchronous Processing:** The queue system ensures background tasks don’t slow down user interactions.

This structure provides a robust, scalable, and efficient design for the Employee Management Software.
