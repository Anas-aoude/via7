import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import getConversationById from "@/app/actions/conversations/getConversationById";
import markConversationAsRead from "@/app/actions/conversations/markConversationAsRead";
import BlockUserButton from "@/app/components/conversations/BlockUserButton";
import DeleteConversationButton from "@/app/components/conversations/DeleteConversationButton";
import MessageInput from "@/app/components/conversations/MessageInput";
import MessageList from "@/app/components/conversations/MessageList";
import UserOnlineStatus from "@/app/components/conversations/UserOnlineStatus";
import { getServerTranslation } from "@/app/libs/serverTranslation";
import { dictionary } from "@/app/libs/dictionary";

interface IParams {
  conversationId?: string;
}

interface ConversationPageProps {
  params: Promise<IParams>;
}

const getDictionaryValue = (
  group: keyof typeof dictionary,
  value: string | null | undefined,
  t: (key: string) => string
) => {
  if (!value) return "";

  const key = (dictionary[group] as Record<string, string>)[value];

  return key ? t(key) : value;
};

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const currentUser = await getCurrentUser();
  const { t, language } = await getServerTranslation();

  if (!currentUser || currentUser.isBanned) {
    redirect("/");
  }

  const resolvedParams = await params;
  const conversation = await getConversationById(resolvedParams);

  if (!conversation) {
    return (
      <div className="px-6 pt-40 text-center text-neutral-500">
        {t("conversations.conversationNotFound")}
      </div>
    );
  }

  await markConversationAsRead(resolvedParams);

  const listingImage =
    conversation.listing.imageUrl ||
    conversation.listing.imageUrls?.[0] ||
    "/images/placeholder.jpg";

  const ownerName =
    conversation.listing.user?.name || t("conversations.owner");

  const governorateLabel = getDictionaryValue(
    "governorate",
    conversation.listing.governorate,
    t
  );

  const otherUserId = conversation.userIds.find((id) => id !== currentUser.id);

  const isOtherUserBlocked = otherUserId
    ? currentUser.blockedUserIds.includes(otherUserId)
    : false;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-72 sm:px-6 md:pt-60 lg:pt-56">
      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href={`/${language}/listings/${conversation.listing.id}`}
            className="group flex min-w-0 gap-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 sm:h-24 sm:w-24">
              <Image
                src={listingImage}
                alt={conversation.listing.title}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>

            <div className="min-w-0">
              <h1 className="line-clamp-1 text-lg font-bold text-neutral-900 sm:text-xl">
                {conversation.listing.title}
              </h1>

              <div className="mt-1 line-clamp-1 text-sm text-neutral-500">
                {governorateLabel}
                {conversation.listing.city
                  ? `, ${conversation.listing.city}`
                  : ""}
              </div>

              <div className="mt-2 text-sm text-neutral-600">
                {t("conversations.owner")}: {ownerName}
              </div>

              {otherUserId && (
                <div className="mt-1">
                  <UserOnlineStatus userId={otherUserId} />
                </div>
              )}
            </div>
          </Link>

          <div className="flex items-center justify-end gap-3">
            {otherUserId && (
              <BlockUserButton
                targetUserId={otherUserId}
                isBlocked={isOtherUserBlocked}
              />
            )}

            <DeleteConversationButton conversationId={conversation.id} />
          </div>
        </div>

        <div className="h-[50vh] min-h-[420px] overflow-y-auto bg-neutral-50">
          <MessageList
            messages={conversation.messages}
            currentUserId={currentUser.id}
            conversationId={conversation.id}
          />
        </div>

        <MessageInput conversationId={conversation.id} />
      </div>
    </div>
  );
}