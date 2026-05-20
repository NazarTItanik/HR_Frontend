import { Leave } from "./Leave";

export interface Employee {
    id: string;

    role: string;

    firstName: string;
    lastName: string;
    email: string;

    hireDate: string;
    status: string;
    createdAt: string;
    position: string;  // ← add
    workType: string;

    contracts?: EmploymentContract[];
    attendances?: Attendance[];
    leaves?: Leave[];
}


export interface EmploymentContract {
    id: string;
    employeeId: string;
    vacancyId: number;
    baseSalary: number;
    department: string;
    workType: string;
    wageType: string;
    startDate: string;
    endDate?: string; // Nullable в C# = опционально в TS
    isActive: boolean;
    calculateLeaveAmount: boolean;
    deductFromBasicPay: boolean;
    status: string;

    // Ссылки на связанные объекты
    vacancy?: any; // Можно заменить на интерфейс Vacancy
}

export interface Attendance {
    id: string;
    employeeId: string;
    date: string;
    clockIn?: string;
    clockOut?: string;
    totalHoursWorked: number;
    status: string;
}