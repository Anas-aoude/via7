"use client";

import axios from "axios";
import Link from "next/link";
import { Listing } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import ImageUpload from "@/app/components/inputs/ImageUpload";
import CategoryInput from "@/app/components/inputs/CategoryInput";
import { categories } from "@/app/constants/categories";
import useTranslation from "@/app/hooks/useTranslation";
import AvailabilityManager from "@/app/components/listings/AvailabilityManager";
import LocationPicker from "@/app/components/inputs/LocationPicker";
import AmenityInput from "@/app/components/inputs/AmenityInput";
import { amenities } from "@/app/constants/amenities";


interface EditListingFormProps {
  listing: Listing;
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

const EditListingForm: React.FC<EditListingFormProps> = ({ listing }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { t, language } = useTranslation();

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [price, setPrice] = useState(String(listing.price));

  const [governorate, setGovernorate] = useState(listing.governorate);
  const [city, setCity] = useState(listing.city || "");
  const [district, setDistrict] = useState(listing.district || "");
  const [street, setStreet] = useState(listing.street || "");
  const [address, setAddress] = useState(listing.address || "");
  const [latitude, setLatitude] = useState<number | null>(
    listing.latitude ?? null
  );

  const [longitude, setLongitude] = useState<number | null>(
    listing.longitude ?? null
  );

  const [category, setCategory] = useState(listing.category);
  const [purpose, setPurpose] = useState(listing.purpose);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    listing.amenities || []
  );

  const [guestCount, setGuestCount] = useState(String(listing.guestCount || 0));
  const [bedroomCount, setBedroomCount] = useState(
    String(listing.bedroomCount || 0)
  );
  const [bedCount, setBedCount] = useState(String(listing.bedCount || 0));
  const [bathroomCount, setBathroomCount] = useState(
    String(listing.bathroomCount || 0)
  );
  const [area, setArea] = useState(String(listing.area || ""));

  const [imageUrls, setImageUrls] = useState<string[]>(
    listing.imageUrls?.length
      ? listing.imageUrls
      : listing.imageUrl
        ? [listing.imageUrl]
        : []
  );

  const [isActive, setIsActive] = useState(listing.isActive);

  const toggleAmenity = (value: string) => {
    setSelectedAmenities((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      return [...current, value];
    });
  };

  const validate = () => {
    if (!title.trim()) return t("editListing.validationTitle");
    if (!description.trim()) return t("editListing.validationDescription");
    if (!price || Number(price) <= 0) return t("editListing.validationPrice");
    if (!governorate) return t("editListing.validationGovernorate");
    if (!category) return t("editListing.validationCategory");
    if (!purpose) return t("editListing.validationPurpose");
    if (imageUrls.length === 0) return t("editListing.validationImages");

    return null;
  };

