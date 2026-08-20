"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

export default function LocationChangeFormPage() {
  const [step, setStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [customer, setCustomer] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Step 2 Form States
  const [newFullAddress, setNewFullAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newResidenceStatus, setNewResidenceStatus] = useState("rent"); // "rent" or "permanent"

  // Step 3 Form States
  const permanentDocOptions = ["EB Bill", "Gas Bill", "House Tax Bill"];
  const rentDocOptions = ["Rental Agreement", "Student ID", "Working Staff ID"];
  const [proofType, setProofType] = useState(rentDocOptions[0]);
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Step 4 Form States
  const [reason, setReason] = useState("");

  // Update default document type when residence status changes
  useEffect(() => {
    if (newResidenceStatus === "permanent") {
      setProofType(permanentDocOptions[0]);
    } else {
      setProofType(rentDocOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newResidenceStatus]);

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
        setStep(2);
      } else {
        alert("No registration found for this mobile number. Please register first.");
      }
    } catch (err) {
      alert("Failed to fetch customer details.");
    }
  };

  const handleSubmit = async () => {
    if (!customer) return;
    if (!newFullAddress.trim() || !newCity.trim() || !newDistrict.trim() || !newState.trim() || !newPincode.trim() || !reason.trim() || !proofFile) {
      setSubmitError("Please fill in all required fields and upload the address proof.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const formData = new FormData();
    formData.append("customerId", customer.id);
    formData.append("newFullAddress", newFullAddress.trim());
    formData.append("newCity", newCity.trim());
    formData.append("newDistrict", newDistrict.trim());
    formData.append("newState", newState.trim());
    formData.append("newPincode", newPincode.trim());
    formData.append("newResidenceStatus", newResidenceStatus);
    formData.append("proofType", proofType);
    formData.append("reason", reason.trim());
    formData.append("proofDocument", proofFile);

    try {
      const res = await fetch(`${API_URL}/customer/location-change`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setStep(5);
      } else {
        setSubmitError(data.message || "Failed to submit location change request");
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
        {step < 5 && (
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {step === 1 ? "Customer Verification" : "Location Change Request"}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              {step === 1
                ? "Enter your registered mobile number to proceed."
                : `Submit location change request for customer: ${customer?.fullName}`}
            </p>
          </div>
        )}

        {/* STEP 1: Verification */}
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
                      className="block w-full px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white transition-colors"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className="whitespace-nowrap px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                )}

                {otpError && (
                  <p className="text-sm text-red-500 mt-2 font-medium">{otpError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Location Details */}
        {step === 2 && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm max-w-xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold border-b border-gray-800 pb-3">New Location Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Full Address *</label>
                <textarea
                  rows={3}
                  value={newFullAddress}
                  onChange={(e) => setNewFullAddress(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white transition-colors"
                  placeholder="Street name, landmark, building etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">City / Town *</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="block w-full px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">District *</label>
                  <input
                    type="text"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="block w-full px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">State *</label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="block w-full px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value)}
                    className="block w-full px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Residence Status *</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setNewResidenceStatus("permanent")}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-colors ${newResidenceStatus === "permanent" ? "bg-[#f26522]/10 border-[#f26522] text-[#f26522]" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}
                  >
                    Permanent House
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewResidenceStatus("rent")}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-colors ${newResidenceStatus === "rent" ? "bg-[#f26522]/10 border-[#f26522] text-[#f26522]" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}
                  >
                    Rent House
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!newFullAddress || !newCity || !newDistrict || !newState || !newPincode}
                className="w-full py-3 bg-[#f26522] hover:bg-[#e05a1e] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                Continue to Address Proof
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Address Proof */}
        {step === 3 && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm max-w-xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold border-b border-gray-800 pb-3">New Address Proof</h2>
            
            <div className="space-y-4">
              <div>
                <span className="block text-sm text-gray-300 mb-2">Select Proof Type *</span>
                <div className="flex flex-wrap gap-2">
                  {(newResidenceStatus === "permanent" ? permanentDocOptions : rentDocOptions).map((doc) => (
                    <button
                      key={doc}
                      type="button"
                      onClick={() => setProofType(doc)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${proofType === doc ? 'bg-[#f26522]/10 border-[#f26522] text-[#f26522]' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                    >
                      {doc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Proof Document *</label>
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-gray-500 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm text-gray-300">
                      {proofFile ? `Selected: ${proofFile.name}` : "Click or drag file to upload proof document"}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-[#131724] border border-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!proofFile}
                className="flex-1 py-3 bg-[#f26522] hover:bg-[#e05a1e] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                Continue to Reason
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Reason */}
        {step === 4 && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm max-w-xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold border-b border-gray-800 pb-3">Reason for Location Change</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Reason *</label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#131724] border border-gray-700 rounded-xl focus:ring-1 focus:ring-[#f26522] focus:border-[#f26522] text-white transition-colors"
                  placeholder="Explain why you are changing location..."
                />
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red-500 font-medium">{submitError}</p>
            )}

            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-[#131724] border border-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !reason.trim()}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Success Screen */}
        {step === 5 && (
          <div className="bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-8 backdrop-blur-sm max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your location change request has been submitted successfully. Our admin team will review the details and update you.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
