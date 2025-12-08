import React from 'react';

export const InputGroup: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>
    {children}
  </div>
);