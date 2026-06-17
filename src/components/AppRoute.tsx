import React from 'react';
import MainLayout from './Layout/MainLayout';

interface AppRouteProps {
  children: React.ReactNode;
}

export const AppRoute: React.FC<AppRouteProps> = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};
