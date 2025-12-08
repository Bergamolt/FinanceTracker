import React from 'react';

export const InputGroup = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>
    {children}
  </div>
);