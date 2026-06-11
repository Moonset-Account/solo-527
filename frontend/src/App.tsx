import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import Login from '@/pages/Login';
import Layout from '@/pages/Layout';
import StudentHome from '@/pages/student/Home';
import ContinueStudy from '@/pages/student/ContinueStudy';
import PurchaseCourse from '@/pages/student/PurchaseCourse';
import CourseManagement from '@/pages/operator/CourseManagement';
import ClassManagement from '@/pages/operator/ClassManagement';
import CouponManagement from '@/pages/operator/CouponManagement';
import CompletionRate from '@/pages/operator/CompletionRate';
import ClassMaterials from '@/pages/operator/ClassMaterials';
import AssignmentReview from '@/pages/operator/AssignmentReview';
import DistributionCommission from '@/pages/operator/DistributionCommission';
import RefundManagement from '@/pages/operator/RefundManagement';

const App: React.FC = () => {
  const { token, user } = useAuthStore();

  const isAuthenticated = !!token;
  const isOperator = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<Layout />}>
        <Route index element={isOperator ? <Navigate to="/courses" replace /> : <StudentHome />} />
        <Route path="purchase" element={<PurchaseCourse />} />
        <Route path="continue-study" element={<ContinueStudy />} />
        {isOperator && (
          <>
            <Route path="courses" element={<CourseManagement />} />
            <Route path="classes" element={<ClassManagement />} />
            <Route path="coupons" element={<CouponManagement />} />
            <Route path="completion-rate" element={<CompletionRate />} />
            <Route path="materials" element={<ClassMaterials />} />
            <Route path="assignments" element={<AssignmentReview />} />
            <Route path="commissions" element={<DistributionCommission />} />
            <Route path="refunds" element={<RefundManagement />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
