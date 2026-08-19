import React, { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import useAuthStore from "../stores/authStore";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Recruitment = lazy(() => import("../pages/Recruitment"));
const RecruitmentPlanning = lazy(() => import("../pages/RecruitmentPlanning"));
const RecruitmentPlanningWeekly = lazy(() => import("../pages/RecruitmentPlanningWeekly"));
const RecruitmentPlanningPipeline = lazy(() => import("../pages/RecruitmentPlanningPipeline"));
const RecruitmentPlanningScorecard = lazy(() => import("../pages/RecruitmentPlanningScorecard"));
const RecruitmentPlanningHistory = lazy(() => import("../pages/RecruitmentPlanningHistory"));
const RecruitmentPublication = lazy(() => import("../pages/RecruitmentPublication"));
const RecruitmentSelectionInterviews = lazy(() => import("../pages/RecruitmentSelectionInterviews"));
const RecruitmentOnboarding = lazy(() => import("../pages/RecruitmentOnboarding"));
const Employees = lazy(() => import("../pages/Employees"));
const EmployeesList = lazy(() => import("../pages/EmployeesList"));
const EmployeesCreate = lazy(() => import("../pages/EmployeesCreate"));
const EmployeesDocuments = lazy(() => import("../pages/EmployeesDocuments"));
const Payroll = lazy(() => import("../pages/Payroll"));
const PayrollDashboard = lazy(() => import("../pages/PayrollDashboard"));
const PayrollList = lazy(() => import("../pages/PayrollList"));
const PayrollGeneration = lazy(() => import("../pages/PayrollGeneration"));
const TimeAttendance = lazy(() => import("../pages/TimeAttendance"));
const Leave = lazy(() => import("../pages/Leave"));
const LeaveOverview = lazy(() => import("../pages/LeaveOverview"));
const LeaveMyRequests = lazy(() => import("../pages/LeaveMyRequests"));
const LeaveApprovals = lazy(() => import("../pages/LeaveApprovals"));
const LeaveBalances = lazy(() => import("../pages/LeaveBalances"));
const LeaveCalendar = lazy(() => import("../pages/LeaveCalendar"));
const LeaveCompliance = lazy(() => import("../pages/LeaveCompliance"));
const Performances = lazy(() => import("../pages/Performances"));
const Kpiboard = lazy(() => import("../pages/Kpiboard"));
const Login = lazy(() => import("../pages/Login"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Forgetpassword = lazy(() => import("../pages/Forgetpassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const Profile = lazy(() => import("../pages/Profile"));
const Settings = lazy(() => import("../pages/Settings"));
const SettingsAppearance = lazy(() => import("../pages/SettingsAppearance"));
const SettingsDepartments = lazy(() => import("../pages/SettingsDepartments"));
const SettingsUsersPermissions = lazy(() => import("../pages/SettingsUsersPermissions"));
const Notifications = lazy(() => import("../pages/Notifications"));
const Messages = lazy(() => import("../pages/Messages"));
const Documents = lazy(() => import("../pages/Documents"));
const Tasks = lazy(() => import("../pages/Tasks"));

const renderLazy = (Component) => (
  <Suspense fallback={<div className="p-4 text-sm text-muted">Chargement...</div>}>
    <Component />
  </Suspense>
);

function RequireAuth() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  return <Outlet />;
}

function PublicOnly() {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}


const routes = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      {
        path: "/Login",
        element: renderLazy(Login)
      },
      {
        path: "/Forgetpassword",
        element: renderLazy(Forgetpassword)
      },
      {
        path: "/ResetPassword",
        element: renderLazy(ResetPassword)
      }
    ]
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
    children: [
      {
        index: true,
        element: renderLazy(Dashboard)
      },
      {
        path: "Recruitment",
        element: renderLazy(Recruitment),
        children: [
          {
            index: true,
            element: <Navigate to="Planification" replace />
          },
          {
            path: "Planification",
            element: renderLazy(RecruitmentPlanning),
            children: [
              {
                index: true,
                element: <Navigate to="Planning-Hebdomadaire" replace />
              },
              {
                path: "Planning-Hebdomadaire",
                element: renderLazy(RecruitmentPlanningWeekly)
              },
              {
                path: "Pipeline-Recrutement",
                element: renderLazy(RecruitmentPlanningPipeline)
              },
              {
                path: "Scorecard-Recrutement",
                element: renderLazy(RecruitmentPlanningScorecard)
              },
              {
                path: "Historique-Modifications",
                element: renderLazy(RecruitmentPlanningHistory)
              }
            ]
          },
          {
            path: "Publication",
            element: renderLazy(RecruitmentPublication)
          },
          {
            path: "Selection-Entretiens",
            element: renderLazy(RecruitmentSelectionInterviews)
          },
          {
            path: "Onboarding",
            element: renderLazy(RecruitmentOnboarding)
          }
        ]
      },
      {
        path: "Employees",
        element: renderLazy(Employees),
        children: [
          {
            index: true,
            element: <Navigate to="Liste-Employes" replace />
          },
          {
            path: "Liste-Employes",
            element: renderLazy(EmployeesList)
          },
          {
            path: "Creer-Employe",
            element: renderLazy(EmployeesCreate)
          },
          {
            path: "Documents",
            element: renderLazy(EmployeesDocuments)
          }
        ]
      },
      {
        path: "Payroll",
        element: renderLazy(Payroll),
        children: [
          {
            index: true,
            element: <Navigate to="Dashboard" replace />
          },
          {
            path: "Dashboard",
            element: renderLazy(PayrollDashboard)
          },
          {
            path: "Liste-Paie",
            element: renderLazy(PayrollList)
          },
          {
            path: "Generation-Paie",
            element: renderLazy(PayrollGeneration)
          }
        ]
      },
      {
        path: "TimeAttendance",
        element: renderLazy(TimeAttendance)
      },
      {
        path: "Leave",
        element: renderLazy(Leave),
        children: [
          {
            index: true,
            element: <Navigate to="Overview" replace />
          },
          {
            path: "Overview",
            element: renderLazy(LeaveOverview)
          },
          {
            path: "My-Requests",
            element: renderLazy(LeaveMyRequests)
          },
          {
            path: "Approvals",
            element: renderLazy(LeaveApprovals)
          },
          {
            path: "Balances",
            element: renderLazy(LeaveBalances)
          },
          {
            path: "Calendar",
            element: renderLazy(LeaveCalendar)
          },
          {
            path: "Compliance",
            element: renderLazy(LeaveCompliance)
          }
        ]
      },
      {
        path: "Performances",
        element: renderLazy(Performances)
      },
      {
        path: "Kpiboard",
        element: renderLazy(Kpiboard)
      },
      {
        path: "Documents",
        element: renderLazy(Documents)
      },
      {
        path: "404",
        element: renderLazy(NotFound)
      },
      {
        path:'notifications',
        element: renderLazy(Notifications)
      },
      {
        path:'messages',
        element: renderLazy(Messages)
      },
      {
        path:'Tasks',
        element: renderLazy(Tasks)
      },
      {
        path: "Profile",
        element: renderLazy(Profile)
      },
      {
        path: "Logout",
        element: <Navigate to="/Login" replace />
      },
      {
        path: "Settings",
        element: renderLazy(Settings),
        children: [
          {
            index: true,
            element: <Navigate to="Appearance" replace />
          },
          {
            path: "Appearance",
            element: renderLazy(SettingsAppearance)
          },
          {
            path: "Departments",
            element: renderLazy(SettingsDepartments)
          },
          {
            path: "Users-Permissions",
            element: renderLazy(SettingsUsersPermissions)
          },
          {
            path: "Security",
            element: <div>Parametres de securite</div>
          },
          {
            path: "Billing",
            element: <div>Parametres de facturation</div>
          },
          {
            path: "Notifications",
            element: <div>Parametres de notification</div>
          },
          {
            path: "Privacy",
            element: <div>Parametres de confidentialite</div>
          },
          {
            path: "Preferences",
            element: <div>Parametres de preferences</div>
          },
          {
            path: "Integrations",
            element: <div>Parametres d'integrations</div>
          },
          {
            path: "API",
            element: <div>Parametres API</div>
          },
          {
            path: "Support",
            element: <div>Parametres de support</div>
          },
          {
            path: "Help",
            element: <div>Parametres d'aide</div>
          },
          {
            path:"payroll",
            element:<div>Parametres de paie</div>,
            children:[
                {
                    index:true,
                    element:<div>Vue d'ensemble de la paie</div>
                },
                {
                    path: "Overview",
                    element: <div>Vue d'ensemble de la paie</div>
                },
                {
                    path:"variablespayroll",
                    element:<div>Variables de paie</div>
                },
                {
                    path:"currencies",
                    element:<div>Devises</div>

                },
                {
                    path:"taxes",
                    element:<div>Taxes</div>
                },
                {
                    path:"deductions",
                    element:<div>Deductions</div>
                },
                {
                    path:"payperiods",
                    element:<div>Periodes de paie</div>
                },
            ]
          }
        ]
      }
    ]
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/404" replace />
  }

]);


  export default routes;
