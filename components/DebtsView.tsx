import React, { useState } from 'react';
import { Debt, Currency } from '../types';
import { Plus, Trash2 } from './ui/Icons';
import { InputGroup } from './ui/InputGroup';

interface DebtsViewProps {
  debts: Debt[];
  onAdd: (debt: Debt) => void;
  onDelete: (id: string) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({ debts, onAdd, onDelete }) => {
  const [newDebt, setNewDebt] = useState<Partial<Debt>>({ currency: Currency.USD, isInstallment: false });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Добавить запись о долге</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <InputGroup label="Название">
             <input className="border p-2 rounded" placeholder="Напр. Автокредит" value={newDebt.title || ''} onChange={e => setNewDebt({...newDebt, title: e.target.value})} />
           </InputGroup>
           <InputGroup label="Источник">
             <input className="border p-2 rounded" placeholder="Напр. Банк" value={newDebt.source || ''} onChange={e => setNewDebt({...newDebt, source: e.target.value})} />
           </InputGroup>
           <InputGroup label="Общая сумма">
             <input type="number" className="border p-2 rounded" value={newDebt.totalAmount || ''} onChange={e => setNewDebt({...newDebt, totalAmount: parseFloat(e.target.value)})} />
           </InputGroup>
           <InputGroup label="Остаток">
             <input type="number" className="border p-2 rounded" value={newDebt.remainingAmount || ''} onChange={e => setNewDebt({...newDebt, remainingAmount: parseFloat(e.target.value)})} />
           </InputGroup>
           <InputGroup label="Валюта">
             <select className="border p-2 rounded" value={newDebt.currency} onChange={e => setNewDebt({...newDebt, currency: e.target.value as Currency})}>
               {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
             </select>
           </InputGroup>
           <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newDebt.isInstallment} onChange={e => setNewDebt({...newDebt, isInstallment: e.target.checked})} />
                <span className="text-sm font-medium">Оплата частями?</span>
              </label>
           </div>
           {newDebt.isInstallment && (
             <>
              <InputGroup label="Всего платежей">
                <input type="number" className="border p-2 rounded" value={newDebt.totalInstallments || ''} onChange={e => setNewDebt({...newDebt, totalInstallments: parseInt(e.target.value)})} />
              </InputGroup>
              <InputGroup label="Оплачено платежей">
                <input type="number" className="border p-2 rounded" value={newDebt.paidInstallments || ''} onChange={e => setNewDebt({...newDebt, paidInstallments: parseInt(e.target.value)})} />
              </InputGroup>
             </>
           )}
        </div>
        <button 
          onClick={() => {
            if (newDebt.title && newDebt.totalAmount) {
              onAdd({ ...newDebt, id: Date.now().toString(), date: new Date().toISOString() } as Debt);
              setNewDebt({ currency: Currency.USD, isInstallment: false });
            }
          }}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700 w-full md:w-auto justify-center"
        >
          <Plus size={16} /> Добавить в лог
        </button>
      </div>

      <div className="space-y-4">
        {debts.map(debt => (
          <div key={debt.id} className="bg-white p-4 rounded-xl border-l-4 border-l-red-500 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative group">
            <button onClick={() => onDelete(debt.id)} className="absolute top-2 right-2 md:top-4 md:right-4 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                   {new Date(debt.date).toLocaleDateString('ru-RU')}
                 </span>
                 <h4 className="font-bold text-slate-800">{debt.title}</h4>
              </div>
              <p className="text-sm text-slate-500">{debt.source} • {debt.isInstallment ? `В рассрочку (${debt.paidInstallments}/${debt.totalInstallments})` : 'Единовременно'}</p>
            </div>
            
            <div className="flex flex-col items-end min-w-[120px] self-end md:self-center">
              <span className="text-xs text-slate-400">Остаток долга</span>
              <span className="text-lg font-mono font-bold text-red-600">{debt.remainingAmount.toLocaleString()} {debt.currency}</span>
              <span className="text-xs text-slate-400">из {debt.totalAmount.toLocaleString()} {debt.currency}</span>
            </div>
          </div>
        ))}
        {debts.length === 0 && <p className="text-center text-slate-400 py-8">История долгов пуста</p>}
      </div>
    </div>
  );
};