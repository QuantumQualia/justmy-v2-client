# Zustand Store

Global state management using Zustand for the application.

## Structure

- `index.ts` - Central export point for all stores
- `profile-store.ts` - Profile data store

## Usage

### Profile Store

```tsx
import { useProfileStore } from "@/lib/store";

function MyComponent() {
  // Get state and actions
  const { data, setData, updateSocialLink } = useProfileStore();

  // Or use selectors for better performance
  const name = useProfileStore((state) => state.data.name);
  const socialLinks = useProfileStore((state) => state.data.socialLinks);

  // Update data
  const handleUpdate = () => {
    setData({ name: "New Name" });
  };

  // Update social link
  const handleUpdateSocial = (id: string) => {
    updateSocialLink(id, { url: "https://example.com" });
  };

  return (
    <div>
      <h1>{name}</h1>
      {/* ... */}
    </div>
  );
}
```

### Available Actions

- `setData(updates)` - Update profile data (partial update)
- `updateSocialLink(id, updates)` - Update a social link
- `addSocialLink(link)` - Add a new social link
- `removeSocialLink(id)` - Remove a social link
- `updateHotlink(id, updates)` - Update a hotlink
- `addHotlink(hotlink)` - Add a new hotlink
- `removeHotlink(id)` - Remove a hotlink
- `reset()` - Reset to initial state
- `fetchProfileData(handle)` - Fetch profile data from API

### Persistence

The store automatically persists to localStorage with the key `profile-storage`. Only the `data` field is persisted (not loading/error states).

### DevTools

The store is configured with Zustand DevTools for debugging. Install the Redux DevTools browser extension to inspect the store.
