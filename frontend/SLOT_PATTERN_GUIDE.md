# Slot-Based Component Architecture

## Overview

LinoChat dashboards now use a **slot-based composition pattern** for building flexible, reusable layouts. This pattern allows you to compose complex UIs by inserting different components into predefined "slots" - similar to Vue.js slots or Web Components.

## Benefits

- **Flexibility**: Easily swap components in and out
- **Reusability**: Write layout logic once, use everywhere
- **Maintainability**: Changes to layout structure affect all dashboards
- **Composition**: Clear separation of concerns
- **Type Safety**: Full TypeScript support

---

## Core Layout Components

### 1. DashboardLayout

The main container component with four slots:

```tsx
<DashboardLayout
  sidebar={<YourSidebar />}        // Left navigation
  header={<YourHeader />}          // Top bar (optional)
  aside={<YourAside />}            // Right sidebar (optional)
>
  <YourMainContent />              // Primary content area
</DashboardLayout>
```

**Props:**
- `sidebar: ReactNode` - Left sidebar navigation (required)
- `header?: ReactNode` - Top header bar (optional)
- `children: ReactNode` - Main content area (required)
- `aside?: ReactNode` - Right sidebar for details (optional)

**Example:**
```tsx
<DashboardLayout
  sidebar={<AdminSidebar activeSection="dashboard" />}
  header={<DashboardHeader user={currentUser} />}
  aside={<CustomerDetailsPanel />}
>
  <DashboardContent>
    {/* Your content */}
  </DashboardContent>
</DashboardLayout>
```

---

### 2. DashboardHeader

Flexible header with search, actions, notifications, and user menu slots.

```tsx
<DashboardHeader
  user={{ name: 'John', email: 'john@example.com', avatar: 'JD' }}
  notificationsList={notifications}
  unreadCount={5}
  actions={<Button>Create Ticket</Button>}
  onSearch={(query) => console.log(query)}
/>
```

**Slots:**
- `search?: ReactNode` - Custom search component
- `actions?: ReactNode` - Action buttons/controls
- `notifications?: ReactNode` - Custom notification dropdown
- `userMenu?: ReactNode` - Custom user menu

**Props:**
- `user?` - User info for default menu
- `notificationsList?` - Array of notifications
- `unreadCount?` - Badge count
- `onSearch?` - Search handler
- `showSearch?` - Toggle default search

**Custom Slots Example:**
```tsx
<DashboardHeader
  search={
    <div className="flex gap-2">
      <Input placeholder="Search..." />
      <Button>Go</Button>
    </div>
  }
  actions={
    <>
      <Button variant="outline">Export</Button>
      <Button>New Ticket</Button>
    </>
  }
  userMenu={<CustomUserDropdown />}
/>
```

---

### 3. DashboardStats

Display metric cards with flexible composition.

**Using stats array:**
```tsx
<DashboardStats 
  stats={[
    {
      title: 'Active Chats',
      value: 24,
      icon: MessageCircle,
      iconColor: 'text-blue-600',
      trend: { value: '+12%', positive: true }
    },
    // ... more stats
  ]}
  columns={4}
/>
```

**Using slot composition:**
```tsx
<DashboardStats columns={3}>
  <StatCard 
    title="Revenue" 
    value="$124k" 
    icon={DollarSign}
    iconColor="text-green-600"
  />
  <CustomMetricCard />
  <AnotherCustomCard />
</DashboardStats>
```

**Props:**
- `stats?` - Array of stat configurations
- `children?` - Custom stat cards
- `columns?` - Grid columns (1-4)
- `className?` - Additional CSS classes

---

### 4. DashboardContent & DashboardSection

Wrappers for consistent spacing and layout.

```tsx
<DashboardContent padding="lg" maxWidth="6xl">
  <DashboardSection
    title="Overview"
    description="Your performance metrics"
    actions={<Button>View All</Button>}
  >
    {/* Section content */}
  </DashboardSection>
  
  <DashboardSection title="Recent Activity">
    {/* Another section */}
  </DashboardSection>
</DashboardContent>
```

**DashboardContent Props:**
- `padding?` - 'none' | 'sm' | 'md' | 'lg'
- `maxWidth?` - 'none' | 'xl' | '2xl' | '4xl' | '6xl' | 'full'
- `className?` - Custom classes

**DashboardSection Props:**
- `title?` - Section heading
- `description?` - Subtitle text
- `actions?` - Header action buttons
- `className?` - Custom classes

---

## Complete Example

Here's a full dashboard using the slot pattern:

