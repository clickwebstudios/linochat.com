// Mock data for the SaaS Customer Support Platform

// Companies
export const mockCompanies = [
  {
    id: 'comp-1',
    name: 'TechCorp Solutions',
    plan: 'Enterprise',
  },
  {
    id: 'comp-2',
    name: 'StartupXYZ',
    plan: 'Pro',
  },
  {
    id: 'comp-3',
    name: 'Global Services Inc',
    plan: 'Starter',
  },
  {
    id: 'comp-4',
    name: 'Innovation Labs',
    plan: 'Enterprise',
  },
  {
    id: 'comp-5',
    name: 'Digital Dynamics',
    plan: 'Pro',
  },
  {
    id: 'comp-6',
    name: 'NovaTech Industries',
    plan: 'Enterprise',
  },
  {
    id: 'comp-7',
    name: 'GreenLeaf Organics',
    plan: 'Pro',
  },
  {
    id: 'comp-8',
    name: 'BrightPath Education',
    plan: 'Pro',
  },
  {
    id: 'comp-9',
    name: 'Apex Fitness Co',
    plan: 'Starter',
  },
  {
    id: 'comp-10',
    name: 'CloudSync Solutions',
    plan: 'Enterprise',
  },
];

// Projects
export const mockProjects = [
  { 
    id: 'proj-1', 
    name: 'E-Commerce Site', 
    color: '#3b82f6',
    description: 'Main e-commerce platform support for online store operations and customer inquiries',
    website: 'https://www.ecommerce-demo.com',
    totalTickets: 324,
    activeTickets: 45,
    members: 8,
    companyId: 'comp-1',
    tickets: 156,
  },
  { 
    id: 'proj-2', 
    name: 'Mobile App', 
    color: '#10b981',
    description: 'Mobile application support for iOS and Android platforms',
    website: 'https://www.mobileapp-demo.com',
    totalTickets: 189,
    activeTickets: 32,
    members: 5,
    companyId: 'comp-1',
    tickets: 89,
  },
  { 
    id: 'proj-3', 
    name: 'SaaS Platform', 
    color: '#f59e0b',
    description: 'Cloud-based software platform technical support and feature requests',
    website: 'https://www.saasplatform-demo.com',
    totalTickets: 567,
    activeTickets: 78,
    members: 12,
    companyId: 'comp-2',
    tickets: 234,
  },
  { 
    id: 'proj-4', 
    name: 'Marketing Site', 
    color: '#8b5cf6',
    description: 'Marketing website inquiries, lead generation, and general information requests',
    website: 'https://www.marketing-demo.com',
    totalTickets: 156,
    activeTickets: 23,
    members: 6,
    companyId: 'comp-3',
    tickets: 78,
  },
  { 
    id: 'proj-5', 
    name: 'Customer Portal', 
    color: '#ec4899',
    description: 'Self-service customer portal and account management',
    website: 'https://www.customerportal-demo.com',
    totalTickets: 203,
    activeTickets: 34,
    members: 7,
    companyId: 'comp-2',
    tickets: 112,
  },
  { 
    id: 'proj-6', 
    name: 'API Documentation', 
    color: '#06b6d4',
    description: 'Developer support and API integration assistance',
    website: 'https://docs.api-demo.com',
    totalTickets: 145,
    activeTickets: 19,
    members: 4,
    companyId: 'comp-4',
    tickets: 67,
  },
  { 
    id: 'proj-7', 
    name: 'Internal Tools', 
    color: '#84cc16',
    description: 'Internal team tools and workflow management',
    website: 'https://internal.tools-demo.com',
    totalTickets: 98,
    activeTickets: 12,
    members: 3,
    companyId: 'comp-5',
    tickets: 45,
  },
];

// Agents
export const mockAgents = [
  {
    id: 'agent-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@techcorp.com',
    companyId: 'comp-1',
  },
  {
    id: 'agent-2',
    name: 'Mike Johnson',
    email: 'mike.johnson@techcorp.com',
    companyId: 'comp-1',
  },
  {
    id: 'agent-3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@techcorp.com',
    companyId: 'comp-1',
  },
  {
    id: 'agent-4',
    name: 'David Kim',
    email: 'david.kim@startupxyz.com',
    companyId: 'comp-2',
  },
  {
    id: 'agent-5',
    name: 'Lisa Martinez',
    email: 'lisa.martinez@startupxyz.com',
    companyId: 'comp-2',
  },
  {
    id: 'agent-6',
    name: 'Sophie Laurent',
    email: 'sophie.laurent@globalservices.com',
    companyId: 'comp-3',
  },
  {
    id: 'agent-7',
    name: 'James Wilson',
    email: 'james.wilson@globalservices.com',
    companyId: 'comp-3',
  },
  {
    id: 'agent-8',
    name: 'Alex Thompson',
    email: 'alex.thompson@innovationlabs.com',
    companyId: 'comp-4',
  },
  {
    id: 'agent-9',
    name: 'Maria Garcia',
    email: 'maria.garcia@innovationlabs.com',
    companyId: 'comp-4',
  },
  {
    id: 'agent-10',
    name: 'Chris Anderson',
    email: 'chris.anderson@digitaldynamics.com',
    companyId: 'comp-5',
  },
];

