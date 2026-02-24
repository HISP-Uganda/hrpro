package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
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
	"hrpro/internal/reports"
	"hrpro/internal/repositories"
	"hrpro/internal/services"
	"hrpro/internal/settings"
	"hrpro/internal/users"

	"github.com/jmoiron/sqlx"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type SaveFileWithDialogRequest struct {
	SuggestedFilename string `json:"suggestedFilename"`
	DataBytes         []byte `json:"dataBytes"`
	MimeType          string `json:"mimeType"`
}

type SaveFileWithDialogResult struct {
	SavedPath string `json:"savedPath"`
	Cancelled bool   `json:"cancelled"`
}

type StartupHealthResponse struct {
	DBOk         bool   `json:"dbOk"`
	RuntimeOk    bool   `json:"runtimeOk"`
	DBError      string `json:"dbError,omitempty"`
	RuntimeError string `json:"runtimeError,omitempty"`
}

type DatabaseConfigParams struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Database string `json:"database"`
	User     string `json:"user"`
	Password string `json:"password"`
	SSLMode  string `json:"sslmode"`
}

type ActionResult struct {
	OK bool `json:"ok"`
}

// App struct
type App struct {
	mu                 sync.RWMutex
	ctx                context.Context
	db                 *sqlx.DB
	startupHealth      StartupHealthResponse
	authHandler        *handlers.AuthHandler
	employeesHandler   *handlers.EmployeesHandler
	departmentsHandler *handlers.DepartmentsHandler
	leaveHandler       *handlers.LeaveHandler
	payrollHandler     *handlers.PayrollHandler
	usersHandler       *handlers.UsersHandler
	auditHandler       *handlers.AuditHandler
	dashboardHandler   *handlers.DashboardHandler
	attendanceHandler  *handlers.AttendanceHandler
	reportsHandler     *handlers.ReportsHandler
	settingsHandler    *handlers.SettingsHandler
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.refreshStartupHealth()

	a.mu.RLock()
	startupHealth := a.startupHealth
	a.mu.RUnlock()
	if !startupHealth.DBOk || !startupHealth.RuntimeOk {
		return
	}

	if err := a.bootstrap(ctx); err != nil {
		runtime.LogWarningf(ctx, "startup runtime bootstrap failed: %v", err)
	}
}

func (a *App) shutdown(_ context.Context) {
	a.mu.RLock()
	database := a.db
	a.mu.RUnlock()

	if database != nil {
		_ = database.Close()
	}
}

func (a *App) bootstrap(ctx context.Context) error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}
	if strings.TrimSpace(cfg.DBConnectionString) == "" {
		return fmt.Errorf("database connection is not configured")
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

	employeesRepo := employees.NewRepository(database)
	employeesService := employees.NewService(employeesRepo)
	employeesHandler := handlers.NewEmployeesHandler(authService, employeesService)
	departmentsRepo := departments.NewRepository(database)
	departmentsService := departments.NewService(departmentsRepo)
	departmentsHandler := handlers.NewDepartmentsHandler(authService, departmentsService)
	leaveRepo := leave.NewRepository(database)
	leaveService := leave.NewService(leaveRepo)
	leaveService.SetAuditRecorder(auditService)
	leaveHandler := handlers.NewLeaveHandler(authService, leaveService)
	attendanceRepo := attendance.NewRepository(database)
	attendanceService := attendance.NewService(attendanceRepo, leaveService)
	attendanceService.SetAuditRecorder(auditService)
	attendanceHandler := handlers.NewAttendanceHandler(authService, attendanceService)
	configDir, err := os.UserConfigDir()
	if err != nil {
		_ = database.Close()
		return fmt.Errorf("resolve user config dir: %w", err)
	}
	logoStore, err := settings.NewLocalLogoStore(filepath.Join(configDir, "hrpro", "logos"))
	if err != nil {
		_ = database.Close()
		return fmt.Errorf("create logo store: %w", err)
	}
	settingsRepo := settings.NewRepository(database)
	settingsService := settings.NewService(settingsRepo, logoStore)
	settingsHandler := handlers.NewSettingsHandler(authService, settingsService)
	attendanceService.SetLunchDefaultsProvider(settingsService)
	reportsRepo := reports.NewRepository(database)
	reportsService := reports.NewService(reportsRepo)
	reportsService.SetFormattingProvider(settingsService)
	reportsHandler := handlers.NewReportsHandler(authService, reportsService)
	payrollRepo := payroll.NewRepository(database)
	payrollService := payroll.NewService(payrollRepo)
	payrollService.SetAuditRecorder(auditService)
	payrollService.SetFormattingProvider(settingsService)
	payrollHandler := handlers.NewPayrollHandler(authService, payrollService)
	usersRepo := users.NewRepository(database)
	usersService := users.NewService(usersRepo)
	usersService.SetAuditRecorder(auditService)
	usersHandler := handlers.NewUsersHandler(authService, usersService)
	auditHandler := handlers.NewAuditHandler(authService, auditService)
	dashboardRepo := dashboard.NewRepository(database)
	dashboardService := dashboard.NewService(dashboardRepo)
	dashboardHandler := handlers.NewDashboardHandler(authService, dashboardService)

	authHandler := handlers.NewAuthHandler(authService)

	a.mu.Lock()
	oldDB := a.db
	a.db = database
	a.authHandler = authHandler
	a.employeesHandler = employeesHandler
	a.departmentsHandler = departmentsHandler
	a.leaveHandler = leaveHandler
	a.payrollHandler = payrollHandler
	a.usersHandler = usersHandler
	a.auditHandler = auditHandler
	a.dashboardHandler = dashboardHandler
	a.attendanceHandler = attendanceHandler
	a.reportsHandler = reportsHandler
	a.settingsHandler = settingsHandler
	a.mu.Unlock()

	if oldDB != nil && oldDB != database {
		_ = oldDB.Close()
	}

	return nil
}