```tsx
export default function MyDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <DashboardLayout
      // Sidebar slot
      sidebar={
        <AdminSidebar 
          activeSection={activeSection}
          onNavigate={setActiveSection}
        />
      }
      
      // Header slot
      header={
        <DashboardHeader
          user={{
            name: 'Sarah Johnson',
            email: 'sarah@company.com',
            avatar: 'SJ',
            role: 'Admin'
          }}
          notificationsList={notifications}
          unreadCount={3}
          actions={
            <>
              <Button variant="outline">Export</Button>
              <Button>New Ticket</Button>
            </>
          }
        />
      }
      
      // Optional aside slot
      aside={
        <CustomerDetailsPanel customerId={selectedCustomer} />
      }
    >
      {/* Main content */}
      <DashboardContent padding="lg">
        {/* Stats section */}
        <DashboardSection className="mb-6">
          <DashboardStats 
            stats={statsData}
            columns={4}
          />
        </DashboardSection>

        {/* Charts section */}
        <DashboardSection
          title="Analytics"
          description="Performance over time"
          actions={<Button variant="link">View Report</Button>}
        >
          <Card>
            <CardContent>
              {/* Your charts */}
            </CardContent>
          </Card>
        </DashboardSection>
      </DashboardContent>
    </DashboardLayout>
  );
}
```

---

## Migration Guide

### Before (Traditional Approach)

```tsx
export default function OldDashboard() {
  return (
    <div className="flex h-screen">
      <aside className="w-24">
        <AdminSidebar />
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="border-b">
          <div className="flex items-center p-4">
            <Input placeholder="Search..." />
            <Button>Notifications</Button>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-6">
          {/* Content */}
        </main>
      </div>
    </div>
  );
}
```

### After (Slot-Based Approach)

```tsx
export default function NewDashboard() {
  return (
    <DashboardLayout
      sidebar={<AdminSidebar />}
      header={<DashboardHeader user={user} />}
    >
      <DashboardContent>
        {/* Content */}
      </DashboardContent>
    </DashboardLayout>
  );
}
```

---

## Best Practices

### 1. Use Slots for Variations

```tsx
// Different headers for different contexts
<DashboardLayout
  sidebar={<AdminSidebar />}
  header={isAdminMode ? <AdminHeader /> : <AgentHeader />}
>
  {children}
</DashboardLayout>
```

### 2. Compose Complex Layouts

```tsx
<DashboardStats>
  <StatCard {...basicStats} />
  <CustomTrendCard />
  <InteractiveMetricCard />
</DashboardStats>
```

### 3. Extract Reusable Patterns

```tsx
// Create custom composed components
function ChatDashboardLayout({ children }) {
  return (
    <DashboardLayout
      sidebar={<ChatSidebar />}
      header={<ChatHeader />}
      aside={<ActiveChatPanel />}
    >
      {children}
    </DashboardLayout>
  );
}
```

### 4. Keep Slot Content Focused

```tsx
// Good - focused slot content
<DashboardHeader
  actions={<CreateTicketButton />}
/>

// Avoid - too much logic in slot
<DashboardHeader
  actions={
    <div>
      {showButton && condition ? (
        <ComplexComponent>
          {/* Lots of nested logic */}
        </ComplexComponent>
      ) : null}
    </div>
  }
/>
```

---

## Pattern Comparison

### Render Props Pattern
```tsx
<Dashboard
  renderHeader={(props) => <Header {...props} />}
  renderSidebar={(props) => <Sidebar {...props} />}
/>
```

### Slot Pattern (Current)
```tsx
<Dashboard
  header={<Header />}
  sidebar={<Sidebar />}
/>
```

**Why Slots?**
- Simpler API
- Better TypeScript inference
- More intuitive composition
- Easier to read and maintain

---

## Advanced Usage

### Conditional Slots

```tsx
<DashboardLayout
  sidebar={<Sidebar />}
  header={<Header />}
  aside={showDetails ? <DetailsPanel /> : undefined}
>
  {children}
</DashboardLayout>
```

### Nested Composition

```tsx
<DashboardLayout sidebar={<Sidebar />} header={<Header />}>
  <DashboardContent>
    <DashboardSection title="Metrics">
      <DashboardStats>
        <StatCard {...stat1} />
        <StatCard {...stat2} />
      </DashboardStats>
    </DashboardSection>
  </DashboardContent>
</DashboardLayout>
```

### Custom Slots

Create your own slot-based components:

```tsx
interface MyComponentProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

function MyComponent({ header, footer, children }: MyComponentProps) {
  return (
    <div>
      {header && <div className="header">{header}</div>}
      <div className="content">{children}</div>
      {footer && <div className="footer">{footer}</div>}
    </div>
  );
}

// Usage
<MyComponent
  header={<Title />}
  footer={<Actions />}
>
  <Content />
</MyComponent>
```

---

## See Also

- `ExampleDashboard.tsx` - Complete working example
- Component files in `/src/app/components/layouts/`
- React documentation on composition
