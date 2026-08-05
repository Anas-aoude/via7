import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/users/getCurrentUser";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    return NextResponse.json(currentUser);
  } catch (error) {
    return NextResponse.json(null);
  }
}