  const onSave = async () => {
    const validationError = validate();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsLoading(true);

      await axios.patch(`/api/listings/${listing.id}`, {
        title,
        description,
        price: Number(price),

        governorate,
        city,
        district,
        street,
        address,
        latitude,
        longitude,

        category,
        type: category,
        purpose,
        amenities: selectedAmenities,

        guestCount: guestCount ? Number(guestCount) : null,
        bedroomCount: bedroomCount ? Number(bedroomCount) : null,
        bedCount: bedCount ? Number(bedCount) : null,
        bathroomCount: bathroomCount ? Number(bathroomCount) : null,
        area: area ? Number(area) : null,

        imageUrls,
        isActive,
      });

      toast.success(t("editListing.updated"));
      router.push(`/${language}/account/listings`);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || t("editListing.somethingWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">{t("editListing.basicInformation")}</h2>

        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="font-medium">{t("editListing.listingTitle")}</label>
            <input disabled={isLoading} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 border rounded-lg p-3 w-full" />
          </div>

          <div>
            <label className="font-medium">{t("editListing.description")}</label>
            <textarea disabled={isLoading} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 border rounded-lg p-3 w-full min-h-[180px]" />
          </div>

          <div>
            <label className="font-medium">{t("editListing.price")}</label>
            <input disabled={isLoading} type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2 border rounded-lg p-3 w-full" />
          </div>
        </div>
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">{t("editListing.category")}</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((item) => (
            <CategoryInput key={item.label} label={item.label} icon={item.icon} selected={category === item.label} onClick={(value) => setCategory(value)} />
          ))}
        </div>
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">{t("editListing.purpose")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button type="button" disabled={isLoading} onClick={() => setPurpose("rent")} className={`border-2 rounded-xl p-6 text-left transition ${purpose === "rent" ? "border-black" : "border-neutral-200"}`}>
            <div className="font-bold">{t("editListing.forRent")}</div>
            <div className="text-neutral-500 text-sm mt-1">{t("editListing.forRentDescription")}</div>
          </button>

          <button type="button" disabled={isLoading} onClick={() => setPurpose("sale")} className={`border-2 rounded-xl p-6 text-left transition ${purpose === "sale" ? "border-black" : "border-neutral-200"}`}>
            <div className="font-bold">{t("editListing.forSale")}</div>
            <div className="text-neutral-500 text-sm mt-1">{t("editListing.forSaleDescription")}</div>
          </button>
        </div>
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">{t("editListing.amenities")}</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {amenities.map((item) => (
            <AmenityInput key={item.label} label={item.label} icon={item.icon} selected={selectedAmenities.includes(item.label)} onClick={toggleAmenity} />
          ))}
        </div>
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">{t("editListing.location")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="font-medium">{t("editListing.governorate")}</label>
            <select disabled={isLoading} value={governorate} onChange={(e) => setGovernorate(e.target.value)} className="mt-2 border rounded-lg p-3 w-full">
              <option value="">{t("editListing.selectGovernorate")}</option>
              {governorates.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium">{t("editListing.city")}</label>
            <input disabled={isLoading} value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 border rounded-lg p-3 w-full" />
          </div>

          <div>
            <label className="font-medium">{t("editListing.district")}</label>
            <input disabled={isLoading} value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-2 border rounded-lg p-3 w-full" />
          </div>

          <div>
            <label className="font-medium">{t("editListing.street")}</label>
            <input disabled={isLoading} value={street} onChange={(e) => setStreet(e.target.value)} className="mt-2 border rounded-lg p-3 w-full" />
          </div>

          <div className="md:col-span-2">
            <label className="font-medium">{t("editListing.address")}</label>
            <input disabled={isLoading} value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2 border rounded-lg p-3 w-full" />
          </div>

          <div className="md:col-span-2">
            <div className="mb-3">
              <h3 className="font-semibold">{t("editListing.map")}</h3>
              <p className="text-sm text-neutral-500">{t("editListing.mapDescription")}</p>
            </div>

            <LocationPicker latitude={latitude} longitude={longitude} onChange={(value) => {
              setLatitude(value.latitude);
              setLongitude(value.longitude);
            }} />

            {latitude !== null && longitude !== null && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-neutral-50 p-3">
                  <span className="font-medium">Latitude:</span> {latitude.toFixed(6)}
                </div>

                <div className="rounded-lg border bg-neutral-50 p-3">
                  <span className="font-medium">Longitude:</span> {longitude.toFixed(6)}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">
          {t("editListing.propertyDetails")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="font-medium">
              {t("editListing.guests")}
            </label>
            <input
              disabled={isLoading}
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">
              {t("editListing.bedrooms")}
            </label>
            <input
              disabled={isLoading}
              type="number"
              value={bedroomCount}
              onChange={(e) => setBedroomCount(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">
              {t("editListing.beds")}
            </label>
            <input
              disabled={isLoading}
              type="number"
              value={bedCount}
              onChange={(e) => setBedCount(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">
              {t("editListing.bathrooms")}
            </label>
            <input
              disabled={isLoading}
              type="number"
              value={bathroomCount}
              onChange={(e) => setBathroomCount(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">
              {t("editListing.area")}
            </label>
            <input
              disabled={isLoading}
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>
        </div>
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">{t("editListing.images")}</h2>
        <ImageUpload value={imageUrls} onChange={setImageUrls} />
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">{t("editListing.listingStatus")}</h2>

        <label className="flex items-center gap-3 font-medium">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          {t("editListing.active")}
        </label>
      </section>

      {purpose === "rent" && (
        <section className="border rounded-2xl p-6 bg-white">
          <AvailabilityManager listingId={listing.id} />
        </section>
      )}

      <div className="flex items-center justify-between">
        <Link href="/account/listings" className="px-5 py-3 rounded-xl border font-semibold hover:bg-neutral-50">
          {t("editListing.cancel")}
        </Link>

        <button disabled={isLoading} onClick={onSave} className="px-6 py-3 rounded-xl bg-black text-white font-semibold hover:opacity-80 disabled:opacity-50">
          {isLoading ? t("editListing.saving") : t("editListing.save")}
        </button>
      </div>
    </div>
  );
};

export default EditListingForm;