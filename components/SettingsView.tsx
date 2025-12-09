import React, { useState, useRef } from 'react';
import { Trash2, RefreshCw, AlertCircle, Download, Upload, TrendingUp, CheckCircle } from './ui/Icons';
import { Modal } from './ui/Modal';
import { FinancialState, Currency } from '../types';
import { InputGroup } from './ui/InputGroup';

interface SettingsViewProps {
  onClearData: () => void;
  onResetData: () => void;
  onImportData?: (data: FinancialState) => void;
  exchangeRates: Record<string, number>;
  onUpdateRates: (rates: Record<string, number>) => void;
  mainCurrency: Currency;
  onUpdateMainCurrency: (c: Currency) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  onClearData, 
  onResetData, 
  onImportData,
  exchangeRates,
  onUpdateRates,
  mainCurrency,
  onUpdateMainCurrency
}) => {
  const [activeModal, setActiveModal] = useState<'clear' | 'reset' | 'rates' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempRates, setTempRates] = useState(exchangeRates);

  const handleClear = () => {
    onClearData();
    setActiveModal(null);
  };

  const handleReset = () => {
    onResetData();
    setActiveModal(null);
  };

  const handleSaveRates = () => {
    onUpdateRates(tempRates);
    setActiveModal(null);
  };

  const handleExport = () => {
    const data = localStorage.getItem('finance_data');
    if (!data) return;
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation
        if (json.debts && json.expenses && json.assets && json.goals && onImportData) {
          onImportData(json as FinancialState);
          alert('Данные успешно восстановлены!');
        } else {
          alert('Ошибка: Неверный формат файла.');
        }
      } catch (err) {
        alert('Ошибка при чтении файла.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Exchange Rates Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-slate-400" />
          Валюта и Курсы
        </h3>
        
        <div className="mb-6">
           <InputGroup label="Основная валюта (для отображения итогов)">
             <select 
               value={mainCurrency} 
               onChange={(e) => onUpdateMainCurrency(e.target.value as Currency)}
               className="border p-3 rounded-xl w-full bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-200 outline-none transition-colors"
             >
               {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
             </select>
           </InputGroup>
           <p className="text-xs text-slate-400 mt-2">Все графики и сводки будут конвертироваться в эту валюту.</p>
        </div>

        <p className="text-slate-500 mb-4 text-sm font-bold">
          Текущие курсы (к USD):
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
           {Object.entries(exchangeRates).map(([curr, rate]) => (
             <div key={curr} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
               <div className="text-xs text-slate-400 font-bold">{curr}</div>
               <div className="font-mono font-medium text-slate-700">{rate}</div>
             </div>
           ))}
        </div>

        <button 
          onClick={() => { setTempRates(exchangeRates); setActiveModal('rates'); }}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors"
        >
          Изменить курсы
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Download size={20} className="text-slate-400" />
          Резервное копирование
        </h3>
        <p className="text-slate-500 mb-6 text-sm">
          Сохраните ваши данные в файл для переноса на другое устройство или восстановите их из резервной копии.
        </p>

        <div className="flex flex-col gap-4">
           <button 
            onClick={handleExport}
            className="flex items-center gap-3 p-4 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-left group"
          >
            <div className="bg-white p-2 rounded-full text-blue-500 group-hover:scale-110 transition-transform">
              <Download size={20} />
            </div>
            <div>
              <div className="font-bold">Скачать резервную копию</div>
              <div className="text-xs opacity-80">Сохранить файл JSON на устройство</div>
            </div>
          </button>

          <button 
            onClick={handleImportClick}
            className="flex items-center gap-3 p-4 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors text-left group"
          >
             <div className="bg-white p-2 rounded-full text-emerald-600 group-hover:scale-110 transition-transform">
              <Upload size={20} />
            </div>
            <div>
              <div className="font-bold">Восстановить из файла</div>
              <div className="text-xs opacity-80">Загрузить данные из ранее сохраненного JSON</div>
            </div>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-slate-400" />
          Опасная зона
        </h3>
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setActiveModal('clear')}
            className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-left group"
          >
            <div className="bg-white p-2 rounded-full text-red-500 group-hover:scale-110 transition-transform">
              <Trash2 size={20} />
            </div>
            <div>
              <div className="font-bold">Очистить все данные</div>
              <div className="text-xs opacity-80">Удаляет все расходы, доходы, долги и цели</div>
            </div>
          </button>

          <button 
            onClick={() => setActiveModal('reset')}
            className="flex items-center gap-3 p-4 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors text-left group"
          >
             <div className="bg-white p-2 rounded-full text-slate-500 group-hover:scale-110 transition-transform">
              <RefreshCw size={20} />
            </div>
            <div>
              <div className="font-bold">Сбросить к демо-версии</div>
              <div className="text-xs opacity-80">Восстанавливает начальный набор данных</div>
            </div>
          </button>
        </div>
      </div>
      
      <div className="text-center text-xs text-slate-400 mt-8">
        <p>FinanceAI Master v1.3.0</p>
        <p>Local Storage Persistence Enabled</p>
      </div>

      {/* Exchange Rates Modal */}
      <Modal 
        isOpen={activeModal === 'rates'} 
        onClose={() => setActiveModal(null)} 
        title="Настройка курсов валют"
      >
         <div className="space-y-4">
           <p className="text-sm text-slate-500 bg-blue-50 p-3 rounded-lg">
             Укажите стоимость 1 USD в других валютах. Например, если 1$ = 41.5 UAH, введите 41.5.
           </p>
           {Object.keys(Currency).map(key => {
             const curr = Currency[key as keyof typeof Currency];
             const isUSD = curr === Currency.USD;
             return (
               <InputGroup key={curr} label={`Курс ${curr} (за 1 USD)`}>
                 <input 
                   type="number" 
                   step="0.01"
                   disabled={isUSD}
                   className={`border p-3 rounded-xl w-full ${isUSD ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}
                   value={tempRates[curr] || ''} 
                   onChange={e => setTempRates({...tempRates, [curr]: parseFloat(e.target.value)})} 
                 />
               </InputGroup>
             )
           })}
           <button 
              onClick={handleSaveRates}
              className="w-full mt-4 bg-slate-800 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg hover:bg-slate-900 shadow-lg active:scale-95 transition-all"
            >
              <CheckCircle size={20} /> Сохранить курсы
            </button>
         </div>
      </Modal>

      {/* Clear Data Modal */}
      <Modal 
        isOpen={activeModal === 'clear'} 
        onClose={() => setActiveModal(null)} 
        title="Удаление данных"
      >
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl flex gap-3 text-red-800 text-sm">
             <AlertCircle className="shrink-0" size={20} />
             <p>Вы собираетесь удалить всю финансовую историю. Это действие нельзя отменить. Вы уверены?</p>
          </div>
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => setActiveModal(null)}
              className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Отмена
            </button>
            <button 
              onClick={handleClear}
              className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Удалить всё
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Data Modal */}
      <Modal 
        isOpen={activeModal === 'reset'} 
        onClose={() => setActiveModal(null)} 
        title="Сброс данных"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-800 text-sm">
             <RefreshCw className="shrink-0" size={20} />
             <p>Текущие данные будут заменены на демонстрационный набор данных. Ваша текущая история будет потеряна.</p>
          </div>
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => setActiveModal(null)}
              className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Отмена
            </button>
            <button 
              onClick={handleReset}
              className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Сбросить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};