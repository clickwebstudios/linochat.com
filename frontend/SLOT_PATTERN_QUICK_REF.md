# Slot Pattern Quick Reference

## Basic Structure

```tsx
import { 
  DashboardLayout,
  DashboardHeader,
  DashboardStats,
  DashboardContent,
  DashboardSection 
} from '@/components/layouts';

function Dashboard() {
  return (
    <DashboardLayout
      sidebar={/* Navigation */}
      header={/* Top bar */}
      aside={/* Right panel (optional) */}
    >
      {/* Main content */}
    </DashboardLayout>
  );
}
```

## Quick Examples

### Minimal Dashboard
```tsx
<DashboardLayout sidebar={<Sidebar />}>
  <DashboardContent>
    <h1>Hello World</h1>
  </DashboardContent>
</DashboardLayout>
```

### With Header
```tsx
<DashboardLayout
  sidebar={<Sidebar />}
  header={<DashboardHeader user={user} />}
>
  <DashboardContent>
    <DashboardStats stats={statsData} />
  </DashboardContent>
</DashboardLayout>
```

### With Custom Header Actions
```tsx
<DashboardLayout
  sidebar={<Sidebar />}
  header={
    <DashboardHeader
      user={user}
      actions={
        <>
          <Button>Export</Button>
          <Button>Create</Button>
        </>
      }
    />
  }
>
  <DashboardContent>Content</DashboardContent>
</DashboardLayout>
```

### With Aside Panel
```tsx
<DashboardLayout
  sidebar={<Sidebar />}
  header={<DashboardHeader />}
  aside={<DetailsPanel />}
>
  <DashboardContent>Content</DashboardContent>
</DashboardLayout>
```

### Stats Variants
```tsx
// Using array
<DashboardStats stats={[
  { title: 'Users', value: 123, icon: Users }
]} />

// Using slots
<DashboardStats>
  <StatCard title="Users" value={123} icon={Users} />
  <CustomCard />
</DashboardStats>
```

### Sections
```tsx
<DashboardContent>
  <DashboardSection 
    title="Overview"
    actions={<Button>View All</Button>}
  >
    <YourContent />
  </DashboardSection>
</DashboardContent>
```

## All Available Slots

### DashboardLayout
- `sidebar` - Required
- `header` - Optional
- `children` - Required
- `aside` - Optional

### DashboardHeader
- `search` - Optional
- `actions` - Optional
- `notifications` - Optional
- `userMenu` - Optional

### DashboardStats
- `children` - Optional (use for custom cards)

### DashboardSection
- `title` - Optional
- `description` - Optional
- `actions` - Optional
- `children` - Required

## Common Patterns

### Admin Dashboard
```tsx
<DashboardLayout
  sidebar={<AdminSidebar activeSection="dashboard" />}
  header={<DashboardHeader user={admin} unreadCount={5} />}
>
  <DashboardContent padding="lg">
    <DashboardSection>
      <DashboardStats stats={adminStats} columns={4} />
    </DashboardSection>
  </DashboardContent>
</DashboardLayout>
```

### Chat View with Details
```tsx
<DashboardLayout
  sidebar={<ChatSidebar />}
  header={<DashboardHeader showSearch={false} />}
  aside={<ChatDetailsPanel />}
>
  <ChatMessages />
</DashboardLayout>
```

### Simple Agent View
```tsx
<DashboardLayout
  sidebar={<AgentSidebar />}
  header={
    <DashboardHeader
      user={agent}
      actions={<StatusToggle />}
    />
  }
>
  <DashboardContent>
    <TicketList />
  </DashboardContent>
</DashboardLayout>
```
