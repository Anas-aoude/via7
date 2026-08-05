"use client";

import axios from "axios";
import type getCurrentUser from "@/app/actions/users/getCurrentUser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import AvatarUpload from "@/app/components/inputs/AvatarUpload";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import useTranslation from "@/app/hooks/useTranslation";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

interface ProfileFormProps {
  currentUser: CurrentUser;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ currentUser }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(currentUser.name || "");
  const [phoneNumber, setPhoneNumber] = useState(
    currentUser.phoneNumber || ""
  );
  const [dateOfBirth, setDateOfBirth] = useState(
    currentUser.dateOfBirth
      ? new Date(currentUser.dateOfBirth).toISOString().split("T")[0]
      : ""
  );
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [bio, setBio] = useState(currentUser.bio || "");

  const handleSave = async () => {
    try {
      setIsLoading(true);

      await axios.patch("/api/account/profile", {
        name,
        phoneNumber,
        dateOfBirth,
        avatarUrl,
        bio,
      });

      toast.success(t("account.profileUpdated"));
      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || t("account.somethingWentWrong")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-2xl p-6 bg-white space-y-6">
      <div>
        <label className="font-medium">{t("account.name")}</label>
        <input
          disabled={isLoading}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 border rounded-lg p-3 w-full"
          placeholder={t("account.yourName")}
        />
      </div>

      <div>
        <label className="font-medium">{t("account.email")}</label>
        <input
          disabled
          value={currentUser.email || ""}
          className="mt-2 border rounded-lg p-3 w-full bg-neutral-100 text-neutral-500"
        />
        <div className="text-xs text-neutral-500 mt-1">
          {t("account.emailCannotBeChanged")}
        </div>
      </div>

      <div>
        <label className="font-medium">{t("account.phoneNumber")}</label>

        <div className="mt-2">
          <PhoneInput
            country={"sy"}
            value={phoneNumber}
            onChange={(phone) => setPhoneNumber(phone)}
            disabled={isLoading}
            inputStyle={{
              width: "100%",
              height: "48px",
            }}
          />
        </div>
      </div>

      <div>
        <label className="font-medium">{t("account.dateOfBirth")}</label>
        <input
          disabled={isLoading}
          type="date"
          value={dateOfBirth}
          onChange={(event) => setDateOfBirth(event.target.value)}
          className="mt-2 border rounded-lg p-3 w-full"
        />
      </div>

      <div>
        <label className="font-medium">{t("account.profileImage")}</label>

        <div className="mt-4">
          <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} />
        </div>
      </div>

      <div>
        <label className="font-medium">{t("account.bio")}</label>
        <textarea
          disabled={isLoading}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="mt-2 border rounded-lg p-3 w-full min-h-[120px]"
          placeholder={t("account.tellAboutYourself")}
        />
      </div>

      <button
        disabled={isLoading}
        onClick={handleSave}
        className="px-6 py-3 rounded-xl bg-black text-white font-semibold hover:opacity-80 disabled:opacity-50"
      >
        {isLoading ? t("account.saving") : t("account.saveProfile")}
      </button>
    </div>
  );
};

export default ProfileForm;