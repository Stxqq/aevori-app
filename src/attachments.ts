export type ChatImage = { id: string; name: string; type: string; size: number };
export type ChatFile = { name: string; size: number; text?: string };
export type PreparedAttachments = { images: ChatImage[]; files: ChatFile[] };
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const TEXT_EXTENSIONS =
  /\.(txt|md|csv|json|log|js|jsx|ts|tsx|html|css|py|yaml|yml|xml|svg)$/i;
export const ATTACHMENT_ACCEPT =
  'image/png,image/jpeg,image/webp,.txt,.md,.csv,.json,.log,.js,.jsx,.ts,.tsx,.html,.css,.py,.yaml,.yml,.xml,.svg';
export function fileSize(size: number) {
  return size < 1024
    ? `${size} B`
    : size < 1024 ** 2
      ? `${Math.ceil(size / 1024)} KB`
      : `${(size / 1024 ** 2).toFixed(1)} MB`;
}
export function attachmentError(file: File) {
  if (IMAGE_TYPES.includes(file.type))
    return file.size > 12 * 1024 ** 2 ? 'Images must be no larger than 12 MB.' : '';
  if (!TEXT_EXTENSIONS.test(file.name)) return 'Choose a PNG, JPG, WebP, text, or code file.';
  return file.size > 100 * 1024 ? 'Text and code files must be no larger than 100 KB.' : '';
}
let database: Promise<IDBDatabase> | undefined;
let namespace = 'owner';
export function setAttachmentWorkspace(value: string) {
  if (namespace !== value) {
    namespace = value;
    database = undefined;
  }
}
function db() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(`aevori-attachments-${namespace}`, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('images');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      database = undefined;
      reject(new Error('Could not save images locally.'));
    };
  }));
}
async function legacyImage(id: string): Promise<Blob> {
  const available = await indexedDB.databases();
  if (!available.some((d) => d.name === 'orbit-attachments')) throw new Error('Image missing.');
  const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('orbit-attachments');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const r = legacy.transaction('images', 'readonly').objectStore('images').get(id);
      r.onsuccess = () => (r.result ? resolve(r.result) : reject(new Error('Image missing.')));
      r.onerror = () => reject(r.error);
    });
  } finally {
    legacy.close();
  }
}
export async function readImage(id: string): Promise<Blob> {
  const database = await db();
  const image = await new Promise<Blob | undefined>((resolve, reject) => {
    const r = database.transaction('images', 'readonly').objectStore('images').get(id);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  if (image) return image;
  if (namespace === 'owner') {
    try {
      const legacy = await legacyImage(id);
      try {
        const tx = database.transaction('images', 'readwrite');
        tx.objectStore('images').put(legacy, id);
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        /* A failed copy must not hide an existing readable image. */
      }
      return legacy;
    } catch {
      /* The original database remains untouched. */
    }
  }
  throw new Error(
    'An image from this chat is missing from browser storage. Please attach it again.',
  );
}
export async function storeImage(file: File): Promise<ChatImage> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > 50_000_000)
      throw new Error('This image is too large. Please use a smaller version.');
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not prepare the image.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Could not prepare the image.'))),
        'image/jpeg',
        0.9,
      ),
    );
    if (blob.size > 2 * 1024 ** 2) throw new Error('Please use a smaller image.');
    const id = crypto.randomUUID();
    const tx = (await db()).transaction('images', 'readwrite');
    tx.objectStore('images').put(blob, id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('Not enough browser storage for this image.'));
    });
    return { id, name: file.name, type: blob.type, size: blob.size };
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function imageDataUrl(image: ChatImage) {
  const blob = await readImage(image.id);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.readAsDataURL(blob);
  });
}
export async function discardImages(images: ChatImage[]) {
  if (!images.length) return;
  const tx = (await db()).transaction('images', 'readwrite');
  images.forEach((image) => tx.objectStore('images').delete(image.id));
}
