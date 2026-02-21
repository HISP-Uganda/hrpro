package main

import (
	"context"
	"fmt"
	"time"

	"hrpro/internal/attendance"
	"hrpro/internal/audit"
	"hrpro/internal/config"
	"hrpro/internal/dashboard"
	"hrpro/internal/db"
	"hrpro/internal/departments"
	"hrpro/internal/employees"
	"hrpro/internal/handlers"
	"hrpro/internal/leave"
	"hrpro/internal/payroll"
	"hrpro/internal/repositories"
	"hrpro/internal/services"
	"hrpro/internal/users"

	"github.com/jmoiron/sqlx"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx                context.Context
	db                 *sqlx.DB
	authHandler        *handlers.AuthHandler
	employeesHandler   *handlers.EmployeesHandler
	departmentsHandler *handlers.DepartmentsHandler
	leaveHandler       *handlers.LeaveHandler
	payrollHandler     *handlers.PayrollHandler
	usersHandler       *handlers.UsersHandler
	auditHandler       *handlers.AuditHandler
	dashboardHandler   *handlers.DashboardHandler
	attendanceHandler  *handlers.AttendanceHandler
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if err := a.bootstrap(ctx); err != nil {
		runtime.LogErrorf(ctx, "startup failed: %v", err)
		panic(err)
	}
}

func (a *App) shutdown(_ context.Context) {
	if a.db != nil {
		_ = a.db.Close()
	}
}

func (a *App) bootstrap(ctx context.Context) error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	database, err := db.NewPool(cfg.DBConnectionString)
	if err != nil {
		return fmt.Errorf("create database pool: %w", err)
	}

	if err := db.ValidateConnection(ctx, database); err != nil {
		_ = database.Close()
		return err
	}

	if cfg.Env != "production" {
		if err := db.RunMigrations(database.DB); err != nil {
			_ = database.Close()
			return err
		}
	}

	userRepo := repositories.NewUserRepository(database)
	refreshRepo := repositories.NewRefreshTokenRepository(database)
	tokenService := services.NewTokenService(cfg.JWTSecret)
	authService := services.NewAuthService(
		userRepo,
		refreshRepo,
		tokenService,
		cfg.AccessTokenExpiry,
		cfg.RefreshTokenExpiry,
	)
	auditRepo := audit.NewRepository(database)
	auditService := audit.NewService(auditRepo)
	authService.SetAuditRecorder(auditService)

	if err := authService.SeedInitialAdmin(
		ctx,
		cfg.InitialAdminUsername,
		cfg.InitialAdminPassword,
		cfg.InitialAdminRole,
	); err != nil {
		_ = database.Close()
		return fmt.Errorf("seed initial admin: %w", err)
	}

	a.db = database
	a.authHandler = handlers.NewAuthHandler(authService)
	employeesRepo := employees.NewRepository(database)
	employeesService := employees.NewService(employeesRepo)
	a.employeesHandler = handlers.NewEmployeesHandler(authService, employeesService)
	departmentsRepo := departments.NewRepository(database)
	departmentsService := departments.NewService(departmentsRepo)
	a.departmentsHandler = handlers.NewDepartmentsHandler(authService, departmentsService)
	leaveRepo := leave.NewRepository(database)
	leaveService := leave.NewService(leaveRepo)
	leaveService.SetAuditRecorder(auditService)
	a.leaveHandler = handlers.NewLeaveHandler(authService, leaveService)
	attendanceRepo := attendance.NewRepository(database)
	attendanceService := attendance.NewService(attendanceRepo, leaveService)
	attendanceService.SetAuditRecorder(auditService)
	a.attendanceHandler = handlers.NewAttendanceHandler(authService, attendanceService)
	payrollRepo := payroll.NewRepository(database)
	payrollService := payroll.NewService(payrollRepo)
	payrollService.SetAuditRecorder(auditService)
	a.payrollHandler = handlers.NewPayrollHandler(authService, payrollService)
	usersRepo := users.NewRepository(database)
	usersService := users.NewService(usersRepo)
	usersService.SetAuditRecorder(auditService)
	a.usersHandler = handlers.NewUsersHandler(authService, usersService)
	a.auditHandler = handlers.NewAuditHandler(authService, auditService)
	dashboardRepo := dashboard.NewRepository(database)
	dashboardService := dashboard.NewService(dashboardRepo)
	a.dashboardHandler = handlers.NewDashboardHandler(authService, dashboardService)
	return nil
}

