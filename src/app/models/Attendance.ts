export interface Attendance {
    id: string;
    employeeId: string;
    employee?: any;

    date: Date | string;

    clockIn: string;
    clockOut: string;

    totalHours: number;
    status: 'Pending' | 'Validated';
}