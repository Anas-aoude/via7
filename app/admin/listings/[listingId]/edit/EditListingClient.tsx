"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import ImageUpload from "@/app/components/inputs/ImageUpload";
import CategoryInput from "@/app/components/inputs/CategoryInput";
import { categories } from "@/app/constants/categories";
import LocationPicker from "@/app/components/inputs/LocationPicker";
import AvailabilityManager from "@/app/components/listings/AvailabilityManager";
import AmenityInput from "@/app/components/inputs/AmenityInput";
import { amenities } from "@/app/constants/amenities";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;

  governorate: string;
  city: string | null;
  district: string | null;
  street: string | null;
  address: string | null;

  latitude: number | null;
  longitude: number | null;

  category: string;
  type: string;
  purpose: string;
  amenities: string[];

  guestCount: number | null;
  bedroomCount: number | null;
  bedCount: number | null;
  bathroomCount: number | null;
  area: number | null;

  imageUrl: string | null;
  imageUrls: string[];

  isActive: boolean;
  featured: boolean;

  createdAt: string;
  updatedAt: string;

  user: {
    id: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    role: string;
  };
};

interface EditListingClientProps {
  listing: Listing;
}

type OwnerSearchResult = {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  isBanned: boolean;

  _count: {
    listings: number;
  };
};

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