func (a *App) setStartupHealth(health StartupHealthResponse) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.startupHealth = health
}

func (a *App) refreshStartupHealth() StartupHealthResponse {
	health := config.EvaluateStartupHealth()
	response := StartupHealthResponse{
		DBOk:         health.DBOk,
		RuntimeOk:    health.RuntimeOK,
		DBError:      strings.TrimSpace(health.DBError),
		RuntimeError: strings.TrimSpace(health.RuntimeError),
	}
	a.setStartupHealth(response)
	return response
}

func (a *App) GetStartupHealth() StartupHealthResponse {
	return a.refreshStartupHealth()
}

func (a *App) TestDatabaseConnection(params DatabaseConfigParams) (*ActionResult, error) {
	connectionParams := config.DatabaseConnectionParams{
		Host:     strings.TrimSpace(params.Host),
		Port:     params.Port,
		Database: strings.TrimSpace(params.Database),
		User:     strings.TrimSpace(params.User),
		Password: params.Password,
		SSLMode:  strings.TrimSpace(params.SSLMode),
	}
	if err := connectionParams.Validate(); err != nil {
		return nil, err
	}

	database, err := db.NewPool(connectionParams.ConnectionString())
	if err != nil {
		return nil, fmt.Errorf("create database pool: %w", err)
	}
	defer func() {
		_ = database.Close()
	}()

	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	if err := db.ValidateConnection(ctx, database); err != nil {
		return nil, err
	}

	return &ActionResult{OK: true}, nil
}

func (a *App) SaveDatabaseConfig(params DatabaseConfigParams) (*ActionResult, error) {
	connectionParams := config.DatabaseConnectionParams{
		Host:     strings.TrimSpace(params.Host),
		Port:     params.Port,
		Database: strings.TrimSpace(params.Database),
		User:     strings.TrimSpace(params.User),
		Password: params.Password,
		SSLMode:  strings.TrimSpace(params.SSLMode),
	}

	if err := config.SaveLocalDatabaseConfig(connectionParams); err != nil {
		return nil, fmt.Errorf("save database config: %w", err)
	}

	if _, err := config.EnsureJWTSecret(); err != nil {
		return nil, fmt.Errorf("ensure runtime secret: %w", err)
	}
	a.refreshStartupHealth()

	return &ActionResult{OK: true}, nil
}

func (a *App) ReloadConfigAndReconnect() (*ActionResult, error) {
	health := a.refreshStartupHealth()
	if !health.RuntimeOk {
		return nil, fmt.Errorf("runtime configuration is invalid: %s", health.RuntimeError)
	}
	if !health.DBOk {
		return nil, fmt.Errorf("database configuration is invalid: %s", health.DBError)
	}

	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()

	if err := a.bootstrap(ctx); err != nil {
		return nil, fmt.Errorf("reload config and reconnect: %w", err)
	}
	a.refreshStartupHealth()
	return &ActionResult{OK: true}, nil
}

func (a *App) getAuthHandler() (*handlers.AuthHandler, error) {
	a.mu.RLock()
	authHandler := a.authHandler
	a.mu.RUnlock()
	if authHandler != nil {
		return authHandler, nil
	}

	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()
	if err := a.bootstrap(ctx); err != nil {
		return nil, fmt.Errorf("database is not connected: %w", err)
	}

	a.mu.RLock()
	defer a.mu.RUnlock()
	if a.authHandler == nil {
		return nil, fmt.Errorf("database is not connected")
	}
	return a.authHandler, nil
}

func (a *App) Login(request handlers.LoginRequest) (*handlers.LoginResponse, error) {
	authHandler, err := a.getAuthHandler()
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return authHandler.Login(ctx, request)
}

