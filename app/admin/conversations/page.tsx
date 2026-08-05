import Link from "next/link";
import { redirect } from "next/navigation";

import getAdminConversations from "@/app/actions/admin/getAdminConversations";
import getCurrentUser from "@/app/actions/users/getCurrentUser";

export default async function AdminConversationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const result = await getAdminConversations();

  const conversations = result.conversations;

  return (
    <div className="pt-60 max-w-screen-xl mx-auto px-6 pb-20">
      <h1 className="text-3xl font-bold mb-8">Admin Conversations</h1>

      <div className="border rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 border-b">
            <tr>
              <th className="text-left p-4">Listing</th>
              <th className="text-left p-4">Owner</th>
              <th className="text-left p-4">Last Message</th>
              <th className="text-left p-4">Updated</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {conversations.map((conversation) => {
              const lastMessage = conversation.messages[0];

              return (
                <tr key={conversation.id} className="border-b">
                  <td className="p-4 font-semibold">
                    {conversation.listing.title}
                  </td>

                  <td className="p-4">
                    {conversation.listing.user?.name || "Owner"}
                  </td>

                  <td className="p-4 max-w-[300px] truncate">
                    {lastMessage
                      ? `${lastMessage.sender.name || "User"}: ${
                      lastMessage.body
                      }`
                      : "No messages yet"}
                  </td>

                  <td className="p-4 text-neutral-500">
                    {new Date(conversation.updatedAt).toLocaleString()}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/conversations/${conversation.id}`}
                      className="text-rose-500 font-semibold hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}

            {conversations.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">
                  No conversations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}