export const mockTickets = [
  {
    id: 'T-1001',
    subject: 'Cannot access dashboard',
    customer: 'John Doe',
    status: 'open',
    priority: 'high',
    created: '2024-12-18',
    lastUpdate: '2 hours ago',
    assignedTo: 'Sarah Chen',
    projectId: 'proj-1',
  },
  {
    id: 'T-1002',
    subject: 'Billing inquiry about upgrade',
    customer: 'Emma Wilson',
    status: 'pending',
    priority: 'medium',
    created: '2024-12-17',
    lastUpdate: '5 hours ago',
    assignedTo: 'Mike Johnson',
    projectId: 'proj-3',
  },
  {
    id: 'T-1003',
    subject: 'Feature request: Dark mode',
    customer: 'Alex Turner',
    status: 'closed',
    priority: 'low',
    created: '2024-12-15',
    lastUpdate: '1 day ago',
    assignedTo: 'Sarah Chen',
    projectId: 'proj-2',
  },
];

export const mockChats = [
  {
    id: 'C-501',
    customer: 'Lisa Anderson',
    avatar: 'LA',
    preview: 'Hi, I need help with...',
    time: '2 min ago',
    unread: 2,
    status: 'active',
    projectId: 'proj-1',
    agent: 'Sarah Chen',
    isAIBot: false,
  },
  {
    id: 'C-502',
    customer: 'Robert Brown',
    avatar: 'RB',
    preview: 'Thanks for your help!',
    time: '15 min ago',
    unread: 0,
    status: 'active',
    projectId: 'proj-2',
    agent: 'AI Bot',
    isAIBot: true,
  },
  {
    id: 'C-503',
    customer: 'Maria Garcia',
    avatar: 'MG',
    preview: 'Can you help me with checkout?',
    time: '5 min ago',
    unread: 1,
    status: 'active',
    projectId: 'proj-1',
    agent: 'Michael Chen',
    isAIBot: false,
  },
  {
    id: 'C-504',
    customer: 'James Wilson',
    avatar: 'JW',
    preview: 'The mobile app is crashing',
    time: '8 min ago',
    unread: 3,
    status: 'active',
    projectId: 'proj-2',
    agent: 'Emily Rodriguez',
    isAIBot: false,
  },
  {
    id: 'C-505',
    customer: 'Emily Chen',
    avatar: 'EC',
    preview: 'Question about pricing',
    time: '12 min ago',
    unread: 0,
    status: 'active',
    projectId: 'proj-3',
    agent: 'AI Bot',
    isAIBot: true,
  },
  {
    id: 'C-506',
    customer: 'David Lee',
    avatar: 'DL',
    preview: 'Need help with integration',
    time: '20 min ago',
    unread: 1,
    status: 'active',
    projectId: 'proj-3',
    agent: 'Sarah Chen',
    isAIBot: false,
  },
  {
    id: 'C-507',
    customer: 'Sarah Johnson',
    avatar: 'SJ',
    preview: 'I will check back later',
    time: '1 hour ago',
    unread: 0,
    status: 'offline',
    projectId: 'proj-4',
    agent: 'Michael Chen',
    isAIBot: false,
  },
];

