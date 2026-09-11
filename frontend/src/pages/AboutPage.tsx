import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { breadcrumbSchema, faqSchema } from "../lib/schema";

const FAQS = [
  {
    question: "What is the ChatGPT Ads Library?",
    answer:
      "The ChatGPT Ads Library is an independent, searchable archive of ads running across ChatGPT. It shows ad creative, advertiser, website, copy, description, publish date, and impression counts.",
  },
  {
    question: "How do I search for ads on ChatGPT?",
    answer:
      "Use the search bar to search across advertisers, websites, and ad copy. You can also filter by advertiser, date range, and impressions to narrow results.",
  },
  {
    question: "Which advertisers run ads on ChatGPT?",
    answer:
      "The library tracks hundreds of advertisers across industries, including retail, software, finance, and marketing technology. Browse the Advertisers page to see ad counts and impressions.",
  },
  {
    question: "Is this project affiliated with OpenAI?",
    answer:
      "No. This is an independent project and is not affiliated with or endorsed by OpenAI. Ad data may be incomplete or change over time.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About — ChatGPT Ads Library"
        description="Learn how the ChatGPT Ads Library works, what ad data it tracks, and how to search and filter ads running across ChatGPT."
        path="/about"
        jsonLd={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
          faqSchema(FAQS),
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          About
        </h1>
        <div className="mt-6 space-y-5 text-zinc-600 dark:text-zinc-300">
          <p>
            ChatGPT Ads Library is an independent, searchable archive of ads running across
            ChatGPT. It makes it easy to browse creative, see which advertisers are active,
            and understand what's being promoted — without needing a dashboard.
          </p>
          <p>
            Every entry includes the ad creative, advertiser, website, copy, description,
            publish date, and impression count. You can search across advertisers, websites,
            and ad text, then filter by advertiser, date range, and impressions.
          </p>
          <p>
            The site is built for researchers, marketers, journalists, and anyone curious about
            the ads inside ChatGPT.
          </p>
        </div>

        <h2 className="mt-10 text-xl font-bold text-zinc-900 dark:text-zinc-100">How to use it</h2>
        <ul className="mt-4 space-y-2 text-zinc-600 dark:text-zinc-300">
          <li>
            <Link to="/" className="font-medium text-brand-500 hover:text-brand-600">
              Browse ads
            </Link>{" "}
            and filter by advertiser, date, or impressions.
          </li>
          <li>
            <Link to="/advertisers" className="font-medium text-brand-500 hover:text-brand-600">
              Explore advertisers
            </Link>{" "}
            to see who's running campaigns and how many ads they have.
          </li>
          <li>Click any ad to see the full creative and metadata.</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mt-4 space-y-4">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <strong className="text-zinc-700 dark:text-zinc-200">Disclaimer:</strong> This is an
          independent project and is not affiliated with or endorsed by OpenAI. Ad data may be
          incomplete or change over time.
        </div>
      </div>
    </>
  );
}
