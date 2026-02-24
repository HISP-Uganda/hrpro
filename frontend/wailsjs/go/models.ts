export namespace attendance {
	
	export class AttendanceRecord {
	    id: number;
	    // Go type: time
	    attendanceDate: any;
	    employeeId: number;
	    status: string;
	    markedByUserId: number;
	    // Go type: time
	    markedAt: any;
	    isLocked: boolean;
	    lockReason?: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new AttendanceRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.attendanceDate = this.convertValues(source["attendanceDate"], null);
	        this.employeeId = source["employeeId"];
	        this.status = source["status"];
	        this.markedByUserId = source["markedByUserId"];
	        this.markedAt = this.convertValues(source["markedAt"], null);
	        this.isLocked = source["isLocked"];
	        this.lockReason = source["lockReason"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AttendanceRow {
	    employeeId: number;
	    employeeName: string;
	    departmentName?: string;
	    attendanceId?: number;
	    status: string;
	    isLocked: boolean;
	    canPostToLeave: boolean;
	    canEdit: boolean;
	    markedByUserId?: number;
	    // Go type: time
	    markedAt?: any;
	
	    static createFrom(source: any = {}) {
	        return new AttendanceRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.employeeId = source["employeeId"];
	        this.employeeName = source["employeeName"];
	        this.departmentName = source["departmentName"];
	        this.attendanceId = source["attendanceId"];
	        this.status = source["status"];
	        this.isLocked = source["isLocked"];
	        this.canPostToLeave = source["canPostToLeave"];
	        this.canEdit = source["canEdit"];
	        this.markedByUserId = source["markedByUserId"];
	        this.markedAt = this.convertValues(source["markedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LunchSummary {
	    attendanceDate: string;
	    staffPresentCount: number;
	    staffFieldCount: number;
	    visitorsCount: number;
	    totalPlates: number;
	    plateCostAmount: number;
	    totalCostAmount: number;
	    staffContributionAmount: number;
	    staffContributionTotal: number;
	    organizationBalance: number;
	    canEditVisitors: boolean;
	
	    static createFrom(source: any = {}) {
	        return new LunchSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.attendanceDate = source["attendanceDate"];
	        this.staffPresentCount = source["staffPresentCount"];
	        this.staffFieldCount = source["staffFieldCount"];
	        this.visitorsCount = source["visitorsCount"];
	        this.totalPlates = source["totalPlates"];
	        this.plateCostAmount = source["plateCostAmount"];
	        this.totalCostAmount = source["totalCostAmount"];
	        this.staffContributionAmount = source["staffContributionAmount"];
	        this.staffContributionTotal = source["staffContributionTotal"];
	        this.organizationBalance = source["organizationBalance"];
	        this.canEditVisitors = source["canEditVisitors"];
	    }
	}
	export class PostAbsentToLeaveResult {
	    success: boolean;
	    message: string;
	    leaveId?: number;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new PostAbsentToLeaveResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.leaveId = source["leaveId"];
	        this.status = source["status"];
	    }
	}

}

export namespace audit {
	
	export class AuditLog {
	    id: number;
	    actorUserId?: number;
	    action: string;
	    entityType?: string;
	    entityId?: number;
	    metadata: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new AuditLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.actorUserId = source["actorUserId"];
	        this.action = source["action"];
	        this.entityType = source["entityType"];
	        this.entityId = source["entityId"];
	        this.metadata = source["metadata"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListAuditLogsResult {
	    items: AuditLog[];
	    totalCount: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new ListAuditLogsResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], AuditLog);
	        this.totalCount = source["totalCount"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace dashboard {
	
	export class AuditEvent {
	    id: number;
	    actorUserId?: number;
	    actorUsername?: string;
	    action: string;
	    entityType?: string;
	    entityId?: number;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new AuditEvent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.actorUserId = source["actorUserId"];
	        this.actorUsername = source["actorUsername"];
	        this.action = source["action"];
	        this.entityType = source["entityType"];
	        this.entityId = source["entityId"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DepartmentHeadcount {
	    departmentName: string;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new DepartmentHeadcount(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.departmentName = source["departmentName"];
	        this.count = source["count"];
	    }
	}
	export class SummaryDTO {
	    totalEmployees: number;
	    activeEmployees: number;
	    inactiveEmployees: number;
	    pendingLeaveRequests: number;
	    approvedLeaveThisMonth: number;
	    employeesOnLeaveToday: number;
	    currentPayrollStatus?: string;
	    currentPayrollTotal?: number;
	    activeUsers?: number;
	    employeesPerDepartment: DepartmentHeadcount[];
	    recentAuditEvents: AuditEvent[];
	
	    static createFrom(source: any = {}) {
	        return new SummaryDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalEmployees = source["totalEmployees"];
	        this.activeEmployees = source["activeEmployees"];
	        this.inactiveEmployees = source["inactiveEmployees"];
	        this.pendingLeaveRequests = source["pendingLeaveRequests"];
	        this.approvedLeaveThisMonth = source["approvedLeaveThisMonth"];
	        this.employeesOnLeaveToday = source["employeesOnLeaveToday"];
	        this.currentPayrollStatus = source["currentPayrollStatus"];
	        this.currentPayrollTotal = source["currentPayrollTotal"];
	        this.activeUsers = source["activeUsers"];
	        this.employeesPerDepartment = this.convertValues(source["employeesPerDepartment"], DepartmentHeadcount);
	        this.recentAuditEvents = this.convertValues(source["recentAuditEvents"], AuditEvent);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace departments {
	
	export class Department {
	    id: number;
	    name: string;
	    description?: string;
	    employeeCount: number;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Department(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.employeeCount = source["employeeCount"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpsertDepartmentInput {
	    name: string;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpsertDepartmentInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	    }
	}

}

export namespace employees {
	
	export class Employee {
	    id: number;
	    firstName: string;
	    lastName: string;
	    otherName?: string;
	    gender?: string;
	    // Go type: time
	    dateOfBirth?: any;
	    phone?: string;
	    email?: string;
	    nationalId?: string;
	    address?: string;
	    departmentId?: number;
	    departmentName?: string;
	    position: string;
	    employmentStatus: string;
	    // Go type: time
	    dateOfHire: any;
	    baseSalaryAmount: number;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Employee(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.firstName = source["firstName"];
	        this.lastName = source["lastName"];
	        this.otherName = source["otherName"];
	        this.gender = source["gender"];
	        this.dateOfBirth = this.convertValues(source["dateOfBirth"], null);
	        this.phone = source["phone"];
	        this.email = source["email"];
	        this.nationalId = source["nationalId"];
	        this.address = source["address"];
	        this.departmentId = source["departmentId"];
	        this.departmentName = source["departmentName"];
	        this.position = source["position"];
	        this.employmentStatus = source["employmentStatus"];
	        this.dateOfHire = this.convertValues(source["dateOfHire"], null);
	        this.baseSalaryAmount = source["baseSalaryAmount"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpsertEmployeeInput {
	    firstName: string;
	    lastName: string;
	    otherName?: string;
	    gender?: string;
	    dateOfBirth?: string;
	    phone?: string;
	    email?: string;
	    nationalId?: string;
	    address?: string;
	    departmentId?: number;
	    position: string;
	    employmentStatus: string;
	    dateOfHire: string;
	    baseSalaryAmount: number;
	
	    static createFrom(source: any = {}) {
	        return new UpsertEmployeeInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.firstName = source["firstName"];
	        this.lastName = source["lastName"];
	        this.otherName = source["otherName"];
	        this.gender = source["gender"];
	        this.dateOfBirth = source["dateOfBirth"];
	        this.phone = source["phone"];
	        this.email = source["email"];
	        this.nationalId = source["nationalId"];
	        this.address = source["address"];
	        this.departmentId = source["departmentId"];
	        this.position = source["position"];
	        this.employmentStatus = source["employmentStatus"];
	        this.dateOfHire = source["dateOfHire"];
	        this.baseSalaryAmount = source["baseSalaryAmount"];
	    }
	}

}

export namespace handlers {
	
	export class ApplyLeaveRequest {
	    accessToken: string;
	    payload: leave.ApplyLeaveInput;
	
	    static createFrom(source: any = {}) {
	        return new ApplyLeaveRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.payload = this.convertValues(source["payload"], leave.ApplyLeaveInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateDepartmentRequest {
	    accessToken: string;
	    payload: departments.UpsertDepartmentInput;
	
	    static createFrom(source: any = {}) {
	        return new CreateDepartmentRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.payload = this.convertValues(source["payload"], departments.UpsertDepartmentInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateEmployeeRequest {
	    accessToken: string;
	    payload: employees.UpsertEmployeeInput;
	
	    static createFrom(source: any = {}) {
	        return new CreateEmployeeRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.payload = this.convertValues(source["payload"], employees.UpsertEmployeeInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateLeaveTypeRequest {
	    accessToken: string;
	    payload: leave.LeaveTypeUpsertInput;
	
	    static createFrom(source: any = {}) {
	        return new CreateLeaveTypeRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.payload = this.convertValues(source["payload"], leave.LeaveTypeUpsertInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreatePayrollBatchRequest {
	    accessToken: string;
	    payload: payroll.CreateBatchInput;
	
	    static createFrom(source: any = {}) {
	        return new CreatePayrollBatchRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.payload = this.convertValues(source["payload"], payroll.CreateBatchInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateUserRequest {
	    accessToken: string;
	    payload: users.CreateUserInput;
	
	    static createFrom(source: any = {}) {
	        return new CreateUserRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.payload = this.convertValues(source["payload"], users.CreateUserInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DeleteDepartmentRequest {
	    accessToken: string;
	    id: number;
	
	    static createFrom(source: any = {}) {
	        return new DeleteDepartmentRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	    }
	}
	export class DeleteEmployeeRequest {
	    accessToken: string;
	    id: number;
	
	    static createFrom(source: any = {}) {
	        return new DeleteEmployeeRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	    }
	}
	export class DepartmentListResponse {
	    items: departments.Department[];
	    totalCount: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new DepartmentListResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], departments.Department);
	        this.totalCount = source["totalCount"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EmployeeListResponse {
	    items: employees.Employee[];
	    totalCount: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new EmployeeListResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], employees.Employee);
	        this.totalCount = source["totalCount"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExportAttendanceSummaryReportRequest {
	    accessToken: string;
	    filters: reports.AttendanceSummaryFilter;
	
	    static createFrom(source: any = {}) {
	        return new ExportAttendanceSummaryReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filters = this.convertValues(source["filters"], reports.AttendanceSummaryFilter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExportAuditLogReportRequest {
	    accessToken: string;
	    filters: reports.AuditLogFilter;
	
	    static createFrom(source: any = {}) {
	        return new ExportAuditLogReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filters = this.convertValues(source["filters"], reports.AuditLogFilter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExportEmployeeReportRequest {
	    accessToken: string;
	    filters: reports.EmployeeListFilter;
	
	    static createFrom(source: any = {}) {
	        return new ExportEmployeeReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filters = this.convertValues(source["filters"], reports.EmployeeListFilter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExportLeaveRequestsReportRequest {
	    accessToken: string;
	    filters: reports.LeaveRequestsFilter;
	
	    static createFrom(source: any = {}) {
	        return new ExportLeaveRequestsReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filters = this.convertValues(source["filters"], reports.LeaveRequestsFilter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExportPayrollBatchesReportRequest {
	    accessToken: string;
	    filters: reports.PayrollBatchesFilter;
	
	    static createFrom(source: any = {}) {
	        return new ExportPayrollBatchesReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filters = this.convertValues(source["filters"], reports.PayrollBatchesFilter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetCompanyLogoRequest {
	    accessToken: string;
	
	    static createFrom(source: any = {}) {
	        return new GetCompanyLogoRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	    }
	}
	export class GetDashboardSummaryRequest {
	    accessToken: string;
	
	    static createFrom(source: any = {}) {
	        return new GetDashboardSummaryRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	    }
	}
	export class GetDepartmentRequest {
	    accessToken: string;
	    id: number;
	
	    static createFrom(source: any = {}) {
	        return new GetDepartmentRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	    }
	}
	export class GetEmployeeRequest {
	    accessToken: string;
	    id: number;
	
	    static createFrom(source: any = {}) {
	        return new GetEmployeeRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	    }
	}
	export class GetLunchSummaryRequest {
	    accessToken: string;
	    date: string;
	
	    static createFrom(source: any = {}) {
	        return new GetLunchSummaryRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.date = source["date"];
	    }
	}
	export class UserDTO {
	    id: number;
	    username: string;
	    role: string;
	
	    static createFrom(source: any = {}) {
	        return new UserDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.username = source["username"];
	        this.role = source["role"];
	    }
	}
	export class GetMeResponse {
	    user: UserDTO;
	
	    static createFrom(source: any = {}) {
	        return new GetMeResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.user = this.convertValues(source["user"], UserDTO);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetMyAttendanceRangeRequest {
	    accessToken: string;
	    startDate: string;
	    endDate: string;
	
	    static createFrom(source: any = {}) {
	        return new GetMyAttendanceRangeRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.startDate = source["startDate"];
	        this.endDate = source["endDate"];
	    }
	}
	export class GetPayrollBatchRequest {
	    accessToken: string;
	    batchId: number;
	
	    static createFrom(source: any = {}) {
	        return new GetPayrollBatchRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.batchId = source["batchId"];
	    }
	}
	export class GetSettingsRequest {
	    accessToken: string;
	
	    static createFrom(source: any = {}) {
	        return new GetSettingsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	    }
	}
	export class GetUserRequest {
	    accessToken: string;
	    id: number;
	
	    static createFrom(source: any = {}) {
	        return new GetUserRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	    }
	}
	export class LeaveActionRequest {
	    accessToken: string;
	    id: number;
	
	    static createFrom(source: any = {}) {
	        return new LeaveActionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	    }
	}
	export class LeaveBalanceRequest {
	    accessToken: string;
	    employeeId: number;
	    year: number;
	
	    static createFrom(source: any = {}) {
	        return new LeaveBalanceRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.employeeId = source["employeeId"];
	        this.year = source["year"];
	    }
	}
	export class ListAttendanceByDateRequest {
	    accessToken: string;
	    date: string;
	
	    static createFrom(source: any = {}) {
	        return new ListAttendanceByDateRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.date = source["date"];
	    }
	}
	export class ListAttendanceSummaryReportRequest {
	    accessToken: string;
	    filters: reports.AttendanceSummaryFilter;
	    pager: reports.PagerInput;
	
	    static createFrom(source: any = {}) {
	        return new ListAttendanceSummaryReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filters = this.convertValues(source["filters"], reports.AttendanceSummaryFilter);
	        this.pager = this.convertValues(source["pager"], reports.PagerInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListAuditLogReportRequest {
	    accessToken: string;
	    filters: reports.AuditLogFilter;
	    pager: reports.PagerInput;
	
	    static createFrom(source: any = {}) {
	        return new ListAuditLogReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filters = this.convertValues(source["filters"], reports.AuditLogFilter);
	        this.pager = this.convertValues(source["pager"], reports.PagerInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListAuditLogsRequest {
	    accessToken: string;
	    page: number;
	    pageSize: number;
	    q: string;
	
	    static createFrom(source: any = {}) {
	        return new ListAuditLogsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.q = source["q"];
	    }
	}
	export class ListDepartmentsRequest {
	    accessToken: string;
	    page: number;
	    pageSize: number;
	    q: string;
	
	    static createFrom(source: any = {}) {
	        return new ListDepartmentsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.q = source["q"];
	    }
	}
	export class ListEmployeeReportRequest {
	    accessToken: string;
	    filters: reports.EmployeeListFilter;
	    pager: reports.PagerInput;
	
	    static createFrom(source: any = {}) {
	        return new ListEmployeeReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filters = this.convertValues(source["filters"], reports.EmployeeListFilter);
	        this.pager = this.convertValues(source["pager"], reports.PagerInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListEmployeesRequest {
	    accessToken: string;
	    page: number;
	    pageSize: number;
	    q: string;
	    status: string;
	    departmentId?: number;
	
	    static createFrom(source: any = {}) {
	        return new ListEmployeesRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.q = source["q"];
	        this.status = source["status"];
	        this.departmentId = source["departmentId"];
	    }
	}
	export class ListLeaveRequestsReportRequest {
	    accessToken: string;
	    filters: reports.LeaveRequestsFilter;
	    pager: reports.PagerInput;
	
	    static createFrom(source: any = {}) {
	        return new ListLeaveRequestsReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filters = this.convertValues(source["filters"], reports.LeaveRequestsFilter);
	        this.pager = this.convertValues(source["pager"], reports.PagerInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListLeaveRequestsRequest {
	    accessToken: string;
	    filter: leave.ListLeaveRequestsFilter;
	
	    static createFrom(source: any = {}) {
	        return new ListLeaveRequestsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filter = this.convertValues(source["filter"], leave.ListLeaveRequestsFilter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListLeaveTypesRequest {
	    accessToken: string;
	    activeOnly: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ListLeaveTypesRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.activeOnly = source["activeOnly"];
	    }
	}
	export class ListLockedDatesRequest {
	    accessToken: string;
	    year: number;
	
	    static createFrom(source: any = {}) {
	        return new ListLockedDatesRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.year = source["year"];
	    }
	}
	export class ListPayrollBatchesReportRequest {
	    accessToken: string;
	    filters: reports.PayrollBatchesFilter;
	    pager: reports.PagerInput;
	
	    static createFrom(source: any = {}) {
	        return new ListPayrollBatchesReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filters = this.convertValues(source["filters"], reports.PayrollBatchesFilter);
	        this.pager = this.convertValues(source["pager"], reports.PagerInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListPayrollBatchesRequest {
	    accessToken: string;
	    filter: payroll.ListBatchesFilter;
	
	    static createFrom(source: any = {}) {
	        return new ListPayrollBatchesRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filter = this.convertValues(source["filter"], payroll.ListBatchesFilter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListUsersRequest {
	    accessToken: string;
	    page: number;
	    pageSize: number;
	    q: string;
	
	    static createFrom(source: any = {}) {
	        return new ListUsersRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.q = source["q"];
	    }
	}
	export class LockDateRequest {
	    accessToken: string;
	    date: string;
	    reason: string;
	
	    static createFrom(source: any = {}) {
	        return new LockDateRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.date = source["date"];
	        this.reason = source["reason"];
	    }
	}
	export class LoginRequest {
	    username: string;
	    password: string;
	
	    static createFrom(source: any = {}) {
	        return new LoginRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.password = source["password"];
	    }
	}
	export class LoginResponse {
	    accessToken: string;
	    refreshToken: string;
	    user: UserDTO;
	
	    static createFrom(source: any = {}) {
	        return new LoginResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.refreshToken = source["refreshToken"];
	        this.user = this.convertValues(source["user"], UserDTO);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LogoutRequest {
	    refreshToken: string;
	
	    static createFrom(source: any = {}) {
	        return new LogoutRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.refreshToken = source["refreshToken"];
	    }
	}
	export class PayrollBatchActionRequest {
	    accessToken: string;
	    batchId: number;
	
	    static createFrom(source: any = {}) {
	        return new PayrollBatchActionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.batchId = source["batchId"];
	    }
	}
	export class PostAbsentToLeaveRequest {
	    accessToken: string;
	    date: string;
	    employeeId: number;
	
	    static createFrom(source: any = {}) {
	        return new PostAbsentToLeaveRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.date = source["date"];
	        this.employeeId = source["employeeId"];
	    }
	}
	export class RefreshRequest {
	    refreshToken: string;
	
	    static createFrom(source: any = {}) {
	        return new RefreshRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.refreshToken = source["refreshToken"];
	    }
	}
	export class RejectLeaveRequest {
	    accessToken: string;
	    id: number;
	    reason?: string;
	
	    static createFrom(source: any = {}) {
	        return new RejectLeaveRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	        this.reason = source["reason"];
	    }
	}
	export class ResetUserPasswordRequest {
	    accessToken: string;
	    id: number;
	    payload: users.ResetUserPasswordInput;
	
	    static createFrom(source: any = {}) {
	        return new ResetUserPasswordRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	        this.payload = this.convertValues(source["payload"], users.ResetUserPasswordInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SetLeaveTypeActiveRequest {
	    accessToken: string;
	    id: number;
	    active: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SetLeaveTypeActiveRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	        this.active = source["active"];
	    }
	}
	export class SetUserActiveRequest {
	    accessToken: string;
	    id: number;
	    active: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SetUserActiveRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	        this.active = source["active"];
	    }
	}
	export class UnlockDateRequest {
	    accessToken: string;
	    date: string;
	
	    static createFrom(source: any = {}) {
	        return new UnlockDateRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.date = source["date"];
	    }
	}
	export class UpdateDepartmentRequest {
	    accessToken: string;
	    id: number;
	    payload: departments.UpsertDepartmentInput;
	
	    static createFrom(source: any = {}) {
	        return new UpdateDepartmentRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	        this.payload = this.convertValues(source["payload"], departments.UpsertDepartmentInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateEmployeeRequest {
	    accessToken: string;
	    id: number;
	    payload: employees.UpsertEmployeeInput;
	
	    static createFrom(source: any = {}) {
	        return new UpdateEmployeeRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	        this.payload = this.convertValues(source["payload"], employees.UpsertEmployeeInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateLeaveTypeRequest {
	    accessToken: string;
	    id: number;
	    payload: leave.LeaveTypeUpsertInput;
	
	    static createFrom(source: any = {}) {
	        return new UpdateLeaveTypeRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	        this.payload = this.convertValues(source["payload"], leave.LeaveTypeUpsertInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdatePayrollEntryAmountsRequest {
	    accessToken: string;
	    entryId: number;
	    payload: payroll.UpdateEntryAmountsInput;
	
	    static createFrom(source: any = {}) {
	        return new UpdatePayrollEntryAmountsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.entryId = source["entryId"];
	        this.payload = this.convertValues(source["payload"], payroll.UpdateEntryAmountsInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateSettingsRequest {
	    accessToken: string;
	    payload: settings.UpdateSettingsInput;
	
	    static createFrom(source: any = {}) {
	        return new UpdateSettingsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.payload = this.convertValues(source["payload"], settings.UpdateSettingsInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateUserRequest {
	    accessToken: string;
	    id: number;
	    payload: users.UpdateUserInput;
	
	    static createFrom(source: any = {}) {
	        return new UpdateUserRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.id = source["id"];
	        this.payload = this.convertValues(source["payload"], users.UpdateUserInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UploadCompanyLogoRequest {
	    accessToken: string;
	    filename: string;
	    data: number[];
	
	    static createFrom(source: any = {}) {
	        return new UploadCompanyLogoRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.filename = source["filename"];
	        this.data = source["data"];
	    }
	}
	export class UpsertAttendanceRequest {
	    accessToken: string;
	    date: string;
	    employeeId: number;
	    status: string;
	    reason?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpsertAttendanceRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.date = source["date"];
	        this.employeeId = source["employeeId"];
	        this.status = source["status"];
	        this.reason = source["reason"];
	    }
	}
	export class UpsertEntitlementRequest {
	    accessToken: string;
	    payload: leave.UpsertEntitlementInput;
	
	    static createFrom(source: any = {}) {
	        return new UpsertEntitlementRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.payload = this.convertValues(source["payload"], leave.UpsertEntitlementInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpsertLunchVisitorsRequest {
	    accessToken: string;
	    date: string;
	    visitorsCount: number;
	
	    static createFrom(source: any = {}) {
	        return new UpsertLunchVisitorsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.date = source["date"];
	        this.visitorsCount = source["visitorsCount"];
	    }
	}

}

export namespace leave {
	
	export class ApplyLeaveInput {
	    leaveTypeId: number;
	    startDate: string;
	    endDate: string;
	    reason?: string;
	
	    static createFrom(source: any = {}) {
	        return new ApplyLeaveInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.leaveTypeId = source["leaveTypeId"];
	        this.startDate = source["startDate"];
	        this.endDate = source["endDate"];
	        this.reason = source["reason"];
	    }
	}
	export class LeaveBalance {
	    employeeId: number;
	    year: number;
	    totalDays: number;
	    reservedDays: number;
	    approvedDays: number;
	    pendingDays: number;
	    availableDays: number;
	
	    static createFrom(source: any = {}) {
	        return new LeaveBalance(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.employeeId = source["employeeId"];
	        this.year = source["year"];
	        this.totalDays = source["totalDays"];
	        this.reservedDays = source["reservedDays"];
	        this.approvedDays = source["approvedDays"];
	        this.pendingDays = source["pendingDays"];
	        this.availableDays = source["availableDays"];
	    }
	}
	export class LeaveEntitlement {
	    id: number;
	    employeeId: number;
	    year: number;
	    totalDays: number;
	    reservedDays: number;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new LeaveEntitlement(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.employeeId = source["employeeId"];
	        this.year = source["year"];
	        this.totalDays = source["totalDays"];
	        this.reservedDays = source["reservedDays"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LeaveLockedDate {
	    id: number;
	    // Go type: time
	    date: any;
	    reason?: string;
	    createdBy?: number;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new LeaveLockedDate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.date = this.convertValues(source["date"], null);
	        this.reason = source["reason"];
	        this.createdBy = source["createdBy"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LeaveRequest {
	    id: number;
	    employeeId: number;
	    employeeName: string;
	    departmentName?: string;
	    leaveTypeId: number;
	    leaveTypeName: string;
	    // Go type: time
	    startDate: any;
	    // Go type: time
	    endDate: any;
	    workingDays: number;
	    status: string;
	    reason?: string;
	    approvedBy?: number;
	    // Go type: time
	    approvedAt?: any;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new LeaveRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.employeeId = source["employeeId"];
	        this.employeeName = source["employeeName"];
	        this.departmentName = source["departmentName"];
	        this.leaveTypeId = source["leaveTypeId"];
	        this.leaveTypeName = source["leaveTypeName"];
	        this.startDate = this.convertValues(source["startDate"], null);
	        this.endDate = this.convertValues(source["endDate"], null);
	        this.workingDays = source["workingDays"];
	        this.status = source["status"];
	        this.reason = source["reason"];
	        this.approvedBy = source["approvedBy"];
	        this.approvedAt = this.convertValues(source["approvedAt"], null);
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LeaveType {
	    id: number;
	    name: string;
	    paid: boolean;
	    countsTowardEntitlement: boolean;
	    requiresAttachment: boolean;
	    requiresApproval: boolean;
	    active: boolean;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new LeaveType(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.paid = source["paid"];
	        this.countsTowardEntitlement = source["countsTowardEntitlement"];
	        this.requiresAttachment = source["requiresAttachment"];
	        this.requiresApproval = source["requiresApproval"];
	        this.active = source["active"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LeaveTypeUpsertInput {
	    name: string;
	    paid: boolean;
	    countsTowardEntitlement: boolean;
	    requiresAttachment: boolean;
	    requiresApproval: boolean;
	
	    static createFrom(source: any = {}) {
	        return new LeaveTypeUpsertInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.paid = source["paid"];
	        this.countsTowardEntitlement = source["countsTowardEntitlement"];
	        this.requiresAttachment = source["requiresAttachment"];
	        this.requiresApproval = source["requiresApproval"];
	    }
	}
	export class ListLeaveRequestsFilter {
	    status: string;
	    dateFrom: string;
	    dateTo: string;
	    employee: string;
	    leaveType: string;
	    dept: string;
	
	    static createFrom(source: any = {}) {
	        return new ListLeaveRequestsFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.dateFrom = source["dateFrom"];
	        this.dateTo = source["dateTo"];
	        this.employee = source["employee"];
	        this.leaveType = source["leaveType"];
	        this.dept = source["dept"];
	    }
	}
	export class UpsertEntitlementInput {
	    employeeId: number;
	    year: number;
	    totalDays: number;
	    reservedDays: number;
	
	    static createFrom(source: any = {}) {
	        return new UpsertEntitlementInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.employeeId = source["employeeId"];
	        this.year = source["year"];
	        this.totalDays = source["totalDays"];
	        this.reservedDays = source["reservedDays"];
	    }
	}

}

export namespace main {
	
	export class ActionResult {
	    ok: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ActionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	    }
	}
	export class DatabaseConfigParams {
	    host: string;
	    port: number;
	    database: string;
	    user: string;
	    password: string;
	    sslmode: string;
	
	    static createFrom(source: any = {}) {
	        return new DatabaseConfigParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.host = source["host"];
	        this.port = source["port"];
	        this.database = source["database"];
	        this.user = source["user"];
	        this.password = source["password"];
	        this.sslmode = source["sslmode"];
	    }
	}
	export class SaveFileWithDialogRequest {
	    suggestedFilename: string;
	    dataBytes: number[];
	    mimeType: string;
	
	    static createFrom(source: any = {}) {
	        return new SaveFileWithDialogRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.suggestedFilename = source["suggestedFilename"];
	        this.dataBytes = source["dataBytes"];
	        this.mimeType = source["mimeType"];
	    }
	}
	export class SaveFileWithDialogResult {
	    savedPath: string;
	    cancelled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SaveFileWithDialogResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.savedPath = source["savedPath"];
	        this.cancelled = source["cancelled"];
	    }
	}
	export class StartupHealthResponse {
	    dbOk: boolean;
	    runtimeOk: boolean;
	    dbError?: string;
	    runtimeError?: string;
	
	    static createFrom(source: any = {}) {
	        return new StartupHealthResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dbOk = source["dbOk"];
	        this.runtimeOk = source["runtimeOk"];
	        this.dbError = source["dbError"];
	        this.runtimeError = source["runtimeError"];
	    }
	}

}

export namespace payroll {
	
	export class CSVExport {
	    filename: string;
	    data: string;
	    mimeType: string;
	
	    static createFrom(source: any = {}) {
	        return new CSVExport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filename = source["filename"];
	        this.data = source["data"];
	        this.mimeType = source["mimeType"];
	    }
	}
	export class CreateBatchInput {
	    month: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateBatchInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.month = source["month"];
	    }
	}
	export class ListBatchesFilter {
	    month: string;
	    status: string;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new ListBatchesFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.month = source["month"];
	        this.status = source["status"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	}
	export class PayrollBatch {
	    id: number;
	    month: string;
	    status: string;
	    createdBy: number;
	    // Go type: time
	    createdAt: any;
	    approvedBy?: number;
	    // Go type: time
	    approvedAt?: any;
	    // Go type: time
	    lockedAt?: any;
	
	    static createFrom(source: any = {}) {
	        return new PayrollBatch(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.month = source["month"];
	        this.status = source["status"];
	        this.createdBy = source["createdBy"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.approvedBy = source["approvedBy"];
	        this.approvedAt = this.convertValues(source["approvedAt"], null);
	        this.lockedAt = this.convertValues(source["lockedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListBatchesResult {
	    items: PayrollBatch[];
	    totalCount: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new ListBatchesResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], PayrollBatch);
	        this.totalCount = source["totalCount"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class PayrollEntry {
	    id: number;
	    batchId: number;
	    employeeId: number;
	    employeeName: string;
	    baseSalary: number;
	    allowancesTotal: number;
	    deductionsTotal: number;
	    taxTotal: number;
	    grossPay: number;
	    netPay: number;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new PayrollEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.batchId = source["batchId"];
	        this.employeeId = source["employeeId"];
	        this.employeeName = source["employeeName"];
	        this.baseSalary = source["baseSalary"];
	        this.allowancesTotal = source["allowancesTotal"];
	        this.deductionsTotal = source["deductionsTotal"];
	        this.taxTotal = source["taxTotal"];
	        this.grossPay = source["grossPay"];
	        this.netPay = source["netPay"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PayrollBatchDetail {
	    batch: PayrollBatch;
	    entries: PayrollEntry[];
	
	    static createFrom(source: any = {}) {
	        return new PayrollBatchDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.batch = this.convertValues(source["batch"], PayrollBatch);
	        this.entries = this.convertValues(source["entries"], PayrollEntry);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class UpdateEntryAmountsInput {
	    allowancesTotal: number;
	    deductionsTotal: number;
	    taxTotal: number;
	
	    static createFrom(source: any = {}) {
	        return new UpdateEntryAmountsInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.allowancesTotal = source["allowancesTotal"];
	        this.deductionsTotal = source["deductionsTotal"];
	        this.taxTotal = source["taxTotal"];
	    }
	}

}

export namespace reports {
	
	export class AttendanceSummaryFilter {
	    dateFrom: string;
	    dateTo: string;
	    departmentId?: number;
	    employeeId?: number;
	
	    static createFrom(source: any = {}) {
	        return new AttendanceSummaryFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dateFrom = source["dateFrom"];
	        this.dateTo = source["dateTo"];
	        this.departmentId = source["departmentId"];
	        this.employeeId = source["employeeId"];
	    }
	}
	export class Pager {
	    page: number;
	    pageSize: number;
	    totalCount: number;
	
	    static createFrom(source: any = {}) {
	        return new Pager(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.totalCount = source["totalCount"];
	    }
	}
	export class AttendanceSummaryReportRow {
	    employeeId: number;
	    employeeName: string;
	    departmentName: string;
	    presentCount: number;
	    lateCount: number;
	    fieldCount: number;
	    absentCount: number;
	    leaveCount: number;
	    unmarkedCount: number;
	
	    static createFrom(source: any = {}) {
	        return new AttendanceSummaryReportRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.employeeId = source["employeeId"];
	        this.employeeName = source["employeeName"];
	        this.departmentName = source["departmentName"];
	        this.presentCount = source["presentCount"];
	        this.lateCount = source["lateCount"];
	        this.fieldCount = source["fieldCount"];
	        this.absentCount = source["absentCount"];
	        this.leaveCount = source["leaveCount"];
	        this.unmarkedCount = source["unmarkedCount"];
	    }
	}
	export class AttendanceSummaryReportListResult {
	    rows: AttendanceSummaryReportRow[];
	    pager: Pager;
	
	    static createFrom(source: any = {}) {
	        return new AttendanceSummaryReportListResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rows = this.convertValues(source["rows"], AttendanceSummaryReportRow);
	        this.pager = this.convertValues(source["pager"], Pager);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class AuditLogFilter {
	    dateFrom: string;
	    dateTo: string;
	    actorUserId?: number;
	    action: string;
	    entityType: string;
	
	    static createFrom(source: any = {}) {
	        return new AuditLogFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dateFrom = source["dateFrom"];
	        this.dateTo = source["dateTo"];
	        this.actorUserId = source["actorUserId"];
	        this.action = source["action"];
	        this.entityType = source["entityType"];
	    }
	}
	export class AuditLogReportRow {
	    // Go type: time
	    createdAt: any;
	    actorUsername: string;
	    action: string;
	    entityType: string;
	    entityId?: number;
	    metadataJson: string;
	
	    static createFrom(source: any = {}) {
	        return new AuditLogReportRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.actorUsername = source["actorUsername"];
	        this.action = source["action"];
	        this.entityType = source["entityType"];
	        this.entityId = source["entityId"];
	        this.metadataJson = source["metadataJson"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AuditLogReportListResult {
	    rows: AuditLogReportRow[];
	    pager: Pager;
	
	    static createFrom(source: any = {}) {
	        return new AuditLogReportListResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rows = this.convertValues(source["rows"], AuditLogReportRow);
	        this.pager = this.convertValues(source["pager"], Pager);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class CSVExport {
	    filename: string;
	    data: string;
	    mimeType: string;
	
	    static createFrom(source: any = {}) {
	        return new CSVExport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filename = source["filename"];
	        this.data = source["data"];
	        this.mimeType = source["mimeType"];
	    }
	}
	export class EmployeeListFilter {
	    departmentId?: number;
	    employmentStatus: string;
	    q: string;
	
	    static createFrom(source: any = {}) {
	        return new EmployeeListFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.departmentId = source["departmentId"];
	        this.employmentStatus = source["employmentStatus"];
	        this.q = source["q"];
	    }
	}
	export class EmployeeReportRow {
	    employeeName: string;
	    departmentName: string;
	    position: string;
	    status: string;
	    // Go type: time
	    dateOfHire: any;
	    phone: string;
	    email: string;
	    baseSalaryAmount?: number;
	
	    static createFrom(source: any = {}) {
	        return new EmployeeReportRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.employeeName = source["employeeName"];
	        this.departmentName = source["departmentName"];
	        this.position = source["position"];
	        this.status = source["status"];
	        this.dateOfHire = this.convertValues(source["dateOfHire"], null);
	        this.phone = source["phone"];
	        this.email = source["email"];
	        this.baseSalaryAmount = source["baseSalaryAmount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EmployeeReportListResult {
	    rows: EmployeeReportRow[];
	    pager: Pager;
	
	    static createFrom(source: any = {}) {
	        return new EmployeeReportListResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rows = this.convertValues(source["rows"], EmployeeReportRow);
	        this.pager = this.convertValues(source["pager"], Pager);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class LeaveRequestsFilter {
	    dateFrom: string;
	    dateTo: string;
	    departmentId?: number;
	    employeeId?: number;
	    leaveTypeId?: number;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new LeaveRequestsFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dateFrom = source["dateFrom"];
	        this.dateTo = source["dateTo"];
	        this.departmentId = source["departmentId"];
	        this.employeeId = source["employeeId"];
	        this.leaveTypeId = source["leaveTypeId"];
	        this.status = source["status"];
	    }
	}
	export class LeaveRequestsReportRow {
	    employeeName: string;
	    departmentName: string;
	    leaveType: string;
	    // Go type: time
	    startDate: any;
	    // Go type: time
	    endDate: any;
	    workingDays: number;
	    status: string;
	    approvedBy?: string;
	    // Go type: time
	    approvedAt?: any;
	
	    static createFrom(source: any = {}) {
	        return new LeaveRequestsReportRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.employeeName = source["employeeName"];
	        this.departmentName = source["departmentName"];
	        this.leaveType = source["leaveType"];
	        this.startDate = this.convertValues(source["startDate"], null);
	        this.endDate = this.convertValues(source["endDate"], null);
	        this.workingDays = source["workingDays"];
	        this.status = source["status"];
	        this.approvedBy = source["approvedBy"];
	        this.approvedAt = this.convertValues(source["approvedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LeaveRequestsReportListResult {
	    rows: LeaveRequestsReportRow[];
	    pager: Pager;
	
	    static createFrom(source: any = {}) {
	        return new LeaveRequestsReportListResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rows = this.convertValues(source["rows"], LeaveRequestsReportRow);
	        this.pager = this.convertValues(source["pager"], Pager);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class PagerInput {
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new PagerInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	}
	export class PayrollBatchesFilter {
	    monthFrom: string;
	    monthTo: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new PayrollBatchesFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.monthFrom = source["monthFrom"];
	        this.monthTo = source["monthTo"];
	        this.status = source["status"];
	    }
	}
	export class PayrollBatchesReportRow {
	    month: string;
	    status: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    approvedAt?: any;
	    // Go type: time
	    lockedAt?: any;
	    entriesCount: number;
	    totalNetPay: number;
	
	    static createFrom(source: any = {}) {
	        return new PayrollBatchesReportRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.month = source["month"];
	        this.status = source["status"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.approvedAt = this.convertValues(source["approvedAt"], null);
	        this.lockedAt = this.convertValues(source["lockedAt"], null);
	        this.entriesCount = source["entriesCount"];
	        this.totalNetPay = source["totalNetPay"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PayrollBatchesReportListResult {
	    rows: PayrollBatchesReportRow[];
	    pager: Pager;
	
	    static createFrom(source: any = {}) {
	        return new PayrollBatchesReportListResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rows = this.convertValues(source["rows"], PayrollBatchesReportRow);
	        this.pager = this.convertValues(source["pager"], Pager);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace settings {
	
	export class CompanyLogo {
	    filename: string;
	    mimeType: string;
	    data: number[];
	
	    static createFrom(source: any = {}) {
	        return new CompanyLogo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filename = source["filename"];
	        this.mimeType = source["mimeType"];
	        this.data = source["data"];
	    }
	}
	export class CompanyProfileSettings {
	    name: string;
	    logoPath?: string;
	
	    static createFrom(source: any = {}) {
	        return new CompanyProfileSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.logoPath = source["logoPath"];
	    }
	}
	export class CompanyProfileSettingsInput {
	    name: string;
	    logoPath?: string;
	
	    static createFrom(source: any = {}) {
	        return new CompanyProfileSettingsInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.logoPath = source["logoPath"];
	    }
	}
	export class CurrencySettings {
	    code: string;
	    symbol: string;
	    decimals: number;
	
	    static createFrom(source: any = {}) {
	        return new CurrencySettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.code = source["code"];
	        this.symbol = source["symbol"];
	        this.decimals = source["decimals"];
	    }
	}
	export class LunchDefaultsSettings {
	    plateCostAmount: number;
	    staffContributionAmount: number;
	
	    static createFrom(source: any = {}) {
	        return new LunchDefaultsSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.plateCostAmount = source["plateCostAmount"];
	        this.staffContributionAmount = source["staffContributionAmount"];
	    }
	}
	export class PayrollDisplaySettings {
	    decimals: number;
	    roundingEnabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PayrollDisplaySettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.decimals = source["decimals"];
	        this.roundingEnabled = source["roundingEnabled"];
	    }
	}
	export class SettingsDTO {
	    company: CompanyProfileSettings;
	    currency: CurrencySettings;
	    lunchDefaults: LunchDefaultsSettings;
	    payrollDisplay: PayrollDisplaySettings;
	
	    static createFrom(source: any = {}) {
	        return new SettingsDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.company = this.convertValues(source["company"], CompanyProfileSettings);
	        this.currency = this.convertValues(source["currency"], CurrencySettings);
	        this.lunchDefaults = this.convertValues(source["lunchDefaults"], LunchDefaultsSettings);
	        this.payrollDisplay = this.convertValues(source["payrollDisplay"], PayrollDisplaySettings);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateSettingsInput {
	    company: CompanyProfileSettingsInput;
	    currency: CurrencySettings;
	    lunchDefaults: LunchDefaultsSettings;
	    payrollDisplay: PayrollDisplaySettings;
	
	    static createFrom(source: any = {}) {
	        return new UpdateSettingsInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.company = this.convertValues(source["company"], CompanyProfileSettingsInput);
	        this.currency = this.convertValues(source["currency"], CurrencySettings);
	        this.lunchDefaults = this.convertValues(source["lunchDefaults"], LunchDefaultsSettings);
	        this.payrollDisplay = this.convertValues(source["payrollDisplay"], PayrollDisplaySettings);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace users {
	
	export class CreateUserInput {
	    username: string;
	    password: string;
	    role: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateUserInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.password = source["password"];
	        this.role = source["role"];
	    }
	}
	export class User {
	    id: number;
	    username: string;
	    role: string;
	    isActive: boolean;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	    // Go type: time
	    lastLoginAt?: any;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.username = source["username"];
	        this.role = source["role"];
	        this.isActive = source["isActive"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	        this.lastLoginAt = this.convertValues(source["lastLoginAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListUsersResult {
	    items: User[];
	    totalCount: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new ListUsersResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], User);
	        this.totalCount = source["totalCount"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ResetUserPasswordInput {
	    newPassword: string;
	
	    static createFrom(source: any = {}) {
	        return new ResetUserPasswordInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.newPassword = source["newPassword"];
	    }
	}
	export class UpdateUserInput {
	    username: string;
	    role: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateUserInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.role = source["role"];
	    }
	}

}

