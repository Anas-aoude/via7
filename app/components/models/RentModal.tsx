"use client";

import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FaKey, FaMoneyBillWave, FaMapMarkerAlt } from "react-icons/fa";

import Modal from "./Modal";
import useRentModal from "../../hooks/useRentModal";
import useTranslation from "../../hooks/useTranslation";
import CategoryInput from "../inputs/CategoryInput";
import Counter from "../inputs/Counter";
import ImageUpload from "../inputs/ImageUpload";
import AmenityInput from "../inputs/AmenityInput";
import { categories } from "../../libs/categories";
import { amenities } from "../../constants/amenities";
import useDictionary from "../../hooks/useDictionary";
enum STEPS {
  CATEGORY = 0,
  PURPOSE = 1,
  LOCATION = 2,
  INFO = 3,
  AMENITIES = 4,
  DESCRIPTION = 5,
  PRICE = 6,
  IMAGES = 7,
}

const governorates = [
  "Damascus",
  "Rif Dimashq",
  "Aleppo",
  "Homs",
  "Hama",
  "Latakia",
  "Tartus",
  "Idlib",
  "Daraa",
  "As-Suwayda",
  "Quneitra",
  "Deir ez-Zor",
  "Raqqa",
  "Al-Hasakah",
];

const RentModal = () => {
  const router = useRouter();
  const rentModal = useRentModal();
  const { t } = useTranslation();
  const dictionary = useDictionary();

  const rentPeriods = [
    { label: t("rentModal.perDay"), value: "DAILY" },
    { label: t("rentModal.perWeek"), value: "WEEKLY" },
    { label: t("rentModal.perMonth"), value: "MONTHLY" },
    { label: t("rentModal.perYear"), value: "YEARLY" },
  ];

  const [step, setStep] = useState(STEPS.CATEGORY);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const LocationPicker = useMemo(
    () =>
      dynamic(() => import("../inputs/LocationPicker"), {
        ssr: false,
      }),
    []
  );

  const [category, setCategory] = useState("");
  const [purpose, setPurpose] = useState("");
  const [rentPeriod, setRentPeriod] = useState("MONTHLY");
  const [price, setPrice] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [governorate, setGovernorate] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");

  const [guestCount, setGuestCount] = useState(0);
  const [bedroomCount, setBedroomCount] = useState(0);
  const [bedCount, setBedCount] = useState(0);
  const [bathroomCount, setBathroomCount] = useState(0);
  const [area, setArea] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const residentialCategories = [
    "Apartment",
    "House",
    "Villa",
    "Cabin",
    "Hotel",
    "Tourism",
  ];

  const categoriesWithBathrooms = [
    ...residentialCategories,
    "Office",
    "Shop",
    "Restaurant",
  ];

  const showResidentialDetails =
    residentialCategories.includes(category);

  const showBathroom =
    categoriesWithBathrooms.includes(category);

  const reset = () => {
    setStep(STEPS.CATEGORY);
    setCategory("");
    setPurpose("");
    setRentPeriod("MONTHLY");
    setPrice("");
    setSelectedAmenities([]);
    setLatitude(null);
    setLongitude(null);
    setGovernorate("");
    setCity("");
    setDistrict("");
    setAddress("");
    setGuestCount(0);
    setBedroomCount(0);
    setBedCount(0);
    setBathroomCount(0);
    setArea("");
    setTitle("");
    setDescription("");
    setAvailableFrom("");
    setImageUrls([]);
  };

  const toggleAmenity = (value: string) => {
    setSelectedAmenities((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      return [...current, value];
    });
  };

  const onBack = () => {
    setStep((value) => value - 1);
  };

  const onNext = () => {
    setStep((value) => value + 1);
  };

  const onLocateAddress = async () => {
    if (!governorate && !city && !district && !address) {
      toast.error(t("rentModal.enterLocationFirst"));
      return;
    }

    try {
      setIsLocating(true);

      const response = await axios.post("/api/geocode", {
        governorate,
        city,
        district,
        address,
      });

      setLatitude(response.data.latitude);
      setLongitude(response.data.longitude);

      toast.success(t("rentModal.locationFound"));
    } catch {
      toast.error(t("rentModal.locationNotFound"));
    } finally {
      setIsLocating(false);
    }
  };

  const onSubmit = () => {
    if (step !== STEPS.IMAGES) {
      return onNext();
    }

    setIsLoading(true);

    axios
      .post("/api/listings", {
        title,
        description,
        price: Number(price),
        governorate,
        city,
        district,
        address,
        latitude,
        longitude,
        category,
        type: category,
        purpose,
        rentPeriod: purpose === "rent" ? rentPeriod : null,
        availableFrom: availableFrom || null,
        amenities: selectedAmenities,
        guestCount: showResidentialDetails ? guestCount : 0,
        bedroomCount: showResidentialDetails ? bedroomCount : 0,
        bedCount: showResidentialDetails ? bedCount : 0,
        bathroomCount: showBathroom ? bathroomCount : 0,
        area: area ? Number(area) : null,
        imageUrl: imageUrls[0],
        imageUrls,
      })
      .then(() => {
        toast.success(t("rentModal.listingCreated"));
        router.refresh();
        reset();
        rentModal.onClose();
      })
      .catch((error: any) => {
        const errorKey = error?.response?.data?.error;

        toast.error(
          errorKey ? t(`errors.${errorKey}`) : t("rentModal.somethingWentWrong")
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  let bodyContent = <div>{t("rentModal.emptyStep")}</div>;

  if (step === STEPS.CATEGORY) {
    bodyContent = (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
        {categories.map((item) => (
          <CategoryInput
            key={item.label}
            label={item.label}
            icon={item.icon}
            selected={category === item.label}
            onClick={(value) => setCategory(value)}
          />
        ))}
      </div>
    );
  }

  if (step === STEPS.PURPOSE) {
    bodyContent = (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          {t("rentModal.whatDoYouWant")}
        </h2>

        <div
          onClick={() => setPurpose("rent")}
          className={`border-2 rounded-xl p-6 cursor-pointer transition flex items-center gap-4 ${
            purpose === "rent" ? "border-black" : "border-neutral-200"
            }`}
        >
          <FaKey size={28} />
          <div>
            <div className="font-semibold">{t("rentModal.forRent")}</div>
            <div className="text-neutral-500 text-sm">
              {t("rentModal.forRentSubtitle")}
            </div>
          </div>
        </div>

        <div
          onClick={() => setPurpose("sale")}
          className={`border-2 rounded-xl p-6 cursor-pointer transition flex items-center gap-4 ${
            purpose === "sale" ? "border-black" : "border-neutral-200"
            }`}
        >
          <FaMoneyBillWave size={28} />
          <div>
            <div className="font-semibold">{t("rentModal.forSale")}</div>
            <div className="text-neutral-500 text-sm">
              {t("rentModal.forSaleSubtitle")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === STEPS.LOCATION) {
    bodyContent = (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          {t("rentModal.propertyLocation")}
        </h2>

        <select
          value={governorate}
          onChange={(e) => setGovernorate(e.target.value)}
          className="border rounded-lg p-3"
        >
          <option value="">{t("rentModal.selectGovernorate")}</option>
          {governorates.map((item) => (
            <option key={item} value={item}>
              {dictionary.governorate(item)}
            </option>
          ))}
        </select>

        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t("rentModal.city")}
          className="border rounded-lg p-3"
        />

        <input
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder={t("rentModal.district")}
          className="border rounded-lg p-3"
        />

        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("rentModal.fullAddress")}
          className="border rounded-lg p-3"
        />

        <button
          type="button"
          disabled={isLocating}
          onClick={onLocateAddress}
          className="flex items-center justify-center gap-2 rounded-xl border border-black px-4 py-3 font-semibold hover:bg-neutral-100 disabled:opacity-50"
        >
          <FaMapMarkerAlt />
          {isLocating
            ? t("rentModal.locating")
            : t("rentModal.locateAddress")}
        </button>

        <div className="flex flex-col gap-2">
          <div className="font-medium">{t("rentModal.mapLocation")}</div>

          <p className="text-sm text-neutral-500">
            {t("rentModal.mapHelp")}
          </p>

          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(value) => {
              setLatitude(value.latitude);
              setLongitude(value.longitude);
            }}
          />

          {latitude !== null && longitude !== null && (
            <div className="text-xs text-neutral-500">
              {t("rentModal.coordinates")}: {latitude.toFixed(5)},{" "}
              {longitude.toFixed(5)}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === STEPS.INFO) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <h2 className="text-xl font-semibold">
          {t("rentModal.propertyDetails")}
        </h2>

        {showResidentialDetails && (
          <>
            <Counter
              title={t("rentModal.guests")}
              subtitle={t("rentModal.guestsSubtitle")}
              value={guestCount}
              onChange={setGuestCount}
            />

            <hr />

            <Counter
              title={t("rentModal.bedrooms")}
              subtitle={t("rentModal.bedroomsSubtitle")}
              value={bedroomCount}
              onChange={setBedroomCount}
            />

            <hr />

            <Counter
              title={t("rentModal.beds")}
              subtitle={t("rentModal.bedsSubtitle")}
              value={bedCount}
              onChange={setBedCount}
            />

            <hr />
          </>
        )}

        {showBathroom && (
          <>
            <Counter
              title={t("rentModal.bathrooms")}
              subtitle={t("rentModal.bathroomsSubtitle")}
              value={bathroomCount}
              onChange={setBathroomCount}
            />

            <hr />
          </>
        )}

        <div>
          <label className="font-medium">
            {t("rentModal.area")}
          </label>

          <input
            type="number"
            min="0"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="mt-2 border rounded-lg p-3 w-full"
          />
        </div>
      </div>
    );
  }

  if (step === STEPS.AMENITIES) {
    bodyContent = (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          {t("rentModal.amenitiesTitle")}
        </h2>

        <p className="text-sm text-neutral-500">
          {t("rentModal.amenitiesSubtitle")}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
          {amenities.map((item) => (
            <AmenityInput
              key={item.label}
              label={item.label}
              icon={item.icon}
              selected={selectedAmenities.includes(item.label)}
              onClick={toggleAmenity}
            />
          ))}
        </div>
      </div>
    );
  }

  if (step === STEPS.DESCRIPTION) {
    bodyContent = (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          {t("rentModal.describeProperty")}
        </h2>

        <div>
          <label className="font-medium">{t("rentModal.title")}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("rentModal.titlePlaceholder")}
            className="mt-2 border rounded-lg p-3 w-full"
          />
        </div>

        <div>
          <label className="font-medium">{t("rentModal.description")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("rentModal.descriptionPlaceholder")}
            className="mt-2 border rounded-lg p-3 w-full min-h-[160px]"
          />
        </div>
      </div>
    );
  }

  if (step === STEPS.PRICE) {
    bodyContent = (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          {t("rentModal.setPrice")}
        </h2>
        <div>
          <label className="font-medium">
            {t("rentModal.availableFrom")}
          </label>

          <input
            type="date"
            value={availableFrom}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setAvailableFrom(e.target.value)}
            className="mt-2 border rounded-lg p-3 w-full"
          />

          <p className="mt-2 text-sm text-neutral-500">
            {t("rentModal.availableFromHelp")}
          </p>
        </div>

        {purpose === "rent" && (
          <div>
            <label className="font-medium">
              {t("rentModal.rentalPeriod")}
            </label>

            <select
              value={rentPeriod}
              onChange={(e) => setRentPeriod(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            >
              {rentPeriods.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="font-medium">
            {purpose === "rent"
              ? t("rentModal.priceUsd")
              : t("rentModal.totalPriceUsd")}
          </label>

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="1000"
            className="mt-2 border rounded-lg p-3 w-full"
          />
        </div>
      </div>
    );
  }

  if (step === STEPS.IMAGES) {
    bodyContent = (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          {t("rentModal.addPhotos")}
        </h2>

        <ImageUpload value={imageUrls} onChange={setImageUrls} />
      </div>
    );
  }

  return (
    <Modal
      disabled={isLoading}
      isOpen={rentModal.isOpen}
      onClose={rentModal.onClose}
      onSubmit={onSubmit}
      title={t("rentModal.createListing")}
      actionLabel={step === STEPS.IMAGES ? t("common.create") : t("common.next")}
      secondaryAction={step === STEPS.CATEGORY ? undefined : onBack}
      secondaryActionLabel={
        step === STEPS.CATEGORY ? undefined : t("common.back")
      }
      body={bodyContent}
    />
  );
};

export default RentModal;