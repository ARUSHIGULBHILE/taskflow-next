"use client";

import { useEffect } from "react";
import { initializeData } from "../lib/taskflow";

export default function SeedOnce() {
  useEffect(() => {
    initializeData();
  }, []);

  return null;
}
