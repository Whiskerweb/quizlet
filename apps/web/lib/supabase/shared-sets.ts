import { supabaseBrowser } from '../supabaseBrowserClient';

export async function hashPassword(password: string): Promise<string> {
  // Use Web Crypto API for client-side hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const sharedSetsService = {
  async shareSet(setId: string): Promise<void> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // For now, this function just validates that the user is authenticated
    // The actual "sharing" logic might be handled differently in your app
    // You can implement a proper collection system later if needed
    console.log('Set shared:', setId);
  },
};

