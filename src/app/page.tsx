import Link from "next/link";

const actions = [
  {
    href: "/customerForm",
    title: "New Registration",
    description: "Register as a new customer and pay the advance to get started.",
    accent: "text-[#f26522] bg-[#f26522]/10",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.5v15m7.5-7.5h-15" />
    ),
  },
  {
    href: "/rentForm",
    title: "Pay Monthly Rent",
    description: "Registered customers can pay their next monthly rental cycle here.",
    accent: "text-[#f26522] bg-[#f26522]/10",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 8.25h19.5M2.25 8.25v10.5a1.5 1.5 0 001.5 1.5h16.5a1.5 1.5 0 001.5-1.5V8.25M2.25 8.25V6.75a1.5 1.5 0 011.5-1.5h16.5a1.5 1.5 0 011.5 1.5v1.5M6 15h4.5" />
    ),
  },
  {
    href: "/returnForm",
    title: "Return Product",
    description: "Discontinue your subscription and request a pickup for your RO unit.",
    accent: "text-red-400 bg-red-500/10",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    ),
  },
  {
    href: "/closeForm",
    title: "Close Account & Refund",
    description: "Confirm your final refund amount and complete account closure.",
    accent: "text-red-400 bg-red-500/10",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
    ),
  },
  {
    href: "/bankDetailsForm",
    title: "Bank Account Details",
    description: "Registered customers can add or update the bank account we send payments to.",
    accent: "text-[#f26522] bg-[#f26522]/10",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 21h19.5M4.5 21V9.75M9.75 21V9.75M14.25 21V9.75M19.5 21V9.75M2.25 9.75L12 3l9.75 6.75M4.5 9.75h15" />
    ),
  },
  {
    href: "/locationChangeForm",
    title: "Location Change",
    description: "Registered customers can request an update to their service address.",
    accent: "text-[#f26522] bg-[#f26522]/10",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    ),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#131724] text-white flex flex-col font-sans">
      <header className="bg-[#1a1f30] flex items-center justify-center px-4 py-3 shadow-md border-b border-gray-800">
        <img src="/logo-footer.svg" alt="AKVINZ Logo" className="h-8 object-contain" />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-12 max-w-xl">
          <div className="inline-flex items-center gap-2 mb-3">
            <svg className="w-3 h-3 text-[#f26522]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
            <span className="text-[#f26522] text-sm font-semibold tracking-wider uppercase">Water Purifier Subscriptions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Welcome to Akvinz</h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Be Pure, Live Fresh. Manage your registration, rent, and returns all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-[#1a1f30]/80 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm hover:border-[#f26522]/60 hover:bg-[#1a1f30] transition-all flex items-start gap-4"
            >
              <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${action.accent}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {action.icon}
                </svg>
              </div>
              <div className="flex-grow">
                <h2 className="text-base font-semibold text-white mb-1 group-hover:text-[#f26522] transition-colors">
                  {action.title}
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">{action.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-600 group-hover:text-[#f26522] group-hover:translate-x-1 transition-all shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-wider">Your information is secure and encrypted</span>
        </div>
      </main>
    </div>
  );
}