export const mockChatMessages = [
  // Chat C-501 - Lisa Anderson
  {
    id: 'msg-1',
    chatId: 'C-501',
    sender: 'customer',
    text: 'Hi, I need help with...',
    timestamp: '2 min ago',
    isRead: true,
  },
  {
    id: 'msg-2',
    chatId: 'C-501',
    sender: 'agent',
    text: "I'd be happy to help! Can you provide more details about the issue you're experiencing?",
    timestamp: '1 min ago',
    isRead: true,
  },
  {
    id: 'msg-3',
    chatId: 'C-501',
    sender: 'customer',
    text: "Sure! I'm having trouble logging into my account. It keeps saying my password is incorrect.",
    timestamp: '30 sec ago',
    isRead: false,
  },
  {
    id: 'msg-4',
    chatId: 'C-501',
    sender: 'customer',
    text: "Yes, it's lisa.anderson@email.com",
    timestamp: 'Just now',
    isRead: false,
  },
  
  // Chat C-502 - Robert Brown
  {
    id: 'msg-5',
    chatId: 'C-502',
    sender: 'customer',
    text: 'I have a question about my recent order',
    timestamp: '20 min ago',
    isRead: true,
  },
  {
    id: 'msg-6',
    chatId: 'C-502',
    sender: 'agent',
    text: "Of course! I'd be happy to help with your order. Could you provide the order number?",
    timestamp: '18 min ago',
    isRead: true,
  },
  {
    id: 'msg-7',
    chatId: 'C-502',
    sender: 'customer',
    text: "It's #ORD-12345. The tracking shows it's delayed.",
    timestamp: '17 min ago',
    isRead: true,
  },
  {
    id: 'msg-8',
    chatId: 'C-502',
    sender: 'agent',
    text: "Let me check that for you right away. I can see there was a weather delay, but it should arrive tomorrow.",
    timestamp: '16 min ago',
    isRead: true,
  },
  {
    id: 'msg-9',
    chatId: 'C-502',
    sender: 'customer',
    text: 'Thanks for your help!',
    timestamp: '15 min ago',
    isRead: true,
  },
  
  // Chat C-503 - Maria Garcia
  {
    id: 'msg-10',
    chatId: 'C-503',
    sender: 'customer',
    text: 'Can you help me with checkout?',
    timestamp: '5 min ago',
    isRead: true,
  },
  {
    id: 'msg-11',
    chatId: 'C-503',
    sender: 'agent',
    text: "Absolutely! What issue are you experiencing during checkout?",
    timestamp: '4 min ago',
    isRead: true,
  },
  {
    id: 'msg-12',
    chatId: 'C-503',
    sender: 'customer',
    text: "My discount code isn't working",
    timestamp: '3 min ago',
    isRead: false,
  },
  
  // Chat C-504 - James Wilson
  {
    id: 'msg-13',
    chatId: 'C-504',
    sender: 'customer',
    text: 'The mobile app is crashing',
    timestamp: '10 min ago',
    isRead: true,
  },
  {
    id: 'msg-14',
    chatId: 'C-504',
    sender: 'agent',
    text: "I'm sorry to hear that. Can you tell me which device and OS version you're using?",
    timestamp: '9 min ago',
    isRead: true,
  },
  {
    id: 'msg-15',
    chatId: 'C-504',
    sender: 'customer',
    text: "iPhone 14, iOS 17.2",
    timestamp: '9 min ago',
    isRead: false,
  },
  {
    id: 'msg-16',
    chatId: 'C-504',
    sender: 'customer',
    text: "It crashes every time I try to upload a photo",
    timestamp: '8 min ago',
    isRead: false,
  },
  {
    id: 'msg-17',
    chatId: 'C-504',
    sender: 'customer',
    text: "Any update on this?",
    timestamp: '8 min ago',
    isRead: false,
  },
  
  // Chat C-505 - Emily Chen
  {
    id: 'msg-18',
    chatId: 'C-505',
    sender: 'customer',
    text: 'Question about pricing',
    timestamp: '15 min ago',
    isRead: true,
  },
  {
    id: 'msg-19',
    chatId: 'C-505',
    sender: 'agent',
    text: "I'd be happy to help with pricing information. What would you like to know?",
    timestamp: '14 min ago',
    isRead: true,
  },
  {
    id: 'msg-20',
    chatId: 'C-505',
    sender: 'customer',
    text: "Do you offer discounts for annual plans?",
    timestamp: '13 min ago',
    isRead: true,
  },
  {
    id: 'msg-21',
    chatId: 'C-505',
    sender: 'agent',
    text: "Yes! We offer 20% off on annual subscriptions. Would you like me to show you the pricing details?",
    timestamp: '12 min ago',
    isRead: true,
  },
  
  // Chat C-506 - David Lee
  {
    id: 'msg-22',
    chatId: 'C-506',
    sender: 'customer',
    text: 'Need help with integration',
    timestamp: '25 min ago',
    isRead: true,
  },
  {
    id: 'msg-23',
    chatId: 'C-506',
    sender: 'agent',
    text: "Sure! Which platform are you trying to integrate with?",
    timestamp: '23 min ago',
    isRead: true,
  },
  {
    id: 'msg-24',
    chatId: 'C-506',
    sender: 'customer',
    text: "Shopify - I can't find the API keys",
    timestamp: '20 min ago',
    isRead: false,
  },
  
  // Chat C-507 - Sarah Johnson (offline)
  {
    id: 'msg-25',
    chatId: 'C-507',
    sender: 'customer',
    text: 'Hi, is anyone available?',
    timestamp: '2 hours ago',
    isRead: true,
  },
  {
    id: 'msg-26',
    chatId: 'C-507',
    sender: 'agent',
    text: "Hello! Yes, I'm here. How can I help you today?",
    timestamp: '2 hours ago',
    isRead: true,
  },
  {
    id: 'msg-27',
    chatId: 'C-507',
    sender: 'customer',
    text: "I will check back later",
    timestamp: '1 hour ago',
    isRead: true,
  },
];

