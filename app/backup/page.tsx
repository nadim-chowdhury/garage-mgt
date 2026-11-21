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
      success('Full backup file downloaded successfully.');
    } catch {
      showError('Failed to download backup file.');
    } finally {
      setIsExporting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showError('Please select a valid .json backup file.');
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
        showError('Invalid backup file format.');
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
      success('Data restored successfully from backup.');
      setSelectedFile(null);
      setRestoreJson(null);
      setShowConfirmRestore(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to restore backup.';
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
        <Card title="Download Database Backup">
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              Download a complete JSON backup file containing all tenants, vehicles, daily entries,
              monthly rent, income, expenses, cash book, and closing records.
            </p>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 space-y-1">
              <p>• Recommended to download backups periodically to secure your business records.</p>
              <p>• Easily restore your data in case of device changes or migrations.</p>
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
        <Card title="Restore Data from Backup">
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              Select a previously downloaded backup JSON file to restore and synchronize database records.
            </p>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Important:</p>
                <p>It is recommended to download a fresh backup copy before performing a data restore.</p>
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
                      <Upload className="h-3.5 w-3.5 mr-1" /> Start Restore
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Only Admin users have permission to restore database backups.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmRestore}
        onClose={() => setShowConfirmRestore(false)}
        onConfirm={handleExecuteRestore}
        title="Confirm Data Restore"
        message="Are you sure you want to restore data from this backup file? This will synchronize database records with the backup file."
        confirmText="Yes, Restore Data"
        variant="primary"
        loading={isRestoring}
      />
    </div>
  );
}
