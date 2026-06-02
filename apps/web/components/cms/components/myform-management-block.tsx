"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { MyFormHub } from "@/components/forms/myform-hub";

interface MyformManagementBlockProps {
  block: PageBlock;
}

/**
 * CMS block: full myFORM manager on this page path using `?myform=` / `formId` query params.
 */
export function MyformManagementBlock(_props: MyformManagementBlockProps) {
  return <MyFormHub showHeader={false} />;
}
