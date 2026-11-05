"use client";

import React from "react";
import { useParams } from "next/navigation";
import { PatientPortalView } from "@/components/PatientPortalView";

export default function CheckInPortalPage() {
  const params = useParams();
  const token = params?.token as string;
  return <PatientPortalView token={token} />;
}

