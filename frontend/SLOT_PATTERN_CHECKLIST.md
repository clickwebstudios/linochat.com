# ✅ Slot Pattern Implementation Checklist

Use this checklist when refactoring or creating new dashboards with the slot pattern.

## Before You Start

- [ ] Read `SLOT_PATTERN_QUICK_REF.md` (5 minutes)
- [ ] View `/example-dashboard` in browser
- [ ] Review one example component

## Creating a New Dashboard

### 1. Setup Imports
```tsx
- [ ] Import DashboardLayout
- [ ] Import DashboardHeader (if needed)
- [ ] Import DashboardContent
- [ ] Import DashboardStats (if showing metrics)
- [ ] Import DashboardSection (for organized sections)
```

### 2. Basic Structure
```tsx
- [ ] Wrap everything in DashboardLayout
- [ ] Add sidebar slot (required)
- [ ] Add header slot (optional but recommended)
- [ ] Add main content in children
- [ ] Add aside slot if needed
```

### 3. Header Configuration
```tsx
- [ ] Pass user info
- [ ] Add custom actions if needed
- [ ] Configure notifications
- [ ] Set up search handler
```

### 4. Content Organization
```tsx
- [ ] Wrap content in DashboardContent
- [ ] Use DashboardSection for each major area
- [ ] Add titles and descriptions
- [ ] Include action buttons where needed
```

### 5. Stats Display
```tsx
- [ ] Prepare stats data array
- [ ] Add DashboardStats component
- [ ] Configure column count
- [ ] Or use custom stat cards in slot
```

## Refactoring Existing Dashboard

### 1. Analysis Phase
- [ ] Identify current layout structure
- [ ] List all header elements
- [ ] Note sidebar configuration
- [ ] Check for right panel/aside usage
- [ ] Map content sections

### 2. Preparation Phase
- [ ] Import slot components
- [ ] Extract header actions to variables
- [ ] Separate sidebar props
- [ ] Organize content into sections

### 3. Refactoring Phase
- [ ] Replace outer div with DashboardLayout
- [ ] Move sidebar to sidebar slot
- [ ] Replace header with DashboardHeader
- [ ] Wrap content in DashboardContent
- [ ] Convert sections to DashboardSection
- [ ] Move aside panel to aside slot

### 4. Cleanup Phase
- [ ] Remove old layout divs
- [ ] Remove duplicate CSS classes
- [ ] Clean up unused variables
- [ ] Test responsive behavior
- [ ] Verify all functionality works

### 5. Enhancement Phase
- [ ] Add missing features from new slots
- [ ] Improve header actions
- [ ] Add section headers
- [ ] Consider stats display improvements

## Testing Checklist

### Visual Testing
- [ ] Desktop layout looks correct
- [ ] Tablet layout is responsive
- [ ] Mobile layout works (if applicable)
- [ ] Sidebar displays properly
- [ ] Header aligns correctly
- [ ] Stats cards show properly

### Functional Testing
- [ ] Navigation works
- [ ] Header actions trigger correctly
- [ ] Search functionality works
- [ ] Notifications display
- [ ] User menu operates correctly
- [ ] Aside panel opens/closes (if used)

### Edge Cases
- [ ] Long content scrolls properly
- [ ] Empty states display correctly
- [ ] Loading states work
- [ ] Error states handled
- [ ] No console errors

## Code Quality

### TypeScript
- [ ] No type errors
- [ ] Props properly typed
- [ ] Slots have correct types
- [ ] Handlers typed correctly

### Code Organization
- [ ] Imports organized
- [ ] Components extracted if needed
- [ ] Variables named clearly
- [ ] Comments added where helpful

### Performance
- [ ] No unnecessary re-renders
- [ ] Memoization used where needed
- [ ] Large lists virtualized if needed

## Documentation

- [ ] Add JSDoc comments to custom slots
- [ ] Document any special props
- [ ] Note any gotchas
- [ ] Update team documentation

## Common Patterns Checklist

### Admin Dashboard Pattern
```tsx
- [ ] AdminSidebar in sidebar slot
- [ ] DashboardHeader with admin actions
- [ ] Stats showing key metrics
- [ ] Multiple DashboardSections for content
- [ ] No aside (full width content)
```

