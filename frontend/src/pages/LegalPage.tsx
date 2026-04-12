import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";

const CONTENT: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  terms: {
    title: "Terms of Service",
    sections: [
      { heading: "1. Acceptance of Terms", body: "By accessing or using RepurposeAI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service." },
      { heading: "2. Description of Service", body: "RepurposeAI is an AI-powered content repurposing platform that transforms your original content into multiple platform-ready formats using Claude AI. We offer free and paid subscription tiers." },
      { heading: "3. User Accounts", body: "You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account." },
      { heading: "4. Acceptable Use", body: "You agree not to use RepurposeAI to generate content that is illegal, harmful, defamatory, or infringes on the intellectual property rights of others. We reserve the right to terminate accounts that violate these terms." },
      { heading: "5. Intellectual Property", body: "You retain all rights to your original content. The AI-generated outputs are also yours to use. RepurposeAI retains rights to the platform, software, and underlying technology." },
      { heading: "6. Payment & Refunds", body: "Paid plans are billed monthly. You may cancel at any time and retain access until the end of your billing period. Refunds are considered on a case-by-case basis. Contact us at hello@repurposeai.com." },
      { heading: "7. Limitation of Liability", body: "RepurposeAI is provided 'as is'. We do not guarantee that the service will be uninterrupted or error-free. Our liability is limited to the amount paid by you in the three months prior to any claim." },
      { heading: "8. Changes to Terms", body: "We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms. We will notify users of significant changes via email." },
      { heading: "9. Governing Law", body: "These terms are governed by the laws of the jurisdiction in which RepurposeAI operates. Any disputes will be resolved through binding arbitration." },
      { heading: "10. Contact", body: "For questions about these Terms of Service, contact us at legal@repurposeai.com or through our contact page." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      { heading: "1. Information We Collect", body: "We collect information you provide directly: name, email address, and content you submit for repurposing. We also collect usage data, device information, and analytics to improve the service." },
      { heading: "2. How We Use Your Information", body: "We use your information to provide and improve RepurposeAI, process payments, send transactional emails (job completion, credit alerts), and respond to support requests. We do not sell your personal data." },
      { heading: "3. Content You Submit", body: "Content you submit for repurposing is processed by Claude AI (Anthropic). We store repurposed outputs in your account. You may delete your content and account at any time from Settings." },
      { heading: "4. Data Sharing", body: "We share data only with: Anthropic (AI processing), Stripe (payment processing), and AssemblyAI (audio transcription). All third parties are bound by their own privacy policies and data processing agreements." },
      { heading: "5. Data Security", body: "We use industry-standard encryption (TLS) for data in transit and encryption at rest. Passwords are hashed using bcrypt. We conduct regular security audits and vulnerability assessments." },
      { heading: "6. Cookies", body: "We use essential cookies for authentication and session management. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, though this may affect functionality." },
      { heading: "7. Data Retention", body: "We retain your account data for as long as your account is active. After account deletion, we delete personal data within 30 days, except where required by law to retain it longer." },
      { heading: "8. Your Rights", body: "You have the right to access, correct, or delete your personal data. You may also request a copy of your data or object to processing. Contact us at privacy@repurposeai.com to exercise these rights." },
      { heading: "9. Children's Privacy", body: "RepurposeAI is not intended for use by children under 13. We do not knowingly collect personal information from children." },
      { heading: "10. Contact", body: "For privacy-related questions or requests, contact our Data Protection Officer at privacy@repurposeai.com." },
    ],
  },
  contact: {
    title: "Contact Us",
    sections: [
      { heading: "General Inquiries", body: "For general questions about RepurposeAI, email us at hello@repurposeai.com. We typically respond within 24 hours on business days." },
      { heading: "Technical Support", body: "Experiencing issues with the platform? Email support@repurposeai.com with a description of your issue and your account email. Include any error messages you see." },
      { heading: "Billing & Subscriptions", body: "For billing questions, refund requests, or subscription changes, email billing@repurposeai.com. You can also manage your subscription directly from Settings → Plan & Billing." },
      { heading: "Legal & Privacy", body: "For legal inquiries or privacy-related requests including data deletion, email legal@repurposeai.com or privacy@repurposeai.com respectively." },
      { heading: "Business & Partnerships", body: "Interested in white-labelling RepurposeAI, bulk licensing, or a partnership? Email partnerships@repurposeai.com with details about your use case." },
      { heading: "Response Times", body: "Support: within 24 hours · Billing: within 4 hours · Legal/Privacy: within 72 hours. We are available Monday to Friday, 9am–6pm UTC." },
    ],
  },
};

export default function LegalPage() {
  const { type = "terms" } = useParams<{ type: string }>();
  const page = CONTENT[type] || CONTENT.terms;

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="border-b border-ink-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-extrabold text-ink-950 text-sm tracking-tight">
              Repurpose<span className="gradient-text">AI</span>
            </span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link to="/legal/terms"    className={`font-medium transition-colors ${type === "terms"   ? "text-brand-600" : "text-ink-500 hover:text-ink-900"}`}>Terms</Link>
            <Link to="/legal/privacy"  className={`font-medium transition-colors ${type === "privacy" ? "text-brand-600" : "text-ink-500 hover:text-ink-900"}`}>Privacy</Link>
            <Link to="/legal/contact"  className={`font-medium transition-colors ${type === "contact" ? "text-brand-600" : "text-ink-500 hover:text-ink-900"}`}>Contact</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-extrabold text-ink-950 mb-2 tracking-tight">
            {page.title}
          </h1>
          <p className="text-sm text-ink-400 mb-10">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="space-y-8">
            {page.sections.map((section) => (
              <motion.div
                key={section.heading}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
              >
                <h2 className="font-display font-bold text-ink-900 mb-3">{section.heading}</h2>
                <p className="text-ink-600 text-sm leading-relaxed">{section.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