func (a *App) Login(request handlers.LoginRequest) (*handlers.LoginResponse, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.authHandler.Login(ctx, request)
}

func (a *App) Logout(request handlers.LogoutRequest) error {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.authHandler.Logout(ctx, request)
}

func (a *App) GetMe(accessToken string) (*handlers.GetMeResponse, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.authHandler.GetMe(ctx, accessToken)
}

func (a *App) CreateEmployee(request handlers.CreateEmployeeRequest) (*employees.Employee, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.employeesHandler.CreateEmployee(ctx, request)
}

func (a *App) UpdateEmployee(request handlers.UpdateEmployeeRequest) (*employees.Employee, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.employeesHandler.UpdateEmployee(ctx, request)
}

func (a *App) DeleteEmployee(request handlers.DeleteEmployeeRequest) error {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.employeesHandler.DeleteEmployee(ctx, request)
}

func (a *App) GetEmployee(request handlers.GetEmployeeRequest) (*employees.Employee, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.employeesHandler.GetEmployee(ctx, request)
}

func (a *App) ListEmployees(request handlers.ListEmployeesRequest) (*handlers.EmployeeListResponse, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.employeesHandler.ListEmployees(ctx, request)
}

func (a *App) CreateDepartment(request handlers.CreateDepartmentRequest) (*departments.Department, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.departmentsHandler.CreateDepartment(ctx, request)
}

func (a *App) UpdateDepartment(request handlers.UpdateDepartmentRequest) (*departments.Department, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.departmentsHandler.UpdateDepartment(ctx, request)
}

func (a *App) DeleteDepartment(request handlers.DeleteDepartmentRequest) error {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.departmentsHandler.DeleteDepartment(ctx, request)
}

func (a *App) GetDepartment(request handlers.GetDepartmentRequest) (*departments.Department, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.departmentsHandler.GetDepartment(ctx, request)
}

func (a *App) ListDepartments(request handlers.ListDepartmentsRequest) (*handlers.DepartmentListResponse, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.departmentsHandler.ListDepartments(ctx, request)
}

func (a *App) ListLeaveTypes(request handlers.ListLeaveTypesRequest) ([]leave.LeaveType, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.ListLeaveTypes(ctx, request)
}

func (a *App) CreateLeaveType(request handlers.CreateLeaveTypeRequest) (*leave.LeaveType, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.CreateLeaveType(ctx, request)
}

func (a *App) UpdateLeaveType(request handlers.UpdateLeaveTypeRequest) (*leave.LeaveType, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.UpdateLeaveType(ctx, request)
}

func (a *App) SetLeaveTypeActive(request handlers.SetLeaveTypeActiveRequest) (*leave.LeaveType, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.SetLeaveTypeActive(ctx, request)
}

func (a *App) ListLockedDates(request handlers.ListLockedDatesRequest) ([]leave.LeaveLockedDate, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.ListLockedDates(ctx, request)
}

func (a *App) LockDate(request handlers.LockDateRequest) (*leave.LeaveLockedDate, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.LockDate(ctx, request)
}

func (a *App) UnlockDate(request handlers.UnlockDateRequest) error {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.UnlockDate(ctx, request)
}

func (a *App) GetMyLeaveBalance(request handlers.LeaveBalanceRequest) (*leave.LeaveBalance, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.GetMyLeaveBalance(ctx, request)
}

func (a *App) GetLeaveBalance(request handlers.LeaveBalanceRequest) (*leave.LeaveBalance, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.GetLeaveBalance(ctx, request)
}

func (a *App) UpsertEntitlement(request handlers.UpsertEntitlementRequest) (*leave.LeaveEntitlement, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.UpsertEntitlement(ctx, request)
}

func (a *App) ApplyLeave(request handlers.ApplyLeaveRequest) (*leave.LeaveRequest, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.ApplyLeave(ctx, request)
}

func (a *App) ListMyLeaveRequests(request handlers.ListLeaveRequestsRequest) ([]leave.LeaveRequest, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.ListMyLeaveRequests(ctx, request)
}

func (a *App) ListAllLeaveRequests(request handlers.ListLeaveRequestsRequest) ([]leave.LeaveRequest, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.ListAllLeaveRequests(ctx, request)
}

func (a *App) ApproveLeave(request handlers.LeaveActionRequest) (*leave.LeaveRequest, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.ApproveLeave(ctx, request)
}

