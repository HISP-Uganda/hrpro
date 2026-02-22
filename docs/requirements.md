# HISP HR System
## Authoritative Requirements Specification
## Phase A – Online-First Architecture
## Stack: Wails v2 (Go 1.22+) + React (TypeScript) + PostgreSQL

---

# 1. Vision

Build a secure, LAN-friendly, desktop HR Management System using Wails that:

- Runs as a desktop application
- Connects to a centralized PostgreSQL database (online-first)
- Supports role-based access control
- Manages Employees, Departments, Payroll, and Leave
- Is modular, scalable, and enterprise-ready
- Can later evolve to offline-sync (Phase B)

---

# 2. Target Architecture (Phase A)

## 2.1 High-Level

Frontend:
- React + TypeScript
- Material UI (MUI v5+)
    - Use dataGrid with advanced features (sticky headers, enable/disable/hide columns)
- TanStack Router
- TanStack Query

Backend:
- Go 1.22+
- Wails v2
- Gin (internal APIs if needed)
- SQLX with golang-migrate for migrations
- JWT Authentication
- PostgreSQL 13+

Deployment:
- Single remote PostgreSQL database
- Users on LAN connect to same DB server
- App distributed as desktop binary (Windows/Mac/Linux)

---

# 3. Core Modules (Phase A)

---

## 3.1 Authentication
- Login screen (small centered window)
- Username + Password
- JWT issued on login
- Token stored in memory
- Role-based access control

Roles:
- Admin
- HR Officer
- Finance Officer
- Viewer

---

## 3.2 Employee Management

CRUD:
- First Name
- Last Name
- Other Name
- Gender
- Date of Birth
- Phone
- Email
- National ID
- Address
- Position
- Department
- Employment Status
- Date of Hire
- Salary Base Amount

Search:
- By name
- By department
- By status

---

## 3.3 Department Management
- Create department
- Edit department
- Delete department
- Assign employees

---

## 3.4 Leave Management (NEW – Phase A)

### Leave Types
- Annual Leave
- Sick Leave
- Maternity Leave
- Unpaid Leave
- Custom types configurable

### Features
- Apply for leave
- Approve / Reject leave
- Leave balance tracking
- Leave history per employee
- Leave status (Pending, Approved, Rejected)
- Automatic leave balance deduction upon approval

### Leave Rules
- Configurable annual leave entitlement
- Leave cannot exceed available balance
- HR/Admin approval required

---

## 3.5 Payroll Management (NEW – Phase A)

### Payroll Features
- Monthly payroll processing
- Salary base amount per employee
- Allowances (configurable)
- Deductions (configurable)
- Automatic gross calculation
- Net salary calculation

### Payroll Fields
- Basic salary
- Allowances
- Deductions
- Tax (manual or percentage-based)
- Net salary

### Payroll Actions
- Generate monthly payroll batch
- Lock payroll after approval
- Export payroll (CSV)

Roles:
- Finance Officer can manage payroll
- Admin has full access

---

## 3.6 User Management (Admin Only)
- Create system users
- Assign role
- Activate/deactivate accounts


## 3.8 Daily Attendance Management

### 3.8.1 Overview

The system shall provide a Daily Attendance module to record and manage employee attendance per date.

This module supports:

- Daily attendance marking
- Status tracking (Present, Late, Field, Absent, Leave)
- Locking of attendance records
- Lunch & Catering daily calculation
- Integration with Leave module
- Audit logging of attendance events

The module must be optimized for fast daily operational use.

---

### 3.8.2 Roles and Permissions

#### Admin / HR Officer

- View attendance for all employees
- Mark attendance for any employee
- Mark special statuses (Field, Absent, Leave)
- Convert Absent to Leave (subject to leave validation rules)
- Override locked records (if Master-level permission)
- Manage daily lunch & catering data

#### Viewer

- View attendance records (read-only)

#### Staff Users

- View own attendance history
- Cannot mark attendance unless explicitly enabled in a future enhancement

All permissions must be enforced server-side.

---

### 3.8.3 Attendance Status Types

Each employee per date shall have one of the following statuses:

- `unmarked` (implicit if no record exists)
- `present`
- `late`
- `field`
- `absent`
- `leave`

Notes:

- “Leave” may be derived automatically from approved leave records.
- Weekends may still be marked (some organizations operate weekends).
- Only one attendance record per employee per date is allowed.

---

