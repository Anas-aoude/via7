"use client";

import axios from "axios";
import { useState, useCallback } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

import Heading from "../Heading";
import Modal from "./Modal";
import Input from "../inputs/Input";
import useTranslation from "../../hooks/useTranslation";
import useForgotPasswordModal from "../../hooks/useForgotPasswordModal";
import useLoginModal from "../../hooks/useLoginModal";

const ForgotPasswordModal = () => {
  const { t } = useTranslation();
  const forgotPasswordModal = useForgotPasswordModal();
  const loginModal = useLoginModal();

  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FieldValues>({
    defaultValues: {
      email: "",
    },
  });

  const handleClose = useCallback(() => {
    setIsSent(false);
    reset();
    forgotPasswordModal.onClose();
  }, [forgotPasswordModal, reset]);

  const goToLogin = useCallback(() => {
    setIsSent(false);
    reset();
    forgotPasswordModal.onClose();
    loginModal.onOpen();
  }, [forgotPasswordModal, loginModal, reset]);

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    axios
      .post("/api/auth/forgot-password", data)
      .then(() => {
        setIsSent(true);
        toast.success(t("auth.resetEmailSent"));
      })
      .catch((error) => {
        const apiError = error?.response?.data?.error;

        if (apiError === "EMAIL_REQUIRED") {
          toast.error(t("auth.emailRequired"));
        } else if (apiError === "OAUTH_ACCOUNT") {
          toast.error(t("auth.oauthAccount"));
        } else {
          toast.error(t("auth.somethingWentWrong"));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const bodyContent = isSent ? (
    <div className="flex flex-col gap-5 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background text-3xl text-primary">
        ✓
      </div>

      <Heading
        center
        title={t("auth.resetPassword")}
        subtitle={t("auth.resetEmailSent")}
      />
    </div>
  ) : (
      <div className="flex flex-col gap-4">
        <Heading
          title={t("auth.forgotPassword")}
          subtitle={t("auth.resetPasswordSubtitle")}
        />

        <Input
          id="email"
          label={t("auth.email")}
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
      </div>
    );

  return (
    <Modal
      disabled={isLoading}
      isOpen={forgotPasswordModal.isOpen}
      title={isSent ? t("auth.resetPassword") : t("auth.forgotPassword")}
      actionLabel={isSent ? t("auth.goToLogin") : t("auth.sendResetLink")}
      onClose={handleClose}
      onSubmit={isSent ? goToLogin : handleSubmit(onSubmit)}
      body={bodyContent}
    />
  );
};

export default ForgotPasswordModal;