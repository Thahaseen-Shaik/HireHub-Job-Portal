# HireHub Database ER Diagram

![HireHub Database ER Diagram](C:/Users/laksh/.gemini/antigravity/brain/9b0f066d-594b-4212-962b-0b10017e94bf/database_er_diagram_visual_1776773891358.png)

This document provides a visual representation of the PostgreSQL database schema for the HireHub project, based on the `setup.sql` definition.

## 📊 Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--|| user_profiles : "has (1:1)"
    users ||--|| manager_profiles : "has (1:1)"
    users ||--o{ companies : "owns"
    users ||--o{ admin_activity_logs : "performed by"
    users ||--o{ applications : "submits"
    
    companies ||--o{ jobs : "posts"
    companies ||--o{ subscriptions : "has"
    
    jobs ||--o{ applications : "receives"
    jobs ||--o{ manager_test_links : "associated with"
    jobs ||--o{ manager_interviews : "schedules"
    jobs ||--o{ manager_offboarding_letters : "tracks"
    
    applications ||--o{ manager_test_links : "triggered by"
    
    manager_test_links ||--o{ manager_test_link_updates : "tracked in"
    manager_interviews ||--o{ manager_interview_updates : "tracked in"

    users {
        int id PK
        string name
        string email UK
        string password
        string role
        boolean is_blocked
        timestamp created_at
    }

    user_profiles {
        int id PK
        int user_id FK
        text profile_photo_url
        jsonb education_details
        jsonb skills
        jsonb work_experience
        jsonb projects
        text resume_url
    }

    companies {
        int id PK
        string name
        int owner_id FK
        string email UK
        string phone
        string status
        text description
    }

    jobs {
        int id PK
        int company_id FK
        string title
        text description
        decimal salary_min
        decimal salary_max
        string apply_mode
        string status
    }

    applications {
        int id PK
        int job_id FK
        int user_id FK
        string status
        decimal test_score
        boolean test_passed
        boolean interview_called
        timestamp applied_at
    }

    subscriptions {
        int id PK
        int company_id FK
        string plan_name
        decimal amount
        timestamp expiry_date
        string status
    }

    manager_test_links {
        int id PK
        int application_id FK
        int job_id FK
        string link_url
        string link_status
        decimal latest_score
        boolean is_passed
    }

    manager_interviews {
        int id PK
        int job_id FK
        string candidate_email
        string interview_type
        timestamp scheduled_at
        string mode
        string status
    }
```

## 🔑 Key Relationships

1.  **Identity Management**: The `users` table is the central hub. It links to `user_profiles` (for candidates) and `manager_profiles` (for recruiters) in one-to-one relationships.
2.  **Corporate Structure**: `users` own `companies`, which in turn post `jobs`.
3.  **Recruitment Funnel**:
    *   Candidates (`users`) submit `applications` for `jobs`.
    *   Applications can trigger `manager_test_links` for assessments.
    *   Successful candidates move to `manager_interviews`.
4.  **Audit & Logs**: `admin_activity_logs` track actions performed by Admin users.
5.  **Billing**: `subscriptions` track the payment status and plan tiers for each company.

## 🛠️ Data Types Note
*   **JSONB**: Used extensively in `user_profiles` for flexible data like skills, experience, and accomplishments.
*   **SERIAL**: Primary keys are auto-incrementing integers.
*   **TIMESTAMP**: Used for tracking creation and update events across all tables.