### 3.8.4 Data Model Requirements

#### attendance_records

Fields:

- `id` (PK)
- `attendance_date` (DATE, required)
- `employee_id` (FK → employees.id, required)
- `status` (string/enum, required)
- `marked_by_user_id` (FK → users.id)
- `marked_at` (timestamp)
- `is_locked` (boolean, default true after first mark)
- `lock_reason` (nullable)
- `created_at`
- `updated_at`

Constraints:

- Unique (`attendance_date`, `employee_id`)
- Indexed by:
  - `attendance_date`
  - `employee_id`
  - `status`

---

#### lunch_catering_daily

Fields:

- `attendance_date` (DATE, unique)
- `visitors_count` (integer, default 0)
- `plate_cost_amount` (integer, default 12000)
- `staff_contribution_amount` (integer, default 4000)
- `updated_by_user_id` (FK → users.id)
- `updated_at` (timestamp)

---

### 3.8.5 Locking Rules

- Once an attendance record is created for a given employee and date, it becomes locked.
- Locked records cannot be edited.
- Master Admin (or equivalent elevated permission) may override a lock.
- Locking applies per employee per date.

---

### 3.8.6 Daily Register UI Requirements

**Route:** `/attendance`

The page shall contain two tabs:

#### 1. Daily Register

Features:

- Date picker (defaults to current date)
- Table listing employees
- Color-coded status badges
- Per-row action buttons:
  - Present
  - Late
  - Field (Admin/HR only)
  - Absent (Admin/HR only)
  - Post Absent to Leave (Admin/HR only, when applicable)

Behavior:

- Status updates immediately reflect in UI
- Locked records show lock indicator
- Staff users see only their own record

---

#### 2. Lunch & Catering

Features:

- Date picker
- Visitors input field
- Calculated values:
  - Staff Present (present + late)
  - Staff in Field
  - Total plates
  - Total cost
  - Staff contribution total
  - Organization balance

Calculations:

- Total Plates = (present + late) + visitors  
- Total Cost = Total Plates × Plate Cost  
- Staff Contribution Total = (present + late) × Staff Contribution Amount  
- Organization Balance = Total Cost − Staff Contribution Total  

All values must update dynamically when inputs change.

---

### 3.8.7 Integration with Leave Module

When Admin/HR selects “Post Absent to Leave”:

- The system attempts to create a Leave record for that employee for that specific date.
- Leave must:
  - Pass entitlement balance checks
  - Respect leave locking rules
- On success:
  - Attendance status changes to `leave`
  - Audit log entry is recorded
- On failure:
  - Attendance remains `absent`
  - Clear error message is shown

---

### 3.8.8 Reporting Requirements (MVP)

The system shall support:

- Attendance summary by employee (date range)
- Attendance summary by department
- Lunch & Catering summary by date range

Reports must support CSV export.

---

### 3.8.9 Audit Logging

The system must record audit events for:

- `attendance.mark`
- `attendance.override`
- `attendance.post_absent_to_leave`
- `lunch.update_visitors`

Each audit record must include:

- `actor_user_id`
- `attendance_date`
- `employee_id` (if applicable)
- `status` (if applicable)
- `created_at` timestamp

---

### 3.8.10 Future Enhancements (Non-MVP)

Architecture shall allow:

- Time-in / Time-out tracking
- Biometric device integration
- Late threshold rules
- Overtime tracking
- Monthly attendance analytics
- Attendance approval workflows
- Public holiday auto-marking
- Department-level attendance dashboards

---

## 3.9 Reporting

### 3.9.1 Overview

The system shall provide a Reports module that allows authorized users to view, filter, and export operational and managerial reports across HR functions:

- Employees
- Leave
- Payroll
- Attendance
- Lunch & Catering
- Users & Audit

Reports must be fast, filterable, and exportable (CSV required; PDF optional for MVP).

All report access must be enforced server-side via RBAC.

---

### 3.9.2 Roles and Permissions

- **Admin**
  - Access to all reports and exports.
- **HR Officer**
  - Access to Employees, Leave, Attendance, Lunch reports.
  - Read-only access to Payroll summary (optional; otherwise no Payroll access).
- **Finance Officer**
  - Access to Payroll reports and exports.
  - Read-only access to Employees summaries (optional).
- **Viewer**
  - Read-only access to non-sensitive summaries (configurable; default: Employees + Leave + Attendance summaries only).
