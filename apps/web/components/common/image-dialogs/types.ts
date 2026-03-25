/**
 * Catalog of image sources for the insert dialog.
 * `ImageInsertDialog` implements `local` and `unsplash` only; other `id` values render as
 * “Not connected” until you add a branch in the dialog component.
 */
export type ImageInsertSourceId = string;

export type ImageInsertSourceOption = {
  id: ImageInsertSourceId;
  label: string;
  description?: string;
};

export type ImagePickResult =
  | { kind: "files"; files: File[] }
  | { kind: "url"; imageSrc: string };

export const DEFAULT_IMAGE_INSERT_SOURCES: ImageInsertSourceOption[] = [
  { id: "local", label: "From device", description: "Upload a photo from this device" },
  { id: "unsplash", label: "Unsplash", description: "Search free high-resolution photos" },
];
