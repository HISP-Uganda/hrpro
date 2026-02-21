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

export namespace payroll {
	
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

