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

}

