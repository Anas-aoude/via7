"use client";

import axios from "axios";
import { User } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";

import Container from "../Container";
import Logo from "./Logo";
import Search from "./Search";
import UserMenu from "./UserMenu";
import Categories from "./Categories";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [openDropdown, setOpenDropdown] = useState<
    "currency" | "language" | null
  >(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get("/api/current-user");

      setCurrentUser(response.data || null);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    window.addEventListener("auth:changed", fetchCurrentUser);

    return () => {
      window.removeEventListener("auth:changed", fetchCurrentUser);
    };
  }, [fetchCurrentUser]);

  return (
    <div className="fixed w-full bg-white z-10 shadow-sm">
      <div className="py-4 border-b-[1px]">
        <Container>
          <div
            className="
              grid
              grid-cols-[auto_1fr]
              items-center
              gap-x-3
              gap-y-3

              md:flex
              md:flex-row
              md:items-center
              md:justify-between
              md:gap-0
            "
          >
            {/* Logo */}
            <div className="col-start-1 row-start-1 shrink-0">
              <Logo />
            </div>

            {/* Search */}
            <div
              className="
                col-span-2
                row-start-2
                w-full

                md:col-auto
                md:row-auto
                md:w-auto
              "
            >
              <Search />
            </div>

            {/* Right controls */}
            <div
              ref={dropdownRef}
              className="
                col-start-2
                row-start-1
                justify-self-end

                flex
                items-center
                gap-2
              "
            >
              <CurrencySwitcher
                isOpen={openDropdown === "currency"}
                onToggle={() =>
                  setOpenDropdown(
                    openDropdown === "currency"
                      ? null
                      : "currency"
                  )
                }
                onClose={() => setOpenDropdown(null)}
              />

              <LanguageSwitcher
                isOpen={openDropdown === "language"}
                onToggle={() =>
                  setOpenDropdown(
                    openDropdown === "language"
                      ? null
                      : "language"
                  )
                }
                onClose={() => setOpenDropdown(null)}
              />

              {isLoaded && currentUser && (
                <NotificationBell
                  currentUserId={currentUser.id}
                />
              )}

              <UserMenu currentUser={currentUser} />
            </div>
          </div>
        </Container>
      </div>

      <Categories />
    </div>
  );
};

export default Navbar;