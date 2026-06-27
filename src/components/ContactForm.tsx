import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const USE_CASES = [
  "Education / Classroom",
  "Sales Demo",
  "Corporate Training",
  "Event / Conference",
  "Other",
] as const;

type UseCase = (typeof USE_CASES)[number];

interface FormValues {
  name: string;
  email: string;
  organization: string;
  use_case: UseCase | "";
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  use_case?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) {
    errors.name = "Name is required";
  }
  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (!values.use_case) {
    errors.use_case = "Select a use case";
  }
  return errors;
}

function buildTag(useCase: UseCase): string {
  return useCase.toLowerCase().replace(/\s+/g, "-");
}

const EMPTY_FORM: FormValues = {
  name: "",
  email: "",
  organization: "",
  use_case: "",
  message: "",
};

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) {
      const nextErrors = validate(next);
      setErrors((prev) => ({ ...prev, [key]: nextErrors[key as keyof FormErrors] }));
    }
  }

  function blur(key: keyof FormValues) {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const nextErrors = validate(values);
    setErrors((prev) => ({ ...prev, [key]: nextErrors[key as keyof FormErrors] }));
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const allTouched: Partial<Record<keyof FormValues, boolean>> = {
      name: true,
      email: true,
      use_case: true,
    };
    setTouched(allTouched);

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error("CRM intake is not configured");
      }

      const useCase = values.use_case as UseCase;

      const res = await fetch(`${supabaseUrl}/functions/v1/crm-intake`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          company: values.organization.trim(),
          message: values.message.trim(),
          workspace: "SaaS",
          contact_type: "prospect",
          source: "roundtaible.com",
          tags: ["roundtaible", "inbound", buildTag(useCase)],
          challenge: values.message.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("CRM intake error", res.status, body);
        throw new Error("Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      console.error("ContactForm submission error:", err);
      toast.error("Something went wrong. Please try again or reach out directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-6 rounded-2xl border border-amber-700/30 bg-stone-950/80 px-8 py-14 text-center backdrop-blur-sm",
          className,
        )}
      >
        <CheckCircle2
          size={48}
          className="text-amber-400"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-amber-100">
            Request Received
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            We'll be in touch within one business day to arrange a walkthrough.
          </p>
        </div>
      </div>
    );
  }

  const fieldClass = (error?: string) =>
    cn(
      "w-full rounded-lg border bg-stone-900/60 px-4 py-3 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-600 focus:bg-stone-900 focus:ring-1",
      error
        ? "border-red-700/60 focus:border-red-600 focus:ring-red-700/30"
        : "border-stone-700/60 focus:border-amber-600/70 focus:ring-amber-700/20",
    );

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        "rounded-2xl border border-amber-700/25 bg-stone-950/80 p-8 backdrop-blur-sm",
        className,
      )}
      aria-label="Contact Roundtaible"
    >
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label
            htmlFor="rt-name"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-amber-500/80"
          >
            Full Name <span className="text-amber-400" aria-hidden="true">*</span>
          </label>
          <input
            id="rt-name"
            type="text"
            autoComplete="name"
            maxLength={100}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "rt-name-error" : undefined}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => blur("name")}
            className={fieldClass(errors.name)}
            placeholder="Your name"
          />
          {errors.name && (
            <p id="rt-name-error" role="alert" className="mt-1.5 text-xs text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="rt-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-amber-500/80"
          >
            Email <span className="text-amber-400" aria-hidden="true">*</span>
          </label>
          <input
            id="rt-email"
            type="email"
            autoComplete="email"
            maxLength={255}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "rt-email-error" : undefined}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => blur("email")}
            className={fieldClass(errors.email)}
            placeholder="you@company.com"
          />
          {errors.email && (
            <p id="rt-email-error" role="alert" className="mt-1.5 text-xs text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        {/* Organization */}
        <div>
          <label
            htmlFor="rt-org"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-amber-500/80"
          >
            Organization
          </label>
          <input
            id="rt-org"
            type="text"
            autoComplete="organization"
            maxLength={150}
            value={values.organization}
            onChange={(e) => set("organization", e.target.value)}
            className={fieldClass()}
            placeholder="School, company, or team name"
          />
        </div>

        {/* Use Case */}
        <div>
          <label
            htmlFor="rt-use-case"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-amber-500/80"
          >
            Use Case <span className="text-amber-400" aria-hidden="true">*</span>
          </label>
          <select
            id="rt-use-case"
            aria-required="true"
            aria-invalid={!!errors.use_case}
            aria-describedby={errors.use_case ? "rt-use-case-error" : undefined}
            value={values.use_case}
            onChange={(e) => set("use_case", e.target.value as UseCase | "")}
            onBlur={() => blur("use_case")}
            className={cn(
              fieldClass(errors.use_case),
              !values.use_case && "text-stone-600",
            )}
          >
            <option value="" disabled className="text-stone-600 bg-stone-900">
              Select your primary use case
            </option>
            {USE_CASES.map((uc) => (
              <option key={uc} value={uc} className="bg-stone-900 text-stone-100">
                {uc}
              </option>
            ))}
          </select>
          {errors.use_case && (
            <p id="rt-use-case-error" role="alert" className="mt-1.5 text-xs text-red-400">
              {errors.use_case}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="rt-message"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-amber-500/80"
          >
            Message
          </label>
          <textarea
            id="rt-message"
            rows={4}
            maxLength={1500}
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            className={cn(fieldClass(), "resize-none")}
            placeholder="Tell us what you're building or trying to solve"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-amber-600/40 bg-amber-500/10 px-6 py-3.5 text-sm font-semibold tracking-wide text-amber-300 transition-all duration-200 hover:border-amber-500/70 hover:bg-amber-500/20 hover:text-amber-200 hover:shadow-lg hover:shadow-amber-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              Sending...
            </>
          ) : (
            <>
              Send Request
              <Send
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
