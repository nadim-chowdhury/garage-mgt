import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Calendar, Home, ClipboardList, PieChart, TrendingUp, CreditCard, BookOpen, Users, Car } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const reports: { title: string; description: string; href: string; icon: LucideIcon }[] = [
  { title: 'Daily Collection', description: 'প্রতিদিন কত টাকা আদায় হয়েছে', href: '/reports/monthly-collection', icon: Calendar },
  { title: 'Monthly Rent Report', description: 'মাসিক ভাড়া নির্ধারিত ও আদায়', href: '/monthly-rent', icon: Home },
  { title: 'Due Report', description: 'কার কাছে কত টাকা পাওনা', href: '/dues', icon: ClipboardList },
  { title: 'Income & Expense Summary', description: 'মোট আয় ও খরচের তুলনা', href: '/reports/income-expense-summary', icon: PieChart },
  { title: 'Profit & Loss', description: 'আয় ও ব্যয়ের ভিত্তিতে উদ্বৃত্ত বা ঘাটতি', href: '/reports/profit-loss', icon: TrendingUp },
  { title: 'Payment History', description: 'কে কখন কত টাকা দিয়েছেন', href: '/reports/payment-history', icon: CreditCard },
  { title: 'Cash Book', description: 'নগদ প্রাপ্তি ও প্রদান', href: '/cash-book', icon: BookOpen },
  { title: 'Tenant Ledger', description: 'প্রতিটি ভাড়াটিয়ার সম্পূর্ণ হিসাব', href: '/reports/tenant-ledger', icon: Users },
  { title: 'Vehicle Ledger', description: 'প্রতিটি গাড়ির লেনদেনের ইতিহাস', href: '/reports/vehicle-ledger', icon: Car },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">বিভিন্ন ধরনের রিপোর্ট</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.href} href={report.href} className="group">
            <Card className="h-full transition-all group-hover:shadow-md group-hover:border-indigo-200">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 shrink-0">
                  <report.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {report.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{report.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
