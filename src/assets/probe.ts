/**
 * ตรวจว่าไฟล์ JSON ของ asset มีอยู่จริงก่อนสั่งโหลด
 *
 * dev server และ static host หลายเจ้าตอบ index.html (200) แทน 404 เมื่อไม่พบไฟล์
 * ถ้าปล่อยให้ Phaser โหลดตรงๆ จะได้ JSON parse error เต็ม console
 * จึงเช็ก content-type ก่อน ไฟล์ไหนไม่ใช่ JSON ถือว่ายังไม่มี และใช้ placeholder แทน
 */
export async function probeJson(urls: readonly string[]): Promise<Set<string>> {
  const found = new Set<string>();
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const type = res.headers.get('content-type') ?? '';
        if (res.ok && type.includes('json')) found.add(url);
      } catch {
        // ไม่มีไฟล์หรือ network error: ใช้ placeholder
      }
    }),
  );
  return found;
}
