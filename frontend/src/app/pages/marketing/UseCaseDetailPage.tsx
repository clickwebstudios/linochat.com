import { useParams, Link, Navigate } from 'react-router-dom';
import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import SEOHead from '../../components/SEOHead';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Bot,
  Zap,
  Clock,
  TrendingUp,
  Users,
  Shield,
  Star,
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

interface UseCaseData {
  id: string;
  title: string;
  tagline: string;
  heroDescription: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  stats: { value: string; label: string }[];
  challenge: { title: string; points: string[] };
  solution: { title: string; points: { heading: string; detail: string }[] };
  features: string[];
  workflow: { step: string; description: string }[];
  testimonial: { quote: string; author: string; role: string; company: string };
  cta: string;
}

const useCaseData: Record<string, UseCaseData> = {
  ecommerce: {
    id: 'ecommerce',
    title: 'E-Commerce & Retail',
    tagline: 'Convert browsers into buyers with AI-powered support',
    heroDescription: 'Online shoppers expect instant answers. LinoChat helps e-commerce businesses provide 24/7 support, reduce cart abandonment, and increase conversions — without growing your support team.',
    color: 'blue',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-indigo-700',
    stats: [
      { value: '80%', label: 'Faster response times' },
      { value: '35%', label: 'Less cart abandonment' },
      { value: '60%', label: 'Support cost savings' },
      { value: '24/7', label: 'Availability' },
    ],
    challenge: {
      title: 'The E-Commerce Support Challenge',
      points: [
        'Customers abandon carts when they can\'t get quick answers about sizing, shipping, or returns',
        'Support teams are overwhelmed during sales events and peak seasons',
        'After-hours inquiries go unanswered, losing international customers',
        'Repetitive questions about order status and return policies drain agent time',
      ],
    },
    solution: {
      title: 'How LinoChat Solves It',
      points: [
        { heading: 'Instant Product Answers', detail: 'AI trained on your product catalog answers sizing, availability, and shipping questions instantly.' },
        { heading: 'Automated Order Tracking', detail: 'Customers check order status without waiting for an agent. Integration with your order management system.' },
        { heading: 'Smart Return Processing', detail: 'Guide customers through return policies and initiate returns automatically.' },
        { heading: 'AI-Powered Upselling', detail: 'Recommend related products based on conversation context and browsing behavior.' },
      ],
    },
    features: [
      'Product catalog integration for instant answers',
      'Order status lookup and tracking',
      'Return and exchange automation',
      'Multi-language support for global stores',
      'Peak season scaling without hiring',
      'Seamless handover to human agents',
    ],
    workflow: [
      { step: 'Customer visits your store', description: 'Widget loads automatically on your site. Greeting message appears after configurable delay.' },
      { step: 'AI answers instantly', description: 'Customer asks about sizing — AI responds with accurate product details from your knowledge base.' },
      { step: 'Cart recovery', description: 'If customer hesitates, AI proactively offers help, answers objections, and suggests alternatives.' },
      { step: 'Agent steps in when needed', description: 'Complex issues get routed to your team with full conversation context.' },
    ],
    testimonial: {
      quote: 'LinoChat handles 80% of our pre-sale questions automatically. Our conversion rate jumped 25% in the first month.',
      author: 'Sarah Chen',
      role: 'Head of E-Commerce',
      company: 'StyleVault',
    },
    cta: 'Start converting more shoppers today',
  },
  saas: {
    id: 'saas',
    title: 'SaaS & Technology',
    tagline: 'Scale support without scaling your team',
    heroDescription: 'Technical support doesn\'t have to be a bottleneck. LinoChat deflects repetitive questions with AI trained on your docs, so your engineers can focus on building.',
    color: 'purple',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-pink-700',
    stats: [
      { value: '70%', label: 'Ticket deflection rate' },
      { value: '<30s', label: 'First response time' },
      { value: '+25%', label: 'CSAT improvement' },
      { value: '10x', label: 'Support capacity' },
    ],
    challenge: {
      title: 'The SaaS Support Challenge',
      points: [
        'Engineers waste hours answering "how do I reset my password?" instead of shipping features',
        'Documentation exists but customers can\'t find answers',
        'Global users expect support across all time zones',
        'Onboarding new users requires significant hand-holding',
      ],
    },
    solution: {
      title: 'How LinoChat Solves It',
      points: [
        { heading: 'Auto-Generated Knowledge Base', detail: 'LinoChat scrapes your docs and builds a searchable AI knowledge base automatically.' },
        { heading: 'Technical Troubleshooting', detail: 'Context-aware AI guides users through common issues step by step.' },
        { heading: 'Bug Report Collection', detail: 'Structured ticket creation with environment details, steps to reproduce, and screenshots.' },
        { heading: 'API & Webhook Integration', detail: 'Connect LinoChat with your stack — Slack, Jira, Linear, GitHub, and more.' },
      ],
    },
    features: [
      'Documentation auto-import and AI training',
      'Code snippet sharing in chat',
      'Structured bug report templates',
      'Slack and Jira integration',
      'Usage-based analytics and reporting',
      'Multi-tier support routing',
    ],
    workflow: [
      { step: 'User hits a blocker', description: 'Customer encounters an issue and opens the chat widget from your app or docs.' },
      { step: 'AI searches your docs', description: 'LinoChat finds the relevant article or guide and presents it conversationally.' },
      { step: 'Guided troubleshooting', description: 'If the answer isn\'t in docs, AI asks diagnostic questions and creates a structured ticket.' },
      { step: 'Engineer gets context', description: 'When escalated, the agent sees full conversation history, environment details, and error logs.' },
    ],
    testimonial: {
      quote: 'We reduced our support ticket volume by 70% in two months. Our engineers finally have time to code.',
      author: 'Alex Rivera',
      role: 'VP of Engineering',
      company: 'CloudStack',
    },
    cta: 'Free your engineering team today',
  },
  healthcare: {
    id: 'healthcare',
    title: 'Healthcare & Wellness',
    tagline: 'Better patient communication, less admin burden',
    heroDescription: 'Patients expect quick, accurate responses about appointments, insurance, and care instructions. LinoChat automates the routine so your staff can focus on patient care.',
    color: 'emerald',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-teal-700',
    stats: [
      { value: '+45%', label: 'Appointment bookings' },
      { value: '30%', label: 'No-show reduction' },
      { value: '50%', label: 'Admin time saved' },
      { value: '24/7', label: 'Patient access' },
    ],
    challenge: {
      title: 'The Healthcare Communication Challenge',
      points: [
        'Phone lines are constantly busy with routine scheduling and billing questions',
        'Patients forget appointments without automated reminders',
        'After-hours inquiries go unanswered until the next business day',
        'Staff spend hours on insurance verification and pre-visit paperwork',
      ],
    },
    solution: {
      title: 'How LinoChat Solves It',
      points: [
        { heading: 'Automated Scheduling', detail: 'Patients book, reschedule, and cancel appointments through the chat — integrated with your calendar.' },
        { heading: 'Pre-Visit Forms', detail: 'Collect insurance information, medical history, and consent forms before the patient arrives.' },
        { heading: 'Insurance & Billing FAQs', detail: 'AI answers common questions about coverage, copays, and billing procedures.' },
        { heading: 'After-Hours Triage', detail: 'Handle non-emergency inquiries 24/7 and route urgent cases to on-call staff.' },
      ],
    },
    features: [
      'Calendar integration for appointment scheduling',
      'Patient intake form collection',
      'Insurance verification assistance',
      'Prescription refill request routing',
      'Multi-language patient support',
      'Appointment reminder automation',
    ],
    workflow: [
      { step: 'Patient visits your website', description: 'Chat widget offers to help with scheduling, insurance questions, or general inquiries.' },
      { step: 'AI handles routine requests', description: 'Appointment scheduling, directions, insurance accepted — all answered instantly.' },
      { step: 'Forms collected digitally', description: 'Pre-visit paperwork completed in chat, reducing wait times at the office.' },
      { step: 'Staff alerted for clinical questions', description: 'Medical questions are routed to appropriate staff with full conversation context.' },
    ],
    testimonial: {
      quote: 'Our no-show rate dropped 30% with automated reminders. Patients love booking appointments through chat.',
      author: 'Dr. Maria Santos',
      role: 'Practice Manager',
      company: 'Harmony Health Clinic',
    },
    cta: 'Modernize your patient communication',
  },
  services: {
    id: 'services',
    title: 'Home Services',
    tagline: 'Book more jobs, answer fewer phone calls',
    heroDescription: 'When homeowners need a plumber at midnight or an HVAC tech on a holiday, LinoChat captures those leads and books appointments — even when your team is off the clock.',
    color: 'orange',
    gradientFrom: 'from-orange-600',
    gradientTo: 'to-amber-700',
    stats: [
      { value: '3x', label: 'Lead capture rate' },
      { value: '+55%', label: 'Booking conversion' },
      { value: '40%', label: 'After-hours leads' },
      { value: '<2min', label: 'Average response' },
    ],
    challenge: {
      title: 'The Home Services Challenge',
      points: [
        'Missed calls = missed revenue. Homeowners call the next company on the list.',
        'After-hours emergencies go to voicemail and competitors',
        'Technicians can\'t answer phones while on the job',
        'Quoting and scheduling is manual and time-consuming',
      ],
    },
    solution: {
      title: 'How LinoChat Solves It',
      points: [
        { heading: 'Instant Quote Estimates', detail: 'AI provides ballpark pricing based on service type and description.' },
        { heading: 'Automated Scheduling', detail: 'Integration with your calendar for real-time availability and booking.' },
        { heading: 'After-Hours Lead Capture', detail: '40% of service requests come outside business hours. Never miss one.' },
        { heading: 'Service Area Checking', detail: 'Automatically verify if the customer is in your service area before booking.' },
      ],
    },
    features: [
      'Service catalog with pricing guides',
      'Calendar integration for real-time booking',
      'Service area and zip code validation',
      'Emergency vs routine request routing',
      'Photo and video upload for assessments',
      'Follow-up and review request automation',
    ],
    workflow: [
      { step: 'Homeowner has a problem', description: 'They visit your site at 10pm with a leaking pipe. Chat widget greets them immediately.' },
      { step: 'AI qualifies the lead', description: 'Collects service type, location, urgency, and contact info. Checks service area.' },
      { step: 'Appointment booked', description: 'Based on availability, the AI books the next available slot and sends confirmation.' },
      { step: 'You show up prepared', description: 'Technician has full details — what\'s wrong, photos if provided, and customer contact.' },
    ],
    testimonial: {
      quote: 'We capture 3x more leads now. The AI books appointments while my guys are out on jobs.',
      author: 'Mike Torres',
      role: 'Owner',
      company: 'RapidFix Plumbing',
    },
    cta: 'Start capturing after-hours leads',
  },
  education: {
    id: 'education',
    title: 'Education & Training',
    tagline: 'Support students and prospects at scale',
    heroDescription: 'Prospective students have questions about programs, admissions, and financial aid at all hours. LinoChat answers them instantly, improving enrollment and student satisfaction.',
    color: 'cyan',
    gradientFrom: 'from-cyan-600',
    gradientTo: 'to-blue-700',
    stats: [
      { value: '85%', label: 'Inquiries handled by AI' },
      { value: 'Instant', label: 'Response time' },
      { value: '20+', label: 'Staff hours saved/week' },
      { value: '+30%', label: 'Enrollment conversion' },
    ],
    challenge: { title: 'The Education Challenge', points: ['Admissions teams overwhelmed during enrollment periods', 'Students expect instant answers about courses and deadlines', 'International prospects in different time zones', 'Repetitive questions about financial aid and prerequisites'] },
    solution: { title: 'How LinoChat Solves It', points: [
      { heading: 'Course Catalog on Demand', detail: 'AI provides program details, prerequisites, schedules, and tuition instantly.' },
      { heading: 'Enrollment Assistance', detail: 'Guide applicants through the enrollment process step by step.' },
      { heading: 'Financial Aid FAQs', detail: 'Answer scholarship, grant, and loan questions automatically.' },
      { heading: 'Event Registration', detail: 'Campus tours, open days, and info sessions booked through chat.' },
    ]},
    features: ['Program and course information delivery', 'Application status checking', 'Financial aid calculator integration', 'Campus tour scheduling', 'Multi-language support', 'Student portal FAQ automation'],
    workflow: [
      { step: 'Prospect discovers your institution', description: 'They browse programs and have questions about requirements and deadlines.' },
      { step: 'AI answers program questions', description: 'Detailed information about courses, faculty, campus life — all from your knowledge base.' },
      { step: 'Application guidance', description: 'AI walks them through the application process and required documents.' },
      { step: 'Admissions team follows up', description: 'Qualified leads are routed to admissions with complete interest profile.' },
    ],
    testimonial: { quote: 'LinoChat handles 85% of our admissions inquiries. Our team focuses on the ones that need a personal touch.', author: 'Prof. Linda Chang', role: 'Director of Admissions', company: 'Pacific Technical Institute' },
    cta: 'Improve your enrollment process',
  },
  realestate: {
    id: 'realestate',
    title: 'Real Estate',
    tagline: 'Never miss a hot lead again',
    heroDescription: 'Real estate moves fast. When a buyer finds their dream home at midnight, LinoChat qualifies them and schedules a viewing — before your competitors even see the inquiry.',
    color: 'rose',
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-pink-700',
    stats: [
      { value: '90%', label: 'Lead qualification rate' },
      { value: '+40%', label: 'Viewing bookings' },
      { value: '<1min', label: 'Response time' },
      { value: '65%', label: 'After-hours captures' },
    ],
    challenge: { title: 'The Real Estate Challenge', points: ['Leads go cold when agents are showing properties and can\'t respond', 'Buyers browse listings at night and weekends', 'Qualifying leads manually wastes agent time on tire-kickers', 'Multiple listing inquiries need fast, personalized responses'] },
    solution: { title: 'How LinoChat Solves It', points: [
      { heading: 'Instant Property Details', detail: 'AI answers questions about any listing — price, features, neighborhood, schools.' },
      { heading: 'Lead Qualification', detail: 'Automatically collects budget, timeline, location preferences, and pre-approval status.' },
      { heading: 'Viewing Scheduling', detail: 'Books property viewings directly into your calendar based on availability.' },
      { heading: 'Market Insights', detail: 'Provides neighborhood info, market trends, and comparable sales data.' },
    ]},
    features: ['Listing detail inquiries', 'Buyer qualification questionnaire', 'Viewing and open house scheduling', 'Mortgage calculator integration', 'Neighborhood information delivery', 'Agent routing by specialty/area'],
    workflow: [
      { step: 'Buyer finds a listing', description: 'They\'re on your site at 11pm, excited about a property. Chat widget engages.' },
      { step: 'AI answers and qualifies', description: 'Property details shared instantly. Budget, timeline, and needs collected.' },
      { step: 'Viewing scheduled', description: 'Qualified buyer books a showing for the next available slot.' },
      { step: 'Agent arrives prepared', description: 'Full buyer profile — budget, must-haves, competing properties they\'re considering.' },
    ],
    testimonial: { quote: 'I closed 3 deals last month from leads that came in after midnight. LinoChat never sleeps.', author: 'Jason Park', role: 'Senior Agent', company: 'Meridian Realty Group' },
    cta: 'Capture more real estate leads',
  },
  hospitality: {
    id: 'hospitality',
    title: 'Restaurants & Hospitality',
    tagline: 'Serve guests before they walk in the door',
    heroDescription: 'From reservation booking to dietary accommodations, LinoChat handles the questions that keep your host stand tied up on the phone.',
    color: 'amber',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-yellow-700',
    stats: [
      { value: '+35%', label: 'Reservation bookings' },
      { value: '50%', label: 'Phone call reduction' },
      { value: '4.8/5', label: 'Guest satisfaction' },
      { value: '15+', label: 'Languages supported' },
    ],
    challenge: { title: 'The Hospitality Challenge', points: ['Phone lines jammed during peak dining hours', 'Guests need menu info for dietary restrictions and allergies', 'Event and catering inquiries need detailed follow-up', 'International guests need multi-language support'] },
    solution: { title: 'How LinoChat Solves It', points: [
      { heading: 'Online Reservations', detail: 'Guests book tables through chat with real-time availability checking.' },
      { heading: 'Menu Browsing', detail: 'AI answers questions about ingredients, allergens, and dietary options.' },
      { heading: 'Event Planning', detail: 'Collect event details, guest count, and preferences for catering inquiries.' },
      { heading: 'Multi-Language', detail: 'Serve international guests in their preferred language automatically.' },
    ]},
    features: ['Reservation management', 'Menu and dietary filtering', 'Event and catering inquiry forms', 'Multi-language auto-detection', 'Wait time estimates', 'Review and feedback collection'],
    workflow: [
      { step: 'Guest looks up your restaurant', description: 'They want to book for Saturday with a gluten-free guest. Chat widget appears.' },
      { step: 'AI handles the booking', description: 'Checks availability, notes dietary needs, confirms the reservation.' },
      { step: 'Pre-visit information', description: 'Sends directions, parking info, and menu highlights based on dietary preferences.' },
      { step: 'Post-visit follow-up', description: 'Automated thank-you message with review request and next-visit incentive.' },
    ],
    testimonial: { quote: 'Our phone barely rings for reservations anymore. Guests love the convenience of booking through chat.', author: 'Chef Isabella Rossi', role: 'Owner', company: 'Trattoria Bella' },
    cta: 'Fill more tables with less effort',
  },
  automotive: {
    id: 'automotive',
    title: 'Automotive',
    tagline: 'Your digital sales assistant that never takes a day off',
    heroDescription: 'Car buyers research online before visiting the lot. LinoChat engages them early, answers inventory questions, and books test drives — before they visit a competitor.',
    color: 'slate',
    gradientFrom: 'from-slate-700',
    gradientTo: 'to-gray-800',
    stats: [
      { value: '+60%', label: 'Test drive bookings' },
      { value: '<2min', label: 'Lead response time' },
      { value: '45%', label: 'After-hours leads' },
      { value: '3x', label: 'Lead-to-visit rate' },
    ],
    challenge: { title: 'The Automotive Challenge', points: ['Online shoppers browse inventory but leave without engaging', 'Sales team can\'t respond to web leads fast enough', 'After-hours and weekend inquiries missed', 'Trade-in and financing questions need quick answers'] },
    solution: { title: 'How LinoChat Solves It', points: [
      { heading: 'Inventory Browsing', detail: 'AI helps shoppers find vehicles by make, model, price range, and features.' },
      { heading: 'Test Drive Scheduling', detail: 'Book test drives directly through chat with calendar integration.' },
      { heading: 'Trade-In Estimates', detail: 'Collect vehicle details and provide preliminary trade-in value ranges.' },
      { heading: 'Financing Pre-Qualification', detail: 'Guide buyers through financing options and collect pre-approval information.' },
    ]},
    features: ['Vehicle inventory search', 'Test drive scheduling', 'Trade-in value estimates', 'Financing pre-qualification', 'Service appointment booking', 'Parts department routing'],
    workflow: [
      { step: 'Shopper browses your inventory', description: 'They\'re comparing two SUVs at 9pm. Chat widget offers to help.' },
      { step: 'AI provides comparisons', description: 'Features, pricing, availability, and financing estimates for both vehicles.' },
      { step: 'Test drive booked', description: 'Shopper schedules a test drive for Saturday morning.' },
      { step: 'Sales team follows up', description: 'Full lead profile — vehicles of interest, budget, trade-in details, timeline.' },
    ],
    testimonial: { quote: 'Test drive bookings are up 60%. The AI qualifies leads so my team spends time with serious buyers.', author: 'Carlos Mendez', role: 'Sales Manager', company: 'Premier Auto Group' },
    cta: 'Drive more test drives',
  },
  travel: {
    id: 'travel',
    title: 'Travel & Tourism',
    tagline: 'Help travelers across every time zone',
    heroDescription: 'Travelers plan trips at all hours from every corner of the globe. LinoChat provides instant assistance with bookings, itineraries, and travel requirements — 24/7.',
    color: 'sky',
    gradientFrom: 'from-sky-600',
    gradientTo: 'to-indigo-700',
    stats: [
      { value: '75%', label: 'Inquiries resolved by AI' },
      { value: '24/7', label: 'Time zone coverage' },
      { value: '+20%', label: 'Customer retention' },
      { value: '50%', label: 'Call center reduction' },
    ],
    challenge: { title: 'The Travel Challenge', points: ['Travelers in different time zones need help at any hour', 'Booking modifications and cancellations overwhelm agents', 'Visa and travel requirement questions are complex and frequent', 'Peak season support demand is unpredictable'] },
    solution: { title: 'How LinoChat Solves It', points: [
      { heading: 'Trip Planning', detail: 'AI recommends destinations, activities, and packages based on preferences.' },
      { heading: 'Booking Assistance', detail: 'Help with modifications, cancellations, and rebooking automatically.' },
      { heading: 'Travel Requirements', detail: 'Visa, vaccination, and documentation guidance for any destination.' },
      { heading: 'Emergency Support', detail: '24/7 assistance for flight changes, lost luggage, and itinerary issues.' },
    ]},
    features: ['Destination recommendations', 'Booking modification handling', 'Visa and travel document guidance', 'Emergency itinerary support', 'Multi-currency pricing', 'Travel insurance information'],
    workflow: [
      { step: 'Traveler researches destinations', description: 'They want a family beach vacation in August. Chat widget engages with suggestions.' },
      { step: 'AI provides options', description: 'Curated destination options with pricing, weather info, and family activity highlights.' },
      { step: 'Booking assistance', description: 'Help with selecting dates, room types, and add-on experiences.' },
      { step: 'Post-booking support', description: 'Travel document reminders, packing lists, and itinerary updates.' },
    ],
    testimonial: { quote: 'LinoChat handles travelers from 40+ countries. The multilingual support has been a game-changer.', author: 'Yuki Tanaka', role: 'Director of Operations', company: 'Pacific Voyages' },
    cta: 'Support travelers worldwide',
  },
  professional: {
    id: 'professional',
    title: 'Professional Services',
    tagline: 'Qualify leads while you focus on client work',
    heroDescription: 'Law firms, accounting practices, and consultancies — pre-qualify potential clients, collect case details, and schedule consultations automatically.',
    color: 'indigo',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-violet-700',
    stats: [
      { value: '+50%', label: 'Consultation bookings' },
      { value: '85%', label: 'Lead qualification rate' },
      { value: '40%', label: 'Admin overhead reduction' },
      { value: '90%', label: 'Inquiry response rate' },
    ],
    challenge: { title: 'The Professional Services Challenge', points: ['Partners and associates are too busy with client work to respond to inquiries', 'Unqualified leads waste consultation time', 'Intake forms are cumbersome and often abandoned', 'Existing clients need status updates that don\'t require attorney time'] },
    solution: { title: 'How LinoChat Solves It', points: [
      { heading: 'Practice Area Guidance', detail: 'AI helps prospects understand your services and which practice area fits their needs.' },
      { heading: 'Client Intake', detail: 'Collect case details, contact information, and relevant documents through structured chat flows.' },
      { heading: 'Consultation Scheduling', detail: 'Book consultations directly with the right professional based on specialty.' },
      { heading: 'Client Status Updates', detail: 'Existing clients get case status updates without tying up attorney time.' },
    ]},
    features: ['Practice area and service information', 'Client intake form collection', 'Conflict check pre-screening', 'Consultation scheduling', 'Document upload capabilities', 'Client portal FAQ automation'],
    workflow: [
      { step: 'Prospect needs legal/financial help', description: 'They visit your website unsure which service they need. Chat widget helps.' },
      { step: 'AI qualifies and routes', description: 'Determines practice area, urgency, and basic case details.' },
      { step: 'Intake completed', description: 'Contact info, case summary, and relevant documents collected in chat.' },
      { step: 'Consultation booked', description: 'Matched with the right professional and scheduled at a convenient time.' },
    ],
    testimonial: { quote: 'We stopped wasting partner hours on unqualified consultations. LinoChat pre-screens perfectly.', author: 'Amanda Foster', role: 'Managing Partner', company: 'Foster & Associates Law' },
    cta: 'Streamline your client intake',
  },
};

