'use client';

import { useState } from 'react';
import { Card, Button, ConfirmDialog, LoadingSpinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import { Database, Download, Upload, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function BackupPage() {
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [restoreJson, setRestoreJson] = useState<unknown | null>(null);

  async function handleDownloadBackup() {
    setIsExporting(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) {
        throw new Error('Failed to download backup');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `garage-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('সম্পূর্ণ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে।');
    } catch {
      showError('ব্যাকআপ ডাউনলোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsExporting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showError('অনুগ্রহ করে একটি বৈধ .json ব্যাকআপ ফাইল নির্বাচন করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.version || !parsed.tenants) {
          throw new Error('Invalid schema');
        }
        setSelectedFile(file);
        setRestoreJson(parsed);
      } catch {
        showError('নির্বাচিত ফাইলটির ফরম্যাট সঠিক নয়।');
        setSelectedFile(null);
        setRestoreJson(null);
      }
    };
    reader.readAsText(file);
  }

  async function handleExecuteRestore() {
    if (!restoreJson) return;
    setIsRestoring(true);
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoreJson),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Restore failed');
      }
      success('ব্যাকআপ থেকে ডাটা সফলভাবে রিস্টোর হয়েছে।');
      setSelectedFile(null);
      setRestoreJson(null);
      setShowConfirmRestore(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'রিস্টোর করতে সমস্যা হয়েছে।';
      showError(message);
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Backup & Restore</h1>
        <p className="mt-1 text-sm text-slate-500">
          গ্যারেজের সমস্ত ডাটার সম্পূর্ণ ব্যাকআপ ডাউনলোড এবং প্রয়োজনে রিস্টোর করার সুবিধা
        </p>
      </div>

      {/* Backup Status Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-800">স্বয়ংক্রিয় ব্যাকআপ স্ট্যাটাস</p>
            <p className="text-base font-semibold text-emerald-900">সক্রিয় ও সুরক্ষিত</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-indigo-800">ডাটাবেস ফরম্যাট</p>
            <p className="text-base font-semibold text-indigo-900">JSON + PostgreSQL</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">অন-ডিমান্ড ব্যাকআপ</p>
            <p className="text-base font-semibold text-slate-900">এক-ক্লিকে ডাউনলোড</p>
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Export Card */}
        <Card title="পূর্ণাঙ্গ ডাটা ব্যাকআপ ডাউনলোড">
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              এই বোতামে ক্লিক করলে আপনার গ্যারেজের সমস্ত ভাড়াটিয়া, গাড়ি, দৈনিক এন্ট্রি, মাসিক ভাড়া, আয়, ব্যয়,
              ক্যাশ বুক এবং ক্লোজিং রেকর্ডের একটি সম্পূর্ণ এনক্রিপ্টেড JSON ব্যাকআপ ফাইল আপনার ডিভাইসে ডাউনলোড হবে।
            </p>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 space-y-1">
              <p>• নিয়মিত ব্যাকআপ কম্পিউটারে বা ক্লাউড ড্রাইভে সংরক্ষণ করা নিরাপদ।</p>
              <p>• কোনো কারণে ইন্টারনেট বা ডিভাইস পরিবর্তিত হলেও সহজেই রিস্টোর করতে পারবেন।</p>
            </div>
            <Button
              type="button"
              onClick={handleDownloadBackup}
              loading={isExporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Full Backup (.json)
            </Button>
          </div>
        </Card>

        {/* Restore Card */}
        <Card title="ব্যাকআপ থেকে ডাটা রিস্টোর">
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              পূর্বে ডাউনলোডকৃত ব্যাকআপ ফাইল নির্বাচন করে সমস্ত পূর্ববর্তী রেকর্ড পুনরায় রিস্টোর করতে পারেন।
            </p>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">সতর্কতা:</p>
                <p>রিস্টোর করার আগে বর্তমান তথ্যের একটি ব্যাকআপ কপি ডাউনলোড করে রাখা জরুরি।</p>
              </div>
            </div>

            {isAdmin ? (
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />

                {selectedFile && (
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200">
                    <span className="text-xs font-medium text-slate-700 truncate">{selectedFile.name}</span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setShowConfirmRestore(true)}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" /> রিস্টোর শুরু করুন
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">শুধুমাত্র অ্যাডমিন ইউজার ব্যাকআপ রিস্টোর করতে পারেন।</p>
            )}
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmRestore}
        onClose={() => setShowConfirmRestore(false)}
        onConfirm={handleExecuteRestore}
        title="ব্যাকআপ রিস্টোর নিশ্চিতকরণ"
        message="আপনি কি নিশ্চিত যে এই ব্যাকআপ ফাইল থেকে ডাটা রিস্টোর করতে চান? এটি পূর্বের সংরক্ষিত রেকর্ডসমূহের সাথে ডাটা সিঙ্ক করবে।"
        confirmText="হ্যাঁ, রিস্টোর করুন"
        variant="primary"
        loading={isRestoring}
      />
    </div>
  );
}
