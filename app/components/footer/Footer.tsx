"use client";

import Link from "next/link";
import { FaGlobe } from "react-icons/fa";

import useTranslation from "@/app/hooks/useTranslation";
import useRentModal from "@/app/hooks/useRentModal";

const Footer = () => {
  const { t, language } = useTranslation();
  const rentModal = useRentModal();

  const sections = [
    {
      title: t("footer.support"),
      links: [
        {
          label: t("footer.contact"),
          href: `/${language}/contact`,
        },
        {
          label: t("footer.safety"),
          href: `/${language}/safety`,
        },
        {
          label: t("footer.report"),
          href: `/${language}/report`,
        },
      ],
    },
    {
      title: t("footer.hosting"),
      links: [
        {
          label: t("footer.createListing"),
          action: rentModal.onOpen,
        },
        {
          label: t("footer.ownerDashboard"),
          href: `/${language}/account`,
        },
      ],
    },
    {
      title: "VIA7",
      links: [
        {
          label: t("footer.about"),
          href: `/${language}/about`,
        },
        {
          label: t("footer.privacy"),
          href: `/${language}/privacy`,
        },
        {
          label: t("footer.terms"),
          href: `/${language}/terms`,
        },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t bg-neutral-50">
      <div className="mx-auto max-w-[2520px] px-6 py-12 md:px-10 xl:px-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-bold text-neutral-900">
                {section.title}
              </h3>

              <div className="flex flex-col gap-3">
                {section.links.map((link) =>
                  link.href ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-left text-sm text-neutral-600 transition hover:text-neutral-900 hover:underline"
                    >
                      {link.label}
                    </Link>
                  ) : (
                      <button
                        key={link.label}
                        type="button"
                        onClick={link.action}
                        className="w-fit text-left text-sm text-neutral-600 transition hover:text-neutral-900 hover:underline"
                      >
                        {link.label}
                      </button>
                    )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-neutral-600">
            <span>© {new Date().getFullYear()} VIA7</span>

            <span aria-hidden="true">·</span>

            <Link
              href={`/${language}/privacy`}
              className="hover:text-neutral-900 hover:underline"
            >
              {t("footer.privacy")}
            </Link>

            <span aria-hidden="true">·</span>

            <Link
              href={`/${language}/terms`}
              className="hover:text-neutral-900 hover:underline"
            >
              {t("footer.terms")}
            </Link>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <FaGlobe aria-hidden="true" />
            <span>{language.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;