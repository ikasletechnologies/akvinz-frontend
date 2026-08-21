"use client";
import React, { useEffect, useState } from "react";
import { API_URL, downloadFile } from "@/lib/api";

export default function RentalFormPage() {
  const [step, setStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Customer & Plan States
  const [customer, setCustomer] = useState<any>(null);
  const [rentalPlanDuration, setRentalPlanDuration] = useState("12"); // 12 or 24
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [isSettingUpAutopay, setIsSettingUpAutopay] = useState(false);
  const [autopayJustEnabled, setAutopayJustEnabled] = useState(false);
  const [assetTermsAccepted, setAssetTermsAccepted] = useState(false);
  const [assetTermsExpanded, setAssetTermsExpanded] = useState(false);

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
        // Fetch customer details
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
        const plan = data.customer.planDuration ? String(data.customer.planDuration) : "12";
        setRentalPlanDuration(plan);
      } else {
        alert("No registration found for this mobile number. Please register first.");
      }
    } catch (err) {
      alert("Failed to fetch customer details.");
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const getPrice = () => {
    return rentalPlanDuration === "12" ? 2 : 1;
  };

  const handleDownloadReceipt = async () => {
    if (!invoiceId || !customer) return;
    setIsDownloadingReceipt(true);
    setReceiptError("");
    try {
      await downloadFile(`${API_URL}/customer/${customer.id}/invoices/${invoiceId}/pdf`);
    } catch (e) {
      setReceiptError("Couldn't download the receipt. Please try again.");
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  const handlePayment = async () => {
    if (!assetTermsAccepted) {
      alert("Please accept the Asset Acceptance & Terms above before continuing.");
      return;
    }
    setIsProcessingPayment(true);
    setAutopayJustEnabled(false);
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded) {
      alert("Razorpay SDK failed to load. Are you online?");
      setIsProcessingPayment(false);
      return;
    }

    try {
      const amount = getPrice();

      const res = await fetch(`${API_URL}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
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
        description: `Monthly Rent - ${rentalPlanDuration} Months Subscription`,
        order_id: data.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API_URL}/verify-rental-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerId: customer.id,
                rentalPlanDuration: parseInt(rentalPlanDuration),
                rentalAmount: amount,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              if (verifyData.invoiceId) {
                setInvoiceId(verifyData.invoiceId);
                downloadFile(`${API_URL}/customer/${customer.id}/invoices/${verifyData.invoiceId}/pdf`).catch((e) =>
                  console.error("Receipt download failed:", e)
                );
              }
              setStep(3);
            } else {
              alert("Payment verification failed!");
            }
          } catch (e) {
            alert("Error verifying payment.");
          }
        },
        prefill: {
          name: customer?.fullName,
          contact: customer?.mobileNumber,
          email: customer?.email
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

  // Sets up UPI Autopay (or card/NACH e-mandate) for future rent — the
  // mandate authorization itself is this cycle's charge, so this replaces
  // handlePayment for this visit rather than running alongside it. Every
  // charge after this one happens automatically via Razorpay, with no
  // further action needed from the customer.
  const handleSetupAutopay = async () => {
    if (!assetTermsAccepted) {
      alert("Please accept the Asset Acceptance & Terms above before continuing.");
      return;
    }
    setIsSettingUpAutopay(true);
    setAutopayJustEnabled(false);
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded) {
      alert("Razorpay SDK failed to load. Are you online?");
      setIsSettingUpAutopay(false);
      return;
    }

    try {
      const amount = getPrice();

      const res = await fetch(`${API_URL}/subscription/autopay/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          rentalPlanDuration: parseInt(rentalPlanDuration),
          rentalAmount: amount,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert("Failed to set up autopay: " + data.message);
        setIsSettingUpAutopay(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        recurring: 1,
        name: "Akvinz",
        description: `Rental Autopay - ${rentalPlanDuration} Months Subscription`,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API_URL}/subscription/autopay/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerId: customer.id,
                rentalPlanDuration: parseInt(rentalPlanDuration),
                rentalAmount: amount,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              if (verifyData.invoiceId) {
                setInvoiceId(verifyData.invoiceId);
                downloadFile(`${API_URL}/customer/${customer.id}/invoices/${verifyData.invoiceId}/pdf`).catch((e) =>
                  console.error("Receipt download failed:", e)
                );
              }
              setAutopayJustEnabled(true);
              setStep(3);
            } else {
              alert("Autopay verification failed!");
            }
          } catch (e) {
            alert("Error verifying autopay setup.");
          }
        },
        prefill: {
          name: customer?.fullName,
          contact: customer?.mobileNumber,
          email: customer?.email
        },
        theme: {
          color: "#f26522"
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response: any) {
        alert("Autopay setup failed: " + response.error.description);
      });

    } catch (e) {
      alert("Error setting up autopay");
    } finally {
      setIsSettingUpAutopay(false);
    }
  };

  const getNextMonthDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    return today.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="min-h-screen bg-[#131724] text-white flex flex-col font-sans">
      <header className="bg-[#1a1f30] flex items-center justify-between px-4 py-3 shadow-md sticky top-0 z-10 border-b border-gray-800">
        <div className="w-8"></div> {/* Spacer */}
        <div className="flex justify-center items-center">
          <img src="/logo-footer.svg" alt="AKVINZ Logo" className="h-8 object-contain" />
        </div>
        <div className="w-8"></div> {/* Spacer */}
      </header>
      <p className="text-center text-xs text-gray-500 font-bold py-2 px-4">
        RENT O MATE is a registered service of AKVINZ.
      </p>

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 py-10 relative">
        {step < 3 && (
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {step === 1 ? "Customer Verification" : "Start Your Subscription"}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              {step === 1 ? "Enter your registered mobile number to proceed." : "Review your details and pay the first month's rent to activate your 30-day billing cycle."}
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
                {otpVerified && <p className="mt-2 text-sm text-green-400 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Mobile Verified successfully!</p>}
              </div>

              {otpVerified && customer && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-[#f26522] hover:bg-[#e05a1e] text-white font-semibold py-4 px-4 rounded-xl shadow-lg shadow-[#f26522]/20 flex justify-center items-center gap-2 transition-all"
                >
                  Continue to Rental Details
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && customer && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-8 max-w-xl mx-auto">

            {/* Customer Summary */}
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
                <div className="col-span-2">
                  <span className="block text-gray-500 mb-1">Installation Address</span>
                  <span className="font-medium text-white block">{customer.addressLine1}</span>
                  {customer.addressLine2 && <span className="font-medium text-white block">{customer.addressLine2}</span>}
                  <span className="font-medium text-white block">{customer.city}, {customer.state} - {customer.pincode}</span>
                </div>
              </div>
            </div>

            {/* Choose Plan */}
            {/* Chosen Plan */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Your Rental Plan</h3>
              <div className="bg-[#f26522]/10 border-2 border-[#f26522] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="block text-gray-400 mb-1 text-sm">{rentalPlanDuration} Months Subscription</span>
                  <span className="block text-2xl font-bold text-white">₹{getPrice()}<span className="text-sm font-normal text-gray-500">/mo</span></span>
                </div>
                <div className="text-[#f26522]">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                </div>
              </div>
            </div>

            {/* Billing Summary */}
            <div className="bg-[#131724] p-5 rounded-xl border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">First Month Billing</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Subscription Start</span>
                  <span className="text-white font-medium">{getTodayDate()}</span>
                </div>
                <div className="flex justify-between text-gray-300 pb-3 border-b border-gray-800">
                  <span>Next Billing Due</span>
                  <span className="text-white font-medium">{getNextMonthDate()}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-white font-semibold text-lg">Total Amount</span>
                  <span className="text-[#f26522] font-bold text-2xl">₹{getPrice()}</span>
                </div>
              </div>
            </div>

            {customer.autopayStatus !== "ACTIVE" && (
              <div className="border border-gray-700 rounded-xl bg-[#131724] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={assetTermsAccepted}
                    onChange={(e) => setAssetTermsAccepted(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-[#1a1f30] text-[#f26522] focus:ring-1 focus:ring-[#f26522] accent-[#f26522] shrink-0"
                  />
                  <span className="text-sm text-gray-300 flex-grow">
                    I have read and accept the Asset Acceptance &amp; Terms
                  </span>
                  <button
                    type="button"
                    onClick={() => setAssetTermsExpanded((v) => !v)}
                    aria-label={assetTermsExpanded ? "Collapse terms" : "Expand terms"}
                    className="p-1 text-gray-400 hover:text-white transition-colors shrink-0"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${assetTermsExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>
                {assetTermsExpanded && (
                  <div className="max-h-72 overflow-y-auto border-t border-gray-700 px-4 py-4 bg-[#1a1f30] space-y-4 text-sm text-gray-300 leading-relaxed">
                    <div>
                      <h4 className="text-white font-semibold mb-1">Acceptance of Asset</h4>
                      <p>
                        The Subscriber hereby declares that they have personally inspected the Product and find it
                        completely operational, fit for purpose, and satisfying all parameters of the execution
                        checklist. The Subscriber assumes the role of a lawful Bailee of the corporate asset from
                        this date forward.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Reaffirmation of Ownership</h4>
                      <p>
                        The Subscriber explicitly reiterates that they possess absolutely no proprietary title,
                        stake, or ownership over the Product or its ancillary hardware. Ownership vests exclusively
                        with Akvinz by Ragavi Enterprises under Section 2 of the Principal Agreement.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Care and Maintenance Boundaries</h4>
                      <p>
                        The Subscriber undertakes to operate the machine strictly as per provided guidelines,
                        ensuring stable power inputs and regular raw water inflow. Any internal alterations, housing
                        component breakage, or un-notified removal will trigger immediate penal liabilities under
                        Section 6 and Section 8 of the Principal Agreement.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {customer.autopayStatus === "ACTIVE" ? (
              <div className="pt-2 text-center bg-green-500/10 border border-green-500/20 rounded-xl p-5">
                <p className="text-green-400 font-medium flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Autopay is active
                </p>
                <p className="text-gray-400 text-sm mt-1">Your rent is charged automatically each month — no action needed.</p>
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleSetupAutopay}
                  disabled={isSettingUpAutopay || isProcessingPayment || !assetTermsAccepted}
                  className="w-full bg-[#f26522] hover:bg-[#e05a1e] text-white font-semibold py-4 px-4 rounded-xl shadow-lg shadow-[#f26522]/20 flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                >
                  <span className="text-lg">{isSettingUpAutopay ? "Setting up..." : `Set up Autopay — ₹${getPrice()}/mo`}</span>
                  {!isSettingUpAutopay && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>}
                </button>
                {!assetTermsAccepted && (
                  <p className="text-center text-xs text-yellow-400">
                    Please accept the Asset Acceptance &amp; Terms above before continuing.
                  </p>
                )}
                <p className="text-center text-xs text-gray-500">
                  Authorize once via GPay, PhonePe, Paytm, any UPI app, or card — future months are charged automatically. Covers this month too.
                </p>
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={isProcessingPayment || isSettingUpAutopay || !assetTermsAccepted}
                  className="w-full bg-transparent hover:bg-white/5 text-gray-300 font-medium py-3 px-4 rounded-xl border border-gray-700 flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isProcessingPayment ? "Processing..." : `Pay ₹${getPrice()} this month only`}
                </button>
                <div className="mt-2 flex items-center justify-center gap-2 text-green-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  <span className="text-xs font-medium uppercase tracking-wider">Secured by Razorpay</span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-8 sm:p-12 backdrop-blur-sm text-center max-w-xl mx-auto">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{autopayJustEnabled ? "Autopay Enabled!" : "Payment Successful!"}</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {autopayJustEnabled
                ? <>Your rent is now on autopay, starting today ({getTodayDate()}). It will be charged automatically each month — your next charge will be around <strong className="text-white">{getNextMonthDate()}</strong>, no action needed from you.</>
                : <>Your rent has been paid. Your 30-day billing cycle starts right now ({getTodayDate()}) and your next payment will be due on <strong className="text-white">{getNextMonthDate()}</strong>.</>
              }
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
