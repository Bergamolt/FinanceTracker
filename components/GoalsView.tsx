import React, { useState } from 'react';
import { Goal, Currency } from '../types';
import { Plus, Trash2 } from './ui/Icons';
import { InputGroup } from './ui/InputGroup';
import { Modal } from './ui/Modal';

interface GoalsViewProps {
  goals: Goal[];
  onAdd: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ goals, onAdd, onDelete }) => {
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({ currency: Currency.USD, currentAmount: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-20 md:pb-0 relative min-h-[80vh]">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {goals.map(goal => {
           const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
           return (
             <div key={goal.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative group">
                <button onClick={() => onDelete(goal.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors z-10"><Trash2 size={18} /></button>
                <div className="flex justify-between items-start mb-4 pr-6">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">{goal.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>Создано: {new Date(goal.date).toLocaleDateString('ru-RU')}</span>
                      {goal.deadline && <span>• До: {goal.deadline}</span>}
                    </div>
                  </div>
                  <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                    {progress.toFixed(0)}%
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 mb-2">
                  <div className="bg-purple-600 h-4 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between text-sm font-mono text-slate-600">
                  <span>{goal.currentAmount.toLocaleString()} {goal.currency}</span>
                  <span>{goal.targetAmount.toLocaleString()} {goal.currency}</span>
                </div>
             </div>
           )
         })}
         {goals.length === 0 && (
           <div className="text-center py-20 text-slate-400 col-span-full">
            <p className="text-lg font-medium text-slate-600">Нет активных целей</p>
            <p className="text-sm">Создайте цель, чтобы отслеживать прогресс</p>
           </div>
         )}
       </div>

      {/* FAB */}
      <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-30">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Plus size={24} />
        </button>
      </div>

       {/* Modal */}
       <Modal
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         title="Новая Финансовая Цель"
       >
         <div className="space-y-4">
           <InputGroup label="Название цели">
             <input className="border p-3 rounded-xl w-full bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-purple-500/20" placeholder="Купить дом" value={newGoal.title || ''} onChange={e => setNewGoal({...newGoal, title: e.target.value})} autoFocus />
           </InputGroup>
           <div className="grid grid-cols-2 gap-4">
             <InputGroup label="Целевая сумма">
               <input type="number" className="border p-3 rounded-xl w-full bg-slate-50" value={newGoal.targetAmount || ''} onChange={e => setNewGoal({...newGoal, targetAmount: parseFloat(e.target.value)})} />
             </InputGroup>
             <InputGroup label="Валюта">
               <select className="border p-3 rounded-xl w-full bg-slate-50" value={newGoal.currency} onChange={e => setNewGoal({...newGoal, currency: e.target.value as Currency})}>
                 {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </InputGroup>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Уже накоплено">
               <input type="number" className="border p-3 rounded-xl w-full bg-slate-50" value={newGoal.currentAmount || ''} onChange={e => setNewGoal({...newGoal, currentAmount: parseFloat(e.target.value)})} />
             </InputGroup>
             <InputGroup label="Дедлайн">
               <input type="date" className="border p-3 rounded-xl w-full bg-slate-50" value={newGoal.deadline || ''} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} />
             </InputGroup>
           </div>
           
           <button 
            onClick={() => {
              if (newGoal.title && newGoal.targetAmount) {
                onAdd({ ...newGoal, id: Date.now().toString(), date: new Date().toISOString() } as Goal);
                setNewGoal({ currency: Currency.USD, currentAmount: 0, title: '', targetAmount: 0, deadline: '' });
                setIsModalOpen(false);
              }
            }}
            className="w-full mt-4 bg-purple-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg hover:bg-purple-700 shadow-lg active:scale-95 transition-all"
          >
            <Plus size={20} /> Создать цель
          </button>
         </div>
       </Modal>
    </div>
  );
};