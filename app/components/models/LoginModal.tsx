"use client";

import axios from "axios";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { AiFillGithub } from "react-icons/ai";
import { useState, useCallback } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import useRegisterModal from "../../hooks/useRegisterModal";
import useLoginModal from "../../hooks/useLoginModal";
import useForgotPasswordModal from "../../hooks/useForgotPasswordModal";
import useTranslation from "../../hooks/useTranslation";
import Modal from "./Modal";
import Heading from "../Heading";
import Input from "../inputs/Input";
import Button from "../Button";

const LoginModal = () => {
  const router = useRouter();
  const registerModal = useRegisterModal();
  const loginModal = useLoginModal();
  const forgotPasswordModal = useForgotPasswordModal();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm<FieldValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleClose = useCallback(() => {
    setShowResendVerification(false);
    setResendLoading(false);
    reset();
    loginModal.onClose();
  }, [loginModal, reset]);

  const onToggle = useCallback(() => {
    setShowResendVerification(false);
    setResendLoading(false);
    reset();

    loginModal.onClose();
    registerModal.onOpen();
  }, [loginModal, registerModal, reset]);

  const onForgotPassword = useCallback(() => {
    setShowResendVerification(false);
    setResendLoading(false);

    loginModal.onClose();
    forgotPasswordModal.onOpen();
  }, [loginModal, forgotPasswordModal]);

  const handleResendVerification = useCallback(async () => {
    const email = String(getValues("email") || "").toLowerCase().trim();

    if (!email) {
      toast.error(t("auth.emailRequired"));
      return;
    }

    try {
      setResendLoading(true);

      await axios.post("/api/auth/resend-verification", {
        email,
      });

      toast.success(t("auth.verificationEmailSent"));
    } catch (error: any) {
      const apiError = error?.response?.data?.error;

      if (apiError === "EMAIL_ALREADY_VERIFIED") {
        toast.error(t("auth.emailAlreadyVerified"));
      } else if (apiError === "USER_NOT_FOUND") {
        toast.error(t("errors.userNotFound"));
      } else {
        toast.error(t("auth.somethingWentWrong"));
      }
    } finally {
      setResendLoading(false);
    }
  }, [getValues, t]);

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);
    setShowResendVerification(false);

    signIn("credentials", {
      ...data,
      redirect: false,
    }).then((callback) => {
      setIsLoading(false);

      if (callback?.ok) {
        toast.success(t("auth.loggedIn"));
        handleClose();

        window.dispatchEvent(new Event("auth:changed"));

        router.refresh();
        return;
      }

      if (callback?.error) {
        if (callback.error === "EMAIL_NOT_VERIFIED") {
          setShowResendVerification(true);
          toast.error(t("auth.verifyEmail"));
          return;
        }

        if (callback.error === "USER_BANNED") {
          toast.error(t("auth.userBanned"));
          return;
        }

        if (callback.error === "TOO_MANY_LOGIN_ATTEMPTS") {
          toast.error(t("auth.tooManyLoginAttempts"));
          return;
        }

        toast.error(t("auth.invalidCredentials"));
      }
    });
  };

  const bodyContent = (
    <div className="flex flex-col gap-4">
      <Heading
        title={t("auth.welcomeBack")}
        subtitle={t("auth.loginSubtitle")}
      />

      <Input
        id="email"
        label={t("auth.email")}
        disabled={isLoading || resendLoading}
        register={register}
        errors={errors}
        required
      />

      <Input
        id="password"
        label={t("auth.password")}
        type="password"
        disabled={isLoading || resendLoading}
        register={register}
        errors={errors}
        required
      />

      <button
        type="button"
        onClick={onForgotPassword}
        disabled={isLoading || resendLoading}
        className="w-fit text-sm font-semibold text-primary transition hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {t("auth.forgotPassword")}
      </button>

      {showResendVerification && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          <div className="mb-3 font-semibold">{t("auth.verifyEmail")}</div>

          <div className="mb-4 leading-6">
            {t("auth.accountCreatedCheckEmail")}
          </div>

          <Button
            outline
            disabled={resendLoading}
            label={
              resendLoading
                ? t("common.loading")
                : t("auth.resendVerification")
            }
            onClick={handleResendVerification}
          />
        </div>
      )}
    </div>
  );

  const footerContent = (
    <div className="flex flex-col gap-4 mt-3">
      <hr />

      <Button
        outline
        label={t("auth.continueWithGoogle")}
        icon={FcGoogle}
        onClick={() => signIn("google")}
      />

      <Button
        outline
        label={t("auth.continueWithGithub")}
        icon={AiFillGithub}
        onClick={() => signIn("github")}
      />

      <div className="text-neutral-500 text-center mt-4 font-light">
        <div className="justify-center flex flex-row items-center gap-2">
          <div>{t("auth.firstTime")}</div>

          <div
            onClick={onToggle}
            className="text-foreground cursor-pointer hover:text-primary transition"
          >
            {t("auth.createAccount")}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      disabled={isLoading || resendLoading}
      isOpen={loginModal.isOpen}
      title={t("auth.login")}
      actionLabel={t("common.continue")}
      onClose={handleClose}
      onSubmit={handleSubmit(onSubmit)}
      body={bodyContent}
      footer={footerContent}
    />
  );
};

export default LoginModal;