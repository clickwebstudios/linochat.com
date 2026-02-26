# Slot Pattern Visual Guide

## Component Structure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     DashboardLayout                              │
│                                                                   │
│  ┌────────┐  ┌────────────────────────────────────────────┐     │
│  │        │  │  Header Slot (optional)                    │     │
│  │        │  │  ┌──────────────────────────────────────┐  │     │
│  │        │  │  │  DashboardHeader                     │  │     │
│  │        │  │  │  ┌────────┬─────────┬──────────────┐ │  │     │
│  │ Side-  │  │  │  │ Search │ Actions │ User Menu    │ │  │     │
│  │ bar    │  │  │  │ Slot   │ Slot    │ Slot         │ │  │     │
│  │ Slot   │  │  │  └────────┴─────────┴──────────────┘ │  │     │
│  │        │  │  └──────────────────────────────────────┘  │     │
│  │        │  └────────────────────────────────────────────┘     │
│  │        │                                                      │
│  │        │  ┌────────────────────────────────────────────┐     │
│  │        │  │  Content Slot (children)                   │     │
│  │        │  │  ┌──────────────────────────────────────┐  │  ┌─┐│
│  │        │  │  │  DashboardContent                    │  │  │A││
│  │        │  │  │  ┌────────────────────────────────┐  │  │  │s││
│  │        │  │  │  │ DashboardSection              │  │  │  │i││
│  │        │  │  │  │ ┌──────────┬─────────────────┐│  │  │  │d││
│  │        │  │  │  │ │ Title    │ Actions Slot    ││  │  │  │e││
│  │        │  │  │  │ └──────────┴─────────────────┘│  │  │  │ ││
│  │        │  │  │  │                                │  │  │  │S││
│  │        │  │  │  │ Your Content Here              │  │  │  │l││
│  │        │  │  │  │                                │  │  │  │o││
│  │        │  │  │  └────────────────────────────────┘  │  │  │t││
│  │        │  │  └──────────────────────────────────────┘  │  │ ││
│  │        │  │                                            │  │o││
│  │        │  └────────────────────────────────────────────┘  │p││
│  │        │                                                   │t││
│  └────────┘                                                   │i││
│                                                                │o││
│                                                                │n││
│                                                                │a││
│                                                                │l││
└────────────────────────────────────────────────────────────────┴─┘
```

## Slot Hierarchy

```
DashboardLayout
├─ sidebar (required)
│  └─ Your sidebar component
├─ header (optional)
│  └─ DashboardHeader
│     ├─ search (optional)
│     ├─ actions (optional)
│     ├─ notifications (optional)
│     └─ userMenu (optional)
├─ children (required - main content)
│  └─ DashboardContent
│     └─ DashboardSection(s)
│        ├─ title (optional)
│        ├─ description (optional)
│        ├─ actions (optional)
│        └─ children (required)
└─ aside (optional)
   └─ Your details panel
```

## Example Flow

```
1. User Request
   ↓
2. Choose Layout Component
   ├─ DashboardLayout (general)
   ├─ ChatDashboardLayout (chat-specific)
   └─ Custom Layout (your specialized layout)
   ↓
3. Fill Slots
   ├─ sidebar → AdminSidebar
   ├─ header → DashboardHeader
   │  ├─ actions → Buttons
   │  └─ userMenu → UserDropdown
   ├─ children → Your Content
   └─ aside → DetailsPanel
   ↓
4. Rendered Dashboard
```

## Composition Patterns

### Pattern 1: Full Featured Dashboard
```
┌─────────────────────────────────┐
│ DashboardLayout                 │
│  [Sidebar] [Header] [Aside]     │
│  [Content with Stats & Charts]  │
└─────────────────────────────────┘
```

### Pattern 2: Simple Dashboard
```
┌─────────────────────────────────┐
│ DashboardLayout                 │
│  [Sidebar] [Content Only]       │
└─────────────────────────────────┘
```

### Pattern 3: Chat Layout (3-Column)
```
┌─────────────────────────────────────────┐
│ ChatDashboardLayout                     │
│  [Sidebar] [ChatList] [Chat] [Details] │
└─────────────────────────────────────────┘
```

## Slot Types

### Container Slots (Layout)
- Control page structure
- Examples: sidebar, header, aside
- Usually accept components

### Content Slots (Data)
- Display information
- Examples: children, actions
- Accept components or elements

### Behavioral Slots (Interactive)
- Handle user interaction
- Examples: search, userMenu
- Accept custom handlers

## Real-World Example

```tsx
<DashboardLayout
  // Container Slot: Navigation
  sidebar={<AdminSidebar />}
  
  // Container Slot: Top Bar
  header={
    <DashboardHeader
      user={currentUser}
      // Behavioral Slot: Custom actions
      actions={
        <>
          <Button onClick={handleExport}>Export</Button>
          <Button onClick={handleCreate}>Create</Button>
        </>
      }
    />
  }
  
  // Container Slot: Right Panel (optional)
  aside={showDetails && <DetailsPanel />}