- **Staff**
  - “My Reports” only (their own attendance + leave history), if enabled later.

RBAC must be enforced server-side for every report endpoint/binding.

---

### 3.9.3 UI Requirements

**Route:** `/reports` under authenticated shell.

Reports page shall provide:
- A left navigation or tabbed layout listing report categories.
- A common filter panel at top (varies by report):
  - Date range (start/end)
  - Department
  - Employee
  - Status
  - Search keyword
- A results area (MUI DataGrid or table) with:
  - Loading state
  - Empty state
  - Error state
  - Pagination for large result sets
- Export actions:
  - **Export CSV** (required)
  - **Export PDF** (optional for MVP; can be deferred)
- Consistent file naming: `report-name-YYYY-MM-DD.csv` (or include range when applicable)

---

### 3.9.4 Employee Reports

#### 3.9.4.1 Employee List Report
Purpose: show employee directory in report form.

Filters:
- Department
- Employment Status (Active/Inactive)
- Search by name

Columns:
- Employee Name
- Gender
- Phone
- Email
- Department
- Position
- Employment Status
- Date of Hire
- Base Salary Amount (role-based visibility; optional hide for non-admin/finance)

Exports:
- CSV required.

#### 3.9.4.2 Headcount by Department
Purpose: show staff distribution.

Output:
- Department name
- Total employees
- Active employees
- Inactive employees

Display:
- Table + optional bar chart.

Exports:
- CSV required.

---

### 3.9.5 Leave Reports

#### 3.9.5.1 Leave Requests Report
Filters:
- Date range (start/end)
- Department
- Employee
- Leave type
- Status (Pending/Approved/Rejected/Cancelled)

Columns:
- Employee
- Department
- Leave Type
- Start Date
- End Date
- Working Days
- Status
- Approved By / Approved At (if applicable)

Exports:
- CSV required.

#### 3.9.5.2 Leave Balances Report
Filters:
- Year
- Department
- Employee

Columns:
- Employee
- Year
- Entitlement Total
- Reserved
- Pending Days
- Approved Days
- Available Days

Exports:
- CSV required.

---

### 3.9.6 Attendance Reports

#### 3.9.6.1 Daily Attendance Register Report
Filters:
- Date
- Department

Columns:
- Employee
- Department
- Status (Present/Late/Field/Absent/Leave/Unmarked)
- Marked By
- Marked At
- Locked (Yes/No)

Exports:
- CSV required.

#### 3.9.6.2 Attendance Summary by Employee (Range)
Filters:
- Date range
- Department
- Employee

Output per employee:
- Present count
- Late count
- Field count
- Absent count
- Leave count
- Unmarked count

Exports:
- CSV required.

---

### 3.9.7 Lunch & Catering Reports

#### 3.9.7.1 Daily Lunch Summary
Filters:
- Date range

Columns:
- Date
- Present (office)
- Field
- Visitors
- Total Plates
- Plate Cost Amount
- Total Cost
- Staff Contribution Amount
- Staff Contribution Total
- Organization Balance

Exports:
- CSV required.

---

### 3.9.8 Payroll Reports

> Access: Finance Officer + Admin only.

#### 3.9.8.1 Payroll Batches Report
Filters:
- Month range
- Status (Draft/Approved/Locked)

Columns:
- Month
- Status
- Created By / Created At
- Approved By / Approved At
- Locked At
- Total Employees Paid (count of entries)
- Total Net Pay (sum)

Exports:
- CSV required.

#### 3.9.8.2 Payroll Entries Report (Per Batch)
Filters:
- Batch (required)
- Employee (optional)

Columns:
- Employee
- Base Salary
- Allowances
- Deductions
- Tax
- Gross Pay
- Net Pay

Exports:
- CSV required.

---

### 3.9.9 Users & Audit Reports

> Access: Admin only by default.

#### 3.9.9.1 Users Report
Filters:
- Role
- Active/Inactive
- Search by username

Columns:
- Username
- Role
- Status
- Created At
- Last Login At

Exports:
- CSV required.

#### 3.9.9.2 Audit Log Report
Filters:
- Date range
- Actor user
- Action type
- Entity type

Columns:
- Timestamp
- Actor
- Action
- Entity Type
- Entity ID
- Metadata (expandable)

Exports:
- CSV required (metadata column may be JSON string).

---

### 3.9.10 Backend Requirements

