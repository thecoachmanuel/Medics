import { Clock, Facebook, FileText, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Video } from "lucide-react";

export const healthcareCategories = [
  {
    id: 'primary-care',
    title: 'Primary Care',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    color: 'bg-blue-500'
  },
  {
    id: 'manage-condition',
    title: 'Manage Your Condition',
    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    color: 'bg-green-500'
  },
  {
    id: 'mental-behavioral-health',
    title: 'Mental & Behavioral Health',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
    color: 'bg-yellow-500'
  },
  {
    id: 'sexual-health',
    title: 'Sexual Health',
    icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    color: 'bg-pink-500'
  },
  {
    id: 'childrens-health',
    title: "Children's Health",
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm0-8h2v6h-2z',
    color: 'bg-red-500'
  },
  {
    id: 'senior-health',
    title: 'Senior Health',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    color: 'bg-orange-500'
  },
  {
    id: 'womens-health',
    title: "Women's Health",
    icon: 'M17.5 9.5C17.5 6.5 15 4 12 4S6.5 6.5 6.5 9.5c0 2.89 2.39 5.43 5.5 6.44V17c0 .55.45 1 1 1s1-.45 1-1v-1.06c3.11-1.01 5.5-3.55 5.5-6.44zM12 14.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
    color: 'bg-purple-500'
  },
  {
    id: 'mens-health',
    title: "Men's Health",
    icon: 'M17.5 9.5C17.5 6.5 15 4 12 4S6.5 6.5 6.5 9.5c0 2.89 2.39 5.43 5.5 6.44V20h3v-4.06c3.11-1.01 5.5-3.55 5.5-6.44z',
    color: 'bg-indigo-500'
  },
  {
    id: 'wellness',
    title: 'Wellness',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    color: 'bg-emerald-500'
  }
];


// Healthcare categories (matches backend)
export const healthcareCategoriesList = [
  "Primary Care",
  "Manage Your Condition",
  "Mental & Behavioral Health",
  "Sexual Health",
  "Children's Health",
  "Senior Health",
  "Women's Health",
  "Men's Health",
  "Wellness",
];

export const specializations = [
  "Cardiologist",
  "Dermatologist",
  "Orthopedic",
  "Pediatrician",
  "Neurologist",
  "Gynecologist",
  "General Physician",
  "ENT Specialist",
  "Psychiatrist",
  "Ophthalmologist",
];



export const testimonials = [
  {
    rating: 5,
    text:
      "I spoke to a doctor from my home in Lagos and got prescriptions the same day. No traffic, no long queues, just quality care on my phone.",
    author: "Chioma A.",
    location: "Lagos, Nigeria",
    bgColor: "bg-chart-1/10",
  },
  {
    rating: 5,
    text:
      "As a busy banker in Abuja, MedicsOnline helped me speak with a doctor during my break. The consultation was clear, professional and very reassuring.",
    author: "Tunde O.",
    location: "Abuja, Nigeria",
    bgColor: "bg-chart-2/10",
  },
  {
    rating: 5,
    text:
      "My mum in Port Harcourt was able to talk to a specialist without travelling to another state. The doctor listened patiently and explained every step.",
    author: "Ngozi K.",
    location: "Port Harcourt, Nigeria",
    bgColor: "bg-chart-4/10",
  },
  {
    rating: 5,
    text:
      "I booked a video consultation for my son late at night. Within minutes a doctor joined, reviewed his symptoms and advised us on what to do next.",
    author: "Ahmed S.",
    location: "Ibadan, Nigeria",
    bgColor: "bg-chart-5/10",
  },
];


