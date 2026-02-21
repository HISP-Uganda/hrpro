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

---

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