const EditListingClient: React.FC<EditListingClientProps> = ({ listing }) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const [currentOwner, setCurrentOwner] = useState(listing.user);

  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<OwnerSearchResult[]>([]);
  const [selectedOwner, setSelectedOwner] =
    useState<OwnerSearchResult | null>(null);

  const [isSearchingOwner, setIsSearchingOwner] = useState(false);
  const [isChangingOwner, setIsChangingOwner] = useState(false);

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
  const [featured, setFeatured] = useState(listing.featured);
  const toggleAmenity = (value: string) => {
    setSelectedAmenities((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      return [...current, value];
    });
  };
  const validate = () => {
    if (!title.trim()) return "Title is required";
    if (!description.trim()) return "Description is required";
    if (!price || Number(price) <= 0) return "Valid price is required";
    if (!governorate) return "Governorate is required";
    if (!category) return "Category is required";
    if (!purpose) return "Purpose is required";
    if (imageUrls.length === 0) return "At least one image is required";

    return null;
  };

  const searchOwners = async () => {
    const search = ownerSearch.trim();

    if (search.length < 2) {
      toast.error("Enter at least 2 characters");
      return;
    }

    setIsSearchingOwner(true);
    setSelectedOwner(null);

    try {
      const response = await axios.get("/api/admin/users", {
        params: {
          search,
          limit: 10,
          page: 1,
        },
      });

      setOwnerResults(response.data.users || []);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error ||
          "Could not search users"
        );
      } else {
        toast.error("Could not search users");
      }

      setOwnerResults([]);
    } finally {
      setIsSearchingOwner(false);
    }
  };

  const changeOwner = async () => {
    if (!selectedOwner) {
      return;
    }

    if (selectedOwner.id === currentOwner.id) {
      toast.error("This user is already the owner");
      return;
    }

    if (selectedOwner.isBanned) {
      toast.error("This user is banned");
      return;
    }

    const confirmed = window.confirm(
      `Change listing owner to ${
      selectedOwner.name ||
      selectedOwner.email ||
      "this user"
      }?`
    );

    if (!confirmed) {
      return;
    }

    setIsChangingOwner(true);

    try {
      const response = await axios.patch(
        `/api/admin/listings/${listing.id}/owner`,
        {
          newOwnerId: selectedOwner.id,
        }
      );

      setCurrentOwner(response.data.user);

      setOwnerSearch("");
      setOwnerResults([]);
      setSelectedOwner(null);

      toast.success("Listing owner changed");

      router.refresh();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error ||
          "Could not change listing owner"
        );
      } else {
        toast.error("Could not change listing owner");
      }
    } finally {
      setIsChangingOwner(false);
    }
  };

  const onSave = async () => {
    const validationError = validate();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    axios
      .patch(`/api/admin/listings/${listing.id}`, {
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

        imageUrl: imageUrls[0] || null,
        imageUrls,

        isActive,
        featured,
      })
      .then(() => {
        toast.success("Listing updated");
        router.push("/admin/listings");
        router.refresh();
      })
      .catch((error) => {
        toast.error(error?.response?.data?.error || "Something went wrong");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="font-medium">Title</label>
            <input
              disabled={isLoading}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">Description</label>
            <textarea
              disabled={isLoading}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full min-h-[180px]"
            />
          </div>

          <div>
            <label className="font-medium">Price USD</label>
            <input
              disabled={isLoading}
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>
        </div>
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">Category</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">Purpose</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            disabled={isLoading}
            onClick={() => setPurpose("rent")}
            className={`border-2 rounded-xl p-6 text-left transition ${
              purpose === "rent" ? "border-black" : "border-neutral-200"
              }`}
          >
            <div className="font-bold">For Rent</div>
            <div className="text-neutral-500 text-sm mt-1">
              Users can rent this property.
            </div>
          </button>

          <button
            disabled={isLoading}
            onClick={() => setPurpose("sale")}
            className={`border-2 rounded-xl p-6 text-left transition ${
              purpose === "sale" ? "border-black" : "border-neutral-200"
              }`}
          >
            <div className="font-bold">For Sale</div>
            <div className="text-neutral-500 text-sm mt-1">
              Users can buy this property.
            </div>
          </button>
        </div>
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">Amenities</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">Location</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="font-medium">Governorate</label>
            <select
              disabled={isLoading}
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            >
              <option value="">Select Governorate</option>
              {governorates.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium">City</label>
            <input
              disabled={isLoading}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">District</label>
            <input
              disabled={isLoading}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">Street</label>
            <input
              disabled={isLoading}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-medium">Full Address</label>
            <input
              disabled={isLoading}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>
          <div className="md:col-span-2">
            <div className="mb-3">
              <h3 className="font-semibold">Select location on map</h3>
              <p className="text-sm text-neutral-500">
                Choose the exact property location on the map.
    </p>
            </div>

            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(value) => {
                setLatitude(value.latitude);
                setLongitude(value.longitude);
              }}
            />

            {latitude !== null && longitude !== null && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-neutral-50 p-3">
                  <span className="font-medium">Latitude:</span>{" "}
                  {latitude.toFixed(6)}
                </div>

                <div className="rounded-lg border bg-neutral-50 p-3">
                  <span className="font-medium">Longitude:</span>{" "}
                  {longitude.toFixed(6)}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">Property Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="font-medium">Guests</label>
            <input
              disabled={isLoading}
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">Bedrooms</label>
            <input
              disabled={isLoading}
              type="number"
              value={bedroomCount}
              onChange={(e) => setBedroomCount(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">Beds</label>
            <input
              disabled={isLoading}
              type="number"
              value={bedCount}
              onChange={(e) => setBedCount(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">Bathrooms</label>
            <input
              disabled={isLoading}
              type="number"
              value={bathroomCount}
              onChange={(e) => setBathroomCount(e.target.value)}
              className="mt-2 border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="font-medium">Area m²</label>
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
        <h2 className="text-2xl font-bold mb-6">Images</h2>

        <ImageUpload value={imageUrls} onChange={setImageUrls} />
      </section>
      {purpose === "rent" && (
        <section className="border rounded-2xl p-6 bg-white">
          <AvailabilityManager listingId={listing.id} />
        </section>
      )}

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-2">
          Listing Owner
  </h2>

        <p className="text-sm text-neutral-500 mb-6">
          Transfer this listing to another user.
  </p>

        {/* Current owner */}
        <div className="rounded-xl border bg-neutral-50 p-4 mb-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
            Current owner
    </div>

          <div className="font-semibold">
            {currentOwner.name || "No name"}
          </div>

          {currentOwner.email && (
            <div className="text-sm text-neutral-600">
              {currentOwner.email}
            </div>
          )}

          {currentOwner.phoneNumber && (
            <div className="text-sm text-neutral-600">
              {currentOwner.phoneNumber}
            </div>
          )}

          <div className="text-xs text-neutral-500 mt-2">
            {currentOwner.role}
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={ownerSearch}
            disabled={isChangingOwner}
            onChange={(e) => setOwnerSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchOwners();
              }
            }}
            placeholder="Search by name, email or phone"
            className="border rounded-xl px-4 py-3 flex-1"
          />

          <button
            type="button"
            disabled={
              isSearchingOwner ||
              isChangingOwner
            }
            onClick={searchOwners}
            className="
        px-5
        py-3
        rounded-xl
        border
        font-semibold
        hover:bg-neutral-50
        disabled:opacity-50
      "
          >
            {isSearchingOwner
              ? "Searching..."
              : "Search"}
          </button>
        </div>

        {/* Results */}
        {ownerResults.length > 0 && (
          <div className="mt-4 border rounded-xl divide-y overflow-hidden">
            {ownerResults.map((user) => {
              const isSelected =
                selectedOwner?.id === user.id;

              const isCurrentOwner =
                currentOwner.id === user.id;

              return (
                <button
                  key={user.id}
                  type="button"
                  disabled={
                    isChangingOwner ||
                    user.isBanned
                  }
                  onClick={() =>
                    setSelectedOwner(user)
                  }
                  className={`
              w-full
              p-4
              text-left
              transition
              disabled:opacity-50
              ${
                    isSelected
                      ? "bg-neutral-100"
                      : "bg-white hover:bg-neutral-50"
                    }
            `}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {user.name || "No name"}
                      </div>

                      {user.email && (
                        <div className="text-sm text-neutral-600 truncate">
                          {user.email}
                        </div>
                      )}

                      {user.phoneNumber && (
                        <div className="text-sm text-neutral-500">
                          {user.phoneNumber}
                        </div>
                      )}

                      {user.isBanned && (
                        <div className="text-xs text-red-500 mt-1">
                          Banned
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-xs font-semibold">
                        {user.role}
                      </div>

                      <div className="text-xs text-neutral-500">
                        {user._count.listings} listings
                </div>

                      {isCurrentOwner && (
                        <div className="text-xs font-medium mt-1">
                          Current owner
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected owner */}
        {selectedOwner && (
          <div className="mt-5 rounded-xl border p-4">
            <div className="text-sm text-neutral-500 mb-1">
              New owner
      </div>

            <div className="font-semibold">
              {selectedOwner.name ||
                selectedOwner.email ||
                "User"}
            </div>

            {selectedOwner.email && (
              <div className="text-sm text-neutral-600">
                {selectedOwner.email}
              </div>
            )}

            <div className="text-xs text-neutral-500 mt-1">
              {selectedOwner.role}
            </div>

            <button
              type="button"
              disabled={
                isChangingOwner ||
                selectedOwner.isBanned ||
                selectedOwner.id === currentOwner.id
              }
              onClick={changeOwner}
              className="
          mt-4
          w-full
          sm:w-auto
          px-5
          py-3
          rounded-xl
          bg-black
          text-white
          font-semibold
          hover:opacity-80
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
            >
              {isChangingOwner
                ? "Changing owner..."
                : "Change owner"}
            </button>
          </div>
        )}
      </section>

      <section className="border rounded-2xl p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6">Admin Controls</h2>

        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3 font-medium">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>

          <label className="flex items-center gap-3 font-medium">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured
          </label>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <Link
          href="/admin/listings"
          className="px-5 py-3 rounded-xl border font-semibold hover:bg-neutral-50"
        >
          Cancel
        </Link>

        <button
          disabled={isLoading}
          onClick={onSave}
          className="px-6 py-3 rounded-xl bg-black text-white font-semibold hover:opacity-80 disabled:opacity-50"
        >
          Save changes
        </button>
      </div>
    </div>
  );
};

export default EditListingClient;