export const faqs = [
  {
    question: "What is MedicsOnline and how does it work?",
    answer:
      "MedicsOnline is a digital clinic that connects you with licensed Nigerian doctors for secure video or voice consultations. You create an account, choose a doctor and time that works for you, pay securely, and join your appointment from your phone or laptop. After the consultation, you can receive prescriptions, notes, and follow-up advice in the app.",
  },
  {
    question: "Where is MedicsOnline available?",
    answer:
      "MedicsOnline is designed for people living in Nigeria. You can book from anywhere in the country as long as you have a stable internet connection and a smartphone or computer. Some services, like prescriptions or lab referrals, may depend on the pharmacies and labs available in your city.",
  },
  {
    question: "How do I book an appointment?",
    answer:
      "Sign up or log in, browse the list of doctors, select your preferred specialist, pick an available date and time, and confirm by making payment. We will send you reminders before your consultation starts, and you can join directly from your dashboard at the scheduled time.",
  },
  {
    question: "What types of consultations can I have?",
    answer:
      "You can speak with doctors via HD video or clear voice calls on MedicsOnline. Video is recommended when the doctor needs to visually assess symptoms, while voice calls are suitable for follow-ups or simple questions. The available options for each appointment are shown during booking.",
  },
  {
    question: "What conditions can MedicsOnline doctors treat?",
    answer:
      "Our doctors handle many everyday and chronic health issues such as fever, malaria, respiratory infections, skin problems, allergies, women’s and men’s health concerns, children’s health issues, mental health check-ins, and long-term condition reviews. If your case requires in-person care or emergency attention, the doctor will guide you on the next steps.",
  },
  {
    question: "Can I use MedicsOnline in an emergency?",
    answer:
      "No. MedicsOnline is not an emergency service. If you or someone around you has chest pain, difficulty breathing, severe bleeding, sudden weakness, loss of consciousness, or any life-threatening symptoms, please go to the nearest emergency room or call your local emergency number immediately before using the app.",
  },
  {
    question: "Are MedicsOnline doctors licensed and verified?",
    answer:
      "Yes. Every doctor on MedicsOnline is a licensed medical professional registered in Nigeria. We verify their credentials, experience, and, where applicable, specialist training before they can consult with patients on the platform.",
  },
  {
    question: "How much do consultations cost and how do I pay?",
    answer:
      "Consultation fees depend on the doctor’s specialty and experience. You will see the exact amount before you confirm your booking. Payments are processed securely online through our local payment partners, so you can pay with Nigerian cards and supported bank channels.",
  },
  {
    question: "Do you work with HMOs or health insurance?",
    answer:
      "Right now, MedicsOnline focuses on direct, out-of-pocket payments so that anyone can quickly access care. We are actively working on partnerships with HMOs and insurers, and when they become available, we will clearly show supported plans during booking.",
  },
  {
    question: "Can MedicsOnline doctors prescribe medicines and lab tests?",
    answer:
      "Yes, when it is medically appropriate, doctors can issue prescriptions and recommend lab tests after your consultation. You can take the prescription or lab request to a trusted pharmacy or diagnostic center near you. Controlled drugs and some medications may not be prescribed through telemedicine and will require in-person evaluation.",
  },
  {
    question: "How is my medical information stored and protected?",
    answer:
      "We take privacy and security seriously. Your health records and consultation notes are stored in secure cloud infrastructure, and access is restricted to you and the clinicians involved in your care. We do not share your personal medical details with third parties without your consent, except when required by law.",
  },
  {
    question: "Can I reschedule or cancel my appointment?",
    answer:
      "Yes, you can manage your bookings from your MedicsOnline dashboard. Each doctor sets their own policies for how close to the appointment time you can reschedule or cancel, and whether any fees apply. These details are shown before you confirm your booking.",
  },
];

  export const trustLogos = [
    "Business Insider", "CBS News", "CNBC", "Forbes", "Fortune", "Fox Business",
    "Healthline", "Inc.", "Men's Health", "TechCrunch", "The New York Times", "WSJ"
  ];


  export const contactInfo = [
  {
    icon: Phone,
    text: "+234-816-888-2014",
  },
  {
    icon: Mail,
    text: "medicsonlineng@gmail.com",
  },
  {
    icon: MapPin,
    text: "Available across Nigeria",
  },
];


    export const footerSections = [
    {
      title: "Company",
      links: [
        { text: "About Us", href: "/about" },
        { text: "Support Center", href: "/support" },
        { text: "Contact Us", href: "/contact" }
      ]
    },
    {
      title: "For Healthcare",
      links: [
        { text: "Join as Doctor", href: "/signup/doctor" },
        { text: "Doctor Resources", href: "/doctor-resources" },
      ]
    },
    {
      title: "For Patients",
      links: [
        { text: "Find Doctors", href: "/signup/patient" },
        { text: "Book Appointment", href: "/signup/patient" },
      ]
    },
    {
      title: "Legal",
      links: [
        { text: "Privacy Policy", href: "/privacy" },
        { text: "Terms of Service", href: "/terms" },
      ]
    }
  ];


  export const socials = [
  { name: "twitter", icon: Twitter, url: "https://twitter.com/medicsonlineng" },
  { name: "facebook", icon: Facebook, url: "https://facebook.com/medicsonlineng" },
  { name: "linkedin", icon: Linkedin, url: "https://linkedin.com/company/medicsonlineng" },
  { name: "instagram", icon: Instagram, url: "https://instagram.com/medicsonlineng"},
]


export  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];



 export const consultationTypes = [
      {
        type: 'Video Consultation',
        icon: Video,
        description: 'Face-to-face consultation via HD video call',
        price: 0,
        recommended: true
      },
      {
        type: 'Voice Call',
        icon: Phone,
        description: 'Audio-only consultation via voice call',
        price: -5000,
        recommended: false
      }
    ];


    
    export const emptyStates = {
      upcoming: {
        icon: Clock,
        title: "No Upcoming Appointments",
        description: "You have no upcoming appointments scheduled.",
      },
      completed: {
        icon: FileText,
        title: "No Past Appointments",
        description: "Your completed, expired or missed consultations will appear here.",
      },
    };



      export const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in progress': return 'bg-purple-100 text-purple-800';
      case 'missed': return 'bg-orange-100 text-orange-800';
      case 'expired': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
