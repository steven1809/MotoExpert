import React, { Component } from 'react';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard.jsx';

class DashboardAdmin extends Component {
  render() {
    const { setView, showToast, unreadNotifications } = this.props;
    const userRole = localStorage.getItem('role')?.toLowerCase();

    // Router de Roles
    if (userRole === 'admin') {
      return <AdminDashboard setView={setView} showToast={showToast} unreadNotifications={unreadNotifications} />;
    } else if (userRole === 'trabajador' || userRole === 'empleado') {
      return <EmployeeDashboard setView={setView} />;
    } else if (['user', 'cliente', 'usuario'].includes(userRole)) {
      return <UserDashboard setView={setView} showToast={showToast} />;
    } else {
      // Por defecto o si no hay rol, mostrar UserDashboard o una vista de error
      return <UserDashboard setView={setView} showToast={showToast} />;
    }
  }
}

export default DashboardAdmin;
