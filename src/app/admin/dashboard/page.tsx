"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch, clearAdminToken, getAdminToken } from "@/lib/adminApi";

interface Customer {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  planDuration: number;
  houseType: string;
  aadharFrontImageUrl: string | null;
  aadharBackImageUrl: string | null;
  panFrontImageUrl: string | null;
  panBackImageUrl: string | null;
  residenceDocUrl: string | null;
  paymentStatus: string;
  rentalPlanDuration: number | null;
  rentalAmount: number | null;
  subscriptionStatus: string;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  lastPaymentDate: string | null;
  autopayStatus: string | null;
  returnRequested: boolean;
  returnRequestedAt: string | null;
  refundAmount: number | null;
  refundBankAccountHolderName: string | null;
  refundBankName: string | null;
  refundBankIfscCode: string | null;
  refundBankAccountNumber: string | null;
  bankAccountHolderName: string | null;
  bankName: string | null;
  bankIfscCode: string | null;
  bankAccountNumber: string | null;
  planChangeRefundProofUrl: string | null;
  planChangeRazorpayRefundId: string | null;
  planChangeRefundStatus: string;
  planChangeRefundAmount: number | null;
  modelName: string | null;
  machineSerialNumber: string | null;
  createdAt: string;
}

interface Draft {
  id: string;
  fullName: string | null;
  mobileNumber: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  planDuration: number | null;
  houseType: string | null;
  residenceDocType: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Invoice {
  id: string;
  billNumber: string;
  type: string;
  productType: string;
  amount: number;
  paymentMethod: string;
  transactionId: string | null;
  status: string;
  reason: string | null;
  documentDate: string;
  createdAt: string;
}

interface PaymentLinkRecord {
  id: string;
  amount: number;
  shortUrl: string;
  expireBy: string;
  status: string;
  paidAt: string | null;
  planChangeTargetDuration: number | null;
  createdAt: string;
}

interface PayoutRecord {
  id: string;
  amount: number;
  reason: string;
  proofUrl: string;
  createdAt: string;
}

interface ReturnEvent {
  id: string;
  step: string;
  status: string;
  eventDate: string;
  remarks: string | null;
  defectImageUrls: string[];
  createdAt: string;
}

interface Stats {
  totalCustomers: number;
  totalSubscribers: number;
  twelveMonthCustomers: number;
  twentyFourMonthCustomers: number;
  rentalPaid: number;
  rentalDue: number;
  returnsInitiated: number;
  customersRefunded: number;
  rentalRevenue: number;
  totalDeposits: number;
  assetsReceived: number;
}

const SECURITY_DEPOSIT_STATUSES: { value: string; label: string }[] = [
  { value: "COMPLETED", label: "Security Deposit Completed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "PENDING_REFUND", label: "Pending Refund" },
];
const SUBSCRIPTION_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "INACTIVE", label: "Inactive" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING_DUE", label: "Pending Due" },
  { value: "CANCELLED", label: "Cancelled" },
];

const SECURITY_DEPOSIT_AMOUNTS: Record<number, number> = { 12: 3, 24: 4 };
const RENTAL_AMOUNTS: Record<number, number> = { 12: 2, 24: 1 };

const DOCUMENT_FIELDS: { key: keyof Customer; label: string; uploadField: string }[] = [
  { key: "aadharFrontImageUrl", label: "Aadhar (Front)", uploadField: "aadharFrontFile" },
  { key: "aadharBackImageUrl", label: "Aadhar (Back)", uploadField: "aadharBackFile" },
  { key: "panFrontImageUrl", label: "PAN (Front)", uploadField: "panFrontFile" },
  { key: "panBackImageUrl", label: "PAN (Back)", uploadField: "panBackFile" },
  { key: "residenceDocUrl", label: "Residence Doc", uploadField: "residenceFile" },
];

const RETURN_STEPS: { key: string; label: string; kind: "status" | "boolean" }[] = [
  { key: "DEINITIALIZATION_INITIATED", label: "De-initialization Initiated", kind: "status" },
  { key: "DEFECT_REPORTED", label: "Machine Defect Status Reported", kind: "boolean" },
  { key: "MACHINE_COLLECTED", label: "Machine Collected from Customer Location", kind: "status" },
  { key: "MACHINE_RECEIVED_WAREHOUSE", label: "Machine Received at Warehouse", kind: "status" },
  { key: "REFUND_INITIATED", label: "Refund Initiated", kind: "status" },
  { key: "PAYMENT_REFUNDED", label: "Payment Refunded", kind: "status" },
];

function todayISO(): string {
  // Local calendar date, not UTC — toISOString() is UTC and rolls over to the
  // previous/next day during early-morning/late-night hours in timezones
  // ahead of UTC (e.g. IST), which desyncs it from nowTimeHHMM() below.
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nowTimeHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatEventDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]): void {
  const csv = rows.map((row) => row.map(toCsvCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDateDMY(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function formatDateTimeDMY(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${formatDateDMY(d)}, ${time}`;
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function returnEventStatusColor(status: string): string {
  if (status === "COMPLETED" || status === "NO") return "bg-green-500/20 text-green-400";
  if (status === "YES") return "bg-red-500/20 text-red-400";
  return "bg-gray-500/20 text-gray-400";
}

async function isAssetReceived(customerId: string): Promise<boolean> {
  const res = await adminFetch(`/api/admin/customers/${customerId}/return-events`);
  const data = await res.json();
  if (!data.success) return false;
  const events: ReturnEvent[] = data.events;
  const latest = events.find((e) => e.step === "MACHINE_RECEIVED_WAREHOUSE");
  return latest?.status === "COMPLETED";
}

function DueDateCell({ customer }: { customer: Customer }) {
  if (!customer.subscriptionEnd) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const due = new Date(customer.subscriptionEnd);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysLeft = Math.round((dueDay.getTime() - todayDay.getTime()) / (1000 * 60 * 60 * 24));

  const isActive = customer.subscriptionStatus === "ACTIVE";
  const isOverdue = daysLeft < 0;
  const isDueSoon = isActive && daysLeft >= 0 && daysLeft <= 3;

  let daysLabel: string;
  if (isOverdue) {
    daysLabel = `Day ${Math.abs(daysLeft)} overdue`;
  } else if (daysLeft === 0) {
    daysLabel = "Due today";
  } else {
    daysLabel = `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
  }

  return (
    <div>
      <div className={isOverdue ? "text-red-400 font-medium" : isDueSoon ? "text-yellow-400 font-medium" : "text-gray-300"}>
        {daysLabel}
      </div>
      <div className="text-xs text-gray-500">{formatDateDMY(dueDay)}</div>
    </div>
  );
}

function DocumentChip({
  label, url, uploading, deleting, onUpload, onDelete,
}: {
  label: string;
  url: string | null;
  uploading: boolean;
  deleting: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${url ? "border-gray-700 bg-[#131724]" : "border-gray-800 bg-[#131724]/40"
        }`}
    >
      <span className={url ? "text-gray-300" : "text-gray-600"}>{label}</span>
      <div className="flex items-center gap-3 shrink-0">
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="text-[#f26522] hover:underline font-medium">
            View
          </a>
        )}
        <label className={`font-medium ${uploading ? "text-gray-600" : "text-gray-400 hover:text-white cursor-pointer"}`}>
          {uploading ? "Uploading..." : url ? "Replace" : "Upload"}
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </label>
        {url && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-red-400 hover:underline font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#1a1f30] border border-gray-700/50 rounded-xl p-3 flex flex-col">
      <p className="text-gray-400 text-xs leading-tight">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

const CUSTOMER_MODAL_SECTIONS: { key: string; label: string }[] = [
  { key: "details", label: "Customer Details" },
  { key: "quickLinks", label: "Quick Links" },
  { key: "transactions", label: "Money Transactions" },
  { key: "documents", label: "Documents" },
  { key: "receipts", label: "Receipts" },
  { key: "product", label: "Company Assets" },
  { key: "subscription", label: "Payment & Subscription" },
  { key: "bankDetails", label: "Account Details" },
  { key: "returns", label: "Returns & Refund" },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETED: "bg-green-500/20 text-green-400",
    ACTIVE: "bg-green-500/20 text-green-400",
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PENDING_DUE: "bg-yellow-500/20 text-yellow-400",
    INACTIVE: "bg-gray-500/20 text-gray-400",
    FAILED: "bg-red-500/20 text-red-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-blue-500/20 text-blue-400",
    PENDING_REFUND: "bg-orange-500/20 text-orange-400",
    RETURNED: "bg-purple-500/20 text-purple-400",
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[status] || "bg-gray-500/20 text-gray-400"}`}>
      {status}
    </span>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsFrom, setStatsFrom] = useState("");
  const [statsTo, setStatsTo] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [assetStatus, setAssetStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExportingCustomers, setIsExportingCustomers] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: "", mobileNumber: "", email: "",
    addressLine1: "", addressLine2: "", city: "", state: "", pincode: "",
    planDuration: "12", houseType: "rent",
  });
  const [addFiles, setAddFiles] = useState<Record<"aadharFrontFile" | "aadharBackFile" | "panFrontFile" | "panBackFile" | "residenceFile", File | null>>({
    aadharFrontFile: null, aadharBackFile: null, panFrontFile: null, panBackFile: null, residenceFile: null,
  });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [addError, setAddError] = useState("");
  const [uploadingDocKey, setUploadingDocKey] = useState("");
  const [deletingDocKey, setDeletingDocKey] = useState("");
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState("");
  const [paymentLinkAmount, setPaymentLinkAmount] = useState("");
  const [paymentLinkUrl, setPaymentLinkUrl] = useState("");
  const [generatingPaymentLink, setGeneratingPaymentLink] = useState(false);
  const [copiedPaymentLink, setCopiedPaymentLink] = useState(false);
  const [paymentLinkHistory, setPaymentLinkHistory] = useState<PaymentLinkRecord[]>([]);
  const [paymentLinkHistoryLoading, setPaymentLinkHistoryLoading] = useState(false);
  const [paymentLinkHistoryError, setPaymentLinkHistoryError] = useState("");
  const [copiedPaymentLinkId, setCopiedPaymentLinkId] = useState("");
  const [markingPaidId, setMarkingPaidId] = useState("");
  const [transactionMode, setTransactionMode] = useState<"pay" | "collect">("collect");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutReason, setPayoutReason] = useState("");
  const [payoutProofFile, setPayoutProofFile] = useState<File | null>(null);
  const [recordingPayout, setRecordingPayout] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [payoutHistoryLoading, setPayoutHistoryLoading] = useState(false);
  const [payoutHistoryError, setPayoutHistoryError] = useState("");
  const [refundingNow, setRefundingNow] = useState(false);
  const [refundingPlanChangeNow, setRefundingPlanChangeNow] = useState(false);
  const [planChangeRefundInitiated, setPlanChangeRefundInitiated] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [newPlanDuration, setNewPlanDuration] = useState("");
  const [planChangeAmount, setPlanChangeAmount] = useState("");
  const [planChangeTopUpUrl, setPlanChangeTopUpUrl] = useState("");
  const [generatingTopUpLink, setGeneratingTopUpLink] = useState(false);
  const [copiedTopUpLink, setCopiedTopUpLink] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("details");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [returnEvents, setReturnEvents] = useState<ReturnEvent[]>([]);
  const [returnEventsLoading, setReturnEventsLoading] = useState(false);
  const [returnEventForm, setReturnEventForm] = useState<Record<string, { status: string; eventDate: string; eventTime: string; remarks: string }>>({});
  const [savingReturnStep, setSavingReturnStep] = useState("");
  const [showReturnHistory, setShowReturnHistory] = useState(false);
  const [editingBankDetails, setEditingBankDetails] = useState(false);
  const [defectImages, setDefectImages] = useState<(File | null)[]>([null, null, null]);

  const [activeTab, setActiveTab] = useState<"customers" | "drafts">("customers");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftsTotalPages, setDraftsTotalPages] = useState(1);
  const [draftsPage, setDraftsPage] = useState(1);
  const [draftsSearch, setDraftsSearch] = useState("");
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [copiedDraftId, setCopiedDraftId] = useState("");

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin/login");
    }
  }, [router]);

  const loadStats = useCallback(async () => {
    const params = new URLSearchParams();
    if (statsFrom) params.set("from", statsFrom);
    if (statsTo) params.set("to", statsTo);
    const qs = params.toString();
    const res = await adminFetch(`/api/admin/stats${qs ? `?${qs}` : ""}`);
    const data = await res.json();
    if (data.success) setStats(data.stats);
  }, [statsFrom, statsTo]);

  const fetchAllCustomers = useCallback(async (statusOverride?: string, returnRequestedOverride?: string) => {
    const all: Customer[] = [];
    let fetchPage = 1;
    let fetchTotalPages = 1;
    do {
      const params = new URLSearchParams({ page: String(fetchPage), limit: "100" });
      if (search) params.set("search", search);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      if (statusOverride) params.set("subscriptionStatus", statusOverride);
      if (returnRequestedOverride) params.set("returnRequested", returnRequestedOverride);

      const res = await adminFetch(`/api/admin/customers?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load customers");
      all.push(...data.customers);
      fetchTotalPages = data.pagination.totalPages || 1;
      fetchPage += 1;
    } while (fetchPage <= fetchTotalPages);
    return all;
  }, [search, paymentStatus]);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // Asset received/not-received isn't a stored field — it's derived from
      // the latest "Machine Received at Warehouse" return event for customers
      // who have a return in progress, so it needs client-side filtering.
      const needsAssetSplit = assetStatus === "RECEIVED" || assetStatus === "NOT_RECEIVED";

      if (needsAssetSplit) {
        let all = await fetchAllCustomers(subscriptionStatus || undefined, "true");

        const received = await Promise.all(all.map((c) => isAssetReceived(c.id)));
        all = all.filter((_, i) => (assetStatus === "RECEIVED" ? received[i] : !received[i]));

        const pageSize = 20;
        const computedTotalPages = Math.max(1, Math.ceil(all.length / pageSize));
        const safePage = Math.min(page, computedTotalPages);
        setCustomers(all.slice((safePage - 1) * pageSize, safePage * pageSize));
        setTotalPages(computedTotalPages);
        if (safePage !== page) setPage(safePage);
        return;
      }

      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      if (subscriptionStatus) params.set("subscriptionStatus", subscriptionStatus);

      const res = await adminFetch(`/api/admin/customers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
        setTotalPages(data.pagination.totalPages || 1);
      } else {
        setError(data.message || "Failed to load customers");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to server");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, paymentStatus, subscriptionStatus, assetStatus, fetchAllCustomers]);

  const handleExportCustomers = useCallback(async () => {
    setIsExportingCustomers(true);
    setError("");
    try {
      const needsAssetSplit = assetStatus === "RECEIVED" || assetStatus === "NOT_RECEIVED";

      let all = await fetchAllCustomers(subscriptionStatus || undefined, needsAssetSplit ? "true" : undefined);

      if (needsAssetSplit) {
        const received = await Promise.all(all.map((c) => isAssetReceived(c.id)));
        all = all.filter((_, i) => (assetStatus === "RECEIVED" ? received[i] : !received[i]));
      }

      const header = [
        "Name", "Mobile", "Email", "Address Line 1", "Address Line 2", "City", "State", "Pincode",
        "Plan Duration (months)", "House Type", "Payment Status", "Subscription Status",
        "Model", "Serial Number", "Security Deposit", "Rental Amount", "Due Date", "Last Rental Payment",
        "Joined", "Return Requested", "Return Requested At", "Refund Amount",
      ];
      const rows = all.map((c) => [
        c.fullName,
        c.mobileNumber,
        c.email,
        c.addressLine1,
        c.addressLine2,
        c.city,
        c.state,
        c.pincode,
        c.planDuration,
        c.houseType,
        c.paymentStatus,
        c.subscriptionStatus,
        c.modelName,
        c.machineSerialNumber,
        SECURITY_DEPOSIT_AMOUNTS[c.planDuration] ?? "",
        c.rentalAmount,
        c.subscriptionEnd ? formatDateDMY(c.subscriptionEnd) : "",
        c.lastPaymentDate ? formatDateDMY(c.lastPaymentDate) : "",
        formatDateDMY(c.createdAt),
        c.returnRequested ? "Yes" : "No",
        c.returnRequestedAt ? formatDateDMY(c.returnRequestedAt) : "",
        c.refundAmount,
      ]);

      downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to server");
    } finally {
      setIsExportingCustomers(false);
    }
  }, [subscriptionStatus, assetStatus, fetchAllCustomers]);

  const exportCustomerReceipts = useCallback(() => {
    if (!selected) return;
    const location = [selected.addressLine1, selected.addressLine2, selected.city, selected.state]
      .filter(Boolean)
      .join(", ") + (selected.pincode ? ` - ${selected.pincode}` : "");

    const header = [
      "Name", "Mobile", "Email", "Location", "Rent Start Date", "Rent End Date",
      "Bill Number", "Product / Reason", "Amount", "Payment Method", "Status", "Payment Date", "Payment Time",
    ];
    const rows = invoices.map((inv) => {
      const d = new Date(inv.documentDate);
      return [
        selected.fullName,
        selected.mobileNumber,
        selected.email,
        location,
        selected.subscriptionStart ? formatDateDMY(selected.subscriptionStart) : "",
        selected.subscriptionEnd ? formatDateDMY(selected.subscriptionEnd) : "",
        inv.billNumber,
        inv.reason || inv.productType,
        inv.amount,
        inv.paymentMethod,
        inv.status,
        formatDateDMY(d),
        d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      ];
    });

    downloadCsv(`${selected.fullName.replace(/\s+/g, "_")}-receipts-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  }, [selected, invoices]);

  const loadDrafts = useCallback(async () => {
    setDraftsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(draftsPage), limit: "20" });
      if (draftsSearch) params.set("search", draftsSearch);

      const res = await adminFetch(`/api/admin/drafts?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDrafts(data.drafts);
        setDraftsTotalPages(data.pagination.totalPages || 1);
      } else {
        setError(data.message || "Failed to load drafts");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setDraftsLoading(false);
    }
  }, [draftsPage, draftsSearch]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (activeTab === "drafts") loadDrafts();
  }, [activeTab, loadDrafts]);

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendCooldown]);

  useEffect(() => {
    setPage(1);
  }, [search, paymentStatus, subscriptionStatus, assetStatus]);

  useEffect(() => {
    setDraftsPage(1);
  }, [draftsSearch]);

  const loadInvoices = useCallback((customerId: string) => {
    setInvoicesLoading(true);
    adminFetch(`/api/admin/customers/${customerId}/invoices`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInvoices(data.invoices);
      })
      .finally(() => setInvoicesLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setInvoices([]);
      return;
    }
    loadInvoices(selected.id);
  }, [selected, loadInvoices]);

  const loadPaymentLinkHistory = useCallback((customerId: string) => {
    setPaymentLinkHistoryLoading(true);
    setPaymentLinkHistoryError("");
    adminFetch(`/api/admin/customers/${customerId}/payment-links`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPaymentLinkHistory(data.paymentLinks);
        } else {
          setPaymentLinkHistory([]);
          setPaymentLinkHistoryError(data.message || "Failed to load payment link history");
        }
      })
      .catch(() => {
        setPaymentLinkHistory([]);
        setPaymentLinkHistoryError("Error connecting to server");
      })
      .finally(() => setPaymentLinkHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setPaymentLinkHistory([]);
      setPaymentLinkHistoryError("");
      return;
    }
    loadPaymentLinkHistory(selected.id);
  }, [selected, loadPaymentLinkHistory]);

  const loadPayoutHistory = useCallback((customerId: string) => {
    setPayoutHistoryLoading(true);
    setPayoutHistoryError("");
    adminFetch(`/api/admin/customers/${customerId}/payouts`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPayoutHistory(data.payouts);
        } else {
          setPayoutHistory([]);
          setPayoutHistoryError(data.message || "Failed to load payout history");
        }
      })
      .catch(() => {
        setPayoutHistory([]);
        setPayoutHistoryError("Error connecting to server");
      })
      .finally(() => setPayoutHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setPayoutHistory([]);
      setPayoutHistoryError("");
      return;
    }
    loadPayoutHistory(selected.id);
  }, [selected, loadPayoutHistory]);

  useEffect(() => {
    setShowReturnHistory(false);
    setDefectImages([null, null, null]);
    const initial: Record<string, { status: string; eventDate: string; eventTime: string; remarks: string }> = {};
    RETURN_STEPS.forEach((s) => {
      initial[s.key] = { status: s.kind === "boolean" ? "NO" : "PENDING", eventDate: todayISO(), eventTime: nowTimeHHMM(), remarks: "" };
    });
    setReturnEventForm(initial);

    if (!selected || !selected.returnRequested) {
      setReturnEvents([]);
      return;
    }
    setReturnEventsLoading(true);
    adminFetch(`/api/admin/customers/${selected.id}/return-events`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReturnEvents(data.events);
      })
      .finally(() => setReturnEventsLoading(false));
  }, [selected]);

  // The date/time defaults above are only set once when the customer modal
  // opens — if the admin sits on other tabs first and returns to Returns &
  // Refund later, those defaults go stale. Refresh just eventDate/eventTime
  // (not status/remarks, so in-progress edits aren't lost) every time this
  // tab becomes active.
  useEffect(() => {
    if (activeSection !== "returns") return;
    setReturnEventForm((prev) => {
      const updated = { ...prev };
      RETURN_STEPS.forEach((s) => {
        if (updated[s.key]) {
          updated[s.key] = { ...updated[s.key], eventDate: todayISO(), eventTime: nowTimeHHMM() };
        }
      });
      return updated;
    });
  }, [activeSection]);

  const latestReturnEvent = (step: string): ReturnEvent | undefined =>
    returnEvents.find((e) => e.step === step);

  const submitReturnEvent = async (stepKey: string) => {
    if (!selected) return;
    const form = returnEventForm[stepKey];
    if (!form) return;
    if (stepKey === "DEFECT_REPORTED" && form.status === "YES" && !form.remarks.trim()) {
      setError("Remarks are required when reporting a defect");
      return;
    }
    setSavingReturnStep(stepKey);
    try {
      const body = new FormData();
      body.append("step", stepKey);
      body.append("status", form.status);
      // Build the Date from the browser's local timezone, then serialize to
      // an offset-aware ISO string — a naive "YYYY-MM-DDTHH:MM" string would
      // get reinterpreted under the server's timezone, not the browser's.
      const localEventDate = new Date(`${form.eventDate}T${form.eventTime || "00:00"}`);
      body.append("eventDate", localEventDate.toISOString());
      if (form.remarks) body.append("remarks", form.remarks);
      if (stepKey === "DEFECT_REPORTED" && form.status === "YES") {
        defectImages.forEach((file) => {
          if (file) body.append("defectImages", file);
        });
      }

      const res = await adminFetch(`/api/admin/customers/${selected.id}/return-events`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (data.success) {
        setReturnEvents((prev) => [data.event, ...prev]);
        setReturnEventForm((prev) => ({
          ...prev,
          [stepKey]: {
            status: stepKey === "DEFECT_REPORTED" ? "NO" : "PENDING",
            eventDate: todayISO(),
            eventTime: nowTimeHHMM(),
            remarks: "",
          },
        }));
        if (stepKey === "DEFECT_REPORTED") setDefectImages([null, null, null]);
      } else {
        setError(data.message || "Failed to save update");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setSavingReturnStep("");
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    router.replace("/admin/login");
  };

  const openEdit = (customer: Customer) => {
    setSelected(customer);
    setActiveSection("details");
    setPaymentLinkAmount("");
    setPaymentLinkUrl("");
    setCopiedPaymentLink(false);
    setCopiedPaymentLinkId("");
    const defaultPlan = customer.planDuration === 12 ? 24 : 12;
    setNewPlanDuration(String(defaultPlan));
    setPlanChangeAmount(String(Math.abs(SECURITY_DEPOSIT_AMOUNTS[defaultPlan] - SECURITY_DEPOSIT_AMOUNTS[customer.planDuration])));
    setPlanChangeTopUpUrl("");
    setCopiedTopUpLink(false);
    setPlanChangeRefundInitiated(false);
    setEditingBankDetails(false);
    setEditForm({
      paymentStatus: customer.paymentStatus,
      subscriptionStatus: customer.subscriptionStatus,
      // Falls back to the customer's originally-committed plan when
      // rentalPlanDuration/rentalAmount are still unset — this happens for
      // anyone whose autopay was first activated by the subscription.charged
      // webhook before it started backfilling these fields (see
      // webhook.controller.ts); they'd otherwise show "Not set" until their
      // next monthly charge fires. Saving here writes the fallback in for
      // good, matching the backend's own "already on file" fallback.
      rentalPlanDuration: String(customer.rentalPlanDuration || customer.planDuration),
      rentalAmount: String(customer.rentalAmount || RENTAL_AMOUNTS[customer.planDuration] || ""),
      // Same legacy gap as rentalPlanDuration above, one field over: the old
      // subscription.charged webhook set subscriptionEnd (from Razorpay's
      // current_end) but never set subscriptionStart at all — only the
      // fixed activateRentalCycle path sets both together. lastPaymentDate
      // WAS set by that old code and is the closest available proxy for
      // when the current billing cycle actually began; there's no more
      // accurate value stored anywhere for these legacy customers. Saving
      // here backfills the real column, same as above.
      subscriptionStart: customer.subscriptionStart
        ? customer.subscriptionStart.slice(0, 10)
        : customer.lastPaymentDate
        ? customer.lastPaymentDate.slice(0, 10)
        : "",
      subscriptionEnd: customer.subscriptionEnd ? customer.subscriptionEnd.slice(0, 10) : "",
      returnRequested: String(customer.returnRequested),
      refundAmount: customer.refundAmount !== null ? String(customer.refundAmount) : "",
      modelName: customer.modelName || "",
      machineSerialNumber: customer.machineSerialNumber || "",
      bankAccountHolderName: customer.bankAccountHolderName || "",
      bankName: customer.bankName || "",
      bankIfscCode: customer.bankIfscCode || "",
      bankAccountNumber: customer.bankAccountNumber || "",
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const body: Record<string, string> = {};
      Object.entries(editForm).forEach(([key, value]) => {
        if (value !== "") body[key] = value;
      });
      const res = await adminFetch(`/api/admin/customers/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(null);
        loadCustomers();
        loadStats();
      } else {
        setError(data.message || "Failed to update customer");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setIsSaving(false);
    }
  };

  const copyLink = async (path: string, mobileNumber: string, label: string) => {
    const url = `${window.location.origin}${path}?mobile=${mobileNumber}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(label);
      setTimeout(() => setCopiedLink(""), 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  const generatePaymentLink = async () => {
    if (!selected) return;
    const amount = Number(paymentLinkAmount);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setGeneratingPaymentLink(true);
    setCopiedPaymentLink(false);
    try {
      const res = await adminFetch(`/api/admin/customers/${selected.id}/payment-link`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentLinkUrl(data.shortUrl);
        setPaymentLinkAmount("");
        loadPaymentLinkHistory(selected.id);
      } else {
        setError(data.message || "Failed to generate payment link");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setGeneratingPaymentLink(false);
    }
  };

  const recordPayout = async () => {
    if (!selected) return;
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!payoutReason.trim()) {
      setError("Enter a reason");
      return;
    }
    if (!payoutProofFile) {
      setError("Attach payment proof before recording");
      return;
    }
    setRecordingPayout(true);
    try {
      const body = new FormData();
      body.append("amount", String(amount));
      body.append("reason", payoutReason.trim());
      body.append("proofFile", payoutProofFile);
      const res = await adminFetch(`/api/admin/customers/${selected.id}/payout`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (data.success) {
        setPayoutAmount("");
        setPayoutReason("");
        setPayoutProofFile(null);
        loadPayoutHistory(selected.id);
        loadInvoices(selected.id);
      } else {
        setError(data.message || "Failed to record payment");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setRecordingPayout(false);
    }
  };

  const copyPaymentLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLinkUrl);
      setCopiedPaymentLink(true);
      setTimeout(() => setCopiedPaymentLink(false), 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  const copyHistoryLink = async (record: PaymentLinkRecord) => {
    try {
      await navigator.clipboard.writeText(record.shortUrl);
      setCopiedPaymentLinkId(record.id);
      setTimeout(() => setCopiedPaymentLinkId(""), 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  const markLinkAsPaid = async (record: PaymentLinkRecord) => {
    if (!selected) return;
    if (!confirm(`Mark the ₹${record.amount} payment link as paid? Only do this after confirming the payment in the Razorpay dashboard.`)) return;
    setMarkingPaidId(record.id);
    try {
      const res = await adminFetch(`/api/admin/payment-links/${record.id}/mark-paid`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        loadPaymentLinkHistory(selected.id);
        loadInvoices(selected.id);
      } else {
        setError(data.message || "Failed to mark as paid");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setMarkingPaidId("");
    }
  };

  const handleRefundNow = async () => {
    if (!selected) return;
    if (!confirm(`Refund ₹${selected.refundAmount} to ${selected.fullName} via Razorpay now? This sends the money immediately to their original payment method.`)) return;
    setRefundingNow(true);
    setError("");
    try {
      const res = await adminFetch(`/api/admin/customers/${selected.id}/refund-now`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSelected(data.customer);
        loadInvoices(selected.id);
        loadCustomers();
      } else {
        setError(data.message || "Failed to process refund");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setRefundingNow(false);
    }
  };

  // Two-step on purpose: "Initiate" just reveals a review panel (nothing
  // moves yet) so the admin sees exactly who/how much before committing —
  // "Confirm Refund" below is what actually calls Razorpay. Replaces a
  // single click + a generic browser confirm() popup, which is easy to
  // blow through for an action that sends real money.
  const requestRefundOtp = async () => {
    if (!selected || !newPlanDuration) return;
    setRequestingOtp(true);
    setError("");
    try {
      const res = await adminFetch(`/api/admin/customers/${selected.id}/plan-change/refund/request-otp`, {
        method: "POST",
        body: JSON.stringify({ newPlanDuration: Number(newPlanDuration) }),
      });
      const data = await res.json();
      if (data.success) {
        setMaskedMobile(data.maskedMobile);
        setOtpSent(true);
        setOtpResendCooldown(30);
        setSelected(data.customer);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setRequestingOtp(false);
    }
  };

  const verifyRefundOtpAndExecute = async () => {
    if (!selected || !otpCode) return;
    setVerifyingOtp(true);
    setError("");
    setRefundingPlanChangeNow(true);
    try {
      const res = await adminFetch(`/api/admin/customers/${selected.id}/plan-change/refund/verify-otp`, {
        method: "POST",
        body: JSON.stringify({ code: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(data.customer);
        setOtpSent(false);
        setOtpCode("");
      } else {
        setError(data.message || "OTP verification failed");
        if (data.customer) {
          setSelected(data.customer);
        }
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setVerifyingOtp(false);
      setRefundingPlanChangeNow(false);
    }
  };

  const cancelRefundOtp = async () => {
    if (!selected) return;
    setError("");
    try {
      const res = await adminFetch(`/api/admin/customers/${selected.id}/plan-change/refund/cancel`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setSelected(data.customer);
        setOtpSent(false);
        setOtpCode("");
        setPlanChangeRefundInitiated(false);
      } else {
        setError(data.message || "Failed to cancel OTP");
      }
    } catch {
      setError("Error connecting to server");
    }
  };

  const planChangeDifference = (): number => {
    if (!selected || !newPlanDuration) return 0;
    return SECURITY_DEPOSIT_AMOUNTS[Number(newPlanDuration)] - SECURITY_DEPOSIT_AMOUNTS[selected.planDuration];
  };

  const generateTopUpLink = async () => {
    if (!selected || !newPlanDuration) return;
    const amount = planChangeDifference();
    if (amount <= 0) return;
    setGeneratingTopUpLink(true);
    setCopiedTopUpLink(false);
    try {
      const res = await adminFetch(`/api/admin/customers/${selected.id}/payment-link`, {
        method: "POST",
        body: JSON.stringify({ amount, planChangeTargetDuration: Number(newPlanDuration) }),
      });
      const data = await res.json();
      if (data.success) {
        setPlanChangeTopUpUrl(data.shortUrl);
        loadPaymentLinkHistory(selected.id);
      } else {
        setError(data.message || "Failed to generate top-up link");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setGeneratingTopUpLink(false);
    }
  };

  const copyTopUpLink = async () => {
    try {
      await navigator.clipboard.writeText(planChangeTopUpUrl);
      setCopiedTopUpLink(true);
      setTimeout(() => setCopiedTopUpLink(false), 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  const confirmPlanChange = async (skipConfirm = false) => {
    if (!selected || !newPlanDuration) return;
    const target = Number(newPlanDuration);
    const difference = planChangeDifference();
    const amountHandled = Number(planChangeAmount);
    if (isNaN(amountHandled) || amountHandled < 0) {
      setError("Enter a valid amount paid/refunded");
      return;
    }
    if (!skipConfirm) {
      const confirmMsg =
        difference > 0
          ? `Apply the ${target}-month plan? This records a ₹${amountHandled} deposit top-up receipt.`
          : `Apply the ${target}-month plan? This records a ₹${amountHandled} deposit refund — make sure the refund has actually been sent to the customer.`;
      if (!confirm(confirmMsg)) return;
    }

    setChangingPlan(true);
    try {
      const res = await adminFetch(`/api/admin/customers/${selected.id}/change-plan`, {
        method: "POST",
        body: JSON.stringify({ newPlanDuration: target, amountHandled }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(data.customer);
        setEditForm((prev) => ({
          ...prev,
          rentalPlanDuration: String(data.customer.rentalPlanDuration),
          rentalAmount: String(data.customer.rentalAmount),
        }));
        setPlanChangeTopUpUrl("");
        const nextPlan = data.customer.planDuration === 12 ? 24 : 12;
        setNewPlanDuration(String(nextPlan));
        setPlanChangeAmount(String(Math.abs(SECURITY_DEPOSIT_AMOUNTS[nextPlan] - SECURITY_DEPOSIT_AMOUNTS[data.customer.planDuration])));
        loadCustomers();
        loadStats();
        loadInvoices(selected.id);
      } else {
        setError(data.message || "Failed to change plan");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setChangingPlan(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Delete customer "${customer.fullName}"? This also permanently deletes their invoices, payment links, payouts, and return history. This cannot be undone.`)) return;
    try {
      const res = await adminFetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSelected(null);
        loadCustomers();
        loadStats();
      } else {
        setError(data.message || "Failed to delete customer");
      }
    } catch {
      setError("Error connecting to server");
    }
  };

  const handleAddCustomer = async () => {
    const { fullName, mobileNumber, email, addressLine1, city, state, pincode } = addForm;
    if (!fullName || !mobileNumber || !email || !addressLine1 || !city || !state || !pincode) {
      setAddError("Please fill in all required fields.");
      return;
    }
    setIsAddingCustomer(true);
    setAddError("");
    try {
      const body = new FormData();
      Object.entries(addForm).forEach(([key, value]) => body.append(key, value));
      Object.entries(addFiles).forEach(([key, file]) => {
        if (file) body.append(key, file);
      });

      const res = await adminFetch("/api/admin/customers", { method: "POST", body });
      const data = await res.json();
      if (data.success) {
        setShowAddCustomer(false);
        setAddForm({
          fullName: "", mobileNumber: "", email: "",
          addressLine1: "", addressLine2: "", city: "", state: "", pincode: "",
          planDuration: "12", houseType: "rent",
        });
        setAddFiles({ aadharFrontFile: null, aadharBackFile: null, panFrontFile: null, panBackFile: null, residenceFile: null });
        loadCustomers();
        loadStats();
      } else {
        setAddError(data.message || "Failed to add customer");
      }
    } catch {
      setAddError("Error connecting to server");
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const handleUploadDocument = async (dbField: string, uploadField: string, file: File) => {
    if (!selected) return;
    setUploadingDocKey(dbField);
    setError("");
    try {
      const body = new FormData();
      body.append(uploadField, file);
      const res = await adminFetch(`/api/admin/customers/${selected.id}/documents`, { method: "POST", body });
      const data = await res.json();
      if (data.success) {
        setSelected(data.customer);
        loadCustomers();
      } else {
        setError(data.message || "Failed to upload document");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setUploadingDocKey("");
    }
  };

  const handleDeleteDocument = async (dbField: string) => {
    if (!selected) return;
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeletingDocKey(dbField);
    setError("");
    try {
      const res = await adminFetch(`/api/admin/customers/${selected.id}/documents/${dbField}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSelected(data.customer);
        loadCustomers();
      } else {
        setError(data.message || "Failed to delete document");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setDeletingDocKey("");
    }
  };

  const copyDraftLink = async (draft: Draft) => {
    const url = `${window.location.origin}/customerForm?draft=${draft.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedDraftId(draft.id);
      setTimeout(() => setCopiedDraftId(""), 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  const downloadInvoicePdf = async (invoice: Invoice) => {
    try {
      const res = await adminFetch(`/api/admin/invoices/${invoice.id}/pdf`);
      if (!res.ok) {
        setError("Failed to download receipt");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.billNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download receipt");
    }
  };

  const handleDeleteDraft = async (draft: Draft) => {
    if (!confirm(`Delete draft for "${draft.fullName || draft.mobileNumber || "this entry"}"? This cannot be undone.`)) return;
    try {
      const res = await adminFetch(`/api/admin/drafts/${draft.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        loadDrafts();
      } else {
        setError(data.message || "Failed to delete draft");
      }
    } catch {
      setError("Error connecting to server");
    }
  };

  return (
    <div className="min-h-screen bg-[#131724] text-white font-sans">
      <header className="bg-[#1a1f30] flex items-center justify-between px-4 sm:px-6 py-3 shadow-md border-b border-gray-800">
        <img src="/logo-footer.svg" alt="AKVINZ Logo" className="h-8 object-contain" />
        <button
          onClick={handleLogout}
          className="text-sm text-gray-300 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
        >
          Logout
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage customers and subscriptions</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">From</label>
            <input
              type="date"
              lang="en-GB"
              value={statsFrom}
              onChange={(e) => setStatsFrom(e.target.value)}
              className="px-3 py-2 bg-[#1a1f30] border border-gray-700 rounded-xl text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">To</label>
            <input
              type="date"
              lang="en-GB"
              value={statsTo}
              onChange={(e) => setStatsTo(e.target.value)}
              className="px-3 py-2 bg-[#1a1f30] border border-gray-700 rounded-xl text-white text-sm"
            />
          </div>
          {(statsFrom || statsTo) && (
            <button
              type="button"
              onClick={() => { setStatsFrom(""); setStatsTo(""); }}
              className="text-sm text-[#f26522] hover:underline pb-2.5"
            >
              Clear (show all-time)
            </button>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <StatCard label="Total Customers" value={stats.totalCustomers} />
            <StatCard label="Total Subscribers" value={stats.totalSubscribers} />
            <StatCard label="12-Month Customers" value={stats.twelveMonthCustomers} />
            <StatCard label="24-Month Customers" value={stats.twentyFourMonthCustomers} />
            <StatCard label="Rental Paid" value={stats.rentalPaid} />
            <StatCard label="Rental Due" value={stats.rentalDue} />
            <StatCard label="Returns Initiated" value={stats.returnsInitiated} />
            <StatCard label="Customers Refunded" value={stats.customersRefunded} />
            <StatCard label="Assets Received" value={stats.assetsReceived} />
            <StatCard label="Rental Revenue" value={`₹${stats.rentalRevenue}`} />
            <StatCard label="Security Deposits" value={`₹${stats.totalDeposits}`} />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === "customers" ? "bg-[#f26522] text-white" : "bg-[#1a1f30] border border-gray-700/50 text-gray-400 hover:text-white"}`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab("drafts")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === "drafts" ? "bg-[#f26522] text-white" : "bg-[#1a1f30] border border-gray-700/50 text-gray-400 hover:text-white"}`}
          >
            Drafts
          </button>
        </div>

        {activeTab === "customers" && (
          <div className="bg-[#1a1f30] border border-gray-700/50 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or mobile..."
                className="flex-grow px-4 py-2.5 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white text-sm transition-colors"
              />
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="px-4 py-2.5 bg-[#131724] border border-gray-700 rounded-xl text-white text-sm"
              >
                <option value="">Security Deposit Status</option>
                {SECURITY_DEPOSIT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                value={subscriptionStatus}
                onChange={(e) => setSubscriptionStatus(e.target.value)}
                className="px-4 py-2.5 bg-[#131724] border border-gray-700 rounded-xl text-white text-sm"
              >
                <option value="">Subscription Status</option>
                {SUBSCRIPTION_STATUS_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                value={assetStatus}
                onChange={(e) => setAssetStatus(e.target.value)}
                className="px-4 py-2.5 bg-[#131724] border border-gray-700 rounded-xl text-white text-sm"
              >
                <option value="">Asset Status</option>
                <option value="RECEIVED">Asset Received</option>
                <option value="NOT_RECEIVED">Asset Not Received</option>
              </select>
              <button
                type="button"
                onClick={handleExportCustomers}
                disabled={isExportingCustomers}
                className="px-4 py-2.5 bg-[#131724] border border-gray-700 rounded-xl text-white text-sm hover:border-[#f26522] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                {isExportingCustomers ? "Exporting..." : "Download"}
              </button>
              <button
                type="button"
                onClick={() => { setAddError(""); setShowAddCustomer(true); }}
                className="px-4 py-2.5 bg-[#f26522] hover:bg-[#e05a1e] rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Customer
              </button>
            </div>

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700/50">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Contact</th>
                    <th className="py-2 pr-4 font-medium">Subscription</th>
                    <th className="py-2 pr-4 font-medium">Product</th>
                    <th className="py-2 pr-4 font-medium">Rental</th>
                    <th className="py-2 pr-4 font-medium">Due Date</th>
                    <th className="py-2 pr-4 font-medium">Last Rental Payment</th>
                    <th className="py-2 pr-4 font-medium">Joined</th>
                    <th className="py-2 pr-4 font-medium">Return Initiated</th>
                    <th className="py-2 pr-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-400">Loading...</td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-400">No customers found</td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="border-b border-gray-800 hover:bg-white/5">
                        <td className="py-3 pr-4">{c.fullName}</td>
                        <td className="py-3 pr-4 text-gray-300">
                          <div>{c.mobileNumber}</div>
                          <div className="text-xs text-gray-500">{c.email}</div>
                        </td>
                        <td className="py-3 pr-4"><StatusBadge status={c.subscriptionStatus} /></td>
                        <td className="py-3 pr-4 text-gray-300">
                          {c.modelName || c.machineSerialNumber ? (
                            <>
                              <div>{c.modelName || "-"}</div>
                              <div className="text-xs text-gray-500">{c.machineSerialNumber || "-"}</div>
                            </>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-gray-300">{c.rentalAmount ? `₹${c.rentalAmount}` : "-"}</td>
                        <td className="py-3 pr-4"><DueDateCell customer={c} /></td>
                        <td className="py-3 pr-4 text-gray-300">{c.lastPaymentDate ? formatDateDMY(c.lastPaymentDate) : "-"}</td>
                        <td className="py-3 pr-4 text-gray-400">{formatDateDMY(c.createdAt)}</td>
                        <td className="py-3 pr-4 text-gray-300">
                          {c.returnRequested && c.returnRequestedAt ? (
                            formatDateDMY(c.returnRequestedAt)
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right space-x-3 whitespace-nowrap">
                          <button
                            onClick={() => openEdit(c)}
                            title="View full details"
                            aria-label="View full details"
                            className="inline-flex align-middle text-gray-400 hover:text-white transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
              <span>Page {page} of {totalPages}</span>
              <div className="space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border border-gray-700 rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border border-gray-700 rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "drafts" && (
          <div className="bg-[#1a1f30] border border-gray-700/50 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                value={draftsSearch}
                onChange={(e) => setDraftsSearch(e.target.value)}
                placeholder="Search by name, email, or mobile..."
                className="flex-grow px-4 py-2.5 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white text-sm transition-colors"
              />
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Registrations customers started but haven&apos;t completed and submitted yet. These are not counted as customers.
            </p>

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700/50">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Contact</th>
                    <th className="py-2 pr-4 font-medium">City</th>
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 pr-4 font-medium">House Type</th>
                    <th className="py-2 pr-4 font-medium">Documents</th>
                    <th className="py-2 pr-4 font-medium">Last Updated</th>
                    <th className="py-2 pr-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {draftsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">Loading...</td>
                    </tr>
                  ) : drafts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">No drafts found</td>
                    </tr>
                  ) : (
                    drafts.map((d) => (
                      <tr key={d.id} className="border-b border-gray-800 hover:bg-white/5">
                        <td className="py-3 pr-4">{d.fullName || <span className="text-gray-500">-</span>}</td>
                        <td className="py-3 pr-4 text-gray-300">
                          <div>{d.mobileNumber || "-"}</div>
                          <div className="text-xs text-gray-500">{d.email || "-"}</div>
                        </td>
                        <td className="py-3 pr-4 text-gray-300">{d.city || "-"}</td>
                        <td className="py-3 pr-4 text-gray-300">{d.planDuration ? `${d.planDuration} months` : "-"}</td>
                        <td className="py-3 pr-4 text-gray-300">{d.houseType || "-"}</td>
                        <td className="py-3 pr-4">
                          {d.residenceDocType ? (
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400">
                              {d.residenceDocType}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">Not selected</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-gray-400">{formatDateTimeDMY(d.updatedAt)}</td>
                        <td className="py-3 pr-4 text-right space-x-3 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedDraft(d)}
                            title="View draft details"
                            aria-label="View draft details"
                            className="inline-flex align-middle text-gray-400 hover:text-white transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                          <button onClick={() => copyDraftLink(d)} className="text-[#f26522] hover:underline">
                            {copiedDraftId === d.id ? "Copied!" : "Copy Continue Link"}
                          </button>
                          <button onClick={() => handleDeleteDraft(d)} className="text-red-400 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
              <span>Page {draftsPage} of {draftsTotalPages}</span>
              <div className="space-x-2">
                <button
                  onClick={() => setDraftsPage((p) => Math.max(1, p - 1))}
                  disabled={draftsPage <= 1}
                  className="px-3 py-1.5 border border-gray-700 rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setDraftsPage((p) => Math.min(draftsTotalPages, p + 1))}
                  disabled={draftsPage >= draftsTotalPages}
                  className="px-3 py-1.5 border border-gray-700 rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
          <div className="bg-[#1a1f30] border border-gray-700/50 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-800 shrink-0">
              <div>
                <h2 className="text-lg font-bold">{selected.fullName}</h2>
                <p className="text-gray-400 text-sm mt-0.5">{selected.email} · {selected.mobileNumber}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-1 min-h-0">
              <div className="flex sm:flex-col shrink-0 w-full sm:w-52 overflow-x-auto sm:overflow-y-auto border-b sm:border-b-0 sm:border-r border-gray-800 py-2">
                {CUSTOMER_MODAL_SECTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setActiveSection(s.key)}
                    className={`shrink-0 text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 sm:border-b-0 sm:border-l-2 ${activeSection === s.key
                      ? "border-[#f26522] text-[#f26522] bg-[#f26522]/10"
                      : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeSection === "details" && (
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>{selected.addressLine1}{selected.addressLine2 ? `, ${selected.addressLine2}` : ""}</p>
                    <p>{selected.city}, {selected.state} - {selected.pincode}</p>
                    <p className="text-gray-500">Plan: {selected.planDuration} months · House: {selected.houseType}</p>
                  </div>
                )}

                {activeSection === "quickLinks" && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyLink("/rentForm", selected.mobileNumber, "rent")}
                        className="px-3 py-1.5 text-xs bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                      >
                        {copiedLink === "rent" ? "Copied!" : "Copy Rent Link"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyLink("/returnForm", selected.mobileNumber, "return")}
                        className="px-3 py-1.5 text-xs bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                      >
                        {copiedLink === "return" ? "Copied!" : "Copy Return Link"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyLink("/bankDetailsForm", selected.mobileNumber, "bankDetails")}
                        className="px-3 py-1.5 text-xs bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                      >
                        {copiedLink === "bankDetails" ? "Copied!" : "Copy Bank Details Link"}
                      </button>
                      {selected.paymentStatus === "PENDING_REFUND" && (
                        <button
                          type="button"
                          onClick={() => copyLink("/closeForm", selected.mobileNumber, "close")}
                          className="px-3 py-1.5 text-xs bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                        >
                          {copiedLink === "close" ? "Copied!" : "Copy Close Agreement Link"}
                        </button>
                      )}
                    </div>
                    {selected.paymentStatus === "PENDING_REFUND" && selected.refundAmount === null && (
                      <p className="text-xs text-yellow-400 mt-2">
                        Set a refund amount below before sending the close agreement link.
                      </p>
                    )}
                  </>
                )}

                {activeSection === "transactions" && (
                  <>
                    <div className="flex gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setTransactionMode("pay")}
                        className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${transactionMode === "pay"
                          ? "bg-[#f26522]/10 border-[#f26522]/40 text-[#f26522]"
                          : "bg-[#131724] border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                          }`}
                      >
                        Pay Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransactionMode("collect")}
                        className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${transactionMode === "collect"
                          ? "bg-[#f26522]/10 border-[#f26522]/40 text-[#f26522]"
                          : "bg-[#131724] border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                          }`}
                      >
                        Collect From Customer
                      </button>
                    </div>

                    {transactionMode === "pay" ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Amount</label>
                          <input
                            type="number"
                            min="1"
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            placeholder="e.g. 100"
                            className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Reason</label>
                          <input
                            type="text"
                            value={payoutReason}
                            onChange={(e) => setPayoutReason(e.target.value)}
                            placeholder="e.g. Deposit refund"
                            className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Payment Proof &mdash; attach before you can record this payment
                          </label>
                          <div
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${payoutProofFile ? "border-gray-700 bg-[#131724]" : "border-gray-800 bg-[#131724]/40"
                              }`}
                          >
                            <span className={payoutProofFile ? "text-gray-300 truncate" : "text-gray-600"}>
                              {payoutProofFile ? payoutProofFile.name : "No file attached"}
                            </span>
                            <label className="font-medium text-gray-400 hover:text-white cursor-pointer shrink-0">
                              {payoutProofFile ? "Replace" : "Attach"}
                              <input
                                type="file"
                                accept=".png,.jpg,.jpeg,.pdf"
                                className="hidden"
                                onChange={(e) => setPayoutProofFile(e.target.files?.[0] || null)}
                              />
                            </label>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={recordPayout}
                          disabled={recordingPayout || !payoutProofFile}
                          className="w-full px-3 py-2 text-xs bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                        >
                          {recordingPayout ? "Recording..." : "Record Payment"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            value={paymentLinkAmount}
                            onChange={(e) => setPaymentLinkAmount(e.target.value)}
                            placeholder="e.g. 499"
                            className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={generatePaymentLink}
                            disabled={generatingPaymentLink}
                            className="px-3 py-2 text-xs whitespace-nowrap bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                          >
                            {generatingPaymentLink ? "Generating..." : "Generate Payment Link"}
                          </button>
                        </div>
                        {paymentLinkUrl && (
                          <div className="flex items-center justify-between gap-2 mt-2 px-3 py-2 rounded-lg border border-gray-700 bg-[#131724] text-xs">
                            <span className="text-gray-300 truncate">{paymentLinkUrl}</span>
                            <button
                              type="button"
                              onClick={copyPaymentLink}
                              className="text-[#f26522] hover:underline shrink-0"
                            >
                              {copiedPaymentLink ? "Copied!" : "Copy Link"}
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Link expires 1 hour after generation.</p>
                      </>
                    )}

                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Transaction History</p>
                      {payoutHistoryLoading || paymentLinkHistoryLoading ? (
                        <p className="text-xs text-gray-500">Loading...</p>
                      ) : payoutHistoryError || paymentLinkHistoryError ? (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-red-400">{payoutHistoryError || paymentLinkHistoryError}</p>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selected) return;
                              loadPayoutHistory(selected.id);
                              loadPaymentLinkHistory(selected.id);
                            }}
                            className="text-xs text-[#f26522] hover:underline shrink-0"
                          >
                            Retry
                          </button>
                        </div>
                      ) : payoutHistory.length === 0 && paymentLinkHistory.length === 0 ? (
                        <p className="text-xs text-gray-500">No transactions yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {[
                            ...payoutHistory.map((p) => ({
                              key: `payout-${p.id}`,
                              direction: "Admin → Customer",
                              amount: p.amount,
                              detail: p.reason,
                              statusLabel: "Completed",
                              statusColor: "text-green-400",
                              date: new Date(p.createdAt),
                              link: null as PaymentLinkRecord | null,
                              proofUrl: p.proofUrl as string | null,
                            })),
                            ...paymentLinkHistory.map((r) => {
                              const expired = new Date(r.expireBy) < new Date();
                              const statusLabel = r.status === "PAID" ? "Paid" : expired ? "Expired" : "Pending";
                              const statusColor = r.status === "PAID" ? "text-green-400" : expired ? "text-gray-500" : "text-yellow-400";
                              return {
                                key: `link-${r.id}`,
                                direction: "Customer → Admin",
                                amount: r.amount,
                                detail: "Payment Link",
                                statusLabel,
                                statusColor,
                                date: new Date(r.status === "PAID" && r.paidAt ? r.paidAt : r.createdAt),
                                link: r,
                                proofUrl: null as string | null,
                              };
                            }),
                          ]
                            .sort((a, b) => b.date.getTime() - a.date.getTime())
                            .map((row) => (
                              <div
                                key={row.key}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-700 bg-[#131724] text-xs"
                              >
                                <div>
                                  <div className="text-gray-200 font-medium">
                                    {row.direction} · ₹{row.amount} <span className={row.statusColor}>· {row.statusLabel}</span>
                                  </div>
                                  <div className="text-gray-500">
                                    {row.detail} · {formatDateTimeDMY(row.date)}
                                  </div>
                                </div>
                                {row.proofUrl && (
                                  <a
                                    href={row.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#f26522] hover:underline shrink-0"
                                  >
                                    View Proof
                                  </a>
                                )}
                                {row.link && row.link.status !== "PAID" && (
                                  <div className="flex items-center gap-3 shrink-0">
                                    <button
                                      onClick={() => copyHistoryLink(row.link as PaymentLinkRecord)}
                                      className="text-[#f26522] hover:underline"
                                    >
                                      {copiedPaymentLinkId === row.link.id ? "Copied!" : "Copy"}
                                    </button>
                                    <button
                                      onClick={() => markLinkAsPaid(row.link as PaymentLinkRecord)}
                                      disabled={markingPaidId === row.link.id}
                                      className="text-green-400 hover:underline disabled:opacity-50"
                                    >
                                      {markingPaidId === row.link.id ? "Marking..." : "Mark as Paid"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeSection === "documents" && (
                  <div>
                    <p className="text-xs text-gray-500 mb-3">
                      {DOCUMENT_FIELDS.filter(({ key }) => Boolean(selected[key])).length}/{DOCUMENT_FIELDS.length} uploaded
                    </p>
                    <div className="space-y-2">
                      {DOCUMENT_FIELDS.map(({ key, label, uploadField }) => (
                        <DocumentChip
                          key={key}
                          label={label}
                          url={selected[key] as string | null}
                          uploading={uploadingDocKey === key}
                          deleting={deletingDocKey === key}
                          onUpload={(file) => handleUploadDocument(key, uploadField, file)}
                          onDelete={() => handleDeleteDocument(key)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === "receipts" && (
                  <>
                    {invoicesLoading ? (
                      <p className="text-xs text-gray-500">Loading...</p>
                    ) : invoices.length === 0 ? (
                      <p className="text-xs text-gray-500">No receipts yet.</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-end mb-1">
                          <button
                            type="button"
                            onClick={exportCustomerReceipts}
                            className="px-3 py-1.5 text-xs bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                          >
                            Download Excel
                          </button>
                        </div>
                        {invoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-700 bg-[#131724] text-xs"
                          >
                            <div>
                              <div className="text-gray-200 font-medium">{inv.billNumber}</div>
                              <div className="text-gray-500">
                                {inv.productType} · ₹{inv.amount} · {formatDateTimeDMY(inv.documentDate)}
                              </div>
                              <div className="text-gray-600 mt-0.5">
                                {inv.paymentMethod}
                                {inv.transactionId && ` · ${inv.transactionId}`}
                              </div>
                            </div>
                            <button onClick={() => downloadInvoicePdf(inv)} className="text-[#f26522] hover:underline shrink-0">
                              Download PDF
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeSection === "product" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Model Name</label>
                      <input
                        type="text"
                        value={editForm.modelName}
                        onChange={(e) => setEditForm({ ...editForm, modelName: e.target.value })}
                        placeholder="e.g. AKV-200"
                        className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Machine Serial Number</label>
                      <input
                        type="text"
                        value={editForm.machineSerialNumber}
                        onChange={(e) => setEditForm({ ...editForm, machineSerialNumber: e.target.value })}
                        placeholder="e.g. SN-000123"
                        className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}

                {activeSection === "subscription" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Autopay:</span>
                      <StatusBadge status={selected.autopayStatus || "NOT_SET"} />
                      {selected.autopayStatus === "FAILED" && (
                        <span className="text-xs text-red-400">Charge failed — generate a payment link below to collect manually.</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Payment Status (Don't touch until refund initiated from company)</label>
                        <select
                          value={editForm.paymentStatus}
                          onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                          className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                        >
                          {SECURITY_DEPOSIT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Subscription Status (Select only if the pending due is cleared)</label>
                        <select
                          value={editForm.subscriptionStatus}
                          onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value })}
                          className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                        >
                          {SUBSCRIPTION_STATUS_FILTERS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Rental Plan</label>
                        <div className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm text-gray-300">
                          {editForm.rentalPlanDuration
                            ? `${editForm.rentalPlanDuration} months · ₹${RENTAL_AMOUNTS[Number(editForm.rentalPlanDuration)]}/month`
                            : "Not set"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Rent Start Date</label>
                        <input
                          type="date"
                          lang="en-GB"
                          value={editForm.subscriptionStart}
                          onChange={(e) => {
                            const start = e.target.value;
                            setEditForm({
                              ...editForm,
                              subscriptionStart: start,
                              subscriptionEnd: start && editForm.rentalPlanDuration
                                ? addMonths(start, Number(editForm.rentalPlanDuration))
                                : editForm.subscriptionEnd
                            });
                          }}
                          className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Rent End Date {editForm.rentalPlanDuration ? `(${editForm.rentalPlanDuration} months)` : ""}
                        </label>
                        <input
                          type="date"
                          lang="en-GB"
                          value={editForm.subscriptionEnd}
                          onChange={(e) => setEditForm({ ...editForm, subscriptionEnd: e.target.value })}
                          className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                        />
                      </div>
                      {editForm.subscriptionStart && editForm.rentalPlanDuration && (() => {
                        const years = Number(editForm.rentalPlanDuration) / 12;
                        const termEnd = addMonths(editForm.subscriptionStart, Number(editForm.rentalPlanDuration));
                        return (
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">
                              Plan Term ({years} year{years === 1 ? "" : "s"})
                            </label>
                            <div className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm text-gray-300">
                              {formatDateDMY(editForm.subscriptionStart)} → {formatDateDMY(termEnd)}
                            </div>
                          </div>
                        );
                      })()}
                      {editForm.subscriptionEnd && (() => {
                        const due = new Date(editForm.subscriptionEnd);
                        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                        const today = new Date();
                        const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const daysLeft = Math.round((dueDay.getTime() - todayDay.getTime()) / (1000 * 60 * 60 * 24));
                        const isActive = editForm.subscriptionStatus === "ACTIVE";
                        const isOverdue = daysLeft < 0;
                        const isDueSoon = isActive && daysLeft >= 0 && daysLeft <= 3;
                        let daysLabel: string;
                        if (isOverdue) {
                          daysLabel = `Day ${Math.abs(daysLeft)} overdue`;
                        } else if (daysLeft === 0) {
                          daysLabel = "Due today";
                        } else {
                          daysLabel = `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
                        }
                        const toneClass = isOverdue
                          ? "border-red-500/40 bg-red-500/10 text-red-400"
                          : isDueSoon
                            ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                            : "border-gray-700 bg-[#131724] text-gray-300";
                        return (
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Overdue</label>
                            <div className={`px-3 py-2 rounded-lg border text-sm ${toneClass}`}>
                              {daysLabel} <span className="text-gray-500">({formatDateDMY(dueDay)})</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="border-t border-gray-800 pt-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Change Plan</h4>
                      <div className="text-xs text-gray-500 mb-2">
                        Current: {selected.planDuration} months · ₹{SECURITY_DEPOSIT_AMOUNTS[selected.planDuration]} deposit · ₹{RENTAL_AMOUNTS[selected.planDuration]}/month
                      </div>
                      <select
                        value={newPlanDuration}
                        onChange={(e) => {
                          const target = Number(e.target.value);
                          setNewPlanDuration(e.target.value);
                          setPlanChangeAmount(String(Math.abs(SECURITY_DEPOSIT_AMOUNTS[target] - SECURITY_DEPOSIT_AMOUNTS[selected.planDuration])));
                          setPlanChangeTopUpUrl("");
                          setCopiedTopUpLink(false);
                          setPlanChangeRefundInitiated(false);
                        }}
                        className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                      >
                        {[12, 24].filter((d) => d !== selected.planDuration).map((d) => (
                          <option key={d} value={d}>
                            {d} months · ₹{SECURITY_DEPOSIT_AMOUNTS[d]} deposit · ₹{RENTAL_AMOUNTS[d]}/month
                          </option>
                        ))}
                      </select>

                      {newPlanDuration && (
                        <>
                          {planChangeDifference() > 0 ? (
                            <p className="text-xs text-yellow-400 mt-2">
                              Customer must pay an additional ₹{planChangeDifference()} deposit top-up.
                            </p>
                          ) : (
                            <p className="text-xs text-yellow-400 mt-2">
                              ₹{Math.abs(planChangeDifference())} deposit refund is due to the customer.
                            </p>
                          )}

                          <div className="mt-2">
                            <label className="block text-xs text-gray-400 mb-1">
                              Amount {planChangeDifference() > 0 ? "Paid" : "Refunded"} (₹) &mdash; edit if it differs from the amount above
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={planChangeAmount}
                              onChange={(e) => setPlanChangeAmount(e.target.value)}
                              placeholder="e.g. 1000"
                              className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                            />
                          </div>

                          {planChangeDifference() > 0 && (() => {
                            const activeTopUpLink = paymentLinkHistory.find(
                              (r) => r.status === "CREATED" && r.planChangeTargetDuration === Number(newPlanDuration)
                            );
                            const currentLinkUrl = planChangeTopUpUrl || activeTopUpLink?.shortUrl;

                            return (
                              <div className="mt-2 space-y-2">
                                {currentLinkUrl ? (
                                  <>
                                    <div className="px-3 py-2 rounded-lg border border-green-600/40 bg-green-500/10 text-xs text-green-400">
                                      ✓ Payment Link Generated (₹{planChangeDifference()} top-up)
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-2 px-3 py-2 rounded-lg border border-gray-700 bg-[#131724] text-xs">
                                      <span className="text-gray-300 truncate">{currentLinkUrl}</span>
                                      <div className="flex gap-2">
                                        <a href={currentLinkUrl} target="_blank" rel="noreferrer" className="text-[#f26522] hover:underline shrink-0">
                                          Open Link
                                        </a>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              await navigator.clipboard.writeText(currentLinkUrl);
                                              setCopiedTopUpLink(true);
                                              setTimeout(() => setCopiedTopUpLink(false), 2000);
                                            } catch {
                                              setError("Failed to copy link");
                                            }
                                          }}
                                          className="text-[#f26522] hover:underline shrink-0 font-medium"
                                        >
                                          {copiedTopUpLink ? "Copied!" : "Copy Link"}
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-[#f26522] font-semibold animate-pulse mt-2">
                                      Waiting for customer payment... The {newPlanDuration}-month plan will be applied automatically after payment succeeds.
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={generateTopUpLink}
                                      disabled={generatingTopUpLink}
                                      className="w-full px-3 py-2 text-xs bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                                    >
                                      {generatingTopUpLink ? "Generating..." : `Generate Top-up Link (₹${planChangeDifference()})`}
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })()}

                          {planChangeDifference() < 0 && (
                            <div className="mt-2 space-y-2">
                              {/* SUCCESS STATE */}
                              {(selected.planChangeRefundStatus === "REFUND_SUCCESS" || selected.planChangeRazorpayRefundId) ? (
                                <div className="px-3 py-2 rounded-lg border border-green-600/40 bg-green-500/10 text-xs text-green-400">
                                  ✓ ₹{selected.planChangeRefundAmount || Math.abs(planChangeDifference())} refunded via Razorpay (ID: {selected.planChangeRazorpayRefundId})
                                </div>
                              ) : /* MANUAL PROOF SUCCESS STATE */
                              selected.planChangeRefundProofUrl ? (
                                <div className="border border-green-600/40 bg-green-500/10 rounded-lg p-3 space-y-2">
                                  <div className="text-xs text-green-400 font-medium">✓ Refund proof uploaded</div>
                                  <DocumentChip
                                    label="Refund Proof"
                                    url={selected.planChangeRefundProofUrl}
                                    uploading={uploadingDocKey === "planChangeRefundProofUrl"}
                                    deleting={deletingDocKey === "planChangeRefundProofUrl"}
                                    onUpload={(file) => handleUploadDocument("planChangeRefundProofUrl", "planChangeRefundProofFile", file)}
                                    onDelete={() => handleDeleteDocument("planChangeRefundProofUrl")}
                                  />
                                </div>
                              ) : /* REFUND PROCESSING STATE */
                              (selected.planChangeRefundStatus === "REFUND_PROCESSING" || refundingPlanChangeNow) ? (
                                <div className="border border-yellow-600/40 bg-yellow-500/5 rounded-lg p-3 space-y-2 text-center">
                                  <div className="text-xs text-yellow-400 font-semibold animate-pulse">✓ OTP Verified</div>
                                  <p className="text-xs text-gray-400 mt-1">
                                    ₹{selected.planChangeRefundAmount || Math.abs(planChangeDifference())} refund is being processed via Razorpay.
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">Please do not close this window or retry.</p>
                                </div>
                              ) : /* OTP PENDING STATE */
                              selected.planChangeRefundStatus === "OTP_PENDING" ? (
                                <div className="border border-yellow-600/40 bg-[#131724] rounded-lg p-3 space-y-3">
                                  <div className="text-xs font-semibold text-white">Verify Refund Authorization</div>
                                  <p className="text-xs text-gray-400">
                                    A verification code has been sent to your registered mobile number ending in <span className="text-white font-medium">{maskedMobile || "••••"}</span>.
                                  </p>
                                  <div>
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Enter OTP</label>
                                    <input
                                      type="text"
                                      maxLength={6}
                                      value={otpCode}
                                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                      placeholder="e.g. 123456"
                                      className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm tracking-widest text-center text-white"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={verifyRefundOtpAndExecute}
                                      disabled={verifyingOtp || otpCode.length !== 6}
                                      className="flex-1 px-3 py-2 text-xs bg-[#f26522] text-white rounded-lg hover:bg-[#d85418] transition-colors disabled:opacity-50"
                                    >
                                      {verifyingOtp ? "Verifying..." : `Verify & Refund ₹${selected.planChangeRefundAmount || Math.abs(planChangeDifference())}`}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelRefundOtp}
                                      disabled={verifyingOtp}
                                      className="px-3 py-2 text-xs bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                  <div className="text-center">
                                    <button
                                      type="button"
                                      disabled={otpResendCooldown > 0 || requestingOtp}
                                      onClick={requestRefundOtp}
                                      className="text-xs text-[#f26522] hover:underline disabled:opacity-50"
                                    >
                                      {otpResendCooldown > 0 ? `Resend OTP in ${otpResendCooldown}s` : "Resend OTP"}
                                    </button>
                                  </div>
                                </div>
                              ) : /* CONFIRMATION PANEL STATE */
                              planChangeRefundInitiated ? (
                                <div className="border border-yellow-600/40 bg-yellow-500/5 rounded-lg p-3 space-y-2">
                                  <p className="text-xs text-gray-300">
                                    About to refund <span className="text-white font-semibold">₹{Math.abs(planChangeDifference())}</span> to{" "}
                                    <span className="text-white font-semibold">{selected.fullName}</span> via Razorpay, against their
                                    original deposit payment. This sends the money immediately &mdash; review the amount before confirming.
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={requestRefundOtp}
                                      disabled={requestingOtp}
                                      className="flex-1 px-3 py-2 text-xs bg-[#f26522]/10 border border-[#f26522]/40 rounded-lg text-[#f26522] hover:bg-[#f26522]/20 transition-colors disabled:opacity-50"
                                    >
                                      {requestingOtp ? "Requesting OTP..." : `Confirm Refund (₹${Math.abs(planChangeDifference())})`}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPlanChangeRefundInitiated(false)}
                                      disabled={requestingOtp}
                                      className="px-3 py-2 text-xs bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* NOT_STARTED / DEFAULT STATE */
                                <div className="space-y-2">
                                  <button
                                    type="button"
                                    onClick={() => setPlanChangeRefundInitiated(true)}
                                    className="w-full px-3 py-2 text-xs bg-[#131724] border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                                  >
                                    Initiate Refund via Razorpay (₹{Math.abs(planChangeDifference())})
                                  </button>
                                  <p className="text-xs text-gray-500 text-center">or</p>
                                  <label className="block text-xs text-gray-400 mb-1">
                                    Proof of Refund Sent &mdash; upload if you refunded manually instead
                                  </label>
                                  <DocumentChip
                                    label="Refund Proof"
                                    url={selected.planChangeRefundProofUrl}
                                    uploading={uploadingDocKey === "planChangeRefundProofUrl"}
                                    deleting={deletingDocKey === "planChangeRefundProofUrl"}
                                    onUpload={(file) => handleUploadDocument("planChangeRefundProofUrl", "planChangeRefundProofFile", file)}
                                    onDelete={() => handleDeleteDocument("planChangeRefundProofUrl")}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {planChangeDifference() < 0 && (() => {
                            const blocked = !selected.planChangeRefundProofUrl && selected.planChangeRefundStatus !== "REFUND_SUCCESS" && !selected.planChangeRazorpayRefundId;
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => confirmPlanChange()}
                                  disabled={changingPlan || blocked}
                                  className="w-full mt-3 px-3 py-2 text-xs bg-[#f26522]/10 border border-[#f26522]/40 rounded-lg text-[#f26522] hover:bg-[#f26522]/20 transition-colors disabled:opacity-50"
                                >
                                  {changingPlan ? "Applying..." : `Apply ${newPlanDuration}-Month Plan`}
                                </button>
                                {blocked && (
                                  <p className="text-xs text-gray-500 mt-1 text-center">
                                    Refund via Razorpay or upload proof of the refund above to enable this.
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}

                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">History</p>
                        {(() => {
                          const planChangeInvoices = invoices.filter(
                            (inv) => inv.productType === "Security Deposit Top-up (Plan Upgrade)" || inv.productType === "Security Deposit Refund (Plan Downgrade)"
                          );
                          if (planChangeInvoices.length === 0) {
                            return <p className="text-xs text-gray-500">No plan changes yet.</p>;
                          }
                          return (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {planChangeInvoices.map((inv) => {
                                const isRefund = inv.type === "REFUND";
                                const planDirection = isRefund ? "24 months → 12 months" : "12 months → 24 months";
                                const sourceMethod = inv.paymentMethod === "Razorpay" 
                                  ? (isRefund ? "Razorpay Refund" : "Razorpay Top-up")
                                  : (isRefund ? "Manual Refund" : "Manual Top-up");
                                
                                return (
                                  <div
                                    key={inv.id}
                                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-700 bg-[#131724] text-xs"
                                  >
                                    <div>
                                      <div className="text-gray-200 font-medium">
                                        ₹{inv.amount} · <span className={isRefund ? "text-yellow-400" : "text-green-400"}>
                                          {isRefund ? "REFUND SUCCESS" : "PAYMENT SUCCESS"}
                                        </span>
                                      </div>
                                      <div className="text-gray-400 mt-0.5">Plan change: {planDirection}</div>
                                      <div className="text-gray-500 mt-0.5">
                                        {sourceMethod} {inv.reason && `· ${inv.reason}`}
                                      </div>
                                      <div className="text-gray-600 text-[10px] mt-0.5">{formatDateTimeDMY(inv.documentDate)}</div>
                                    </div>
                                    <button onClick={() => downloadInvoicePdf(inv)} className="text-[#f26522] hover:underline shrink-0">
                                      Download PDF
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "bankDetails" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bank Account Details</h3>
                      {!editingBankDetails && (
                        <button
                          type="button"
                          onClick={() => setEditingBankDetails(true)}
                          className="text-xs text-[#f26522] hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {!editingBankDetails ? (
                      selected.bankAccountNumber ? (
                        <div className="bg-[#131724] border border-gray-700 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="block text-gray-500 text-xs mb-1">Account Holder Name</span>
                            <span className="text-white font-medium">{selected.bankAccountHolderName || "-"}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500 text-xs mb-1">Bank Name</span>
                            <span className="text-white font-medium">{selected.bankName || "-"}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500 text-xs mb-1">IFSC Code</span>
                            <span className="text-white font-medium">{selected.bankIfscCode || "-"}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500 text-xs mb-1">Account Number</span>
                            <span className="text-white font-medium">{selected.bankAccountNumber}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No bank details submitted yet. Use &quot;Copy Bank Details Link&quot; in Quick Links to request them, or click Edit to enter them yourself.
                        </p>
                      )
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 mb-4">
                          Editing here overrides whatever the customer submitted. Click Save Changes below to apply.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Account Holder Name</label>
                            <input
                              type="text"
                              value={editForm.bankAccountHolderName}
                              onChange={(e) => setEditForm({ ...editForm, bankAccountHolderName: e.target.value })}
                              placeholder="As per bank records"
                              className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Bank Name</label>
                            <input
                              type="text"
                              value={editForm.bankName}
                              onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                              placeholder="e.g. State Bank of India"
                              className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">IFSC Code</label>
                            <input
                              type="text"
                              value={editForm.bankIfscCode}
                              onChange={(e) => setEditForm({ ...editForm, bankIfscCode: e.target.value.toUpperCase() })}
                              placeholder="e.g. SBIN0001234"
                              className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm uppercase"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Account Number</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editForm.bankAccountNumber}
                              onChange={(e) => setEditForm({ ...editForm, bankAccountNumber: e.target.value.replace(/\D/g, "") })}
                              placeholder="Enter account number"
                              className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeSection === "returns" && (
                  <>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Product Returned</label>
                        <select
                          value={editForm.returnRequested}
                          onChange={(e) => setEditForm({ ...editForm, returnRequested: e.target.value })}
                          className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Refund Amount (₹) &mdash; set after inspecting the returned product for damage
                        </label>
                        <input
                          type="number"
                          value={editForm.refundAmount}
                          onChange={(e) => setEditForm({ ...editForm, refundAmount: e.target.value })}
                          placeholder="e.g. 2999, or less if damaged"
                          className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {selected.paymentStatus === "PENDING_REFUND" && (
                      <div className="border-t border-gray-800 mt-6 pt-6">
                        {selected.refundAmount !== null ? (
                          <div className="bg-[#131724] border border-gray-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm text-gray-200 font-medium">Refund ₹{selected.refundAmount} now via Razorpay</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Sends the money immediately to the customer&apos;s original payment method &mdash; they don&apos;t need to confirm on their own link first.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRefundNow}
                              disabled={refundingNow}
                              className="px-4 py-2 text-sm bg-[#f26522] hover:bg-[#e05a1e] rounded-lg font-medium disabled:opacity-50 shrink-0"
                            >
                              {refundingNow ? "Processing..." : "Refund Now via Razorpay"}
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Set and save a refund amount above to enable an immediate Razorpay refund.</p>
                        )}
                      </div>
                    )}

                    {selected.returnRequested && (
                      <div className="border-t border-gray-800 mt-6 pt-6">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Refund Bank Details</h3>
                        {selected.refundBankAccountNumber ? (
                          <div className="bg-[#131724] border border-gray-700 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="block text-gray-500 text-xs mb-1">Account Holder Name</span>
                              <span className="text-white font-medium">{selected.refundBankAccountHolderName || "-"}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 text-xs mb-1">Bank Name</span>
                              <span className="text-white font-medium">{selected.refundBankName || "-"}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 text-xs mb-1">IFSC Code</span>
                              <span className="text-white font-medium">{selected.refundBankIfscCode || "-"}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 text-xs mb-1">Account Number</span>
                              <span className="text-white font-medium">{selected.refundBankAccountNumber}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No bank details submitted yet.</p>
                        )}
                      </div>
                    )}

                    {(() => {
                      const refundInvoice = invoices.find((inv) => inv.type === "REFUND");
                      if (!refundInvoice) return null;
                      return (
                        <div className="border-t border-gray-800 mt-6 pt-6">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Refund Transaction</h3>
                          <div className="bg-[#131724] border border-gray-700 rounded-xl p-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <span className="text-2xl font-bold text-white">₹{refundInvoice.amount}</span>
                              <StatusBadge status={refundInvoice.status} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="block text-gray-500 text-xs mb-1">Payment Method</span>
                                <span className="text-white font-medium">{refundInvoice.paymentMethod}</span>
                              </div>
                              <div>
                                <span className="block text-gray-500 text-xs mb-1">Transaction ID</span>
                                <span className="text-white font-medium break-all">{refundInvoice.transactionId || "-"}</span>
                              </div>
                              <div>
                                <span className="block text-gray-500 text-xs mb-1">Date</span>
                                <span className="text-white font-medium">{formatDateTimeDMY(refundInvoice.documentDate)}</span>
                              </div>
                              <div>
                                <span className="block text-gray-500 text-xs mb-1">Receipt</span>
                                <button
                                  onClick={() => downloadInvoicePdf(refundInvoice)}
                                  className="text-[#f26522] hover:underline font-medium"
                                >
                                  Download PDF
                                </button>
                              </div>
                            </div>
                            {refundInvoice.paymentMethod === "Razorpay" && (
                              <p className="text-xs text-gray-500 mt-3">
                                Sent automatically via Razorpay to the customer&apos;s original payment method — not the bank
                                details shown above (those are kept on file but aren&apos;t used for this transfer).
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {selected.returnRequested && (
                      <div className="border-t border-gray-800 mt-6 pt-6">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Return Process
                            {selected.returnRequestedAt && (
                              <span className="normal-case text-gray-500 ml-2 font-normal">
                                · Return Date: {formatDateDMY(selected.returnRequestedAt)}
                              </span>
                            )}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowReturnHistory((v) => !v)}
                            className="text-xs text-[#f26522] hover:underline"
                          >
                            {showReturnHistory ? "Hide History" : "View History"}
                          </button>
                        </div>

                        {!showReturnHistory ? (
                          <div className="space-y-3">
                            {RETURN_STEPS.map((step) => {
                              const latest = latestReturnEvent(step.key);
                              const form = returnEventForm[step.key] || {
                                status: step.kind === "boolean" ? "NO" : "PENDING",
                                eventDate: todayISO(),
                                eventTime: nowTimeHHMM(),
                                remarks: "",
                              };
                              return (
                                <div key={step.key} className="bg-[#131724] border border-gray-700 rounded-xl p-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <span className="text-sm text-gray-200 font-medium">{step.label}</span>
                                    {latest ? (
                                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${returnEventStatusColor(latest.status)}`}>
                                        {latest.status} · {formatEventDateTime(latest.eventDate)}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-500/20 text-gray-400">Not started</span>
                                    )}
                                  </div>
                                  {latest && latest.defectImageUrls.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      {latest.defectImageUrls.map((url, i) => (
                                        <a
                                          key={url}
                                          href={url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2 py-1 rounded-lg text-xs bg-[#1a1f30] border border-gray-700 text-[#f26522] hover:underline"
                                        >
                                          View Picture {i + 1}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-end gap-2">
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">Status</label>
                                      <select
                                        value={form.status}
                                        onChange={(e) =>
                                          setReturnEventForm((prev) => ({ ...prev, [step.key]: { ...form, status: e.target.value } }))
                                        }
                                        className="px-2 py-1.5 bg-[#1a1f30] border border-gray-700 rounded-lg text-xs"
                                      >
                                        {(step.kind === "boolean" ? ["NO", "YES"] : ["PENDING", "COMPLETED"]).map((v) => (
                                          <option key={v} value={v}>{v}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">Date</label>
                                      <input
                                        type="date"
                                        lang="en-GB"
                                        value={form.eventDate}
                                        onChange={(e) =>
                                          setReturnEventForm((prev) => ({ ...prev, [step.key]: { ...form, eventDate: e.target.value } }))
                                        }
                                        className="px-2 py-1.5 bg-[#1a1f30] border border-gray-700 rounded-lg text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">Time</label>
                                      <input
                                        type="time"
                                        value={form.eventTime}
                                        onChange={(e) =>
                                          setReturnEventForm((prev) => ({ ...prev, [step.key]: { ...form, eventTime: e.target.value } }))
                                        }
                                        className="px-2 py-1.5 bg-[#1a1f30] border border-gray-700 rounded-lg text-xs"
                                      />
                                    </div>
                                    {step.kind === "boolean" && form.status === "YES" && (
                                      <div className="flex-1 min-w-[160px]">
                                        <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                                        <input
                                          type="text"
                                          value={form.remarks}
                                          onChange={(e) =>
                                            setReturnEventForm((prev) => ({ ...prev, [step.key]: { ...form, remarks: e.target.value } }))
                                          }
                                          placeholder="Defect details..."
                                          className="w-full px-2 py-1.5 bg-[#1a1f30] border border-gray-700 rounded-lg text-xs"
                                        />
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => submitReturnEvent(step.key)}
                                      disabled={savingReturnStep === step.key}
                                      className="px-3 py-1.5 text-xs bg-[#f26522] hover:bg-[#e05a1e] rounded-lg font-medium disabled:opacity-50"
                                    >
                                      {savingReturnStep === step.key ? "Saving..." : "Log Update"}
                                    </button>
                                  </div>
                                  {step.kind === "boolean" && form.status === "YES" && (
                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                      {[0, 1, 2].map((i) => (
                                        <div key={i}>
                                          <label className="block text-xs text-gray-500 mb-1">Picture {i + 1}</label>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0] || null;
                                              setDefectImages((prev) => {
                                                const next = [...prev];
                                                next[i] = file;
                                                return next;
                                              });
                                            }}
                                            className="w-full text-xs text-gray-400 file:mr-2 file:px-2 file:py-1 file:rounded-md file:border-0 file:bg-[#1a1f30] file:text-gray-300 file:text-xs file:cursor-pointer"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {returnEventsLoading ? (
                              <p className="text-xs text-gray-500">Loading...</p>
                            ) : returnEvents.length === 0 ? (
                              <p className="text-xs text-gray-500">No updates logged yet.</p>
                            ) : (
                              returnEvents.map((ev) => {
                                const stepLabel = RETURN_STEPS.find((s) => s.key === ev.step)?.label || ev.step;
                                return (
                                  <div
                                    key={ev.id}
                                    className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg border border-gray-700 bg-[#131724] text-xs"
                                  >
                                    <div>
                                      <div className="text-gray-200 font-medium">{stepLabel}</div>
                                      <div className="text-gray-500">
                                        {ev.status} · {formatEventDateTime(ev.eventDate)}
                                        {ev.remarks && <> · {ev.remarks}</>}
                                      </div>
                                      {ev.defectImageUrls.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                          {ev.defectImageUrls.map((url, i) => (
                                            <a
                                              key={url}
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-[#f26522] hover:underline"
                                            >
                                              Picture {i + 1}
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-gray-600 shrink-0 whitespace-nowrap">
                                      logged {formatDateTimeDMY(ev.createdAt)}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
              <button
                onClick={() => handleDelete(selected)}
                className="text-sm text-red-400 hover:underline"
              >
                Delete Customer
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm bg-[#f26522] hover:bg-[#e05a1e] rounded-lg font-medium disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
          <div className="bg-[#1a1f30] border border-gray-700/50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-800 shrink-0">
              <div>
                <h2 className="text-lg font-bold">Add Customer</h2>
                <p className="text-gray-400 text-sm mt-0.5">Manually add a customer — no OTP or payment required.</p>
              </div>
              <button
                onClick={() => setShowAddCustomer(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-white shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4 text-sm">
              {addError && <p className="text-sm text-red-400">{addError}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={addForm.mobileNumber}
                    onChange={(e) => setAddForm({ ...addForm, mobileNumber: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    value={addForm.addressLine1}
                    onChange={(e) => setAddForm({ ...addForm, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={addForm.addressLine2}
                    onChange={(e) => setAddForm({ ...addForm, addressLine2: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">City *</label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">State *</label>
                  <input
                    type="text"
                    value={addForm.state}
                    onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={addForm.pincode}
                    onChange={(e) => setAddForm({ ...addForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Plan Duration</label>
                  <select
                    value={addForm.planDuration}
                    onChange={(e) => setAddForm({ ...addForm, planDuration: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                  >
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">House Type</label>
                  <select
                    value={addForm.houseType}
                    onChange={(e) => setAddForm({ ...addForm, houseType: e.target.value })}
                    className="w-full px-3 py-2 bg-[#131724] border border-gray-700 rounded-lg text-sm"
                  >
                    <option value="rent">Rent</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Documents (optional)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["aadharFrontFile", "Aadhaar (Front)"],
                    ["aadharBackFile", "Aadhaar (Back)"],
                    ["panFrontFile", "PAN (Front)"],
                    ["panBackFile", "PAN (Back)"],
                    ["residenceFile", "Residence Proof"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-400 mb-1">{label}</label>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={(e) => setAddFiles({ ...addFiles, [key]: e.target.files?.[0] || null })}
                        className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-700 file:bg-[#131724] file:text-gray-300 file:text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
              <button
                onClick={() => setShowAddCustomer(false)}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={isAddingCustomer}
                className="px-4 py-2 text-sm bg-[#f26522] hover:bg-[#e05a1e] rounded-lg font-medium disabled:opacity-50"
              >
                {isAddingCustomer ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDraft && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
          <div className="bg-[#1a1f30] border border-gray-700/50 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-800 shrink-0">
              <div>
                <h2 className="text-lg font-bold">{selectedDraft.fullName || "Unnamed Draft"}</h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {selectedDraft.email || "-"} · {selectedDraft.mobileNumber || "-"}
                </p>
              </div>
              <button
                onClick={() => setSelectedDraft(null)}
                aria-label="Close"
                className="text-gray-400 hover:text-white shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Address</p>
                <p className="text-gray-200">
                  {selectedDraft.addressLine1 || "-"}
                  {selectedDraft.addressLine2 ? `, ${selectedDraft.addressLine2}` : ""}
                </p>
                <p className="text-gray-200">
                  {[selectedDraft.city, selectedDraft.state, selectedDraft.pincode].filter(Boolean).join(", ") || "-"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Plan</p>
                  <p className="text-gray-200">{selectedDraft.planDuration ? `${selectedDraft.planDuration} months` : "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">House Type</p>
                  <p className="text-gray-200">{selectedDraft.houseType || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Residence Document</p>
                {selectedDraft.residenceDocType ? (
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400">
                    {selectedDraft.residenceDocType}
                  </span>
                ) : (
                  <span className="text-gray-600 text-xs">Not selected</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Started</p>
                  <p className="text-gray-200">{formatDateTimeDMY(selectedDraft.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Last Updated</p>
                  <p className="text-gray-200">{formatDateTimeDMY(selectedDraft.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
              <button
                onClick={() => setSelectedDraft(null)}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