Reports must be implemented as server-side queries with:
- Pagination for large reports
- Parameterized SQL only (SQLX)
- Filter inputs validated server-side
- RBAC enforced server-side per report type
- Export endpoints must not load unbounded data in memory (streaming export preferred for large datasets)

Suggested Wails bindings (names indicative):
- `Reports.ListEmployeeReport(filters, pager)`
- `Reports.ExportEmployeeReportCSV(filters)`
- `Reports.ListLeaveRequestsReport(filters, pager)`
- `Reports.ExportLeaveRequestsCSV(filters)`
- `Reports.ListAttendanceSummary(filters, pager)`
- `Reports.ExportAttendanceSummaryCSV(filters)`
- `Reports.ListPayrollBatchesReport(filters, pager)`
- `Reports.ExportPayrollBatchesCSV(filters)`
- `Reports.ListAuditReport(filters, pager)`
- `Reports.ExportAuditCSV(filters)`

---

### 3.9.11 Definition of Done (MVP)

- `/reports` route added and linked in sidebar.
- At least these reports implemented end-to-end (UI + backend + export CSV):
  1) Employee List Report
  2) Leave Requests Report
  3) Attendance Summary by Employee (Range)
  4) Payroll Batches Report (Finance/Admin only)
  5) Audit Log Report (Admin only)
- All report exports work and are correctly named.
- RBAC enforced server-side for each report.
- Navigation tests pass (no NotFound warnings).
- docs/status.md updated + docs/notes/reports.md created.

---

### 3.9.12 Future Enhancements (Non-MVP)

- PDF exports (branded printable reports)
- Scheduled reports (daily/weekly email export)
- Dashboard widgets powered by report queries
- Saved report presets per user
- Role-configurable report access matrix

# 4. Security Requirements

- Password hashing (bcrypt)
- JWT access tokens
- Role-based middleware
- Input validation
- SQL injection protection
- Payroll access restricted to Finance/Admin
- Leave approval restricted to HR/Admin
- No hardcoded credentials

---

# 5. Database Requirements

PostgreSQL 13+

---

## 5.1 users
- id
- username
- password_hash
- role
- is_active
- created_at
- updated_at

---

## 5.2 departments
- id
- name
- description
- created_at
- updated_at

---

## 5.3 employees
- id
- first_name
- last_name
- other_name
- gender
- dob
- phone
- email
- national_id
- address
- department_id (FK)
- position
- employment_status
- hire_date
- base_salary
- created_at
- updated_at

---

## 5.4 leave_types
- id
- name
- annual_entitlement_days
- is_active
- created_at
- updated_at

---

## 5.5 leave_requests
- id
- employee_id (FK)
- leave_type_id (FK)
- start_date
- end_date
- days_requested
- status (Pending, Approved, Rejected)
- approved_by
- approved_at
- created_at
- updated_at

---

## 5.6 payroll_batches
- id
- month
- year
- status (Draft, Approved, Locked)
- created_at
- updated_at

---

## 5.7 payroll_entries
- id
- batch_id (FK)
- employee_id (FK)
- basic_salary
- allowances
- deductions
- tax
- net_salary
- created_at
- updated_at

---

Indexes:
- employee name index
- department index
- user username unique index
- payroll month/year composite index

---

# 6. UI Requirements

## 6.1 Login Screen
- Small window (not much larger than form)
- Centered
- Clean professional design
- No main shell visible before login

## 6.2 Main Shell
After authentication:
- Sidebar navigation
- Top bar with user info
- Logout button
- Protected routes

Pages:
- Dashboard
- Employees
- Departments
- Leave
- Payroll
- Users (admin only)

---

# 7. Project Structure

hr-system/
frontend/
backend/
internal/
auth/
users/
employees/
departments/
leave/
payroll/
db/
middleware/
migrations/
docs/
requirements.md
codex-prompts.md
status.md 


---

# 8. Non-Functional Requirements

- Must compile on Windows, Mac, Linux
- Clean architecture
- Modular packages
- Logging using structured logger
- Database migrations supported
- No business logic inside UI
- Payroll processing must be transactional
- Audit logging for payroll approvals

---

# 9. Out of Scope (Phase A)

- Offline mode
- Performance appraisal
- Recruitment module
- Mobile app
- External integrations

---

# 10. Future Phase B

- Offline-first sync engine
- Local SQLite cache
- Background sync service
- Conflict resolution strategy

---

# END OF AUTHORITATIVE SPEC

