"use client";

import { AiOutlineMenu } from "react-icons/ai";
import { User } from "@prisma/client";
import { signOut } from "next-auth/react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";

import MenuItem from "./MenuItem";
import useRegisterModal from "../../hooks/useRegisterModal";
import useLoginModal from "../../hooks/useLoginModal";
import useRentModal from "../../hooks/useRentModal";
import useTranslation from "../../hooks/useTranslation";

interface UserMenuProps {
  currentUser?: User | null;
}

const UserMenu: React.FC<UserMenuProps> = ({ currentUser }) => {
  const router = useRouter();
  const { t, language } = useTranslation();

  const registerModal = useRegisterModal();
  const loginModal = useLoginModal();
  const rentModal = useRentModal();

  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = useCallback(() => {
    setIsOpen((value) => !value);
  }, []);

  const onRent = useCallback(() => {
    if (!currentUser) {
      loginModal.onOpen();
      return;
    }

    rentModal.onOpen();
  }, [currentUser, loginModal, rentModal]);

  const handleLogout = useCallback(() => {
    setIsOpen(false);

    signOut({
      callbackUrl: `/${language}`,
    });
  }, [language]);

  const openProfile = useCallback(() => {
    setIsOpen(false);

    if (!currentUser) {
      loginModal.onOpen();
      return;
    }

    router.push(`/${language}/account/profile`);
  }, [currentUser, loginModal, router, language]);

  return (
    <div className="relative">
      <div className="flex flex-row items-center gap-3">
        <div
          onClick={onRent}
          className="
            hidden
            md:block
            text-sm
            font-semibold
            py-3
            px-4
            rounded-full
            hover:bg-neutral-100
            transition
            cursor-pointer
          "
        >
          {t("navbar.createListing")}
        </div>



        <button
          onClick={toggleOpen}
          className="
            p-3
            border-[1px]
            border-neutral-200
            rounded-full
            cursor-pointer
            hover:shadow-md
            transition
            bg-white
          "
        >
          <AiOutlineMenu size={20} />
        </button>

        <button
          onClick={openProfile}
          className="
            hidden
            md:flex
            w-12
            h-12
            rounded-full
            items-center
            justify-center
            overflow-hidden
            bg-neutral-100
            border
            hover:shadow-md
            transition
          "
        >
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name || "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
              <FaUserCircle size={30} className="text-neutral-500" />
            )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-14 z-50 w-[280px] overflow-hidden rounded-xl bg-white text-sm shadow-md">
          <div className="flex cursor-pointer flex-col">
            {currentUser ? (
              <>
                {currentUser.role === "ADMIN" && (
                  <>
                    <MenuItem
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/admin");
                      }}
                      label={t("navbar.adminDashboard")}
                    />
                    <hr />
                  </>
                )}

                {currentUser.role === "MANAGER" && (
                  <>
                    <MenuItem
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/${language}/manager`);
                      }}
                      label={t("navbar.managerDashboard")}
                    />
                    <hr />
                  </>
                )}

                <MenuItem
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/${language}/account`);
                  }}
                  label={t("navbar.accountDashboard")}
                />

                <MenuItem
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/${language}/account/profile`);
                  }}
                  label={t("navbar.profile")}
                />

                <MenuItem
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/${language}/favorites`);
                  }}
                  label={t("navbar.favorites")}
                />

                <MenuItem
                  onClick={onRent}
                  label={t("navbar.createListing")}
                />

                <hr />

                <MenuItem
                  onClick={handleLogout}
                  label={t("navbar.logout")}
                />
              </>
            ) : (
                <>
                  <MenuItem
                    onClick={() => {
                      setIsOpen(false);
                      loginModal.onOpen();
                    }}
                    label={t("navbar.login")}
                  />

                  <MenuItem
                    onClick={() => {
                      setIsOpen(false);
                      registerModal.onOpen();
                    }}
                    label={t("navbar.signup")}
                  />
                </>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;