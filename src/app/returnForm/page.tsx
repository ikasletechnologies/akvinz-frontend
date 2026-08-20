"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

export default function ReturnFormPage() {
  const [step, setStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [customer, setCustomer] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [bankAccountHolderName, setBankAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountNumberConfirm, setBankAccountNumberConfirm] = useState("");
  const [ifscStatus, setIfscStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [ifscBranch, setIfscBranch] = useState("");
  const [legalDeclarationsAccepted, setLegalDeclarationsAccepted] = useState(false);
  const [legalDeclarationsExpanded, setLegalDeclarationsExpanded] = useState(false);

  useEffect(() => {
    const code = bankIfscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) {
      setIfscStatus("idle");
      setIfscBranch("");
      return;
    }

    let cancelled = false;
    setIfscStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${code}`);
        if (cancelled) return;
        if (!res.ok) {
          setIfscStatus("invalid");
          setIfscBranch("");
          return;
        }
        const data = await res.json();
        setIfscStatus("valid");
        setIfscBranch(data.BRANCH || "");
        setBankName(data.BANK || bankName);
      } catch {
        if (!cancelled) setIfscStatus("idle"); // network hiccup, not a verdict on the code — don't block submission
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankIfscCode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mobileParam = params.get("mobile");
    if (mobileParam) setMobileNumber(mobileParam.replace(/\D/g, "").slice(-10));
  }, []);

  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSendingOtp(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: "+91" + mobileNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
      } else {
        setOtpError(data.message || data.error || "Failed to send OTP");
      }
    } catch (err) {
      setOtpError("Error connecting to server");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;

    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: "+91" + mobileNumber, code: otpCode }),
      });
      const data = await res.json();

      if (data.success && data.verified) {
        setOtpVerified(true);
        await fetchCustomerDetails("+91" + mobileNumber);
      } else {
        setOtpError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setOtpError("Error connecting to server");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const fetchCustomerDetails = async (fullMobileNumber: string) => {
    try {
      const res = await fetch(`${API_URL}/customer/${encodeURIComponent(fullMobileNumber)}`);
      const data = await res.json();
      if (data.success) {
        setCustomer(data.customer);
        // Pre-fill from bank details they already have on file (e.g. via
        // bankDetailsForm), so they aren't retyping the same thing —
        // they can still edit these if the refund should go elsewhere.
        if (data.customer.bankAccountHolderName && data.customer.bankIfscCode && data.customer.bankAccountNumber) {
          setBankAccountHolderName(data.customer.bankAccountHolderName);
          setBankName(data.customer.bankName || "");
          setBankIfscCode(data.customer.bankIfscCode);
          setBankAccountNumber(data.customer.bankAccountNumber);
          setBankAccountNumberConfirm(data.customer.bankAccountNumber);
        }
      } else {
        alert("No registration found for this mobile number. Please register first.");
      }
    } catch (err) {
      alert("Failed to fetch customer details.");
    }
  };

  const bankDetailsFilled = !!bankAccountHolderName.trim() && !!bankName.trim() && !!bankIfscCode.trim() && !!bankAccountNumber.trim() && !!bankAccountNumberConfirm.trim();
  const accountNumbersMatch = bankAccountNumber.trim() === bankAccountNumberConfirm.trim();

  const handleSubmit = async () => {
    if (!customer || !agreed) return;
    if (!bankDetailsFilled) {
      setSubmitError("Please fill in all bank account details.");
      return;
    }
    if (!accountNumbersMatch) {
      setSubmitError("Account number and confirmation do not match.");
      return;
    }
    if (ifscStatus === "invalid") {
      setSubmitError("Please enter a valid IFSC code.");
      return;
    }
    if (!legalDeclarationsAccepted) {
      setSubmitError("Please accept the Legal Declarations & Liquidation Release before continuing.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API_URL}/subscription/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          bankAccountHolderName: bankAccountHolderName.trim(),
          bankName: bankName.trim(),
          bankIfscCode: bankIfscCode.trim(),
          bankAccountNumber: bankAccountNumber.trim(),
          bankAccountNumberConfirm: bankAccountNumberConfirm.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(3);
      } else {
        setSubmitError(data.message || "Failed to submit request");
      }
    } catch (err) {
      setSubmitError("Error connecting to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131724] text-white flex flex-col font-sans">
      <header className="bg-[#1a1f30] flex items-center justify-between px-4 py-3 shadow-md sticky top-0 z-10 border-b border-gray-800">
        <div className="w-8"></div>
        <div className="flex justify-center items-center">
          <img src="/logo-footer.svg" alt="AKVINZ Logo" className="h-8 object-contain" />
        </div>
        <div className="w-8"></div>
      </header>
      <p className="text-center text-xs text-gray-500 font-bold py-2 px-4">
        RENT O MATE is a registered service of AKVINZ.
      </p>

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 py-10 relative">
        {step < 3 && (
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {step === 1 ? "Customer Verification" : "Discontinue Subscription"}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              {step === 1
                ? "Enter your registered mobile number to proceed with your return request."
                : "Review your subscription and confirm that you want to discontinue and return your product."}
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm max-w-xl mx-auto">
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Registered Mobile Number</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-medium">+91</span>
                    </div>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      disabled={otpVerified}
                      className="block w-full pl-14 pr-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white transition-colors"
                      placeholder="Enter 10 digit number"
                    />
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || mobileNumber.length < 10}
                      className="whitespace-nowrap px-6 py-3 bg-[#f26522] hover:bg-[#e05a1e] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isSendingOtp ? "Sending..." : (otpSent ? "Resend OTP" : "Send OTP")}
                    </button>
                  )}
                </div>

                {otpSent && !otpVerified && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="block w-full sm:w-1/2 px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl text-center tracking-[0.5em] focus:ring-1 focus:ring-[#f26522] text-white"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className="w-full sm:w-auto px-6 py-3 bg-[#f26522] hover:bg-[#e05a1e] text-white font-medium rounded-xl transition-all disabled:opacity-50"
                    >
                      {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                )}

                {otpError && <p className="mt-2 text-sm text-red-400">{otpError}</p>}
                {otpVerified && (
                  <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Mobile Verified successfully!
                  </p>
                )}
              </div>

              {otpVerified && customer && (
                ["ACTIVE", "PENDING_DUE"].includes(customer.subscriptionStatus) ? (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-[#f26522] hover:bg-[#e05a1e] text-white font-semibold py-4 px-4 rounded-xl shadow-lg shadow-[#f26522]/20 flex justify-center items-center gap-2 transition-all"
                  >
                    Continue to Return Request
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                  </button>
                ) : (
                  <p className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    You don&apos;t have an active subscription to discontinue.
                  </p>
                )
              )}
            </div>
          </div>
        )}

        {step === 2 && customer && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-8 max-w-xl mx-auto">
            <div className="bg-[#131724] p-5 rounded-xl border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Customer Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500 mb-1">Name</span>
                  <span className="font-medium text-white">{customer.fullName}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Mobile</span>
                  <span className="font-medium text-white">{customer.mobileNumber}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Rental Plan</span>
                  <span className="font-medium text-white">{customer.rentalPlanDuration ? `${customer.rentalPlanDuration} Months` : "-"}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Monthly Rent</span>
                  <span className="font-medium text-white">{customer.rentalAmount ? `₹${customer.rentalAmount}` : "-"}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-gray-500 mb-1">Installation Address</span>
                  <span className="font-medium text-white block">{customer.addressLine1}</span>
                  {customer.addressLine2 && <span className="font-medium text-white block">{customer.addressLine2}</span>}
                  <span className="font-medium text-white block">{customer.city}, {customer.state} - {customer.pincode}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#131724] p-5 rounded-xl border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Refund Bank Details</h3>
              <p className="text-xs text-gray-500 mb-4">
                Your refundable security deposit will be sent to this account once the returned product is inspected.
              </p>
              {customer?.bankAccountNumber && bankAccountNumber === customer.bankAccountNumber && (
                <p className="text-xs text-[#f26522] mb-4 -mt-2">
                  Pre-filled from the bank details you already have on file — change these if the refund should go elsewhere.
                </p>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankAccountHolderName}
                    onChange={(e) => setBankAccountHolderName(e.target.value)}
                    className="block w-full px-4 py-3 bg-[#1a1f30] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors"
                    placeholder="As per bank records"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    value={bankIfscCode}
                    onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                    className={`block w-full px-4 py-3 bg-[#1a1f30] border rounded-xl focus:ring-1 text-white placeholder-gray-600 transition-colors uppercase ${
                      ifscStatus === "invalid"
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : ifscStatus === "valid"
                        ? "border-green-600 focus:ring-green-600 focus:border-green-600"
                        : "border-gray-700 focus:ring-[#f26522] focus:border-[#f26522]"
                    }`}
                    placeholder="e.g. SBIN0001234"
                    maxLength={11}
                  />
                  {ifscStatus === "checking" && <p className="mt-2 text-xs text-gray-500">Checking IFSC code...</p>}
                  {ifscStatus === "valid" && (
                    <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Verified: {bankName}{ifscBranch ? `, ${ifscBranch} branch` : ""}
                    </p>
                  )}
                  {ifscStatus === "invalid" && (
                    <p className="mt-2 text-xs text-red-400">This IFSC code doesn&apos;t exist. Please check and re-enter.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="block w-full px-4 py-3 bg-[#1a1f30] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors"
                    placeholder="e.g. State Bank of India"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Account Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
                    className="block w-full px-4 py-3 bg-[#1a1f30] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors"
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Re-enter Account Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bankAccountNumberConfirm}
                    onChange={(e) => setBankAccountNumberConfirm(e.target.value.replace(/\D/g, ""))}
                    className="block w-full px-4 py-3 bg-[#1a1f30] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white placeholder-gray-600 transition-colors"
                    placeholder="Re-enter to confirm"
                  />
                  {bankAccountNumber && bankAccountNumberConfirm && !accountNumbersMatch && (
                    <p className="mt-2 text-sm text-red-400">Account numbers do not match.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-gray-700 rounded-xl bg-[#131724] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={legalDeclarationsAccepted}
                  onChange={(e) => setLegalDeclarationsAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-[#1a1f30] text-[#f26522] focus:ring-1 focus:ring-[#f26522] accent-[#f26522] shrink-0"
                />
                <span className="text-sm text-gray-300 flex-grow">
                  I have read and accept the Legal Declarations &amp; Liquidation Release
                </span>
                <button
                  type="button"
                  onClick={() => setLegalDeclarationsExpanded((v) => !v)}
                  aria-label={legalDeclarationsExpanded ? "Collapse terms" : "Expand terms"}
                  className="p-1 text-gray-400 hover:text-white transition-colors shrink-0"
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${legalDeclarationsExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>
              {legalDeclarationsExpanded && (
                <div className="max-h-72 overflow-y-auto border-t border-gray-700 px-4 py-4 bg-[#1a1f30] space-y-4 text-sm text-gray-300 leading-relaxed">
                  <h3 className="text-white font-bold text-base">Legal Declarations &amp; Liquidation Release</h3>
                  <div>
                    <h4 className="text-white font-semibold mb-1">4.1 Surrender of Possession</h4>
                    <p>
                      The Subscriber hereby confirms that they have voluntarily surrendered possession of the Akvinz
                      Ultron ROM Water Purifier unit along with all original ancillary power and plumbing connectors
                      to the authorized corporate representative. The Subscriber acknowledges that their role as a
                      Bailee of the asset is terminated effective immediately upon the departure of the technician.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">4.2 Full and Final Settlement</h4>
                    <p>
                      Both parties agree that the financial assessment detailed in Section 3 is final, binding, and
                      calculated in strict compliance with the liquidation guidelines of the Principal Agreement.
                      Upon processing of the Net Refundable Amount (if any) via electronic bank transfer to the
                      Subscriber&apos;s verified account within 30-45 working days, no further claims, liabilities,
                      or disputes shall be entertained by either party.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">4.3 Dispute, Refusal to Sign, &amp; Recovery of Deficit</h4>
                    <p>
                      If the Subscriber disputes the assessment recorded in Section 3 above, or declines to sign
                      this Report, the Field Engineer shall record such refusal along with the date and time, and
                      shall capture photographic and/or video evidence of the asset&apos;s condition at the time of
                      collection. The assessment recorded herein shall stand as final and binding for the purposes
                      of deposit settlement unless the Subscriber raises a specific written objection through the
                      Company&apos;s official escalation channel (per Section 11 of the Principal Subscription
                      Agreement) within 48 hours of collection. If the deficit amount referred to in the Note above
                      is not paid within the stipulated 7 working days, the outstanding amount shall accrue interest
                      at 18% per annum (pro-rated daily) from the due date until payment, without prejudice to the
                      Company&apos;s right to refer the matter for recovery, including through its authorised
                      recovery agents or legal counsel.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">5. Execution &amp; Sign-Off</h4>
                    <p className="italic">
                      &quot;I certify that I have witnessed the de-installation of the asset and agree with the
                      technician&apos;s assessment of the machine&apos;s physical condition and the final deposit
                      deductions calculated above.&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-2">Before you continue</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Discontinuing your subscription will stop future billing and requires you to return the installed
                product to Akvinz in good working condition. Our team will contact you to schedule a pickup.
              </p>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-600 bg-[#131724] text-[#f26522] focus:ring-1 focus:ring-[#f26522] accent-[#f26522] shrink-0"
                />
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors">
                  I accept, I discontinue the subscription and return my product.
                </span>
              </label>
            </div>

            {submitError && <p className="text-sm text-red-400">{submitError}</p>}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!agreed || isSubmitting || !bankDetailsFilled || !accountNumbersMatch || ifscStatus === "invalid" || !legalDeclarationsAccepted}
                className="w-full bg-[#f26522] hover:bg-[#e05a1e] text-white font-semibold py-4 px-4 rounded-xl shadow-lg shadow-[#f26522]/20 flex justify-center items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Confirm & Discontinue Subscription"}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="w-full mt-4 text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-8 sm:p-12 backdrop-blur-sm text-center max-w-xl mx-auto">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Return Request Submitted</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Your subscription has been discontinued. Our team will reach out shortly to schedule the pickup of
              your product.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl border border-gray-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
