export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function readFilesAsDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(files.map((f) => readFileAsDataUrl(f)));
}
