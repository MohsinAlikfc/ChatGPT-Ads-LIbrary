import { Link, type MetaFunction } from "react-router";
import {
  aboutPageSchema,
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  webPageSchema,
} from "../lib/schema";
import { SITE_URL } from "../lib/site";

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
  {
    question: "How often is the ChatGPT Ads Library updated?",
    answer:
      "The library is updated regularly to capture new ads and advertisers appearing on ChatGPT. Check back frequently for the latest ad creative and impression data.",
  },
  {
    question: "Can I filter ads by date or impressions?",
    answer:
      "Yes. The homepage FilterBar lets you filter by date range (date_from and date_to) and by impression count range (min and max impressions). Combine filters with keyword search for precise results.",
  },
  {
    question: "What data does each ad record include?",
    answer:
      "Each ad record includes: the ad creative image, advertiser name and logo, the advertised website domain, ad headline copy, a description, the publish date, and an impression count.",
  },
  {
    question: "Who is the ChatGPT Ads Library designed for?",
    answer:
      "The library is built for marketers, researchers, journalists, and anyone curious about which brands advertise inside ChatGPT and what their ad creative looks like.",
  },
];

const HOW_TO_STEPS = [
  {
    name: "Open the Ads Library",
    text: "Go to chatgpt-ads-library.com and you will see the full paginated list of ads running on ChatGPT, sorted by date by default.",
  },
  {
    name: "Search by keyword",
    text: "Type a keyword into the search bar (top of page). Results will filter across advertiser names, website domains, and ad copy in real time.",
  },
  {
    name: "Filter by advertiser, date, or impressions",
    text: "Open the FilterBar below the header and select an advertiser, choose a date range, or set a minimum and maximum impression count to narrow the results.",
  },
  {
    name: "Click an ad for full details",
    text: "Click any ad card to open the detail page, which shows the full creative image, copy, description, publish date, total impressions, and a link to the advertiser's website.",
  },
  {
    name: "Explore an advertiser's full profile",
    text: "From any ad card or detail page, click 'View advertiser' to open the advertiser profile with all their ads, total impressions, and first/last seen dates.",
  },
];

export const meta: MetaFunction = () => {
  const aboutUrl = `${SITE_URL}/about`;
  const seoTitle = "About the ChatGPT Ads Library — How It Works & FAQs";
  const seoDescription =
    "Learn how the ChatGPT Ads Library works, what ad data it tracks, and how to search and filter ads running across ChatGPT. Includes FAQs and a step-by-step guide.";
  const seoKeywords =
    "ChatGPT Ads Library about, how ChatGPT ads work, ChatGPT advertising FAQ, search ChatGPT ads, OpenAI advertising transparency";

  const seoJsonLd = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
    ]),
    aboutPageSchema({
      url: aboutUrl,
      name: "About the ChatGPT Ads Library",
      description:
        "Learn how the ChatGPT Ads Library works, what ad data it tracks, and how to search and filter ads running on ChatGPT.",
    }),
    webPageSchema({
      url: aboutUrl,
      name: "About — ChatGPT Ads Library",
      description:
        "Learn how the ChatGPT Ads Library works, what ad data it tracks, and how to search and filter ads running across ChatGPT.",
      speakableSelectors: ["h1", ".about-intro"],
    }),
    faqSchema(FAQS),
    howToSchema({
      name: "How to Search and Browse ChatGPT Ads",
      description:
        "A step-by-step guide to finding, filtering, and exploring ads running inside ChatGPT using the ChatGPT Ads Library.",
      steps: HOW_TO_STEPS,
    }),
  ];

  const metaTags: any[] = [
    { title: seoTitle },
    { name: "description", content: seoDescription },
    { name: "keywords", content: seoKeywords },
    { name: "robots", content: "index, follow" },
    { tagName: "link", rel: "canonical", href: aboutUrl },
    { property: "og:site_name", content: "ChatGPT Ads Library" },
    { property: "og:title", content: seoTitle },
    { property: "og:description", content: seoDescription },
    { property: "og:url", content: aboutUrl },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ];

  seoJsonLd.forEach((json) => {
    metaTags.push({ "script:ld+json": json });
  });

  return metaTags;
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        About
      </h1>
      <div className="about-intro mt-6 space-y-5 text-zinc-600 dark:text-zinc-300">
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
      <ol className="mt-4 space-y-3 text-zinc-600 dark:text-zinc-300">
        {HOW_TO_STEPS.map((step, i) => (
          <li key={step.name} className="flex gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-100">{step.name}: </span>
              <span>{step.text}</span>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-zinc-600 dark:text-zinc-300">
        <Link to="/" className="font-medium text-brand-500 hover:text-brand-600">
          Browse ads
        </Link>{" "}
        and filter by advertiser, date, or impressions. Or{" "}
        <Link to="/advertisers" className="font-medium text-brand-500 hover:text-brand-600">
          explore advertisers
        </Link>{" "}
        to see who's running campaigns and how many ads they have.
      </p>

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
  );
}
