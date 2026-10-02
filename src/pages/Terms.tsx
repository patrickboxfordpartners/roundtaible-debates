import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function Terms() {
  usePageMeta({
    title: "Terms of Service - Roundtaible",
    description: "Terms of Service for The Roundtaible debate platform.",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
      <Breadcrumbs items={[{ label: "Terms of Service" }]} className="mb-6" />
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Legal</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-sm text-gray-500">Last updated: October 1, 2026</p>

      <div className="mt-12 space-y-8 text-gray-700 leading-relaxed">
        <p>These Terms of Service ("Terms") govern your use of The Roundtaible ("The Roundtaible," "we," "us," or "our"), a product of Boxford Partners LLC, accessible at theroundtaible.com. By accessing or using our platform, you agree to these Terms.</p>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Service Description</h2>
          <p>The Roundtaible is an AI-powered debate and discussion platform designed for educational settings. It enables students and teachers to engage in structured debates, practice argumentation, and develop critical thinking skills.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Age Requirements</h2>
          <p>The Roundtaible is intended for users aged 13 and older. Users under 13 may only access the platform with verifiable parental consent obtained by their teacher or school, in compliance with COPPA. By creating an account, you represent that you are at least 13 years old or have obtained the required parental consent.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Acceptable Use</h2>
          <p>You agree to use The Roundtaible only for lawful, educational purposes. You will not:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Use the platform to harass, bully, or threaten other users</li>
            <li>Submit content that is obscene, defamatory, or promotes violence</li>
            <li>Attempt to gain unauthorized access to other accounts or systems</li>
            <li>Use the platform in any manner that disrupts the educational environment</li>
            <li>Misrepresent AI-generated content as your own original work outside the platform</li>
            <li>Use automated tools to scrape content or abuse the service</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Teacher Responsibilities</h2>
          <p>Teachers who create classes and invite students are responsible for:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Ensuring students meet the minimum age requirement or obtaining verifiable parental consent for students under 13</li>
            <li>Supervising student use of the platform within their classes</li>
            <li>Ensuring student use complies with their school or district policies</li>
            <li>Reporting any misuse or safety concerns to us promptly</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Content Ownership</h2>
          <p>You retain ownership of the debate topics, arguments, and other content you create on The Roundtaible. By submitting content, you grant us a limited license to store, display, and process your content as necessary to operate the service. AI-generated debate responses are provided for educational use and are not claimed as your original work.</p>
          <p className="mt-2">Debate transcripts and recordings created on the platform may be accessed by teachers within the same class for educational assessment purposes.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">AI-Generated Content</h2>
          <p>The Roundtaible uses AI services (xAI/Grok) to generate debate content and ElevenLabs for text-to-speech features. AI-generated content is provided for educational purposes and may not always be accurate. Users should critically evaluate all AI-generated content.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Account Termination</h2>
          <p>We may suspend or terminate your account if you violate these Terms. You may delete your account at any time by contacting us. Upon termination, your data will be handled in accordance with our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Disclaimers</h2>
          <p>The Roundtaible is provided "as is" without warranties of any kind, express or implied. We do not guarantee uninterrupted or error-free service. AI-generated content may contain inaccuracies and should not be relied upon as authoritative.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Boxford Partners LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of The Roundtaible.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Governing Law</h2>
          <p>These Terms are governed by the laws of the State of California, without regard to conflict of law principles. Any disputes arising under these Terms shall be resolved in the courts of California.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Changes to These Terms</h2>
          <p>We may update these Terms from time to time. Material changes will be noted with a new "Last updated" date. Continued use of the platform after changes constitutes acceptance of the updated Terms.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
          <p>Questions about these Terms:</p>
          <p className="mt-2">
            The Roundtaible / Boxford Partners LLC<br />
            <a href="mailto:hello@theroundtaible.com" className="text-blue-600 hover:underline">hello@theroundtaible.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