export const mockStats = {
  activeChats: 24,
  openTickets: 156,
  avgResponseTime: '2.5 min',
  satisfaction: '94%',
  resolvedToday: 89,
  newTickets: 32,
};

export const mockUsers = [
  { id: 1, username: 'sarah.chen', email: 'sarah@company.com', role: 'Agent', status: 'Active', lastActive: '2 min ago' },
  { id: 2, username: 'mike.johnson', email: 'mike@company.com', role: 'Agent', status: 'Active', lastActive: '10 min ago' },
  { id: 3, username: 'admin', email: 'admin@company.com', role: 'Admin', status: 'Active', lastActive: 'Now' },
];

export const mockArticles = [
  { id: 1, title: 'Getting Started Guide', category: 'Guides', views: 1250, helpful: 45 },
  { id: 2, title: 'How to Reset Password', category: 'Account', views: 890, helpful: 78 },
  { id: 3, title: 'Billing FAQs', category: 'Billing', views: 560, helpful: 34 },
];

export const mockPricingPlans = [
  {
    name: 'Free',
    priceMonthly: '$0',
    priceAnnual: '$0',
    period: 'forever',
    features: ['1 agent', 'Basic chat widget', '100 tickets/month', 'Email support', '7-day chat history'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Starter',
    priceMonthly: '$19',
    priceAnnual: '$15',
    period: 'per user/month',
    features: ['Up to 5 agents', 'Unlimited chats', 'Unlimited tickets', 'Email & chat support', '30-day history', 'Basic analytics'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Pro',
    priceMonthly: '$49',
    priceAnnual: '$39',
    period: 'per user/month',
    features: ['Unlimited agents', 'AI chatbots', 'Advanced analytics', 'Priority support', 'Unlimited history', 'Custom integrations', 'SLA management'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    priceMonthly: 'Custom',
    priceAnnual: 'Custom',
    period: 'contact us',
    features: ['Everything in Pro', 'Dedicated account manager', 'Custom AI training', 'White-label options', 'GDPR compliance tools', 'Advanced security', '24/7 phone support'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const mockTestimonials = [
  { quote: 'LinoChat transformed our customer service. Response times dropped by 60% and our CSAT score hit an all-time high.', author: 'Jennifer Martinez', role: 'Head of Support', company: 'TechCorp', avatar: 'JM' },
  { quote: 'The AI automation saves us hours every day. Best investment we made this year — paid for itself in the first week.', author: 'David Kim', role: 'CEO', company: 'StartupXYZ', avatar: 'DK' },
  { quote: 'Incredibly intuitive interface. Our team was up and running in minutes, no training needed.', author: 'Sophie Laurent', role: 'Customer Success Manager', company: 'Global Services', avatar: 'SL' },
  { quote: 'We went from 3 support agents to 1 agent + LinoChat AI. The bot handles 80% of conversations perfectly.', author: 'Marcus Chen', role: 'Operations Director', company: 'CloudNine SaaS', avatar: 'MC' },
  { quote: 'The knowledge base auto-generation is magic. It scraped our site and built a complete FAQ in minutes.', author: 'Rachel Adams', role: 'Product Manager', company: 'DesignHub', avatar: 'RA' },
  { quote: 'Our customers love the instant responses. We no longer lose leads to slow reply times.', author: 'Thomas Berg', role: 'Sales Director', company: 'Nordic Digital', avatar: 'TB' },
  { quote: 'Setup was ridiculously easy — one script tag and we were live. The widget looks beautiful on our site.', author: 'Aisha Patel', role: 'CTO', company: 'FreshCart', avatar: 'AP' },
  { quote: 'LinoChat helped us scale support across 3 time zones without hiring. The AI never sleeps.', author: 'James Wilson', role: 'VP of Customer Experience', company: 'Nexus Labs', avatar: 'JW' },
  { quote: "The handover from AI to human is seamless. Customers don't even notice the transition.", author: 'Elena Volkov', role: 'Support Team Lead', company: 'Prism Analytics', avatar: 'EV' },
  { quote: 'We tried 4 other chat tools before LinoChat. Nothing comes close to the AI quality and ease of use.', author: "Ryan O'Brien", role: 'Founder', company: 'Greenline Agency', avatar: 'RO' },
];

// Customer Activity History
export const mockCustomerActivity = {
  'C-501': {
    customer: 'Lisa Anderson',
    browser: 'Chrome 120.0',
    device: 'Desktop - Windows',
    location: 'San Francisco, CA',
    sessionStart: '2024-12-20 10:23 AM',
    chatInitiatedFrom: '/products/premium-plan',
    totalTickets: 12,
    customerTier: 'Premium',
    pagesVisited: [
      { page: 'Homepage', url: '/', timestamp: '10:23 AM', duration: '2m 15s' },
      { page: 'Pricing Page', url: '/pricing', timestamp: '10:25 AM', duration: '3m 42s' },
      { page: 'Premium Plan Details', url: '/products/premium-plan', timestamp: '10:29 AM', duration: '1m 30s' },
      { page: 'Chat Initiated', url: '/products/premium-plan', timestamp: '10:30 AM', duration: 'Active' },
    ],
    previousChats: [
      { 
        date: '2024-12-15', 
        topic: 'Billing inquiry', 
        duration: '8 minutes', 
        agent: 'Mike Johnson',
        messages: [
          { sender: 'customer', text: 'Hi, I have a question about my recent invoice.', time: '2:15 PM' },
          { sender: 'agent', text: 'Hello! I\'d be happy to help you with your billing question. What would you like to know?', time: '2:16 PM' },
          { sender: 'customer', text: 'I was charged twice for my subscription this month. Can you check that?', time: '2:16 PM' },
          { sender: 'agent', text: 'Let me look into that for you right away. I\'m pulling up your account now.', time: '2:17 PM' },
          { sender: 'agent', text: 'I can see what happened. There was a duplicate charge on Dec 5th. I\'ve already initiated a refund for you. It should appear in your account within 3-5 business days.', time: '2:19 PM' },
          { sender: 'customer', text: 'That\'s great, thank you! Will this affect my subscription?', time: '2:20 PM' },
          { sender: 'agent', text: 'Not at all! Your subscription remains active and this won\'t impact your service. Is there anything else I can help you with today?', time: '2:21 PM' },
          { sender: 'customer', text: 'No, that\'s all. Thanks for the quick help!', time: '2:22 PM' },
          { sender: 'agent', text: 'You\'re very welcome! Have a great day!', time: '2:23 PM' },
        ]
      },
      { 
        date: '2024-12-10', 
        topic: 'Feature question', 
        duration: '5 minutes', 
        agent: 'Sarah Chen',
        messages: [
          { sender: 'customer', text: 'Does your platform support multi-language chatbots?', time: '11:05 AM' },
          { sender: 'agent', text: 'Hi there! Yes, we do support multi-language chatbots. Our premium plan includes support for over 50 languages.', time: '11:05 AM' },
          { sender: 'customer', text: 'That\'s perfect! Can I switch languages automatically based on the customer\'s location?', time: '11:06 AM' },
          { sender: 'agent', text: 'Absolutely! You can set up automatic language detection based on browser settings or IP location. You can also let customers manually select their preferred language.', time: '11:07 AM' },
          { sender: 'customer', text: 'Excellent. How do I set this up?', time: '11:08 AM' },
          { sender: 'agent', text: 'I can send you a guide right now. You\'ll find the settings in Dashboard > Chatbot > Language Settings. Would you like me to email you the detailed setup guide?', time: '11:09 AM' },
          { sender: 'customer', text: 'Yes please, that would be great!', time: '11:09 AM' },
          { sender: 'agent', text: 'Just sent it to your email! Let me know if you need any help setting it up.', time: '11:10 AM' },
        ]
      },
    ],
    referralSource: 'Google Search - "best customer support software"',
  },
  'C-502': {
    customer: 'Robert Brown',
    browser: 'Safari 17.2',
    device: 'Mobile - iPhone 15',
    location: 'New York, NY',
    sessionStart: '2024-12-20 10:15 AM',
    chatInitiatedFrom: '/help/getting-started',
    pagesVisited: [
      { page: 'Help Center', url: '/help', timestamp: '10:15 AM', duration: '1m 20s' },
      { page: 'Getting Started Guide', url: '/help/getting-started', timestamp: '10:16 AM', duration: '4m 10s' },
      { page: 'Chat Initiated', url: '/help/getting-started', timestamp: '10:20 AM', duration: 'Active' },
    ],
    previousChats: [
      { 
        date: '2024-12-18', 
        topic: 'Technical support', 
        duration: '12 minutes', 
        agent: 'Sarah Chen',
        messages: [
          { sender: 'customer', text: 'I\'m having trouble connecting the chat widget to my website.', time: '3:30 PM' },
          { sender: 'agent', text: 'Hi! I\'m here to help. What error are you seeing when you try to connect?', time: '3:31 PM' },
          { sender: 'customer', text: 'It says "Invalid API key" but I copied it directly from the dashboard.', time: '3:32 PM' },
          { sender: 'agent', text: 'Let me check your integration settings. What platform is your website built on?', time: '3:33 PM' },
          { sender: 'customer', text: 'WordPress with a custom theme.', time: '3:33 PM' },
          { sender: 'agent', text: 'I see the issue. It looks like there\'s a space at the end of your API key. Can you try removing any extra spaces and pasting it again?', time: '3:35 PM' },
          { sender: 'customer', text: 'Let me try... Oh wow, that worked! It\'s showing up now.', time: '3:38 PM' },
          { sender: 'agent', text: 'Perfect! The widget should be live on your site now. Try opening it from your website to test it out.', time: '3:39 PM' },
          { sender: 'customer', text: 'Yes! It\'s working perfectly. Thank you so much!', time: '3:40 PM' },
          { sender: 'agent', text: 'You\'re welcome! Don\'t hesitate to reach out if you need anything else.', time: '3:41 PM' },
        ]
      },
    ],
    referralSource: 'Direct Traffic',
  },
  'C-503': {
    customer: 'Maria Garcia',
    browser: 'Firefox 121.0',
    device: 'Desktop - macOS',
    location: 'Austin, TX',
    sessionStart: '2024-12-20 10:25 AM',
    chatInitiatedFrom: '/checkout',
    pagesVisited: [
      { page: 'Homepage', url: '/', timestamp: '10:25 AM', duration: '1m 05s' },
      { page: 'Products', url: '/products', timestamp: '10:26 AM', duration: '2m 30s' },
      { page: 'Shopping Cart', url: '/cart', timestamp: '10:28 AM', duration: '1m 45s' },
      { page: 'Checkout', url: '/checkout', timestamp: '10:30 AM', duration: '0m 45s' },
      { page: 'Chat Initiated', url: '/checkout', timestamp: '10:30 AM', duration: 'Active' },
    ],
    previousChats: [],
    referralSource: 'Facebook Ad Campaign',
  },
  'C-504': {
    customer: 'James Wilson',
    browser: 'Chrome 120.0',
    device: 'Mobile - Android',
    location: 'Seattle, WA',
    sessionStart: '2024-12-20 10:22 AM',
    chatInitiatedFrom: '/mobile-app-support',
    pagesVisited: [
      { page: 'Mobile App Page', url: '/mobile-app', timestamp: '10:22 AM', duration: '1m 30s' },
      { page: 'Troubleshooting', url: '/mobile-app-support', timestamp: '10:23 AM', duration: '2m 15s' },
      { page: 'Chat Initiated', url: '/mobile-app-support', timestamp: '10:25 AM', duration: 'Active' },
    ],
    previousChats: [
      { 
        date: '2024-12-16', 
        topic: 'App installation help', 
        duration: '15 minutes', 
        agent: 'Mike Johnson',
        messages: [
          { sender: 'customer', text: 'I can\'t install the mobile app. It keeps failing.', time: '4:10 PM' },
          { sender: 'agent', text: 'I\'m sorry to hear that! Let\'s get this sorted out. What device are you using?', time: '4:11 PM' },
          { sender: 'customer', text: 'Samsung Galaxy S23, Android 14.', time: '4:11 PM' },
          { sender: 'agent', text: 'Thanks! What error message are you seeing during installation?', time: '4:12 PM' },
          { sender: 'customer', text: '"App not installed. Package conflicts with existing package."', time: '4:13 PM' },
          { sender: 'agent', text: 'This usually means there\'s an older version of the app. Could you go to Settings > Apps > ChatSupport and uninstall it first?', time: '4:14 PM' },
          { sender: 'customer', text: 'I don\'t see ChatSupport in my apps list though.', time: '4:16 PM' },
          { sender: 'agent', text: 'In that case, let\'s try clearing the Google Play Store cache. Go to Settings > Apps > Google Play Store > Storage > Clear Cache.', time: '4:17 PM' },
          { sender: 'customer', text: 'Okay, done that. Should I try installing again?', time: '4:19 PM' },
          { sender: 'agent', text: 'Yes, please try now. Also make sure you have at least 100MB of free storage.', time: '4:19 PM' },
          { sender: 'customer', text: 'It\'s installing! Taking a while but the progress bar is moving.', time: '4:21 PM' },
          { sender: 'agent', text: 'Great news! Let me know once it\'s complete and we\'ll get you logged in.', time: '4:21 PM' },
          { sender: 'customer', text: 'Done! It\'s installed now. Thanks for your help!', time: '4:24 PM' },
          { sender: 'agent', text: 'Excellent! Welcome aboard. Let me know if you need help setting up your account.', time: '4:25 PM' },
        ]
      },
      { 
        date: '2024-12-12', 
        topic: 'Login issues', 
        duration: '6 minutes', 
        agent: 'Sarah Chen',
        messages: [
          { sender: 'customer', text: 'I can\'t log into my account. Says my password is wrong.', time: '10:15 AM' },
          { sender: 'agent', text: 'Hi! Let\'s get you back in. Have you tried resetting your password?', time: '10:16 AM' },
          { sender: 'customer', text: 'Not yet. How do I do that?', time: '10:16 AM' },
          { sender: 'agent', text: 'On the login screen, click "Forgot Password" and enter your email. You\'ll get a reset link.', time: '10:17 AM' },
          { sender: 'customer', text: 'Okay, I sent the request. How long does it take?', time: '10:18 AM' },
          { sender: 'agent', text: 'Should be instant. Check your inbox and spam folder for an email from noreply@chatsupport.com', time: '10:18 AM' },
          { sender: 'customer', text: 'Got it! Resetting now... Okay I\'m in! Thanks!', time: '10:20 AM' },
          { sender: 'agent', text: 'Perfect! Make sure to use a strong password and consider enabling two-factor authentication for extra security.', time: '10:21 AM' },
        ]
      },
    ],
    referralSource: 'App Store Link',
  },
  'C-505': {
    customer: 'Emily Chen',
    browser: 'Edge 120.0',
    device: 'Desktop - Windows',
    location: 'Boston, MA',
    sessionStart: '2024-12-20 10:18 AM',
    chatInitiatedFrom: '/pricing',
    pagesVisited: [
      { page: 'Homepage', url: '/', timestamp: '10:18 AM', duration: '0m 45s' },
      { page: 'Features', url: '/features', timestamp: '10:19 AM', duration: '3m 20s' },
      { page: 'Pricing', url: '/pricing', timestamp: '10:22 AM', duration: '2m 40s' },
      { page: 'Chat Initiated', url: '/pricing', timestamp: '10:24 AM', duration: 'Active' },
    ],
    previousChats: [
      { 
        date: '2024-12-19', 
        topic: 'Pricing comparison', 
        duration: '10 minutes', 
        agent: 'Sarah Chen',
        messages: [
          { sender: 'customer', text: 'Hi, can you help me understand the difference between your Business and Enterprise plans?', time: '2:45 PM' },
          { sender: 'agent', text: 'Of course! I\'d be happy to help. What\'s your main use case?', time: '2:46 PM' },
          { sender: 'customer', text: 'We\'re a growing company with about 50 employees. We need good analytics and custom branding.', time: '2:47 PM' },
          { sender: 'agent', text: 'Perfect! Both plans include custom branding and analytics. The main differences are: Business supports up to 5 team members, while Enterprise is unlimited. Enterprise also includes priority support and dedicated account manager.', time: '2:48 PM' },
          { sender: 'customer', text: 'We only need 3-4 agents, so Business might work. What about API access?', time: '2:49 PM' },
          { sender: 'agent', text: 'Great question! Business includes API access with 10K calls/month. Enterprise has unlimited API calls. What\'s your expected API usage?', time: '2:50 PM' },
          { sender: 'customer', text: 'We\'re building some integrations, maybe 5K calls per month to start.', time: '2:51 PM' },
          { sender: 'agent', text: 'Then Business plan would be perfect for you! You\'ll have plenty of headroom. Plus you can always upgrade to Enterprise if you need more later.', time: '2:51 PM' },
          { sender: 'customer', text: 'That makes sense. Is there a trial period?', time: '2:52 PM' },
          { sender: 'agent', text: 'Yes! We offer a 14-day free trial on all plans. No credit card required. Want me to set that up for you?', time: '2:53 PM' },
          { sender: 'customer', text: 'Sure, let\'s do that!', time: '2:54 PM' },
          { sender: 'agent', text: 'Perfect! I\'ll send you a link to get started with your Business plan trial right now.', time: '2:54 PM' },
        ]
      },
    ],
    referralSource: 'LinkedIn Ad',
  },
  'C-506': {
    customer: 'David Lee',
    browser: 'Chrome 120.0',
    device: 'Desktop - macOS',
    location: 'Los Angeles, CA',
    sessionStart: '2024-12-20 10:05 AM',
    chatInitiatedFrom: '/integrations/shopify',
    pagesVisited: [
      { page: 'Integrations', url: '/integrations', timestamp: '10:05 AM', duration: '2m 10s' },
      { page: 'Shopify Integration', url: '/integrations/shopify', timestamp: '10:07 AM', duration: '4m 30s' },
      { page: 'API Documentation', url: '/docs/api', timestamp: '10:11 AM', duration: '3m 15s' },
      { page: 'Chat Initiated', url: '/integrations/shopify', timestamp: '10:14 AM', duration: 'Active' },
    ],
    previousChats: [
      { date: '2024-12-17', topic: 'API setup', duration: '18 minutes', agent: 'Mike Johnson' },
    ],
    referralSource: 'Google Search - "shopify customer support integration"',
  },
  'C-507': {
    customer: 'Sarah Johnson',
    browser: 'Safari 17.2',
    device: 'Tablet - iPad',
    location: 'Miami, FL',
    sessionStart: '2024-12-20 8:30 AM',
    chatInitiatedFrom: '/contact',
    pagesVisited: [
      { page: 'Homepage', url: '/', timestamp: '8:30 AM', duration: '1m 30s' },
      { page: 'About Us', url: '/about', timestamp: '8:31 AM', duration: '2m 00s' },
      { page: 'Contact', url: '/contact', timestamp: '8:33 AM', duration: '0m 50s' },
      { page: 'Chat Initiated', url: '/contact', timestamp: '8:34 AM', duration: 'Ended' },
    ],
    previousChats: [],
    referralSource: 'Twitter Post',
  },
};

/** Activity data shape for the Info panel */
export type CustomerActivity = {
  customer: string;
  browser: string;
  device: string;
  location: string;
  sessionStart: string;
  chatInitiatedFrom: string;
  pagesVisited: Array<{ page: string; url: string; timestamp: string; duration: string }>;
  previousChats: Array<{ date: string; topic: string; duration: string; agent: string; messages?: Array<{ sender: string; text: string; time: string }> }>;
  referralSource: string;
  totalTickets?: number;
  customerTier?: string;
};

/**
 * Get activity data for a chat. Uses mock data when ID matches, otherwise builds from chat + defaults.
 */
export function getActivityForChat(chat: { id?: string; customer_name?: string; customer_email?: string; created_at?: string; metadata?: Record<string, unknown> } | null): CustomerActivity | null {
  if (!chat) return null;

  const mock = mockCustomerActivity[chat.id as keyof typeof mockCustomerActivity];
  if (mock) return mock as CustomerActivity;

  // Fallback: use first mock entry as template, override with real chat data
  const template = Object.values(mockCustomerActivity)[0] as CustomerActivity;
  const createdAt = chat.created_at ? new Date(chat.created_at) : new Date();
  const sessionStart = createdAt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

  return {
    ...template,
    customer: chat.customer_name || chat.customer_email || 'Guest',
    sessionStart,
    chatInitiatedFrom: (chat.metadata as { current_page?: string })?.current_page || '/',
    pagesVisited: [
      { page: 'Chat Initiated', url: (chat.metadata as { current_page?: string })?.current_page || '/', timestamp: sessionStart.split(' ').slice(1).join(' ') || '', duration: 'Active' },
    ],
    previousChats: [],
    totalTickets: template.totalTickets,
    customerTier: template.customerTier,
  };
}