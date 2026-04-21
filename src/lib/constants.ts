export const ISSUE_TYPES = [
  // Notarial Services
  { group: 'Notarial Services', label: 'Acknowledgment of Documents' },
  { group: 'Notarial Services', label: 'Affidavit of Loss' },
  { group: 'Notarial Services', label: 'Affidavit of Guardianship' },
  { group: 'Notarial Services', label: 'Affidavit of Support' },
  { group: 'Notarial Services', label: 'Affidavit of Heirship' },
  { group: 'Notarial Services', label: 'Special Power of Attorney (SPA)' },
  { group: 'Notarial Services', label: 'General Power of Attorney (GPA)' },
  { group: 'Notarial Services', label: 'Deed of Sale / Deed of Absolute Sale' },
  { group: 'Notarial Services', label: 'Deed of Donation' },
  { group: 'Notarial Services', label: 'Memorandum of Agreement (MOA)' },
  { group: 'Notarial Services', label: 'Contract Notarization' },
  { group: 'Notarial Services', label: 'Jurat / Sworn Statement' },
  { group: 'Notarial Services', label: 'Certification / Certificate Authentication' },
  { group: 'Notarial Services', label: 'Last Will and Testament' },
  { group: 'Notarial Services', label: 'Student Internship Agreement (SIA)' },

  // Civil / Family Law
  { group: 'Civil & Family Law', label: 'Legal Separation' },
  { group: 'Civil & Family Law', label: 'Annulment of Marriage' },
  { group: 'Civil & Family Law', label: 'Declaration of Nullity of Marriage' },
  { group: 'Civil & Family Law', label: 'Child Custody and Support' },
  { group: 'Civil & Family Law', label: 'Adoption' },
  { group: 'Civil & Family Law', label: 'Guardianship Petition' },
  { group: 'Civil & Family Law', label: 'Inheritance / Succession' },
  { group: 'Civil & Family Law', label: 'Property Dispute' },

  // Business / Corporate Law
  { group: 'Business & Corporate', label: 'Business Registration / Incorporation' },
  { group: 'Business & Corporate', label: 'Contract Drafting & Review' },
  { group: 'Business & Corporate', label: 'Partnership Agreement' },
  { group: 'Business & Corporate', label: 'Lease Agreement' },
  { group: 'Business & Corporate', label: 'Employment Contract Review' },

  // Criminal Law
  { group: 'Criminal Law', label: 'Filing of Criminal Complaint' },
  { group: 'Criminal Law', label: 'Criminal Defense Consultation' },
  { group: 'Criminal Law', label: 'Bail Application' },
  { group: 'Criminal Law', label: 'Estafa / Fraud Case' },

  // Other
  { group: 'Other', label: 'Legal Consultation (General)' },
  { group: 'Other', label: 'Other (Please describe below)' },
]

export const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}