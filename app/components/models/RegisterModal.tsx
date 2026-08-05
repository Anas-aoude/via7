"use client";

import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { useState, useCallback } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { signIn } from "next-auth/react";

import Heading from "../Heading";
import useRegisterModal from "../../hooks/useRegisterModal";
import useLoginModal from "../../hooks/useLoginModal";
import useTranslation from "../../hooks/useTranslation";
import Modal from "./Modal";
import Input from "../inputs/Input";
import Button from "../Button";

const RegisterModal = () => {
  const registerModal = useRegisterModal();
  const loginModal = useLoginModal();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FieldValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onToggle = useCallback(() => {
    setIsRegistered(false);
    setRegisteredEmail("");
    reset();

    registerModal.onClose();
    loginModal.onOpen();
  }, [registerModal, loginModal, reset]);

  const handleClose = useCallback(() => {
    setIsRegistered(false);
    setRegisteredEmail("");
    reset();

    registerModal.onClose();
  }, [registerModal, reset]);

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    axios
      .post("/api/register", data)
      .then(() => {
        setRegisteredEmail(data.email);
        setIsRegistered(true);
        toast.success(t("auth.accountCreatedCheckEmail"));
      })
      .catch((error) => {
        const apiError = error?.response?.data?.error;

        if (apiError === "Email already exists") {
          toast.error(t("errors.emailAlreadyExists"));
        } else if (apiError === "Missing fields") {
          toast.error(t("errors.missingFields"));
        } else {
          toast.error(t("auth.somethingWentWrong"));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const bodyContent = isRegistered ? (
    <div className="flex flex-col gap-5 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
        ✓
      </div>

      <Heading
        center
        title={t("auth.verifyEmail")}
        subtitle={t("auth.accountCreatedCheckEmail")}
      />

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
        <div>{t("auth.emailSentTo")}</div>

        {registeredEmail && (
          <div className="mt-2 font-semibold text-neutral-900">
            {registeredEmail}
          </div>
        )}

        <div className="mt-3 text-neutral-500">{t("auth.checkSpamFolder")}</div>
      </div>
    </div>
  ) : (
      <div className="flex flex-col gap-4">
        <Heading
          title={t("auth.welcomeToMarket")}
          subtitle={t("auth.createAccountSubtitle")}
        />

        <Input
          id="name"
          label={t("auth.name")}
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />

        <Input
          id="email"
          label={t("auth.email")}
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />

        <Input
          id="password"
          label={t("auth.password")}
          type="password"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
      </div>
    );

  const footerContent = isRegistered ? (
    <div className="flex flex-col gap-4 mt-3">
      <hr />

      <Button label={t("auth.goToLogin")} onClick={onToggle} />
    </div>
  ) : (
      <div className="flex flex-col gap-4 mt-3">
        <hr />

        <Button
          outline
          label={t("auth.continueWithGoogle")}
          icon={FcGoogle}
          onClick={() => signIn("google")}
        />

        <div className="text-neutral-500 text-center mt-4 font-light">
          <div className="justify-center flex flex-row items-center gap-2">
            <div>{t("auth.alreadyHaveAccount")}</div>

            <div
              onClick={onToggle}
              className="text-neutral-800 cursor-pointer hover:underline"
            >
              {t("auth.logIn")}
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <Modal
      disabled={isLoading}
      isOpen={registerModal.isOpen}
      title={isRegistered ? t("auth.verifyEmail") : t("auth.register")}
      actionLabel={isRegistered ? t("auth.close") : t("common.continue")}
      onClose={handleClose}
      onSubmit={isRegistered ? handleClose : handleSubmit(onSubmit)}
      body={bodyContent}
      footer={footerContent}
    />
  );
};

export default RegisterModal;