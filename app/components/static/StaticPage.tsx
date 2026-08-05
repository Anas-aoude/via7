import Link from "next/link";

interface StaticPageProps {
  title: string;
  description?: string;
  backLabel: string;
  backHref: string;
  children: React.ReactNode;
}

const StaticPage = ({
  title,
  description,
  backLabel,
  backHref,
  children,
}: StaticPageProps) => {
  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-6 pb-20 pt-60 md:px-10 md:pt-60">
      <header className="mb-10 border-b border-neutral-200 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-600">
            {description}
          </p>
        )}
      </header>

      <article className="space-y-8 leading-8 text-neutral-700">
        {children}
      </article>

      <footer className="mt-14 border-t border-neutral-200 pt-8">
        <Link
          href={backHref}
          className="text-sm font-semibold text-neutral-700 transition hover:text-black hover:underline"
        >
          {backLabel}
        </Link>
      </footer>
    </main>
  );
};

export default StaticPage;