func (a *App) RejectLeave(request handlers.RejectLeaveRequest) (*leave.LeaveRequest, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.RejectLeave(ctx, request)
}

func (a *App) CancelLeave(request handlers.LeaveActionRequest) (*leave.LeaveRequest, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.leaveHandler.CancelLeave(ctx, request)
}

func (a *App) ListPayrollBatches(request handlers.ListPayrollBatchesRequest) (*payroll.ListBatchesResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.payrollHandler.ListPayrollBatches(ctx, request)
}

func (a *App) CreatePayrollBatch(request handlers.CreatePayrollBatchRequest) (*payroll.PayrollBatch, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.payrollHandler.CreatePayrollBatch(ctx, request)
}

func (a *App) GetPayrollBatch(request handlers.GetPayrollBatchRequest) (*payroll.PayrollBatchDetail, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.payrollHandler.GetPayrollBatch(ctx, request)
}

func (a *App) GeneratePayrollEntries(request handlers.PayrollBatchActionRequest) error {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.payrollHandler.GeneratePayrollEntries(ctx, request)
}

func (a *App) UpdatePayrollEntryAmounts(request handlers.UpdatePayrollEntryAmountsRequest) (*payroll.PayrollEntry, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.payrollHandler.UpdatePayrollEntryAmounts(ctx, request)
}

func (a *App) ApprovePayrollBatch(request handlers.PayrollBatchActionRequest) (*payroll.PayrollBatch, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.payrollHandler.ApprovePayrollBatch(ctx, request)
}

func (a *App) LockPayrollBatch(request handlers.PayrollBatchActionRequest) (*payroll.PayrollBatch, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.payrollHandler.LockPayrollBatch(ctx, request)
}

func (a *App) ExportPayrollBatchCSV(request handlers.PayrollBatchActionRequest) (string, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.payrollHandler.ExportPayrollBatchCSV(ctx, request)
}

func (a *App) ListUsers(request handlers.ListUsersRequest) (*users.ListUsersResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.usersHandler.ListUsers(ctx, request)
}

func (a *App) GetUser(request handlers.GetUserRequest) (*users.User, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.usersHandler.GetUser(ctx, request)
}

func (a *App) CreateUser(request handlers.CreateUserRequest) (*users.User, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.usersHandler.CreateUser(ctx, request)
}

func (a *App) UpdateUser(request handlers.UpdateUserRequest) (*users.User, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.usersHandler.UpdateUser(ctx, request)
}

func (a *App) ResetUserPassword(request handlers.ResetUserPasswordRequest) error {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.usersHandler.ResetUserPassword(ctx, request)
}

func (a *App) SetUserActive(request handlers.SetUserActiveRequest) (*users.User, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.usersHandler.SetUserActive(ctx, request)
}

func (a *App) ListAuditLogs(request handlers.ListAuditLogsRequest) (*audit.ListAuditLogsResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.auditHandler.ListAuditLogs(ctx, request)
}

func (a *App) GetDashboardSummary(request handlers.GetDashboardSummaryRequest) (*dashboard.SummaryDTO, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.dashboardHandler.GetDashboardSummary(ctx, request)
}

func (a *App) ListAttendanceByDate(request handlers.ListAttendanceByDateRequest) ([]attendance.AttendanceRow, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.attendanceHandler.ListAttendanceByDate(ctx, request)
}

func (a *App) UpsertAttendance(request handlers.UpsertAttendanceRequest) (*attendance.AttendanceRecord, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.attendanceHandler.UpsertAttendance(ctx, request)
}

func (a *App) GetMyAttendanceRange(request handlers.GetMyAttendanceRangeRequest) ([]attendance.AttendanceRecord, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.attendanceHandler.GetMyAttendanceRange(ctx, request)
}

func (a *App) GetLunchSummary(request handlers.GetLunchSummaryRequest) (*attendance.LunchSummary, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.attendanceHandler.GetLunchSummary(ctx, request)
}

func (a *App) UpsertLunchVisitors(request handlers.UpsertLunchVisitorsRequest) (*attendance.LunchSummary, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.attendanceHandler.UpsertLunchVisitors(ctx, request)
}

func (a *App) PostAbsentToLeave(request handlers.PostAbsentToLeaveRequest) (*attendance.PostAbsentToLeaveResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.attendanceHandler.PostAbsentToLeave(ctx, request)
}
