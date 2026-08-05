import { redirect } from "next/navigation";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import getListingForEdit from "@/app/actions/listings/getListingForEdit";
import EditListingForm from "@/app/components/listings/EditListingForm";

interface IParams {
  listingId?: string;
}

interface EditListingPageProps {
  params: Promise<IParams>;
}

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  if (currentUser.isBanned) {
    redirect("/");
  }

  const resolvedParams = await params;

  const listing = await getListingForEdit(resolvedParams);

  if (!listing) {
    return <div className="pt-60 px-8">Listing not found</div>;
  }

  return (
    <div className="pt-72 md:pt-60 max-w-screen-xl mx-auto px-6 pb-20">
      <h1 className="text-3xl font-bold mb-2">Edit Listing</h1>

      <div className="text-neutral-500 mb-8">
        Update your property details
      </div>

      <EditListingForm listing={listing} />
    </div>
  );
}