import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Login } from './auth/login/login';
import { HomeComponent } from './pages/home/home';
import { CandidatesComponent } from './pages/candidates/candidates';
import { RequestAccess } from './auth/request-access/request-access';
import { CandidateDetailsComponent } from './pages/candidates/candidate-details/candidate-details';
import { EmployeesComponent as Employees } from './pages/employees/employees';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard';
import { authGuard } from './guard/auth-guard';
import { EmployeeDetailsComponent } from './pages/employees/enployee-details/employee-details';
import { AttendancesComponent } from './pages/attendance/attendance';
import { LeavesComponent } from './pages/leaves-component/leaves-component';
import { PayslipsComponent } from './pages/payslips/payslips';
export const routes: Routes = [
    // 1. Путь для логина (без хедера и сайдбара)
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    {
        path: 'login',
        component: Login,
        title: 'Login - HR System'
    },
    {
        path: 'apply', component: RequestAccess, canActivate: [authGuard]
    },

    // 2. Группа путей, использующих MainLayout
    {
        path: '',
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: HomeComponent, title: 'Dashboard' },
            { path: 'candidates', component: CandidatesComponent, title: 'Employee Details' },
            { path: 'candidate-detail', component: CandidateDetailsComponent, title: 'Employee Details', data: { roles: ['ADMIN'] } },
            { path: 'employee-detail', component: EmployeeDetailsComponent, title: 'Employee Details', data: { roles: ['ADMIN'] } },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'attendance', component: AttendancesComponent, title: 'Attendance' },
            { path: 'leaves', component: LeavesComponent, title: 'Attendance' },
            { path: 'payslips', component: PayslipsComponent, title: 'Payslips' },
            { path: 'employees', component: Employees, title: 'Employees' },
            { path: 'user-dashboard', component: UserDashboardComponent, title: 'User Dashboard' }
        ]
    },

    // Редирект на логин, если путь совсем непонятный
    { path: '**', redirectTo: 'login' }
];