func (a *App) Logout(request handlers.LogoutRequest) error {
	authHandler, err := a.getAuthHandler()
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return authHandler.Logout(ctx, request)
}

func (a *App) GetMe(accessToken string) (*handlers.GetMeResponse, error) {
	authHandler, err := a.getAuthHandler()
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return authHandler.GetMe(ctx, accessToken)
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

func (a *App) ExportPayrollBatchCSV(request handlers.PayrollBatchActionRequest) (*payroll.CSVExport, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.payrollHandler.ExportPayrollBatchCSV(ctx, request)
}

func (a *App) SaveFileWithDialog(request SaveFileWithDialogRequest) (*SaveFileWithDialogResult, error) {
	filename := strings.TrimSpace(request.SuggestedFilename)
	if filename == "" {
		filename = "export.csv"
	}

	options := runtime.SaveDialogOptions{
		Title:           "Save File",
		DefaultFilename: filename,
	}

	if strings.Contains(strings.ToLower(request.MimeType), "text/csv") {
		options.Filters = []runtime.FileFilter{
			{
				DisplayName: "CSV Files (*.csv)",
				Pattern:     "*.csv",
			},
		}
	}

	path, err := runtime.SaveFileDialog(a.ctx, options)
	if err != nil {
		return nil, fmt.Errorf("open save dialog: %w", err)
	}

	if strings.TrimSpace(path) == "" {
		return &SaveFileWithDialogResult{Cancelled: true}, nil
	}

	if err := os.WriteFile(path, request.DataBytes, 0o600); err != nil {
		return nil, fmt.Errorf("write file: %w", err)
	}

	return &SaveFileWithDialogResult{
		SavedPath: path,
		Cancelled: false,
	}, nil
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

func (a *App) ListEmployeeReport(request handlers.ListEmployeeReportRequest) (*reports.EmployeeReportListResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.reportsHandler.ListEmployeeReport(ctx, request)
}

func (a *App) ExportEmployeeReportCSV(request handlers.ExportEmployeeReportRequest) (*reports.CSVExport, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()
	return a.reportsHandler.ExportEmployeeReportCSV(ctx, request)
}

func (a *App) ListLeaveRequestsReport(request handlers.ListLeaveRequestsReportRequest) (*reports.LeaveRequestsReportListResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.reportsHandler.ListLeaveRequestsReport(ctx, request)
}

func (a *App) ExportLeaveRequestsReportCSV(request handlers.ExportLeaveRequestsReportRequest) (*reports.CSVExport, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()
	return a.reportsHandler.ExportLeaveRequestsReportCSV(ctx, request)
}

func (a *App) ListAttendanceSummaryReport(request handlers.ListAttendanceSummaryReportRequest) (*reports.AttendanceSummaryReportListResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.reportsHandler.ListAttendanceSummaryReport(ctx, request)
}

func (a *App) ExportAttendanceSummaryReportCSV(request handlers.ExportAttendanceSummaryReportRequest) (*reports.CSVExport, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()
	return a.reportsHandler.ExportAttendanceSummaryReportCSV(ctx, request)
}

func (a *App) ListPayrollBatchesReport(request handlers.ListPayrollBatchesReportRequest) (*reports.PayrollBatchesReportListResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.reportsHandler.ListPayrollBatchesReport(ctx, request)
}

func (a *App) ExportPayrollBatchesReportCSV(request handlers.ExportPayrollBatchesReportRequest) (*reports.CSVExport, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()
	return a.reportsHandler.ExportPayrollBatchesReportCSV(ctx, request)
}

func (a *App) ListAuditLogReport(request handlers.ListAuditLogReportRequest) (*reports.AuditLogReportListResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.reportsHandler.ListAuditLogReport(ctx, request)
}

func (a *App) ExportAuditLogReportCSV(request handlers.ExportAuditLogReportRequest) (*reports.CSVExport, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()
	return a.reportsHandler.ExportAuditLogReportCSV(ctx, request)
}

func (a *App) GetSettings(request handlers.GetSettingsRequest) (*settings.SettingsDTO, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.settingsHandler.GetSettings(ctx, request)
}

func (a *App) UpdateSettings(request handlers.UpdateSettingsRequest) (*settings.SettingsDTO, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.settingsHandler.UpdateSettings(ctx, request)
}

func (a *App) UploadCompanyLogo(request handlers.UploadCompanyLogoRequest) (string, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()
	return a.settingsHandler.UploadCompanyLogo(ctx, request)
}

func (a *App) GetCompanyLogo(request handlers.GetCompanyLogoRequest) (*settings.CompanyLogo, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()
	return a.settingsHandler.GetCompanyLogo(ctx, request)
}
