import React, { useMemo, useState } from 'react';
import { FinancialState, Currency } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, AlertCircle, Target, Scale, ChevronRight, CheckCircle, X } from './ui/Icons';
import { Modal } from './ui/Modal';

interface DashboardProps {
  data: FinancialState;
  exchangeRates: Record<string, number>;
  mainCurrency: Currency;
}

type MetricType = 'netWorth' | 'forecast' | 'monthly' | 'debt';

const CardWrapper = ({ children, colorClass, onClick }: { children?: React.ReactNode, colorClass: string, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm p-6 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${colorClass}`}
  >
    {children}
    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
       <ChevronRight size={16} />
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ data, exchangeRates, mainCurrency }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType | null>(null);

  // --- 1. Analytics Calculation (Shared Logic) ---
  const analytics = useMemo(() => {
    const debtSum: Record<string, number> = {};
    const assetSum: Record<string, number> = {}; 
    const projectedCashFlow: Record<string, number> = {}; 
    const monthlyIncome: Record<string, number> = {};
    const monthlyExpense: Record<string, number> = {};

    const add = (map: Record<string, number>, curr: string, val: number) => {
      map[curr] = (map[curr] || 0) + val;
    };

    // Process Debts
    data.debts.forEach(d => add(debtSum, d.currency, d.remainingAmount));

    // Process Assets
    data.assets.forEach(a => {
      if (a.isReceived !== false) {
        add(assetSum, a.currency, a.amount);
        add(projectedCashFlow, a.currency, a.amount); 
      }
    });

    const dominantCurrency = mainCurrency;

    const toDominant = (amount: number, curr: string) => {
      if (curr === dominantCurrency) return amount;
      const rateFrom = exchangeRates[curr] || 1;
      const rateTo = exchangeRates[dominantCurrency] || 1;
      return (amount / rateFrom) * rateTo;
    };

    let totalDebt = 0;
    let totalAssets = 0;
    let projectedBalance = 0;
    let monthResult = 0;
    let totalMonthlyIncome = 0;
    let totalMonthlyExpense = 0;

    Object.entries(debtSum).forEach(([c, v]) => totalDebt += toDominant(v, c));
    Object.entries(assetSum).forEach(([c, v]) => totalAssets += toDominant(v, c));
    
    const now = new Date();
    const currentDay = now.getDate();

    data.assets.forEach(a => {
       const d = new Date(a.date);
       if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
         if (a.type === 'Income') add(monthlyIncome, a.currency, a.amount);
         if (a.isReceived === false) add(projectedCashFlow, a.currency, a.amount);
       }
    });

    data.expenses.forEach(e => {
       const d = new Date(e.date);
       const isThisMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
       
       let expenseAmount = 0;
       if (e.frequency === 'Monthly') expenseAmount = e.amount;
       else if (e.frequency === 'One-time' && isThisMonth) expenseAmount = e.amount;
       else if (e.frequency === 'Weekly') expenseAmount = e.amount * 4;
       else if (e.frequency === 'Yearly') expenseAmount = e.amount / 12;

       if (expenseAmount > 0) add(monthlyExpense, e.currency, expenseAmount);

       if (e.isPaid === false) {
          if (e.frequency === 'Monthly' || (e.frequency === 'One-time' && isThisMonth)) {
             add(projectedCashFlow, e.currency, -e.amount);
          }
       }
    });

    data.debts.forEach(d => {
       if (d.isInstallment) {
          const monthlyPayment = d.monthlyPayment || (d.totalInstallments ? d.totalAmount / d.totalInstallments : 0);
          if (monthlyPayment > 0) {
            add(monthlyExpense, d.currency, monthlyPayment);
            const debtDate = new Date(d.date);
            const dueDay = debtDate.getDate();
            if (currentDay <= dueDay) {
               add(projectedCashFlow, d.currency, -monthlyPayment);
            }
          }
       }
    });

    Object.entries(projectedCashFlow).forEach(([c, v]) => projectedBalance += toDominant(v, c));
    Object.entries(monthlyIncome).forEach(([c, v]) => {
        const val = toDominant(v, c);
        monthResult += val;
        totalMonthlyIncome += val;
    });
    Object.entries(monthlyExpense).forEach(([c, v]) => {
        const val = toDominant(v, c);
        monthResult -= val;
        totalMonthlyExpense += val;
    });

    const netWorth = totalAssets - totalDebt;

    return {
       dominantCurrency,
       netWorth,
       totalDebt,
       totalAssets,
       projectedBalance,
       monthResult,
       totalMonthlyIncome,
       totalMonthlyExpense,
       toDominant
    };
  }, [data, exchangeRates, mainCurrency]);

  // --- 2. Drilldown Data Generator ---
  const getDrilldownData = () => {
    if (!activeMetric) return null;
    const { dominantCurrency, toDominant } = analytics;
    const items: Array<{ label: string; amount: number; currency: string; converted: number; type: 'plus' | 'minus' | 'neutral'; date?: string }> = [];
    const now = new Date();
    const currentDay = now.getDate();

    if (activeMetric === 'forecast') {
      // 1. Current Balance
      data.assets.filter(a => a.isReceived !== false).forEach(a => {
         items.push({ label: a.title || 'Актив', amount: a.amount, currency: a.currency, converted: toDominant(a.amount, a.currency), type: 'neutral' });
      });
      // 2. Pending Income
      data.assets.filter(a => a.isReceived === false).forEach(a => {
         const d = new Date(a.date);
         if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            items.push({ label: `Ожидается: ${a.title}`, amount: a.amount, currency: a.currency, converted: toDominant(a.amount, a.currency), type: 'plus', date: new Date(a.date).toLocaleDateString() });
         }
      });
      // 3. Pending Expenses
      data.expenses.filter(e => e.isPaid === false).forEach(e => {
        const d = new Date(e.date);
        const isThisMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (e.frequency === 'Monthly' || (e.frequency === 'One-time' && isThisMonth)) {
           items.push({ label: `План: ${e.title}`, amount: e.amount, currency: e.currency, converted: toDominant(e.amount, e.currency), type: 'minus', date: e.dayOfMonth ? `${e.dayOfMonth} числа` : new Date(e.date).toLocaleDateString() });
        }
      });
      // 4. Future Debt Payments
      data.debts.forEach(d => {
         if (d.isInstallment && d.remainingAmount > 0) {
            const dueDay = new Date(d.date).getDate();
            if (currentDay <= dueDay) {
               const payment = d.monthlyPayment || (d.totalAmount / (d.totalInstallments || 1));
               items.push({ label: `Платеж: ${d.title}`, amount: payment, currency: d.currency, converted: toDominant(payment, d.currency), type: 'minus', date: `${dueDay} числа` });
            }
         }
      });
    } else if (activeMetric === 'monthly') {
      // Income
      data.assets.filter(a => a.type === 'Income').forEach(a => {
         const d = new Date(a.date);
         if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            items.push({ label: a.title, amount: a.amount, currency: a.currency, converted: toDominant(a.amount, a.currency), type: 'plus', date: new Date(a.date).toLocaleDateString() });
         }
      });
      // Expenses
      data.expenses.forEach(e => {
         const d = new Date(e.date);
         const isThisMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
         let amt = 0;
         if (e.frequency === 'Monthly') amt = e.amount;
         else if (e.frequency === 'One-time' && isThisMonth) amt = e.amount;
         
         if (amt > 0) {
            items.push({ label: e.title, amount: amt, currency: e.currency, converted: toDominant(amt, e.currency), type: 'minus' });
         }
      });
      // Debts
      data.debts.forEach(d => {
         if (d.isInstallment) {
            const payment = d.monthlyPayment || (d.totalAmount / (d.totalInstallments || 1));
            items.push({ label: `Кредит: ${d.title}`, amount: payment, currency: d.currency, converted: toDominant(payment, d.currency), type: 'minus' });
         }
      });
    } else if (activeMetric === 'netWorth') {
      data.assets.filter(a => a.isReceived !== false).forEach(a => {
         items.push({ label: a.title, amount: a.amount, currency: a.currency, converted: toDominant(a.amount, a.currency), type: 'plus' });
      });
      data.debts.forEach(d => {
         items.push({ label: d.title, amount: d.remainingAmount, currency: d.currency, converted: toDominant(d.remainingAmount, d.currency), type: 'minus' });
      });
    } else if (activeMetric === 'debt') {
       data.debts.forEach(d => {
         items.push({ label: d.title, amount: d.remainingAmount, currency: d.currency, converted: toDominant(d.remainingAmount, d.currency), type: 'minus' });
      });
    }

    return { items, currency: dominantCurrency };
  };

  const drilldown = getDrilldownData();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Net Worth (Total Capital) */}
        <CardWrapper onClick={() => setActiveMetric('netWorth')} colorClass="bg-gradient-to-br from-white to-slate-50">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Scale size={64} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Scale size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Общий капитал</h3>
          </div>
          <div>
             <span className={`text-2xl md:text-3xl font-bold font-mono ${analytics.netWorth >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
               {analytics.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })} {analytics.dominantCurrency}
             </span>
             <p className="text-xs text-slate-400 mt-1">Активы - Долги</p>
          </div>
        </CardWrapper>

        {/* 2. Projected Balance */}
        <CardWrapper onClick={() => setActiveMetric('forecast')} colorClass="bg-gradient-to-br from-white to-blue-50">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Target size={64} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Target size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Прогноз (Кэш)</h3>
          </div>
          <div>
             <span className={`text-2xl md:text-3xl font-bold font-mono ${analytics.projectedBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
               {analytics.projectedBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} {analytics.dominantCurrency}
             </span>
             <p className="text-xs text-slate-400 mt-1">На конец месяца</p>
          </div>
        </CardWrapper>

        {/* 3. Monthly Result */}
        <CardWrapper onClick={() => setActiveMetric('monthly')} colorClass="">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <AlertCircle size={64} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Месячный итог</h3>
          </div>
          <div>
             <span className={`text-2xl md:text-3xl font-bold font-mono ${analytics.monthResult >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
               {analytics.monthResult > 0 ? '+' : ''}{analytics.monthResult.toLocaleString(undefined, { maximumFractionDigits: 0 })} {analytics.dominantCurrency}
             </span>
             
             {/* Detailed Breakdown */}
             <div className="flex items-center gap-4 mt-3 text-xs font-mono border-t border-slate-100 pt-2">
               <div className="flex items-center gap-1 text-emerald-600" title="Доходы в этом месяце">
                  <TrendingUp size={12} />
                  <span>+{analytics.totalMonthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
               </div>
               <div className="flex items-center gap-1 text-red-500" title="Расходы в этом месяце (вкл. кредиты)">
                  <TrendingUp size={12} className="rotate-180" />
                  <span>-{analytics.totalMonthlyExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
               </div>
             </div>
          </div>
        </CardWrapper>

        {/* 4. Total Debt */}
        <CardWrapper onClick={() => setActiveMetric('debt')} colorClass="">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Wallet size={64} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Wallet size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Общий долг</h3>
          </div>
          <div>
             <span className="text-2xl md:text-3xl font-bold font-mono text-slate-800">
               -{analytics.totalDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })} {analytics.dominantCurrency}
             </span>
             <p className="text-xs text-slate-400 mt-1">
                {analytics.dominantCurrency !== Currency.USD && '(Конвертировано)'}
             </p>
          </div>
        </CardWrapper>
        
        <div className="col-span-full text-center text-xs text-slate-300 mt-4">
           Все суммы конвертированы в {analytics.dominantCurrency} по текущему курсу из настроек.
        </div>
      </div>

      {/* Drilldown Modal */}
      <Modal 
        isOpen={!!activeMetric} 
        onClose={() => setActiveMetric(null)} 
        title={
          activeMetric === 'forecast' ? 'Детализация Прогноза' :
          activeMetric === 'monthly' ? 'Месячный Отчет' :
          activeMetric === 'netWorth' ? 'Структура Капитала' : 'Список Долгов'
        }
      >
         <div className="space-y-1">
            {activeMetric === 'forecast' && (
               <div className="bg-blue-50 p-4 rounded-xl mb-4 text-sm text-blue-800">
                  <p className="font-bold mb-1">Формула прогноза:</p>
                  <p>Текущие деньги + Ожидаемый доход - Неоплаченные счета - Будущие платежи по кредитам</p>
               </div>
            )}

            {drilldown?.items.length === 0 ? (
               <div className="py-8 text-center text-slate-400">Нет данных для отображения</div>
            ) : (
               <div className="divide-y divide-slate-100">
                  {drilldown?.items.map((item, idx) => (
                     <div key={idx} className="py-3 flex justify-between items-center group">
                        <div className="flex items-start gap-3">
                           <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                              item.type === 'plus' ? 'bg-emerald-400' : 
                              item.type === 'minus' ? 'bg-red-400' : 'bg-slate-400'
                           }`} />
                           <div>
                              <div className="text-sm font-medium text-slate-700">{item.label}</div>
                              {item.date && <div className="text-xs text-slate-400">{item.date}</div>}
                           </div>
                        </div>
                        <div className="text-right">
                           <div className={`font-mono text-sm font-bold ${
                              item.type === 'plus' ? 'text-emerald-600' : 
                              item.type === 'minus' ? 'text-red-600' : 'text-slate-700'
                           }`}>
                              {item.type === 'plus' ? '+' : item.type === 'minus' ? '-' : ''}
                              {item.converted.toLocaleString(undefined, { maximumFractionDigits: 0 })} {drilldown.currency}
                           </div>
                           {item.currency !== drilldown.currency && (
                              <div className="text-[10px] text-slate-400">
                                 {item.amount.toLocaleString()} {item.currency}
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            )}
            
            {/* Total Footer */}
            <div className="mt-4 pt-4 border-t-2 border-slate-100 flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-6">
               <span className="font-bold text-slate-500">ИТОГО</span>
               <span className="font-mono text-2xl font-bold text-slate-800">
                  {activeMetric === 'forecast' ? analytics.projectedBalance.toLocaleString() :
                   activeMetric === 'monthly' ? analytics.monthResult.toLocaleString() :
                   activeMetric === 'netWorth' ? analytics.netWorth.toLocaleString() :
                   analytics.totalDebt.toLocaleString()} {drilldown?.currency}
               </span>
            </div>
         </div>
      </Modal>
    </>
  );
};