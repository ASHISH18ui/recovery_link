// Simple i18n for the patient portal
// English + Hindi labels for navigation and common actions.

export type Lang = "en" | "hi";

export const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    // Nav
    home: "Home",
    checkin: "Check-in",
    medicines: "Medicines",
    progress: "Progress",
    messages: "Messages",
    appointments: "Appointments",
    recoveryPlan: "Recovery Plan",
    documents: "Documents",
    notifications: "Notifications",
    profile: "Profile",
    emergency: "Emergency",
    logout: "Logout",

    // Actions
    submit: "Submit",
    back: "Back",
    continue: "Continue",
    markTaken: "Mark Taken",
    markSkipped: "Mark Skipped",
    sendMessage: "Send Message",
    requestReschedule: "Request Reschedule",
    changePassword: "Change Password",
    saveChanges: "Save Changes",
    getHelp: "I Need Help",
    alertCareTeam: "Alert My Care Team",

    // Status
    onTrack: "On Track",
    needsAttention: "Needs Attention",
    completed: "Completed",
    upcoming: "Upcoming",
    taken: "Taken",
    skipped: "Skipped",
    pending: "Pending",

    // Dashboard
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    dayOfRecovery: "Day of recovery",
    todayTasks: "Today's Tasks",
    nextAppointment: "Next Appointment",
    recoveryProgress: "Recovery Progress",
    dailyCheckin: "Daily Check-in",
    medicinesDue: "Medicines Due",

    // Check-in
    howAreYouFeeling: "How are you feeling today?",
    painLevel: "Pain Level",
    doYouHaveFever: "Do you have a fever?",
    temperature: "Temperature (°C)",
    swelling: "Any swelling at the surgical site?",
    woundStatus: "How does your wound look?",
    breathingDifficulty: "Any difficulty breathing?",
    eating: "Eating normally?",
    sleeping: "Sleeping normally?",
    mobility: "Moving around normally?",
    newSymptoms: "Any new or worsening symptoms?",
    mood: "How is your mood today?",
    medicationTaken: "Did you take all your medications?",
    optionalVitals: "Optional: Record your vitals",
    optionalPhoto: "Optional: Upload a photo of your surgical site",
    submitCheckin: "Submit Check-in",
    checkinDone: "Check-in Completed",
    editCheckin: "Edit Today's Check-in",

    // Misc
    disclaimer: "AI-generated summary. Clinician review required.",
    footer: "Illustrative workflow; clinical instructions must be customised and approved by the hospital.",
    careTeamNotified: "Your care team has been notified.",
    emergencyNote: "If this is a life-threatening emergency, call your local emergency number immediately.",
    language: "Language",
  },
  hi: {
    // Nav
    home: "होम",
    checkin: "चेक-इन",
    medicines: "दवाइयाँ",
    progress: "प्रगति",
    messages: "संदेश",
    appointments: "अपॉइंटमेंट",
    recoveryPlan: "रिकवरी प्लान",
    documents: "दस्तावेज़",
    notifications: "सूचनाएँ",
    profile: "प्रोफ़ाइल",
    emergency: "आपातकाल",
    logout: "लॉग आउट",

    // Actions
    submit: "जमा करें",
    back: "वापस",
    continue: "जारी रखें",
    markTaken: "ली गई",
    markSkipped: "छोड़ी गई",
    sendMessage: "संदेश भेजें",
    requestReschedule: "पुनर्निर्धारण अनुरोध",
    changePassword: "पासवर्ड बदलें",
    saveChanges: "बदलाव सहेजें",
    getHelp: "मुझे मदद चाहिए",
    alertCareTeam: "केयर टीम को सूचित करें",

    // Status
    onTrack: "ट्रैक पर",
    needsAttention: "ध्यान चाहिए",
    completed: "पूर्ण",
    upcoming: "आगामी",
    taken: "ली गई",
    skipped: "छोड़ी गई",
    pending: "लंबित",

    // Dashboard
    goodMorning: "शुभ प्रभात",
    goodAfternoon: "शुभ अपराह्न",
    goodEvening: "शुभ संध्या",
    dayOfRecovery: "रिकवरी का दिन",
    todayTasks: "आज के कार्य",
    nextAppointment: "अगला अपॉइंटमेंट",
    recoveryProgress: "रिकवरी प्रगति",
    dailyCheckin: "दैनिक चेक-इन",
    medicinesDue: "दवाइयाँ लेनी हैं",

    // Check-in
    howAreYouFeeling: "आज आप कैसा महसूस कर रहे हैं?",
    painLevel: "दर्द का स्तर",
    doYouHaveFever: "क्या आपको बुखार है?",
    temperature: "तापमान (°C)",
    swelling: "सर्जरी की जगह पर सूजन है?",
    woundStatus: "आपका घाव कैसा दिखता है?",
    breathingDifficulty: "सांस लेने में कोई तकलीफ?",
    eating: "सामान्य रूप से खा रहे हैं?",
    sleeping: "सामान्य रूप से सो रहे हैं?",
    mobility: "सामान्य रूप से चल-फिर रहे हैं?",
    newSymptoms: "कोई नए या बिगड़ते लक्षण?",
    mood: "आज आपका मूड कैसा है?",
    medicationTaken: "क्या आपने सभी दवाइयाँ लीं?",
    optionalVitals: "वैकल्पिक: अपने वाइटल रिकॉर्ड करें",
    optionalPhoto: "वैकल्पिक: सर्जरी स्थान की फ़ोटो अपलोड करें",
    submitCheckin: "चेक-इन जमा करें",
    checkinDone: "चेक-इन पूर्ण",
    editCheckin: "आज का चेक-इन संपादित करें",

    // Misc
    disclaimer: "AI द्वारा उत्पन्न सारांश। चिकित्सक की समीक्षा आवश्यक है।",
    footer: "यह एक प्रदर्शन वर्कफ़्लो है; नैदानिक निर्देश अस्पताल द्वारा अनुकूलित और अनुमोदित होने चाहिए।",
    careTeamNotified: "आपकी केयर टीम को सूचित कर दिया गया है।",
    emergencyNote: "यदि यह जीवन-घातक आपातकाल है, तो तुरंत अपने स्थानीय आपातकालीन नंबर पर कॉल करें।",
    language: "भाषा",
  },
};

export function t(key: string, lang: Lang): string {
  return LABELS[lang]?.[key] ?? LABELS["en"][key] ?? key;
}
