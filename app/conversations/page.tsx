import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import getConversations from "@/app/actions/conversations/getConversations";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { getServerTranslation } from "@/app/libs/serverTranslation";

interface ConversationsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function ConversationsPage({
  searchParams,
}: ConversationsPageProps) {
  const currentUser = await getCurrentUser();
  const { t, language } = await getServerTranslation();

  if (!currentUser || currentUser.isBanned) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;

  const { conversations, totalPages, currentPage, totalCount } =
    await getConversations({
      page,
      limit: 10,
    });

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-72 sm:px-6 md:pt-60 lg:pt-56">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">
          {t("conversations.inbox")}
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          {totalCount} {t("conversations.conversations") || "conversations"}
        </p>
      </div>

      {conversations.length === 0 && (
        <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
          <div className="text-lg font-semibold text-neutral-900">
            {t("conversations.noConversations")}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {conversations.map((conversation) => {
          const lastMessage = conversation.messages[0];
          const unreadCount = conversation.unreadCount;

          const listingImage =
            conversation.listing.imageUrl ||
            conversation.listing.imageUrls?.[0] ||
            "/images/placeholder.jpg";

          const lastMessageText = lastMessage
            ? lastMessage.body || lastMessage.attachmentName || "Attachment"
            : t("conversations.noMessages");

          return (
            <Link
              key={conversation.id}
              href={`/${language}/conversations/${conversation.id}`}
              className="
                group
                flex
                gap-4
                rounded-3xl
                border
                bg-white
                p-4
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:shadow-lg
                sm:p-5
              "
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 sm:h-28 sm:w-28">
                <Image
                  src={listingImage}
                  alt={conversation.listing.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-base font-bold text-neutral-900 sm:text-lg">
                      {conversation.listing.title}
                    </div>

                    <div className="mt-1 line-clamp-1 text-sm text-neutral-500">
                      {conversation.listing.governorate}
                      {conversation.listing.city
                        ? `, ${conversation.listing.city}`
                        : ""}
                    </div>
                  </div>

                  <div className="shrink-0 text-xs text-neutral-400">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                <div
                  className={`
                    mt-4
                    line-clamp-1
                    text-sm
                    ${
                    unreadCount > 0
                      ? "font-bold text-neutral-900"
                      : "text-neutral-600"
                    }
                  `}
                >
                  {lastMessage
                    ? `${lastMessage.sender.name || t("conversations.user")}: ${lastMessageText}`
                    : lastMessageText}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    {new Date(conversation.updatedAt).toLocaleTimeString()}
                  </span>

                  {unreadCount > 0 && (
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-rose-500 px-2 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between gap-4">
          {currentPage > 1 ? (
            <Link
              href={`/${language}/conversations?page=${currentPage - 1}`}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold transition hover:bg-neutral-100"
            >
              {t("common.previous") || "Previous"}
            </Link>
          ) : (
              <div />
            )}

          <div className="text-sm text-neutral-500">
            {currentPage} / {totalPages}
          </div>

          {currentPage < totalPages ? (
            <Link
              href={`/${language}/conversations?page=${currentPage + 1}`}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold transition hover:bg-neutral-100"
            >
              {t("common.next") || "Next"}
            </Link>
          ) : (
              <div />
            )}
        </div>
      )}
    </div>
  );
}