### Agent Dashboard Pattern
```tsx
- [ ] AgentSidebar in sidebar slot
- [ ] DashboardHeader with status toggle
- [ ] Quick stats (chats, tickets)
- [ ] Main content area with tabs
- [ ] Optional aside for customer details
```

### Chat Interface Pattern
```tsx
- [ ] Use ChatDashboardLayout instead
- [ ] Chat list in chatList slot
- [ ] Messages in children
- [ ] Customer info in customerDetails slot
- [ ] Call/email actions in header
```

### Reports Pattern
```tsx
- [ ] Minimal sidebar
- [ ] Header with date picker and export
- [ ] Filters in aside slot
- [ ] Charts in main content
- [ ] Stats at top of content
```

## Anti-Patterns to Avoid

### ❌ Don't Do This
```tsx
// Mixing old and new patterns
<div className="flex h-screen">
  <DashboardLayout sidebar={...}>
    ...
  </DashboardLayout>
</div>
```

### ✅ Do This Instead
```tsx
// Use slots properly
<DashboardLayout sidebar={...} header={...}>
  <DashboardContent>...</DashboardContent>
</DashboardLayout>
```

### ❌ Don't Do This
```tsx
// Nesting layouts unnecessarily
<DashboardLayout>
  <DashboardLayout>...</DashboardLayout>
</DashboardLayout>
```

### ✅ Do This Instead
```tsx
// One layout per page
<DashboardLayout>
  <DashboardContent>
    <DashboardSection>...</DashboardSection>
  </DashboardContent>
</DashboardLayout>
```

### ❌ Don't Do This
```tsx
// Putting layout logic in content
<DashboardLayout>
  <div className="flex">
    <div className="sidebar">...</div>
    <div className="content">...</div>
  </div>
</DashboardLayout>
```

### ✅ Do This Instead
```tsx
// Use the aside slot
<DashboardLayout aside={<RightPanel />}>
  <Content />
</DashboardLayout>
```

## Quick Reference Template

Copy and adapt this template:

```tsx
import { 
  DashboardLayout,
  DashboardHeader,
  DashboardContent,
  DashboardStats,
  DashboardSection
} from '@/components/layouts';
import { YourSidebar } from '@/components/YourSidebar';

export default function YourDashboard() {
  // State and handlers
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Data
  const user = { name: '...', email: '...', avatar: '...' };
  const stats = [
    { title: '...', value: '...', icon: Icon, iconColor: '...' }
  ];
  
  // Header actions
  const headerActions = (
    <>
      <Button>Action 1</Button>
      <Button>Action 2</Button>
    </>
  );
  
  return (
    <DashboardLayout
      sidebar={
        <YourSidebar 
          activeSection={activeSection}
          onNavigate={setActiveSection}
        />
      }
      header={
        <DashboardHeader
          user={user}
          actions={headerActions}
          notificationsList={notifications}
          unreadCount={2}
        />
      }
      // aside={<YourAsidePanel />}  // Optional
    >
      <DashboardContent padding="lg">
        {/* Stats */}
        <DashboardSection className="mb-6">
          <DashboardStats stats={stats} columns={4} />
        </DashboardSection>
        
        {/* Main Content */}
        <DashboardSection
          title="Your Section"
          description="Description here"
          actions={<Button>View All</Button>}
        >
          {/* Your content */}
        </DashboardSection>
      </DashboardContent>
    </DashboardLayout>
  );
}
```

## Review Checklist

Before considering the refactoring complete:

- [ ] All slots used correctly
- [ ] No layout code in content components
- [ ] Responsive behavior maintained
- [ ] All features still work
- [ ] Code is cleaner than before
- [ ] TypeScript types are correct
- [ ] No console warnings/errors
- [ ] Tested in browser
- [ ] Peer reviewed (if applicable)
- [ ] Documentation updated

## Done! 🎉

Once you've completed the checklist:

1. Test thoroughly in the browser
2. Check responsive breakpoints
3. Verify all interactions work
4. Commit your changes
5. Share learnings with the team

## Need Help?

- Check `SLOT_PATTERN_QUICK_REF.md` for examples
- View `/example-dashboard` for working code
- Review `ExampleDashboard.tsx` source
- Read full guide in `SLOT_PATTERN_GUIDE.md`
