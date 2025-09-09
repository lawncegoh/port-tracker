"use client";

import { ReactNode } from 'react';
import { Card } from './card';

interface TableWrapperProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function TableWrapper({ title, actions, children }: TableWrapperProps) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </Card>
  );
}
