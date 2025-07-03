// src/services/syncService.js
export async function syncToNotion(article, { storage }) {
  try {
    console.error('🔄 syncToNotion が呼ばれました:', article);
    await storage.upsert(article);
    console.error('✅ syncToNotion 成功');
    return { synced: true };
  } catch (error) {
    console.error('🔴 syncToNotion error:', error);
    return { synced: false, error: error.message };
  }
}
