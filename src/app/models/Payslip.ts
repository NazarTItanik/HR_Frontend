export interface Payslip {
    id: string;
    employeeId: string;
    grossSalary: number;
    netSalary: number;
    periodStart: string;
    periodEnd: string;
    generationDate: string;
    status: 'Paid' | 'Unpaid';

    // ADD THIS LINE
    // The '?' means "this property might be missing sometimes"
    employeeName?: string;
}