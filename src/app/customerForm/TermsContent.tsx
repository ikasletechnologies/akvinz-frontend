// Full text of the AKVINZ Subscription Agreement, shown inline on the
// customer registration form so the subscriber can review it before
// accepting the checkbox that gates OTP verification.
export default function TermsContent() {
  return (
    <div className="text-sm text-gray-700 space-y-6 leading-relaxed">
      <div>
        <h3 className="text-lg font-bold text-gray-900">AKVINZ SUBSCRIPTION AGREEMENT</h3>
        <p className="text-xs text-gray-500 mt-1">
          WWW.AKVINZ.COM · +91 81100 16161 · CUSTOMERCONNECT@AKVINZ.COM
        </p>
      </div>

      <p>
        This Subscription Agreement (&quot;Agreement&quot;) is executed by and between AKVINZ by M/S Ragavi Enterprises
        (hereinafter referred to as the &quot;Company&quot;, which expression shall include its successors and assigns) and
        the individual subscribing to the services (hereinafter referred to as the &quot;Subscriber&quot; or &quot;Renter&quot;).
      </p>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">1. Parties and Definitions</h4>

        <h5 className="text-gray-800 font-medium">i. &quot;Product/Equipment&quot;</h5>
        <p>
          &quot;Product/Equipment&quot; refers to the AKVINZ Ultron series Water Purifier unit, including all internal filters,
          pump motor, solenoid valve, power adopter, all internal sensors, RO membranes, outer casing, pre-filters, and
          smart-metering components installed at the premises.
        </p>
        <p>
          For the purpose of legal recovery, liquidated damages, and liability protection under this contract, the fixed
          Maximum Retail Price (MRP) of the Product is explicitly defined and quantified as a fixed sum of ₹17,999
          (Rupees Seventeen thousand nine hundred ninetynine Only).
        </p>

        <h5 className="text-gray-800 font-medium">ii. Loss, Theft, or Irreparable Damage</h5>
        <p>
          Where the Product is lost, stolen, or irreparably damaged, the amount recoverable from the Subscriber as
          liquidated damages shall be the MRP depreciated on the following schedule, calculated from the date of first
          installation:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-300 border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Period</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Recoverable MRP</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-300 px-3 py-2">First 6 months</td><td className="border border-gray-300 px-3 py-2">100% of MRP</td></tr>
              <tr><td className="border border-gray-300 px-3 py-2">Exceeding 6 months up to 12 months</td><td className="border border-gray-300 px-3 py-2">85% of MRP</td></tr>
              <tr><td className="border border-gray-300 px-3 py-2">Exceeding 12 months up to 18 months</td><td className="border border-gray-300 px-3 py-2">70% of MRP</td></tr>
              <tr><td className="border border-gray-300 px-3 py-2">Exceeding 18 months up to 24 months</td><td className="border border-gray-300 px-3 py-2">55% of MRP</td></tr>
              <tr><td className="border border-gray-300 px-3 py-2">Beyond 24 months</td><td className="border border-gray-300 px-3 py-2">40% of MRP (floor value)</td></tr>
            </tbody>
          </table>
        </div>

        <h5 className="text-gray-800 font-medium">iii. &quot;Services&quot;</h5>
        <p>&quot;Services&quot; refers to water purification, routine maintenance, filter swaps, and repair management provided by the Company.</p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">2. Scope of Agreement &amp; Asset Ownership</h4>

        <h5 className="text-gray-800 font-medium">i. Retention of Title</h5>
        <p>
          The Product provided to the Subscriber is strictly on a rental/subscription basis. Absolute ownership of the
          Product remains exclusively with the Company at all times. The Subscriber enjoys only a non-transferable
          right to use the Equipment at the registered address.
        </p>

        <h5 className="text-gray-800 font-medium">ii. No Encumbrance</h5>
        <p>
          The Subscriber shall not pledge, mortgage, rent, sublease, or create any charge or lien on the Product. Any
          attempt to do so such conduct shall constitute a material breach of this Agreement and the Company reserves
          the right to initiate appropriate civil and criminal proceedings where applicable.
        </p>

        <h5 className="text-gray-800 font-medium">iii. Non-Compete and Misuse Prohibitions</h5>
        <p>
          The Subscriber is strictly prohibited from reverse-engineering, dismantling, copying, modifying, or
          duplicating the design, technology, or software of the Product. The Equipment is provided solely for
          personal/domestic consumption; commercial resale of purified water or unauthorized commercial exploitation
          of the machine without explicit written consent from the Company is strictly forbidden and will attract
          immediate legal action.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">3. Subscription Slabs, Billing, &amp; Water Consumption Caps</h4>
        <p>The Company offers choices under the following subscription frameworks. The Subscriber agrees to adhere to the selected structure:</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-300 border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Subscription Slab</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Security Deposit (Refundable)</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Fixed Rental Monthly</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Months</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-300 px-3 py-2">Plan A (1 Year)</td><td className="border border-gray-300 px-3 py-2">₹2,999</td><td className="border border-gray-300 px-3 py-2">₹699</td><td className="border border-gray-300 px-3 py-2">12</td></tr>
              <tr><td className="border border-gray-300 px-3 py-2">Plan B (2 Years)</td><td className="border border-gray-300 px-3 py-2">₹3,999</td><td className="border border-gray-300 px-3 py-2">₹449</td><td className="border border-gray-300 px-3 py-2">24</td></tr>
            </tbody>
          </table>
        </div>

        <h5 className="text-gray-800 font-medium">i. Mandatory Auto-Debit Setup</h5>
        <p>The Subscriber must configure an automated recurring payment profile (via NACH Mandate, Credit/Debit Card e-mandate, or UPI Auto-pay) upon onboarding.</p>

        <h5 className="text-gray-800 font-medium">ii. Advance Payment</h5>
        <p>The fixed monthly rental for the first billing cycle is payable upfront alongside the Security Deposit.</p>

        <h5 className="text-gray-800 font-medium">iii. Taxes</h5>
        <p>
          All amounts specified in this Agreement (including the Security Deposit, Fixed Monthly Rental, and Excess
          Usage Fee) are exclusive of Goods and Services Tax (GST) and any other applicable taxes, levies, or cess,
          which shall be charged additionally by the Company at the rate prevailing under law and reflected in the
          relevant invoice.
        </p>

        <h5 className="text-gray-800 font-medium">iv. Price Revision</h5>
        <p>
          The Company reserves the right to revise the Fixed Monthly Rental and Excess Usage Fee at the time of plan
          renewal, or during the subsisting term upon thirty (30) days prior written notice to the Subscriber, to
          reflect changes in operating costs, statutory levies, or inflation. Continued use of the Product after the
          effective date of any such revision shall constitute the Subscriber&apos;s acceptance of the revised charges.
        </p>

        <h5 className="text-gray-800 font-medium">v. No Suspension for Non-Use</h5>
        <p>
          The Fixed Monthly Rental shall continue to accrue and be payable for as long as the Product remains
          installed at the Subscriber&apos;s premises, irrespective of actual water usage or occupancy of the premises,
          unless a temporary hold has been formally requested by the Subscriber and approved in writing by the
          Company, subject to such hold fee (if any) as the Company may prescribe.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">4. Onboarding, Verification, &amp; KYC Compliance</h4>

        <h5 className="text-gray-800 font-medium">i. Documentation Threshold</h5>
        <p>
          Prior to delivery, the Subscriber must upload valid Know Your Customer (KYC) documents: Identity Proof (PAN
          card and Aadhaar/Passport) and Address Validation (House tax invoice if owner OR a valid, registered Rental
          Agreement if tenant).
        </p>

        <h5 className="text-gray-800 font-medium">ii. Physical Verification</h5>
        <p>
          A Company-authorized technician will visit the designated premises within 72 hours of deposit payment to run
          document authentication, inspect structural plumbing, and log the primary installation coordinates.
        </p>

        <h5 className="text-gray-800 font-medium">iii. Deployment Logging</h5>
        <p>
          Upon physical installation, a digital snapshot of the functioning unit along with the Subscriber at the site
          will be securely logged via the Company&apos;s backend administration portal and WhatsApp API to initialize the
          billing engine.
        </p>

        <h5 className="text-gray-800 font-medium">iv. Installation Feasibility &amp; Company Authority</h5>
        <p>
          Installation of the Product is subject to site suitability and plumbing feasibility as determined by the
          Company&apos;s authorized technician during the verification visit. If the premises are found unsuitable for
          installation due to structural, plumbing, or safety constraints, the Company reserves the right to refuse
          installation without liability and the Security Deposit shall be refunded within 7–10 working days.
        </p>

        <h5 className="text-gray-800 font-medium">v. Structural Alterations &amp; Restoration</h5>
        <p>
          The Subscriber grants the Company permission to perform necessary minor plumbing modifications and
          structural wall-drilling required for standard equipment mounting. Upon contract termination or relocation,
          the Company&apos;s sole responsibility is the safe de-installation and retrieval of its Equipment. The Company
          shall not be held liable or responsible for restoring, painting, or patching walls, countertops, or
          structural plumbing lines to their original state.
        </p>

        <h5 className="text-gray-800 font-medium">vi. Authority Limits</h5>
        <p>
          The Subscriber agrees that only Company-authorized personnel may perform installation, removal, or
          reinstallation. Any attempt by the Subscriber or third parties to install or modify the Product
          independently shall render this Agreement null and void, with liability for damages as per Clause 8.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">5. Maintenance, Servicing, &amp; IoT Operations</h4>

        <h5 className="text-gray-800 font-medium">i. Complimentary Regular Maintenance</h5>
        <p>
          The Company provides zero-cost routine preventative maintenance, including periodic filter assessments and
          replacement of exhausted consumable spares (sediment filters, carbon blocks, RO membranes), provided the
          unit is operating under normal wear-and-tear conditions. This complimentary maintenance is conditional on
          the Subscriber granting the Company&apos;s technician timely access to carry out scheduled preventive-maintenance
          visits; if the Subscriber repeatedly refuses or reschedules such a visit, the Company shall be relieved of
          liability for any resulting fault and may treat the resulting repair as chargeable.
        </p>

        <h5 className="text-gray-800 font-medium">ii. Source Water Quality Conditions</h5>
        <p>
          The complimentary maintenance framework is strictly subject to the input source water Total Dissolved Solids
          (TDS) levels not exceeding 1,500 ppm. Any accelerated component degradation, structural blockage, corrosion,
          or other damage caused by connecting the Product to unvetted, highly contaminated, industrial, or other
          non-standard domestic water sources shall constitute physical misuse by the Subscriber. The cost of repair,
          replacement of affected components, and all associated service charges shall be borne by the Subscriber.
          Where such misuse results in the Product becoming irreparably damaged, destroyed, or economically beyond
          repair, the provisions of Clause 1(i) relating to the defined Maximum Retail Price (MRP) of the Product and
          the applicable liquidated damages schedule shall apply, and the Company shall be entitled to recover
          compensation in accordance with the depreciation schedule specified therein, subject to applicable law.
        </p>

        <h5 className="text-gray-800 font-medium">iii. Electricity &amp; Network Dependency</h5>
        <p>
          The Product requires a continuous electricity supply and internet/network connectivity to function properly
          and record water usage. The Subscriber is responsible for providing a stable power supply and network
          connection at the installation premises. The Company shall not be responsible for any interruption in
          service, temporary malfunction, or inaccurate usage records caused by power cuts, voltage fluctuations,
          internet outages, or other failures in the local electricity or communication network that are beyond the
          Company&apos;s control.
        </p>

        <h5 className="text-gray-800 font-medium">iv. Service Level Agreement (SLA)</h5>
        <p>
          In the event of a mechanical failure or breakdown, the Subscriber must raise a service ticket via the
          official AKVINZ portal, WhatsApp, or registered email. The Company will dispatch an authorized technician to
          diagnose and remedy the issue as per ticket registration.
        </p>

        <h5 className="text-gray-800 font-medium">v. Proprietary Spares</h5>
        <p>
          Only Company certified parts may be used. The cost of all regular component replacements will be
          dynamically captured in the backend infrastructure logs for asset health tracing.
        </p>

        <h5 className="text-gray-800 font-medium">vi. Malfunction &amp; Company Decision Authority</h5>
        <p>
          Following inspection by an authorized AKVINZ technician, the Company shall have sole discretion to determine
          the corrective action, which may include refixing the machine with spare parts or filters, replacing the
          machine with new or equivalent certified refurbished unit, or terminating the subscription agreement. The
          Subscriber agrees to accept and cooperate with the Company&apos;s decision without objection. Failure to
          cooperate shall constitute a material breach of this Agreement, leading to immediate termination and
          forfeiture of the Security Deposit.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">6. Relocation &amp; Address Updates</h4>

        <h5 className="text-gray-800 font-medium">i. Authorized Relocation Only</h5>
        <p>The Subscriber shall not de-install or move the Product to a new address independently.</p>

        <h5 className="text-gray-800 font-medium">ii. Relocation Framework</h5>
        <p>
          The primary/first installation is completely free of charge. Subsequent address changes or internal unit
          shifting must be scheduled through the Company. A relocation service charge of ₹600 will apply per instance,
          subject to the Company checking service feasibility in the new locality.
        </p>

        <h5 className="text-gray-800 font-medium">iii. Relocation &amp; Unauthorized Removal Clause</h5>
        <p>
          The Subscriber must provide prior written notice to the Company before any shifting, removal, or
          reinstallation of the Product within the same/new premises. Such notice shall be valid only if raised
          through a registered email, official WhatsApp, or a ticket via the AKVINZ portal. Only Company-authorized
          personnel are permitted to carry out removal, relocation, or reinstallation. Any attempt by the Subscriber
          or third parties to independently uninstall or move the Product shall constitute a material breach,
          rendering this Agreement null and void with immediate effect. In such cases, the Subscriber shall be legally
          liable to pay the full defined MRP of the Product as liquidated damages, in addition to forfeiture of the
          Security Deposit. The Company reserves the right to initiate civil and/or criminal proceedings for
          unauthorized handling of its proprietary equipment.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">7. Early Termination, Cancellation, &amp; Security Deposit Refunds</h4>

        <h5 className="text-gray-800 font-medium">i. Customer Cooperation</h5>
        <p>
          The Subscriber must provide timely access to the premises for service, inspection, or retrieval. Refusal or
          obstruction shall be treated as breach, leading to subscription termination and forfeiture of deposit.
        </p>

        <h5 className="text-gray-800 font-medium">ii. Notice Period</h5>
        <p>The Subscriber may cancel the subscription at any point by serving a mandatory 30 days&apos; prior notice via the AKVINZ application or registered email.</p>

        <h5 className="text-gray-800 font-medium">iii. Asset Reclamation</h5>
        <p>
          Upon termination, the Subscriber must grant Company personnel safe entry to dismantle and retrieve the
          Product. If the Subscriber fails to provide access or behaves uncooperatively during retrieval, it will lead
          to the immediate forfeiture of the entire Security Deposit, without prejudice to the Company&apos;s right to
          pursue legal retrieval.
        </p>

        <h5 className="text-gray-800 font-medium">iv. Early Exit Adjustments</h5>
        <p>
          If a user opts out of Plan A or Plan B prior to completing the committed period, the rental difference
          between the actual tenure used and the committed slab will be deducted from the security deposit before
          final settlement. For clarity, this difference shall be calculated as:
        </p>
        <p className="italic text-gray-600">
          (Company&apos;s standard non-discounted monthly rental rate − Subscriber&apos;s discounted Plan monthly rental rate)
          × Number of months the Product was actually installed at the premises.
        </p>

        <h5 className="text-gray-800 font-medium">v. Sufficiency of Recovery</h5>
        <p>
          If the calculated rental difference deficit or outstanding dues arising from an early exit exceed the
          available Security Deposit pool, the Company is explicitly authorized to automatically recover the
          remaining financial shortfall via the Subscriber&apos;s linked auto-debit profile setup under Clause 3.
        </p>

        <h5 className="text-gray-800 font-medium">vi. Refund Processing</h5>
        <p>
          The remaining Security Deposit will be processed online and returned to the Subscriber&apos;s source bank
          account within 10 to 15 working days following a successful, damage-free asset retrieval report signed off
          by our technician.
        </p>

        <h5 className="text-gray-800 font-medium">vii. Auto-Renewal</h5>
        <p>
          Unless the Subscriber serves the 30-day exit notice referred to above prior to expiry of the committed Plan
          A/Plan B tenure, this Agreement shall automatically renew on a month-to-month basis on the same terms, at
          the Company&apos;s then-prevailing standard monthly rental rate, until terminated by either party in accordance
          with this Clause 7.
        </p>

        <h5 className="text-gray-800 font-medium">vii. Automatic Termination upon Insolvency or Bankruptcy</h5>

        <p className="font-medium text-gray-800">1. Immediate Termination</p>
        <p>
          Notwithstanding anything to the contrary in this Agreement, this Agreement shall stand automatically
          terminated with immediate effect, without requiring any prior notice or a 30-day notice period, upon the
          occurrence of any of the following events:
        </p>
        <p>a. The Subscriber files a petition for insolvency or bankruptcy under the Insolvency and Bankruptcy Code (IBC) or any other applicable laws.</p>
        <p>b. The Subscriber is adjudicated as insolvent or bankrupt by a competent court or tribunal.</p>
        <p>c. A liquidator, receiver, or administrator is appointed over the assets or estate of the Subscriber.</p>

        <p className="font-medium text-gray-800">2. Exclusion of Asset from Insolvency Pool</p>
        <p>
          Since absolute ownership of the Product remains exclusively with the Company at all times (as per Clause 2),
          the Product does not constitute an asset of the Subscriber. It shall not be subject to any liquidation
          proceedings, debt-restructuring pools, or claims by the Subscriber&apos;s creditors.
        </p>

        <p className="font-medium text-gray-800">3. Immediate Repossession Right</p>
        <p>
          Upon the occurrence of an insolvency event, the Company or its authorized representatives shall have an
          unconditional, immediate right to enter the installation premises to de-install and reclaim the Product. Any
          resistance, delay, or obstruction by the Subscriber, their family, or appointed insolvency professionals
          shall be treated as an illegal withholding of Company property, the Company reserves the right to initiate
          civil and/or criminal proceedings for unauthorized handling of its proprietary equipment.
        </p>

        <p className="font-medium text-gray-800">4. Financial Settlement</p>
        <p>
          In the event of insolvency, the entire Security Deposit shall be immediately forfeited to cover any unbilled
          water usage, outstanding rental dues, or deinstallation logistics, without prejudice to the Company&apos;s right
          to claim additional outstanding dues as an operational creditor.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">8. Infractions, Penalties, &amp; Deposit Forfeiture Matrix</h4>

        <h5 className="text-gray-800 font-medium">i. Critical Operating Notice</h5>
        <p>Tampering, bypassing IoT meters, or unapproved relocation will trigger automated system lockdowns and prompt legal escalations.</p>

        <h5 className="text-gray-800 font-medium">ii. Late Payment Fee</h5>
        <p>
          If an auto-debit attempt fails, a one-time NACH/auto-debit-bounce charge of ₹100 will be levied for that
          attempt, and the overdue amount shall additionally accrue interest at 18% per annum (calculated on a daily
          pro-rata basis) until the outstanding amount, including such interest, is fully cleared. If the account
          remains past due for more than 30 consecutive days, the subscription will be suspended, access to water may
          be disabled electronically, the security deposit will be forfeited, and recovery actions will begin.
        </p>

        <h5 className="text-gray-800 font-medium">iii. Tampering &amp; Unauthorized Access</h5>
        <p>
          Any physical tampering with the internal components, breaking of factory seals, or altering the digital IoT
          flow meter will result in the immediate forfeiture of the full security deposit plus an explicit recovery
          charge covering the actual repair or total replacement value of the unit.
        </p>

        <h5 className="text-gray-800 font-medium">iv. Missed Service Appointments</h5>
        <p>
          If a subscriber schedules a repair or statutory inspection visit but denies entry or is unavailable without
          24 hours&apos; notice, a ₹500 missed-visit penalty will be appended to the next billing statement.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">9. Privacy, Data Protection, &amp; Confidentiality</h4>

        <h5 className="text-gray-800 font-medium">i. Data Minimization</h5>
        <p>The Company affirms that all gathered KYC items, geographical coordinates, images, and subscription meta-logs will be managed safely in encrypted storage.</p>

        <h5 className="text-gray-800 font-medium">ii. Confidentiality Framework</h5>
        <p>
          Both parties agree to preserve absolute confidentiality regarding internal matters. The Company ensures that
          customer data, proprietary water usage logs, and backend IoT analytics will not be disclosed to third-party
          entities, except as strictly required by law, regulatory frameworks, or for optimization of direct service
          delivery.
        </p>

        <h5 className="text-gray-800 font-medium">iii. Consent &amp; Compliance with the Digital Personal Data Protection Act, 2023</h5>
        <p>
          By executing this Agreement, the Subscriber consents to the Company processing their personal data
          (including KYC documents, installation photographs/videos, geo-location, and IoT usage logs) for the
          purposes of onboarding, billing, service delivery, and recovery of dues, in accordance with the Digital
          Personal Data Protection Act, 2023 and rules made thereunder. The Company shall make available a standalone
          privacy notice describing the data collected and the purpose of processing, and shall designate a Grievance
          Officer/contact channel through which the Subscriber may raise data-related or service-related grievances.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">10. Risk Allocation, Liability, and Exclusions</h4>

        <h5 className="text-gray-800 font-medium">i. Force Majeure</h5>
        <p>
          The Company shall not be held liable or responsible for any failure, delay, or disruption in servicing,
          water delivery, or app accessibility resulting from events entirely beyond its reasonable control. This
          includes natural disasters, strikes, utility grid failures, internet disruptions, or restrictive government
          mandates.
        </p>

        <h5 className="text-gray-800 font-medium">ii. Indemnity Clause</h5>
        <p>
          The Subscriber explicitly agrees to defend, indemnify, and hold harmless the Company, its directors,
          employees, and authorized agents from and against any and all claims, damages, losses, liabilities, legal
          costs, or expenses emerging out of the Subscriber&apos;s misuse of the Product, unapproved plumbing
          modifications, negligence, violation of this agreement, or any third-party actions occurring at the
          installation premises.
        </p>

        <h5 className="text-gray-800 font-medium">iii. Limitation of Liability</h5>
        <p>
          Notwithstanding anything to the contrary contained herein, the maximum aggregate financial liability of the
          Company towards the Subscriber for any operational defaults, service lapses, errors, or breaches shall be
          strictly capped at an amount equivalent to the total subscription fees actually paid by the Subscriber in
          the immediate one (1) month preceding the claim. In the event of gross negligence or willful misconduct
          verified by judicial review, the Company shall provide the Subscriber with a replacement machine free of
          cost, which shall constitute the sole and exclusive remedy available to the Subscriber. In no event shall
          the Company be liable for any indirect, incidental, special, or consequential loss or damage (including loss
          of business, data, or amenity), even if the Company has been advised of the possibility of such loss.
        </p>

        <h5 className="text-gray-800 font-medium">iv. Insurance &amp; Risk Coverage</h5>
        <p>
          The Subscriber acknowledges that the Product is not insured against theft, fire, or natural calamities under
          this Agreement. Any such loss shall result in forfeiture of the deposit and immediate liability for the full
          defined MRP.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">11. Dispute Escalation Ladder &amp; Governing Law</h4>

        <h5 className="text-gray-800 font-medium">i. Structured Escalation Ladder</h5>
        <p>Both parties commit to solving issues via the following mandatory three-tier framework before initiating formal legal remedies:</p>
        <p>Tier 1: Customer Service Support Ticket</p>
        <p>Tier 2: Regional Management Review (within 15 business days)</p>
        <p>Tier 3: Statutory Arbitration (if internal mediation fails after an additional 15 business days).</p>

        <h5 className="text-gray-800 font-medium">ii. Arbitration and Jurisdiction</h5>
        <p>
          Unresolved conflicts shall be referred to and finally resolved by arbitration under the Arbitration and
          Conciliation Act, 1996, before a Sole Arbitrator mutually appointed by both parties through written consent
          within fifteen (15) days of either party issuing a notice of dispute. If the parties are unable to mutually
          agree on the Sole Arbitrator within this period, either party shall be entitled to apply for appointment of
          an arbitrator to the jurisdictional High Court (or its designated authority) under Section 11 of the
          Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Coimbatore, Tamil Nadu,
          and the language of arbitration shall be English. The competent civil courts in Coimbatore shall hold
          exclusive judicial jurisdiction over all matters not referable to arbitration.
        </p>

        <h5 className="text-gray-800 font-medium">iii. Legal Remedies</h5>
        <p>The Company reserves the right to pursue civil and criminal remedies in addition to arbitration for fraud, tampering, or unauthorized handling of the Product.</p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">12. Miscellaneous Provisions</h4>

        <h5 className="text-gray-800 font-medium">i. Digital Acceptance Validity</h5>
        <p>
          In alignment with the Information Technology Act, 2000 (IT Act), execution via electronic signatures, mobile
          application-based click-wrap consent, or One-Time Password (OTP) verification shall be fully valid, legally
          binding, and enforceable as a physical signature in a court of law.
        </p>

        <h5 className="text-gray-800 font-medium">ii. Survival Clause</h5>
        <p>
          The rights and obligations of both parties which by their nature are intended to survive expiration or
          premature termination—including Clause 2 (Asset Ownership), Clause 9 (Confidentiality), Clause 10
          (Indemnity/Liability Limits), and Clause 11 (Dispute Resolution)—shall remain fully active.
        </p>

        <h5 className="text-gray-800 font-medium">iii. Entire Agreement &amp; No Oral Variation</h5>
        <p>
          This Agreement, together with its referenced addenda (including the Equipment Receipt &amp; Installation
          Acknowledgement, Job Sheets, and the End-of-Tenure De-installation &amp; Deposit Clearance Report),
          constitutes the entire understanding between the parties and supersedes all prior discussions,
          representations, or commitments, whether oral or written. No modification, waiver, or amendment of this
          Agreement shall be valid unless made in writing and digitally or physically executed by an authorized
          signatory of the Company.
        </p>

        <h5 className="text-gray-800 font-medium">iv. Severability</h5>
        <p>
          If any provision of this Agreement is held by a court or tribunal of competent jurisdiction to be invalid,
          illegal, or unenforceable, such provision shall be severed, and the remaining provisions of this Agreement
          shall continue in full force and effect. The invalid provision shall, to the extent permitted by law, be
          deemed replaced by a valid provision that most closely reflects the original commercial intent of the
          parties.
        </p>

        <h5 className="text-gray-800 font-medium">v. Assignment</h5>
        <p>
          The Company shall act reasonably and in good faith while exercising its discretion and without requiring the
          Subscriber&apos;s consent, may assign, transfer, securities, or create a charge over its rights, receivables,
          and obligations under this Agreement (including to financiers, asset financing partners, or
          successors-in-business), provided the Subscriber&apos;s rights to use the Product on the agreed terms are not
          adversely affected. The Subscriber shall not assign, transfer, or sub-contract any of its rights or
          obligations under this Agreement without the prior written consent of the Company.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-gray-900 font-semibold">13. Secondary Contact &amp; Co-Debtor Liability Clause</h4>

        <h5 className="text-gray-800 font-medium">i. Emergency &amp; Recovery Contact</h5>
        <p>
          In the event the Subscriber becomes unreachable, absconds, defaults on payments exceeding thirty (30) days,
          or denies the Company physical access to retrieve the Product, the Company reserves the absolute right to
          contact and interface with the designated Secondary Contact person to locate the asset.
        </p>

        <h5 className="text-gray-800 font-medium">ii. Joint and Several Liability</h5>
        <p>
          The Secondary Contact explicitly signs this Agreement as a Co-Signatory / Guarantor. In the event that the
          primary Subscriber absconds with the Product, goes through insolvency, or fails to return it upon contract
          termination, the Secondary Contact shall be held jointly and severally liable for all outstanding dues,
          structural late fees, and the full defined Maximum Retail Price (MRP) of the Product as liquidated damages.
        </p>
      </section>
    </div>
  );
}
