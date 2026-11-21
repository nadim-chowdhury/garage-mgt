'use client';

import { useState, useEffect } from 'react';
import { useGetCashBookQuery } from '@/store/api/dashboardApi';
import { Card, StatCard, DatePicker, Table, LoadingSpinner, Button, Badge, Modal, Input, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import { formatCurrency, formatDate, getIncomeCategoryLabel, getExpenseCategoryLabel } from '@/lib/utils';
import type { IncomeEntry, ExpenseEntry, DailyClosing } from '@/types';
import { Wallet, CreditCard, FolderOpen, PieChart, ChevronLeft, ChevronRight, CheckCircle, Lock, Calendar } from 'lucide-react';

export default function CashBookPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();

  const { data, isLoading, refetch } = useGetCashBookQuery(date);
  const cashBook = data?.data;

  // Day Closing Status State
  const [dayClosing, setDayClosing] = useState<DailyClosing | null>(null);
  const [showDayEndModal, setShowDayEndModal] = useState(false);
  const [showMonthEndModal, setShowMonthEndModal] = useState(false);

  // Day End Form State
  const [actualCash, setActualCash] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Fetch Day Closing status whenever date changes
  useEffect(() => {
    async function checkClosing() {
      try {
        const res = await fetch(`/api/closings/day?date=${date}`);
        const json = await res.json();
        if (json.success) {
          setDayClosing(json.data);
        } else {
          setDayClosing(null);
        }
      } catch {
        setDayClosing(null);
      }
    }
    checkClosing();
  }, [date]);

  // Date Navigation
  function handlePrevDay() {
    const prev = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];
    setDate(prev);
  }

  function handleNextDay() {
    const next = new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0];
    setDate(next);
  }

  function handleToday() {
    setDate(today);
  }

  // Day End Submission
  async function handleExecuteDayEnd() {
    setIsSubmittingClose(true);
    try {
      const res = await fetch('/api/closings/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closingDate: date,
          actualCashCounted: actualCash !== '' ? Number(actualCash) : undefined,
          notes: closingNotes,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Day end failed');
      }

      success(result.message || 'Day end closing completed successfully.');
      setShowDayEndModal(false);
      setDayClosing(result.data);
      refetch();

      if (result.nextDate) {
        setDate(result.nextDate);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete day end closing.';
      showError(message);
    } finally {
      setIsSubmittingClose(false);
    }
  }

  // Month End Submission
  async function handleExecuteMonthEnd() {
    setIsSubmittingClose(true);
    try {
      const [year, month] = date.split('-').map(Number);
      const res = await fetch('/api/closings/period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closingType: 'month',
          periodMonth: month,
          periodYear: year,
          notes: closingNotes,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Month end failed');
      }

      success(result.message || 'Month end closing completed successfully.');
      setShowMonthEndModal(false);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete month end closing.';
      showError(message);
    } finally {
      setIsSubmittingClose(false);
    }
  }

  const expectedClosing = cashBook?.closingBalance ?? 0;
  const countedNumber = actualCash !== '' ? Number(actualCash) : expectedClosing;
  const cashDiff = countedNumber - expectedClosing;

  const incomeColumns: Column<IncomeEntry>[] = [
    { key: 'category', header: 'Category', render: (r) => getIncomeCategoryLabel(r.category) },
    { key: 'amount', header: 'Amount', render: (r) => <span className="font-medium text-emerald-600">{formatCurrency(r.amount)}</span> },
    { key: 'notes', header: 'Notes', wrap: true, render: (r) => r.notes || '—' },
  ];

  const expenseColumns: Column<ExpenseEntry>[] = [
    { key: 'category', header: 'Category', render: (r) => getExpenseCategoryLabel(r.category) },
    { key: 'description', header: 'Description', wrap: true, render: (r) => r.description || '—' },
    { key: 'amount', header: 'Amount', render: (r) => <span className="font-medium text-red-600">{formatCurrency(r.amount)}</span> },
  ];

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Day Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Cash Book</h1>
            {dayClosing ? (
              <Badge variant="success">
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Closed
                </span>
              </Badge>
            ) : (
              <Badge variant="info">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Active Working Day
                </span>
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Daily cash and closing records — {formatDate(date)}
          </p>
        </div>

        {/* Date Navigator + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day Navigation */}
          <div className="inline-flex items-center h-[38px] rounded-lg border border-slate-300 bg-white">
            <button
              type="button"
              onClick={handlePrevDay}
              className="inline-flex h-full items-center justify-center px-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-l-lg transition-colors cursor-pointer"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="inline-flex h-full items-center justify-center px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 border-x border-slate-200 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="inline-flex h-full items-center justify-center px-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-r-lg transition-colors cursor-pointer"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="w-36">
            <DatePicker value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Day End Action Button */}
          {!dayClosing ? (
            <Button
              variant="primary"
              onClick={() => {
                setActualCash(String(expectedClosing));
                setClosingNotes('');
                setShowDayEndModal(true);
              }}
              className="gap-1.5"
            >
              <CheckCircle className="h-4 w-4" />
              Day End
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handleNextDay}
              className="gap-1.5"
            >
              Next Day <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Month End Action Button (Admin) */}
          {isAdmin && (
            <Button
              variant="secondary"
              onClick={() => {
                setClosingNotes('');
                setShowMonthEndModal(true);
              }}
              className="gap-1.5 text-slate-700"
              title="Archive and close monthly accounts"
            >
              <Lock className="h-4 w-4 text-slate-400" />
              Month End
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
        <StatCard
          title="Opening Balance"
          value={formatCurrency(cashBook?.openingBalance ?? 0)}
          icon={<FolderOpen className="h-5 w-5" />}
          color="neutral"
        />
        <StatCard
          title="Total Income"
          value={formatCurrency(cashBook?.totalIncome ?? 0)}
          icon={<Wallet className="h-5 w-5" />}
          color="success"
        />
        <StatCard
          title="Total Expense"
          value={formatCurrency(cashBook?.totalExpense ?? 0)}
          icon={<CreditCard className="h-5 w-5" />}
          color="danger"
        />
        <StatCard
          title="Closing Balance"
          value={formatCurrency(cashBook?.closingBalance ?? 0)}
          icon={<PieChart className="h-5 w-5" />}
          color={(cashBook?.closingBalance ?? 0) >= 0 ? 'primary' : 'danger'}
        />
      </div>

      {/* Day Closing Details Banner (if closed) */}
      {dayClosing && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="font-semibold text-emerald-900">
                Day End Closing completed for {formatDate(date)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-800">
              <span>Closing Balance: <strong>{formatCurrency(dayClosing.closingBalance)}</strong></span>
              {dayClosing.actualCashCounted !== null && (
                <span>Actual Cash Counted: <strong>{formatCurrency(dayClosing.actualCashCounted)}</strong></span>
              )}
              {Number(dayClosing.cashDifference) !== 0 && (
                <span className={Number(dayClosing.cashDifference) > 0 ? 'text-blue-700' : 'text-red-700'}>
                  {Number(dayClosing.cashDifference) > 0 ? 'Surplus:' : 'Shortage:'} <strong>{formatCurrency(Math.abs(Number(dayClosing.cashDifference)))}</strong>
                </span>
              )}
            </div>
          </div>
          {dayClosing.notes && (
            <p className="mt-2 text-xs text-emerald-700 border-t border-emerald-200/60 pt-2">
              Notes: {dayClosing.notes}
            </p>
          )}
        </div>
      )}

      {/* Income & Expense breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
        <Card title="Income Entries" noPadding>
          <Table
            columns={incomeColumns}
            data={(cashBook?.incomeEntries ?? []) as unknown as IncomeEntry[]}
            emptyMessage="No income recorded for this date"
            emptyIcon={<Wallet className="h-6 w-6" />}
            keyExtractor={(r) => r.id}
          />
        </Card>

        <Card title="Expense Entries" noPadding>
          <Table
            columns={expenseColumns}
            data={(cashBook?.expenseEntries ?? []) as unknown as ExpenseEntry[]}
            emptyMessage="No expenses recorded for this date"
            emptyIcon={<CreditCard className="h-6 w-6" />}
            keyExtractor={(r) => r.id}
          />
        </Card>
      </div>

      {/* Day End Modal */}
      <Modal
        isOpen={showDayEndModal}
        onClose={() => setShowDayEndModal(false)}
        title={`Day End Process — ${formatDate(date)}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Close today&apos;s cash book, record actual cash on hand, and advance to the next working day.
          </p>

          <div className="rounded-lg bg-slate-50 p-3 space-y-2 text-sm border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Opening Balance:</span>
              <span className="font-medium text-slate-900">{formatCurrency(cashBook?.openingBalance ?? 0)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Total Cash In (Income):</span>
              <span className="font-medium">+{formatCurrency(cashBook?.totalIncome ?? 0)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Total Cash Out (Expenses):</span>
              <span className="font-medium">-{formatCurrency(cashBook?.totalExpense ?? 0)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
              <span>Expected Closing Balance:</span>
              <span className="text-indigo-600">{formatCurrency(expectedClosing)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Actual Cash Counted
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder="Enter actual cash counted"
            />
          </div>

          {actualCash !== '' && cashDiff !== 0 && (
            <div className={`rounded-lg p-2.5 text-xs font-medium ${cashDiff > 0 ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {cashDiff > 0 ? (
                <span>Cash Surplus: +{formatCurrency(cashDiff)}</span>
              ) : (
                <span>Cash Shortage: -{formatCurrency(Math.abs(cashDiff))}</span>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Closing Notes
            </label>
            <Textarea
              rows={2}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="Enter closing notes or discrepancy explanations (optional)..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDayEndModal(false)}
              disabled={isSubmittingClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleExecuteDayEnd}
              loading={isSubmittingClose}
            >
              Complete Day End
            </Button>
          </div>
        </div>
      </Modal>

      {/* Month End Modal */}
      <Modal
        isOpen={showMonthEndModal}
        onClose={() => setShowMonthEndModal(false)}
        title="Month End Closing"
        size="md"
      >
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Finalize and archive all income, expense, and rent accounts for this month.
          </p>

          <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-3 space-y-1.5 text-xs text-indigo-900">
            <p className="font-semibold text-sm text-indigo-950">Closing Summary:</p>
            <p>• Current month accounts will be locked and permanently archived.</p>
            <p>• Final closing balance will automatically carry forward as next month&apos;s opening balance.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Monthly Closing Notes
            </label>
            <Textarea
              rows={2}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="Enter monthly closing notes (optional)..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowMonthEndModal(false)}
              disabled={isSubmittingClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleExecuteMonthEnd}
              loading={isSubmittingClose}
            >
              Confirm Month End
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