>
  {/* Content Slot: Main area */}
  <DashboardContent>
    {/* Nested content slots */}
    <DashboardSection 
      title="Metrics"
      actions={<RefreshButton />}
    >
      <DashboardStats stats={data} />
    </DashboardSection>
  </DashboardContent>
</DashboardLayout>
```

## Benefits Visualized

### Before (Traditional)
```
Component A                  Component B
┌──────────────────┐        ┌──────────────────┐
│ Layout Code      │        │ Layout Code      │
│ Sidebar          │        │ Sidebar          │
│ Header           │        │ Header           │
│ Content A        │        │ Content B        │
└──────────────────┘        └──────────────────┘
    Duplicated!                 Duplicated!
```

### After (Slot-Based)
```
         DashboardLayout
         ┌──────────────┐
         │ Layout Logic │
         └──────────────┘
                │
      ┌─────────┴─────────┐
      │                   │
  Component A         Component B
  ┌─────────┐         ┌─────────┐
  │Content A│         │Content B│
  └─────────┘         └─────────┘
      Reused!             Reused!
```

## Common Slot Combinations

### Admin Dashboard
```
Layout: DashboardLayout
├─ Sidebar: AdminSidebar ✓
├─ Header: DashboardHeader ✓
│  ├─ Actions: Create Buttons ✓
│  └─ User Menu: Admin Menu ✓
├─ Content: Stats + Charts ✓
└─ Aside: None
```

### Agent Dashboard
```
Layout: DashboardLayout
├─ Sidebar: AgentSidebar ✓
├─ Header: DashboardHeader ✓
│  ├─ Actions: Status Toggle ✓
│  └─ User Menu: Agent Menu ✓
├─ Content: Tickets + Chats ✓
└─ Aside: Customer Details ✓
```

### Chat View
```
Layout: ChatDashboardLayout
├─ Sidebar: Navigation ✓
├─ Header: Chat Header ✓
│  └─ Actions: Call/Email ✓
├─ Chat List: Active Chats ✓
├─ Content: Messages ✓
└─ Details: Customer Info ✓
```

## Quick Decision Tree

```
Need a dashboard?
├─ Yes
│  ├─ Is it chat-focused?
│  │  ├─ Yes → Use ChatDashboardLayout
│  │  └─ No → Use DashboardLayout
│  │
│  └─ Custom layout needed?
│     └─ Create new layout composing base components
│
└─ No
   └─ Use appropriate page layout
```

## Slot Naming Convention

```
Slot Name        Purpose              Example
─────────────────────────────────────────────────
sidebar          Left navigation      <AdminSidebar />
header           Top bar              <DashboardHeader />
children         Main content         <YourContent />
aside            Right panel          <DetailsPanel />
actions          Action buttons       <Button />...
search           Search widget        <SearchBar />
title            Section heading      "Overview"
description      Section subtitle     "Last 30 days"
```

## Tips for Using Slots

1. **Start Simple**
   ```tsx
   <DashboardLayout sidebar={<Sidebar />}>
     <Content />
   </DashboardLayout>
   ```

2. **Add Complexity Gradually**
   ```tsx
   <DashboardLayout 
     sidebar={<Sidebar />}
     header={<Header />}  // Added
   >
     <Content />
   </DashboardLayout>
   ```

3. **Customize When Needed**
   ```tsx
   <DashboardLayout 
     sidebar={<Sidebar />}
     header={
       <Header 
         actions={<CustomActions />}  // Customized
       />
     }
   >
     <Content />
   </DashboardLayout>
   ```

## Summary

✅ Slots = Composable building blocks
✅ Mix and match as needed
✅ Reuse layouts across pages
✅ Easy to maintain and extend
✅ Type-safe with TypeScript
