# 🚀 Slot Pattern - 5 Minute Quick Start

## What Are Slots?

Slots let you compose complex layouts by inserting components into predefined areas - like filling in blanks in a form.

```tsx
<DashboardLayout
  sidebar={/* Your sidebar here */}
  header={/* Your header here */}
>
  {/* Your content here */}
</DashboardLayout>
```

Think of it like a template with placeholders that you fill in!

## See It In Action

Visit these URLs in your browser:
- **Basic Example**: http://localhost:5173/example-dashboard
- **Chat Example**: http://localhost:5173/example-chat-dashboard

## Your First Slot-Based Dashboard

### Step 1: Import Components (30 seconds)

```tsx
import { 
  DashboardLayout,
  DashboardHeader,
  DashboardContent
} from '@/components/layouts';
import { AdminSidebar } from '@/components/AdminSidebar';
```

### Step 2: Build the Layout (2 minutes)

```tsx
export default function MyDashboard() {
  return (
    <DashboardLayout
      sidebar={<AdminSidebar />}
      header={<DashboardHeader user={{ name: 'You', email: 'you@example.com', avatar: 'YO' }} />}
    >
      <DashboardContent>
        <h1>My Dashboard</h1>
        <p>This is using slots!</p>
      </DashboardContent>
    </DashboardLayout>
  );
}
```

### Step 3: Add Some Stats (2 minutes)

```tsx
import { DashboardStats } from '@/components/layouts';
import { Users, MessageCircle } from 'lucide-react';

// Inside your component:
const myStats = [
  { title: 'Users', value: 150, icon: Users, iconColor: 'text-blue-600' },
  { title: 'Messages', value: 324, icon: MessageCircle, iconColor: 'text-green-600' }
];

return (
  <DashboardLayout sidebar={<AdminSidebar />} header={<DashboardHeader />}>
    <DashboardContent>
      <DashboardStats stats={myStats} />
    </DashboardContent>
  </DashboardLayout>
);
```

## Common Recipes

### Recipe 1: Dashboard with Actions
```tsx
<DashboardLayout
  sidebar={<Sidebar />}
  header={
    <DashboardHeader
      user={currentUser}
      actions={
        <>
          <Button>Export</Button>
          <Button>Create</Button>
        </>
      }
    />
  }
>
  <DashboardContent>{/* content */}</DashboardContent>
</DashboardLayout>
```

### Recipe 2: With Stats
```tsx
<DashboardContent>
  <DashboardStats 
    stats={[
      { title: 'Total', value: 100, icon: Users }
    ]} 
  />
</DashboardContent>
```

### Recipe 3: With Sections
```tsx
<DashboardContent>
  <DashboardSection title="Overview">
    <YourContent />
  </DashboardSection>
  
  <DashboardSection title="Activity">
    <YourActivity />
  </DashboardSection>
</DashboardContent>
```

### Recipe 4: With Details Panel
```tsx
<DashboardLayout
  sidebar={<Sidebar />}
  header={<Header />}
  aside={<DetailsPanel />}  // Right sidebar
>
  <DashboardContent>{/* content */}</DashboardContent>
</DashboardLayout>
```

## The 4 Main Components

### 1. DashboardLayout
The outer container. **Always start here.**

```tsx
<DashboardLayout
  sidebar={/* required */}
  header={/* optional */}
  aside={/* optional */}
>
  {/* your content - required */}
</DashboardLayout>
```

### 2. DashboardHeader
The top bar with search, actions, notifications, and user menu.

```tsx
<DashboardHeader
  user={{ name: 'John', email: 'john@example.com', avatar: 'JD' }}
  actions={<Button>Create</Button>}
  unreadCount={5}
/>
```

### 3. DashboardContent
Wrapper for your main content with consistent padding.

```tsx
<DashboardContent padding="lg">
  {/* your content */}
</DashboardContent>
```

### 4. DashboardStats
Display metric cards.

```tsx
<DashboardStats 
  stats={[
    { title: 'Users', value: 100, icon: Users, iconColor: 'text-blue-600' }
  ]}
  columns={4}
/>
```

## Copy-Paste Template

```tsx
import { 
  DashboardLayout,
  DashboardHeader,
  DashboardContent,
  DashboardStats,
  DashboardSection
} from '@/components/layouts';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MyDashboard() {
  const user = {
    name: 'Your Name',
    email: 'your@email.com',
    avatar: 'YN'
  };
  
  const stats = [
    { title: 'Total Users', value: 150, icon: Users, iconColor: 'text-blue-600' }
  ];
  
  return (
    <DashboardLayout
      sidebar={<AdminSidebar activeSection="dashboard" />}
      header={
        <DashboardHeader
          user={user}
          actions={<Button>Create New</Button>}
        />
      }
    >
      <DashboardContent padding="lg">
        <DashboardSection className="mb-6">
          <DashboardStats stats={stats} columns={4} />
        </DashboardSection>
        
        <DashboardSection title="Your Section" description="Description here">
          {/* Add your content here */}
          <p>Hello World!</p>
        </DashboardSection>
      </DashboardContent>
    </DashboardLayout>
  );
}
```

## What Slots Are Available?

| Component | Slots | Required? |
|-----------|-------|-----------|
| **DashboardLayout** | `sidebar`, `header`, `children`, `aside` | sidebar & children |
| **DashboardHeader** | `search`, `actions`, `notifications`, `userMenu` | none (all optional) |
| **DashboardStats** | `children` | either stats prop or children |
| **DashboardSection** | `title`, `description`, `actions`, `children` | children only |

## Quick Tips

1. **Start Simple**: Use just sidebar and content first
2. **Add Gradually**: Add header when you need it
3. **Customize**: Pass custom components to any slot
4. **Type-Safe**: TypeScript will help you use correct props

## Common Mistakes

❌ **Wrong:** Nesting layouts
```tsx
<DashboardLayout>
  <DashboardLayout>...</DashboardLayout>
</DashboardLayout>
```

✅ **Right:** One layout per page
```tsx
<DashboardLayout>
  <DashboardContent>...</DashboardContent>
</DashboardLayout>
```

❌ **Wrong:** Manual layout in content
```tsx
<DashboardLayout sidebar={<Sidebar />}>
  <div className="flex h-screen">
    <div className="sidebar">...</div>
  </div>
</DashboardLayout>
```

✅ **Right:** Use the aside slot
```tsx
<DashboardLayout 
  sidebar={<Sidebar />}
  aside={<RightPanel />}
>
  <Content />
</DashboardLayout>
```

## Next Steps

1. ✅ **Try the template above** - Copy, paste, and run it
2. 📚 **Read** `SLOT_PATTERN_QUICK_REF.md` for more examples
3. 👀 **View** `/example-dashboard` in your browser
4. 🎨 **Customize** the slots to fit your needs
5. 📖 **Deep dive** into `SLOT_PATTERN_GUIDE.md` when ready

## Need Help?

**Quick Reference**: `SLOT_PATTERN_QUICK_REF.md`
**Full Guide**: `SLOT_PATTERN_GUIDE.md`
**Visual Guide**: `SLOT_PATTERN_VISUAL_GUIDE.md`
**Examples**: Visit `/example-dashboard` in browser

---

**You're ready to use slots! 🎰** Start with the template above and customize it to your needs.