export default function UseCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const uc = id ? useCaseData[id] : null;

  if (!uc) return <Navigate to="/use-cases" replace />;

  // Find prev/next for navigation
  const keys = Object.keys(useCaseData);
  const currentIdx = keys.indexOf(uc.id);
  const prev = currentIdx > 0 ? useCaseData[keys[currentIdx - 1]] : null;
  const next = currentIdx < keys.length - 1 ? useCaseData[keys[currentIdx + 1]] : null;

  return (
    <div className="min-h-screen">
      <SEOHead title={`${uc.title} — Use Case`} description={uc.heroDescription} />
      <MarketingHeader />

      {/* Hero */}
      <section className={`relative py-20 lg:py-28 overflow-hidden bg-gradient-to-br ${uc.gradientFrom} ${uc.gradientTo}`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-white/5 blur-sm" />
        <div className="absolute bottom-10 left-20 h-56 w-56 rounded-full bg-white/5 blur-sm" />
        <div className="container mx-auto px-4 relative">
          <motion.div {...fadeUp} className="max-w-3xl">
            <Link to="/use-cases" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> All Use Cases
            </Link>
            <Badge className="mb-4 bg-white/20 text-white border-white/30">Use Case</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-white mb-4">{uc.title}</h1>
            <p className="text-xl text-white/80 mb-8">{uc.heroDescription}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {uc.stats.map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/70 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Challenge */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-12">
            <div>
              <Badge variant="outline" className="mb-4 text-red-600 border-red-200">The Challenge</Badge>
              <h2 className="text-3xl font-bold mb-6">{uc.challenge.title}</h2>
              <ul className="space-y-4">
                {uc.challenge.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Badge variant="outline" className="mb-4 text-green-600 border-green-200">The Solution</Badge>
              <h2 className="text-3xl font-bold mb-6">{uc.solution.title}</h2>
              <div className="space-y-5">
                {uc.solution.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">{point.heading}</div>
                      <div className="text-sm text-muted-foreground">{point.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-20 bg-muted/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {uc.workflow.map((step, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-bold mx-auto mb-4">{i + 1}</div>
                    <h3 className="font-semibold mb-2 text-sm">{step.step}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Key Features for {uc.title}</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {uc.features.map((feature, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                <Zap className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 lg:py-20 bg-muted/40">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
            </div>
            <blockquote className="text-xl font-medium mb-6 leading-relaxed">
              &ldquo;{uc.testimonial.quote}&rdquo;
            </blockquote>
            <div className="font-semibold">{uc.testimonial.author}</div>
            <div className="text-sm text-muted-foreground">{uc.testimonial.role}, {uc.testimonial.company}</div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className={`relative py-20 overflow-hidden bg-gradient-to-br ${uc.gradientFrom} ${uc.gradientTo}`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
        <div className="container mx-auto px-4 text-center max-w-2xl relative">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-bold text-white mb-4">{uc.cta}</h2>
            <p className="text-white/80 mb-8">Get started in minutes. No credit card required.</p>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 shadow-xl">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Prev/Next Navigation */}
      <section className="py-8 border-t">
        <div className="container mx-auto px-4 max-w-4xl flex justify-between">
          {prev ? (
            <Link to={`/use-cases/${prev.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/use-cases/${next.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              {next.title} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : <span />}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
