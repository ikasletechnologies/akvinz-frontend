"use client";
import React, { useEffect, useRef, useState } from "react";
import { API_URL, downloadFile } from "@/lib/api";
import TermsContent from "./TermsContent";

export default function CustomerFormPage() {
  const permanentDocOptions = ["EB Bill", "Gas Bill", "House Tax Bill"];
  const rentDocOptions = ["Rental Agreement", "Student ID", "Working Staff ID"];

  const [openContactCard, setOpenContactCard] = useState<"call" | "email" | null>(null);
  const [step, setStep] = useState(1);
  const [planDuration, setPlanDuration] = useState("12");
  const [houseType, setHouseType] = useState("rent");
  const [residenceDocType, setResidenceDocType] = useState(rentDocOptions[0]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");

  // File States
  const [aadharFrontFile, setAadharFrontFile] = useState<File | null>(null);
  const [aadharBackFile, setAadharBackFile] = useState<File | null>(null);
  const [panFrontFile, setPanFrontFile] = useState<File | null>(null);
  const [residenceFile, setResidenceFile] = useState<File | null>(null);

  // OTP States
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [mobileAlreadyRegistered, setMobileAlreadyRegistered] = useState(false);
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const isValidEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);

  // Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Draft autosave: persists form input to the backend as the customer types,
  // so partial entries are not lost if they abandon the form before submitting.
  // A `?draft=<id>` link (generated from the admin dashboard) resumes that
  // specific draft instead of the one tracked in this browser's localStorage.
  const [draftId, setDraftId] = useState(() => {
    if (typeof window === "undefined") return "";
    const fromLink = new URLSearchParams(window.location.search).get("draft");
    if (fromLink) {
      localStorage.setItem("akvinz_draft_id", fromLink);
      return fromLink;
    }
    const existing = localStorage.getItem("akvinz_draft_id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("akvinz_draft_id", id);
    return id;
  });
  const [isResumingDraft, setIsResumingDraft] = useState(false);
  const [resumedDraft, setResumedDraft] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromLink = new URLSearchParams(window.location.search).get("draft");
    if (!fromLink) return;

    setIsResumingDraft(true);
    fetch(`${API_URL}/customer/draft/${fromLink}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.draft) return;
        const d = data.draft;
        if (d.fullName) setFullName(d.fullName);
        if (d.mobileNumber) setMobileNumber(d.mobileNumber.replace(/\D/g, "").slice(-10));
        if (d.email) setEmail(d.email);
        if (d.addressLine1) setAddressLine1(d.addressLine1);
        if (d.addressLine2) setAddressLine2(d.addressLine2);
        if (d.city) setCity(d.city);
        if (d.state) setStateName(d.state);
        if (d.pincode) setPincode(d.pincode);
        if (d.planDuration) setPlanDuration(String(d.planDuration));
        if (d.houseType) setHouseType(d.houseType);
        if (d.residenceDocType) setResidenceDocType(d.residenceDocType);
        setResumedDraft(true);
      })
      .catch(() => { })
      .finally(() => setIsResumingDraft(false));
  }, []);

  const lastCheckedEmailRef = useRef<string | null>(null);

  useEffect(() => {
    if (!draftId) return;
    const hasData = fullName || mobileNumber || email || addressLine1 || addressLine2 || city || stateName || pincode;
    if (!hasData) return;

    // Only show the "checking email" spinner when the email itself changed —
    // this effect also re-fires (autosave) on every other field edit
    // (address, city, etc.), which shouldn't touch the email status UI.
    const emailChanged = email !== lastCheckedEmailRef.current;
    if (emailChanged) {
      if (isValidEmailFormat) setCheckingEmail(true);
      else setCheckingEmail(false);
    }

    const timer = setTimeout(() => {
      fetch(`${API_URL}/customer/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          fullName,
          mobileNumber,
          email,
          addressLine1,
          addressLine2,
          city,
          state: stateName,
          pincode,
          planDuration,
          houseType,
          residenceDocType,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          lastCheckedEmailRef.current = email;
          setCheckingEmail(false);
          if (data.code === "CUSTOMER_EXISTS") {
            setMobileAlreadyRegistered(true);
            return;
          }
          setMobileAlreadyRegistered(false);
          if (data.code === "EMAIL_EXISTS") {
            setEmailAlreadyRegistered(true);
            return;
          }
          setEmailAlreadyRegistered(false);
          // The backend may have merged this into a pre-existing draft for
          // the same mobile number (resumed from another device/session) —
          // adopt that id so future autosaves update the same row instead
          // of recreating the one we just abandoned.
          if (data.resumedDraftId && data.resumedDraftId !== draftId) {
            setDraftId(data.resumedDraftId);
            localStorage.setItem("akvinz_draft_id", data.resumedDraftId);
          }
        })
        .catch(() => {
          lastCheckedEmailRef.current = email;
          setCheckingEmail(false);
        });
    }, 800);

    return () => clearTimeout(timer);
  }, [draftId, fullName, mobileNumber, email, addressLine1, addressLine2, city, stateName, pincode, planDuration, houseType, residenceDocType, isValidEmailFormat]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded) {
      alert("Razorpay SDK failed to load. Are you online?");
      setIsProcessingPayment(false);
      return;
    }

    try {
      const amountStr = getPrice().replace(/,/g, '');
      const amount = parseInt(amountStr);

      const res = await fetch(`${API_URL}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // draftId lets the order.paid webhook finalize this registration
        // server-side even if this browser tab never gets to call
        // /verify-payment itself (closed, lost connection, etc. right after paying).
        body: JSON.stringify({ amount, notes: { draftId } }),
      });

      const data = await res.json();

      if (!data.success) {
        alert("Failed to create order: " + data.message);
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Akvinz",
        description: `Subscription - ${planDuration} Months`,
        order_id: data.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API_URL}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                draftId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // Only now does this person actually become a Customer —
              // registration alone (or a cancelled/failed payment) never
              // creates one, it just leaves the Draft in place.
              setCustomerId(verifyData.customerId);
              localStorage.removeItem("akvinz_draft_id");
              if (verifyData.invoiceId) {
                setInvoiceId(verifyData.invoiceId);
                downloadFile(`${API_URL}/customer/${verifyData.customerId}/invoices/${verifyData.invoiceId}/pdf`).catch((e) =>
                  console.error("Receipt download failed:", e)
                );
              }
              setStep(3);
            } else {
              alert("Payment verification failed! " + (verifyData.message || "You can retry payment; your details are saved as a draft."));
            }
          } catch (e) {
            alert("Error verifying payment. Your details are saved as a draft — you can retry payment.");
          }
        },
        prefill: {
          contact: mobileNumber,
        },
        theme: {
          color: "#f26522"
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response: any) {
        alert("Payment Failed: " + response.error.description);
      });

    } catch (e) {
      alert("Error initiating payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      setOtpError("Please enter a valid mobile number.");
      return;
    }
    setIsSendingOtp(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: "+91" + mobileNumber.replace(/\D/g, "") }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpError("");
      } else {
        setOtpError(data.message || "Failed to send OTP.");
      }
    } catch (e) {
      setOtpError("Error sending OTP. Please check your backend.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }
    if (!termsAccepted) {
      setOtpError("Please accept the AKVINZ Subscription Agreement before verifying.");
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: "+91" + mobileNumber.replace(/\D/g, ""), code: otpCode }),
      });
      const data = await res.json();
      if (data.verified) {
        const existingCustomerRes = await fetch(`${API_URL}/customer/${mobileNumber}`);
        if (existingCustomerRes.ok) {
          setMobileAlreadyRegistered(true);
          return;
        }

        // Resume an in-progress draft for this number from a previous
        // attempt (different device/browser, or cleared local storage)
        // instead of letting a second draft pile up for the same person.
        const draftRes = await fetch(`${API_URL}/customer/draft/by-mobile/${mobileNumber}`);
        if (draftRes.ok) {
          const draftData = await draftRes.json();
          const d = draftData.draft;
          if (d && d.id !== draftId) {
            if (d.fullName) setFullName(d.fullName);
            if (d.email) setEmail(d.email);
            if (d.addressLine1) setAddressLine1(d.addressLine1);
            if (d.addressLine2) setAddressLine2(d.addressLine2);
            if (d.city) setCity(d.city);
            if (d.state) setStateName(d.state);
            if (d.pincode) setPincode(d.pincode);
            if (d.planDuration) setPlanDuration(String(d.planDuration));
            if (d.houseType) setHouseType(d.houseType);
            if (d.residenceDocType) setResidenceDocType(d.residenceDocType);
            setDraftId(d.id);
            localStorage.setItem("akvinz_draft_id", d.id);
            setResumedDraft(true);
          }
        }

        setOtpVerified(true);
        setOtpError("");
      } else {
        setOtpError(data.message || "Invalid OTP. Try again.");
      }
    } catch (e) {
      setOtpError("Error verifying OTP.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      alert("Please verify OTP first");
      return;
    }

    if (!aadharFrontFile || !aadharBackFile || !panFrontFile || !residenceFile) {
      alert("Please upload all required documents — Aadhaar (front & back), PAN (front & back), and your residence proof — before continuing.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("draftId", draftId);
      formData.append("fullName", fullName);
      formData.append("mobileNumber", mobileNumber);
      formData.append("email", email);
      formData.append("addressLine1", addressLine1);
      formData.append("addressLine2", addressLine2);
      formData.append("city", city);
      formData.append("state", stateName);
      formData.append("pincode", pincode);
      formData.append("planDuration", planDuration);
      formData.append("houseType", houseType);
      formData.append("residenceDocType", residenceDocType);

      if (aadharFrontFile) formData.append("aadharFrontFile", aadharFrontFile);
      if (aadharBackFile) formData.append("aadharBackFile", aadharBackFile);
      if (panFrontFile) formData.append("panFrontFile", panFrontFile);
      if (residenceFile) formData.append("residenceFile", residenceFile);

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        // This only finalizes the Draft with the uploaded documents — no
        // Customer exists yet. That only happens once payment succeeds, so
        // a cancelled/abandoned payment here just leaves a followable Draft.
        if (data.draftId && data.draftId !== draftId) {
          setDraftId(data.draftId);
          localStorage.setItem("akvinz_draft_id", data.draftId);
        }
        setStep(2);
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      alert("Error saving details");
    }
  };

  const handleDownloadReceipt = async () => {
    if (!invoiceId) return;
    setIsDownloadingReceipt(true);
    setReceiptError("");
    try {
      await downloadFile(`${API_URL}/customer/${customerId}/invoices/${invoiceId}/pdf`);
    } catch (e) {
      setReceiptError("Couldn't download the receipt. Please try again.");
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  const getPrice = () => {
    return planDuration === "12" ? "3" : "4";
  };

  const getMonthlyPrice = (duration: string) => {
    return duration === "12" ? "2" : "1";
  };

  const allDocumentsUploaded = !!aadharFrontFile && !!aadharBackFile && !!panFrontFile && !!residenceFile;

  return (
    <div className="min-h-screen bg-[#131724] text-white flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="bg-[#1a1f30] flex items-center justify-between px-4 py-3 shadow-md sticky top-0 z-10 border-b border-gray-800">
        <a href="https://akvinz.com/" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-white rounded-md transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </a>
        <div className="flex justify-center items-center">
          <img src="/logo-footer.svg" alt="AKVINZ Logo" className="h-8 object-contain" />
        </div>
        <div className="flex space-x-2">
          {openContactCard && (
            <div
              className="hidden sm:block fixed inset-0 z-10"
              onClick={() => setOpenContactCard(null)}
            />
          )}

          <div className="relative">
            <a
              href="tel:+918110016161"
              className="sm:hidden p-2 bg-[#f26522]/10 text-[#f26522] rounded-full hover:bg-[#f26522]/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </a>
            <button
              type="button"
              onClick={() => setOpenContactCard((v) => (v === "call" ? null : "call"))}
              className="hidden sm:inline-flex p-2 bg-[#f26522]/10 text-[#f26522] rounded-full hover:bg-[#f26522]/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </button>
            {openContactCard === "call" && (
              <div className="hidden sm:block absolute right-0 top-full mt-2 w-56 bg-[#1a1f30] border border-gray-700/50 rounded-xl shadow-lg p-4 z-20">
                <p className="text-xs text-gray-500 mb-1">Call us</p>
                <a
                  href="tel:+918110016161"
                  className="text-sm text-white font-medium hover:text-[#f26522] transition-colors"
                >
                  +91 81100 16161
                </a>
              </div>
            )}
          </div>

          <div className="relative">
            <a
              href="mailto:Customerconnect@akvinz.com"
              className="sm:hidden p-2 bg-gray-800 text-gray-400 rounded-full hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </a>
            <button
              type="button"
              onClick={() => setOpenContactCard((v) => (v === "email" ? null : "email"))}
              className="hidden sm:inline-flex p-2 bg-gray-800 text-gray-400 rounded-full hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </button>
            {openContactCard === "email" && (
              <div className="hidden sm:block absolute right-0 top-full mt-2 w-64 bg-[#1a1f30] border border-gray-700/50 rounded-xl shadow-lg p-4 z-20">
                <p className="text-xs text-gray-500 mb-1">Email us</p>
                <a
                  href="mailto:Customerconnect@akvinz.com"
                  className="text-sm text-white font-medium hover:text-[#f26522] transition-colors break-all"
                >
                  Customerconnect@akvinz.com
                </a>
              </div>
            )}
          </div>
        </div>
      </header>
      <p className="text-center text-xs text-gray-500 font-bold py-2 px-4">
        RENT O MATE is a registered service of AKVINZ.
      </p>

      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-4 py-10 relative">
        {/* Subtle background pipes pattern can be added here if needed, keeping it simple for now */}

        {/* Title Section */}
        {step < 3 && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <svg className="w-3 h-3 text-[#f26522]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
              <span className="text-[#f26522] text-sm font-semibold tracking-wider uppercase">Step {step} of 2</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {step === 1 ? "Customer Registration" : "Payment Details"}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              {step === 1 ? "Welcome to Akvinz! Please provide your details and required documentation to complete your registration." : "Review your selected plan and complete the secure payment to finish your registration."}
            </p>
          </div>
        )}

        {step === 1 && (
          <form className="space-y-6" onSubmit={handleSubmit}>

            {isResumingDraft && (
              <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#1a1f30]/80 border border-gray-700/50 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 animate-spin text-[#f26522]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Restoring your saved registration...
              </div>
            )}
            {resumedDraft && !isResumingDraft && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Welcome back! We&apos;ve restored your saved details &mdash; pick up where you left off.
              </div>
            )}

            {/* Subscription Plan Card */}
            <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded bg-[#f26522]/10 flex items-center justify-center text-[#f26522]">
                  <span className="font-bold text-sm">01</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Subscription Plan</h2>
              </div>

              <div className="flex gap-4 mb-2 sm:ml-11">
                <label className={`flex-1 flex items-baseline justify-center gap-1 cursor-pointer group rounded-xl border-2 py-5 transition-colors ${planDuration === '24' ? 'border-[#f26522] bg-[#f26522]/5' : 'border-gray-700 hover:border-gray-500'}`}>
                  <input type="radio" name="plan_duration" value="24" checked={planDuration === "24"} onChange={() => setPlanDuration("24")} className="hidden" />
                  <span className={`text-3xl font-extrabold ${planDuration === '24' ? 'text-[#f26522]' : 'text-white'}`}>₹{getMonthlyPrice("24")}</span>
                  <span className="text-sm text-gray-500">/ month</span>
                </label>
                <label className={`flex-1 flex items-baseline justify-center gap-1 cursor-pointer group rounded-xl border-2 py-5 transition-colors ${planDuration === '12' ? 'border-[#f26522] bg-[#f26522]/5' : 'border-gray-700 hover:border-gray-500'}`}>
                  <input type="radio" name="plan_duration" value="12" checked={planDuration === "12"} onChange={() => setPlanDuration("12")} className="hidden" />
                  <span className={`text-3xl font-extrabold ${planDuration === '12' ? 'text-[#f26522]' : 'text-white'}`}>₹{getMonthlyPrice("12")}</span>
                  <span className="text-sm text-gray-500">/ month</span>
                </label>
              </div>

              {planDuration && (
                <div className="sm:ml-11 mt-4 rounded-xl bg-[#131724] border border-gray-700/50 px-4 py-3 flex items-center justify-between">
                  <span className="flex flex-col">
                    <span className="text-sm text-white font-medium">{planDuration} Months Subscription</span>
                    <span className="text-xs text-[#f26522] font-semibold mt-0.5">{planDuration === '24' ? 'Smart Saver' : 'Easy Flexi'}</span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-white">₹{planDuration === '24' ? '4' : '3'}</span>
                    <span className="text-xs text-gray-500 mt-0.5">Refundable Security Deposit</span>
                  </span>
                </div>
              )}
            </div>

            {/* Personal Information Card */}
            <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded bg-[#f26522]/10 flex items-center justify-center text-[#f26522]">
                  <span className="font-bold text-sm">02</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Personal Information</h2>
              </div>

              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="block w-full pl-12 pr-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors" placeholder="John Doe" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Mobile Number & OTP Verification */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm text-gray-300 mb-2">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                          </svg>
                        </div>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          disabled={otpVerified}
                          className={`block w-full pl-12 pr-4 py-3 bg-[#131724] border rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors ${otpVerified ? 'border-green-500/50 opacity-70' : 'border-gray-700'}`}
                          placeholder="Enter 10 digit number"
                        />
                      </div>

                      {!otpVerified && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp || mobileNumber.length < 10 || mobileAlreadyRegistered}
                          className="whitespace-nowrap px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl border border-gray-700 transition-colors disabled:opacity-50"
                        >
                          {isSendingOtp ? "Sending..." : (otpSent ? "Resend OTP" : "Send OTP")}
                        </button>
                      )}

                      {otpVerified && (
                        <div className="flex items-center justify-center px-4 py-3 bg-green-500/10 text-green-400 font-medium rounded-xl border border-green-500/20">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          Verified
                        </div>
                      )}
                    </div>

                    {!otpVerified && (
                      <div className="mt-3 border border-gray-700 rounded-xl bg-[#131724] overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-600 bg-[#1a1f30] text-[#f26522] focus:ring-1 focus:ring-[#f26522] accent-[#f26522] shrink-0"
                          />
                          <span className="text-sm text-gray-300 flex-grow">
                            I have read and accept the AKVINZ Subscription Agreement
                          </span>
                          <button
                            type="button"
                            onClick={() => setTermsExpanded((v) => !v)}
                            aria-label={termsExpanded ? "Collapse terms" : "Expand terms"}
                            className="p-1 text-gray-400 hover:text-white transition-colors shrink-0"
                          >
                            <svg
                              className={`w-5 h-5 transition-transform ${termsExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </button>
                        </div>
                        {termsExpanded && (
                          <div className="max-h-96 overflow-y-auto border-t border-gray-700 px-4 py-4 bg-[#1a1f30]">
                            <TermsContent />
                          </div>
                        )}
                      </div>
                    )}

                    {otpSent && !otpVerified && (
                      <div className="mt-3 flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="block w-full sm:w-1/2 px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors text-center tracking-[0.5em]"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otpCode.length !== 6 || !termsAccepted}
                          className="w-full sm:w-auto px-6 py-3 bg-[#f26522] hover:bg-[#e05a1e] text-white font-medium rounded-xl shadow-lg shadow-[#f26522]/20 transition-all disabled:opacity-50"
                        >
                          {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                        </button>
                      </div>
                    )}
                    {otpSent && !otpVerified && !termsAccepted && (
                      <p className="mt-2 text-xs text-yellow-400">
                        Please accept the Subscription Agreement above before verifying your OTP.
                      </p>
                    )}

                    {otpError && (
                      <p className="mt-2 text-sm text-red-400">{otpError}</p>
                    )}

                    {mobileAlreadyRegistered && !otpVerified && (
                      <p className="mt-2 text-sm text-red-400">
                        This mobile number is already registered. Please use the rent or manage-subscription link instead.
                      </p>
                    )}
                  </div>

                  {/* Email ID */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm text-gray-300 mb-2">Email ID <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailAlreadyRegistered(false);
                        }}
                        className={`block w-full pl-12 pr-4 py-3 bg-[#131724] border rounded-xl focus:ring-1 text-white placeholder-gray-600 transition-colors ${emailAlreadyRegistered ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-700 focus:ring-[#f26522] focus:border-[#f26522]"}`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {checkingEmail ? (
                      <p className="mt-2 text-sm text-gray-400 flex items-center gap-1.5">
                        <svg className="animate-spin h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Checking email availability...
                      </p>
                    ) : emailAlreadyRegistered ? (
                      <p className="mt-2 text-sm text-red-400">
                        This email is already registered. Please use a different email.
                      </p>
                    ) : isValidEmailFormat ? (
                      <p className="mt-2 text-sm text-green-400 flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Email available
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4 pt-2">
                  <label className="block text-sm text-gray-300">Full Address <span className="text-red-500">*</span></label>

                  {/* Address Line 1 */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                      </svg>
                    </div>
                    <input type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="block w-full pl-12 pr-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors" placeholder="House No., Building Name, Street Area" />
                  </div>

                  {/* Address Line 2 */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </div>
                    <input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className="block w-full pl-12 pr-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors" placeholder="Locality, Landmark (Optional)" />
                  </div>

                  {/* City, State, Pincode */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="block w-full px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors" placeholder="City" />
                    </div>
                    <div className="relative">
                      <input type="text" value={stateName} onChange={(e) => setStateName(e.target.value)} className="block w-full px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors" placeholder="State" />
                    </div>
                    <div className="relative">
                      <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="block w-full px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors" placeholder="Pincode" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Identity Documents Card */}
            <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-stretch gap-3 mb-6">
                <div className="w-8 rounded bg-[#f26522]/10 flex items-center justify-center text-[#f26522] shrink-0">
                  <span className="font-bold text-sm">03</span>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Please upload the required documents below to proceed with your subscriptions{" "}
                  <span className="text-xs font-normal text-gray-500">(By continuing, you agree to let us securely use your information to provide and manage your subscription, as per applicable privacy laws)</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Aadhaar Front Upload */}
                <div>
                  <span className="block text-sm text-gray-300 mb-2">Aadhaar Card Image (Front Side)</span>
                  <label className="border border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-[#131724]/50 hover:border-[#f26522] hover:bg-[#131724] transition-all cursor-pointer group block w-full relative">
                    <svg className="w-8 h-8 text-gray-500 mb-3 group-hover:text-[#f26522] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-sm text-gray-400 mb-1">
                      {aadharFrontFile ? (
                        <span className="text-[#f26522] font-semibold">{aadharFrontFile.name}</span>
                      ) : (
                        <><span className="text-[#f26522] font-semibold">Choose File</span> or drag & drop</>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or PDF (Max 5MB)</p>
                    <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setAadharFrontFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                {/* Aadhaar Back Upload */}
                <div>
                  <span className="block text-sm text-gray-300 mb-2">Aadhaar Card Image (Back Side)</span>
                  <label className="border border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-[#131724]/50 hover:border-[#f26522] hover:bg-[#131724] transition-all cursor-pointer group block w-full relative">
                    <svg className="w-8 h-8 text-gray-500 mb-3 group-hover:text-[#f26522] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-sm text-gray-400 mb-1">
                      {aadharBackFile ? (
                        <span className="text-[#f26522] font-semibold">{aadharBackFile.name}</span>
                      ) : (
                        <><span className="text-[#f26522] font-semibold">Choose File</span> or drag & drop</>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or PDF (Max 5MB)</p>
                    <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setAadharBackFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                {/* PAN Front Upload */}
                <div>
                  <span className="block text-sm text-gray-300 mb-2">PAN Card Image (Front Side)</span>
                  <label className="border border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-[#131724]/50 hover:border-[#f26522] hover:bg-[#131724] transition-all cursor-pointer group block w-full relative">
                    <svg className="w-8 h-8 text-gray-500 mb-3 group-hover:text-[#f26522] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-sm text-gray-400 mb-1">
                      {panFrontFile ? (
                        <span className="text-[#f26522] font-semibold">{panFrontFile.name}</span>
                      ) : (
                        <><span className="text-[#f26522] font-semibold">Choose File</span> or drag & drop</>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or PDF (Max 5MB)</p>
                    <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setPanFrontFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            </div>

            {/* Residence Status Card */}
            <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-[#f26522]/10 flex items-center justify-center text-[#f26522]">
                  <span className="font-bold text-sm">04</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Residence Status</h2>
              </div>
              <p className="text-sm text-gray-400 mb-6 ml-1 sm:ml-11">
                Kindly select your residence type and provide the corresponding supporting document.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 ml-1 sm:ml-11">
                <label className="flex items-center cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${houseType === 'permanent' ? 'border-[#f26522]' : 'border-gray-500 group-hover:border-gray-400'}`}>
                    {houseType === 'permanent' && <div className="w-2.5 h-2.5 bg-[#f26522] rounded-full"></div>}
                  </div>
                  <input type="radio" name="residence" value="permanent" checked={houseType === "permanent"} onChange={() => { setHouseType("permanent"); setResidenceDocType(permanentDocOptions[0]); }} className="hidden" />
                  <span className={`text-base ${houseType === 'permanent' ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>Permanent House</span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${houseType === 'rent' ? 'border-[#f26522]' : 'border-gray-500 group-hover:border-gray-400'}`}>
                    {houseType === 'rent' && <div className="w-2.5 h-2.5 bg-[#f26522] rounded-full"></div>}
                  </div>
                  <input type="radio" name="residence" value="rent" checked={houseType === "rent"} onChange={() => { setHouseType("rent"); setResidenceDocType(rentDocOptions[0]); }} className="hidden" />
                  <span className={`text-base ${houseType === 'rent' ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>Rent House</span>
                </label>
              </div>

              {/* Document Type Selection */}
              <div className="mb-6 ml-1 sm:ml-11">
                <span className="block text-sm text-gray-300 mb-3">
                  Please select one document to submit as proof:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(houseType === "permanent" ? permanentDocOptions : rentDocOptions).map((doc) => (
                    <button
                      key={doc}
                      type="button"
                      onClick={() => setResidenceDocType(doc)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${residenceDocType === doc ? 'bg-[#f26522]/10 border-[#f26522] text-[#f26522]' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'}`}
                    >
                      {doc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Upload Box */}
              <div className="bg-[#131724] border border-gray-700 rounded-xl p-5 ml-0 sm:ml-11">
                <span className="block text-sm font-medium text-gray-300 mb-3">
                  {residenceDocType} Image (Required for {houseType === "permanent" ? "Permanent House" : "Rent House"})
                </span>
                <label className="border border-gray-600 rounded-lg p-3 flex flex-col sm:flex-row items-center sm:justify-between gap-3 cursor-pointer hover:border-[#f26522] transition-colors group bg-[#1a1f30] block w-full relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-gray-800 text-gray-400 group-hover:text-[#f26522] transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">
                        {residenceFile ? (
                          <span className="text-[#f26522] font-semibold">{residenceFile.name}</span>
                        ) : (
                          <><span className="text-[#f26522] font-semibold">Choose File</span> or drag & drop</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto text-left sm:text-right">
                    <p className="text-xs text-gray-500">PNG, JPG or PDF (Max 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setResidenceFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={!otpVerified || !allDocumentsUploaded || emailAlreadyRegistered}
                className={`w-full font-semibold py-4 px-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-all active:scale-[0.98] ${otpVerified && allDocumentsUploaded && !emailAlreadyRegistered ? 'bg-[#f26522] hover:bg-[#e05a1e] text-white shadow-[#f26522]/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}`}
              >
                <span className="text-lg">Continue to Next Step</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
              </button>
              {otpVerified && !allDocumentsUploaded && (
                <p className="text-center text-xs text-red-400 mt-3">
                  Please upload all 5 required documents to continue.
                </p>
              )}
              <div className="mt-5 flex items-center justify-center gap-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <span className="text-xs font-medium uppercase tracking-wider">Your information is secure and encrypted</span>
              </div>
            </div>

          </form>
        )}

        {step === 2 && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-8 max-w-xl mx-auto mt-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-gray-700/50 pb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Rent O Mate By Akvinz</h3>
                <p className="text-gray-400 mt-1">{planDuration} Months Subscription</p>
                <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  100% Refundable
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 line-through">₹{planDuration === "12" ? "4,999" : "7,999"}</p>
                <p className="text-3xl font-bold text-[#f26522]">₹{getPrice()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Refundable Security Deposit</span>
                <span className="text-white font-medium">₹{getPrice()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">GST on Deposit</span>
                <span className="text-white font-medium text-green-400">Not Applicable</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold pt-4 border-t border-gray-700/50">
                <span className="text-white">Total Payable Now</span>
                <span className="text-[#f26522]">₹{getPrice()}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 -mt-2 p-3.5 rounded-xl bg-[#131724] border border-gray-700/50">
              <svg className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-xs text-gray-500 leading-relaxed">
                The security deposit collected for the water purifier subscription service provided by RentOMate (AKVINZ) is held strictly as a refundable performance guarantee. Pursuant to prevailing tax regulations, this deposit does not constitute consideration for a taxable supply and is explicitly excluded from GST liability and filing requirements.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handlePayment}
                disabled={isProcessingPayment}
                className="w-full bg-[#f26522] hover:bg-[#e05a1e] text-white font-semibold py-4 px-4 rounded-xl shadow-lg shadow-[#f26522]/20 flex justify-center items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span className="text-lg">{isProcessingPayment ? "Processing..." : "Pay with Razorpay"}</span>
                {!isProcessingPayment && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                  </svg>
                )}
              </button>
              <div className="mt-5 flex items-center justify-center gap-2 text-green-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                <span className="text-xs font-medium uppercase tracking-wider">Secured by Razorpay</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isProcessingPayment}
                className="w-full mt-4 text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                ← Back to Registration
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-8 sm:p-12 backdrop-blur-sm text-center max-w-xl mx-auto mt-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Registration Successful!</h2>
            <p className="text-gray-400 mb-8">
              Thank you for choosing Akvinz. Your payment has been successfully received and your registration is complete.
            </p>
            {receiptError && <p className="text-red-400 text-sm mb-4">{receiptError}</p>}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {invoiceId && (
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  disabled={isDownloadingReceipt}
                  className="px-8 py-3 bg-[#f26522] hover:bg-[#d9591c] disabled:opacity-60 text-white font-medium rounded-xl transition-colors"
                >
                  {isDownloadingReceipt ? "Downloading..." : "Download Receipt"}
                </button>
              )}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl border border-gray-700 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}