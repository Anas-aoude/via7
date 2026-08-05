import { redirect } from "next/navigation";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import ProfileForm from "@/app/components/account/ProfileForm";
import { getServerTranslation } from "@/app/libs/serverTranslation";

export default async function AccountProfilePage() {
  const currentUser = await getCurrentUser();
  const { t } = await getServerTranslation();

  if (!currentUser) {
    redirect("/");
  }

  if (currentUser.isBanned) {
    redirect("/");
  }

  return (
    <div className="pt-72 md:pt-60 max-w-screen-xl mx-auto px-6 pb-20">
      <h1 className="text-3xl font-bold mb-2">
        {t("account.profile")}
      </h1>

      <div className="text-neutral-500 mb-8">
        {t("account.managePersonalInfo")}
      </div>

      <ProfileForm currentUser={currentUser} />
    </div>
  );
}