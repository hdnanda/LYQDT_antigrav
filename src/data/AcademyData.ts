export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Lesson {
  id: string;
  title: string;
  isLocked: boolean;
  isExam: boolean;
  requiredAccuracy?: number;
  questions: Question[];
  xpReward: number;
}

export interface Section {
  id: string;
  title: string;
  color: string; // Tailwind class equivalent color hex or name
  lessons: Lesson[];
}

const CURRICULUM_DATA: Record<string, Question[]> = {
  "l_1_1": [
    { id: "q_1_1_1", text: "You really want the new iPhone, but your current one works fine. Is this a need or a want?", options: ["Need", "Want", "Investment", "Emergency"], correctIndex: 1 },
    { id: "q_1_1_2", text: "Paying your monthly rent or mortgage is considered a:", options: ["Want", "Luxury", "Need", "Optional Expense"], correctIndex: 2 },
    { id: "q_1_1_3", text: "Which of these is a 'Want' for most people?", options: ["Groceries", "Electricity", "Netflix Subscription", "Water"], correctIndex: 2 },
    { id: "q_1_1_4", text: "The 50/30/20 rule suggests 50% of income goes to:", options: ["Wants", "Needs", "Savings", "Investing"], correctIndex: 1 },
    { id: "q_1_1_5", text: "If you have $100 and spend $80 on a concert ticket, you are prioritizing a:", options: ["Need", "Want", "Asset", "Liability"], correctIndex: 1 }
  ],
  "l_1_2": [
    { id: "q_1_2_1", text: "What is 'Gross Income'?", options: ["Money after taxes", "Total money earned before taxes", "Money spent on bills", "Profit from stocks"], correctIndex: 1 },
    { id: "q_1_2_2", text: "What is 'Net Income'?", options: ["Total earnings", "Money before deductions", "Take-home pay after taxes", "Gross income plus bonuses"], correctIndex: 2 },
    { id: "q_1_2_3", text: "Which of these is an example of Passive Income?", options: ["Hourly wage", "Salary", "Rental property income", "Freelance work"], correctIndex: 2 },
    { id: "q_1_2_4", text: "A 'Salary' is typically paid:", options: ["By the hour", "As a fixed annual amount", "Only when you sell something", "Based on tips"], correctIndex: 1 },
    { id: "q_1_2_5", text: "Taxes are usually deducted from your pay by:", options: ["Your landlord", "The government/employer", "Your bank", "Yourself at the ATM"], correctIndex: 1 }
  ],
  "l_1_3": [
    { id: "q_1_3_1", text: "What is the 'Pay Yourself First' principle?", options: ["Buy what you want first", "Save a portion of income before spending", "Pay all bills on the last day", "Give money to friends"], correctIndex: 1 },
    { id: "q_1_3_2", text: "What is Compound Interest?", options: ["Interest on the principal only", "Interest on the principal plus accumulated interest", "A fee for saving money", "A type of tax"], correctIndex: 1 },
    { id: "q_1_3_3", text: "Where is the safest place to keep your savings?", options: ["Under the mattress", "In a piggy bank", "In a high-yield savings account", "In a friend's wallet"], correctIndex: 2 },
    { id: "q_1_3_4", text: "The 'Rule of 72' helps you estimate:", options: ["How much tax you owe", "How long it takes to double your money", "Your retirement age", "The cost of a house"], correctIndex: 1 },
    { id: "q_1_3_5", text: "Inflation makes your savings:", options: ["More valuable", "Less valuable over time", "Stay the same", "Grow faster"], correctIndex: 1 }
  ],
  "l_1_4": [
    { id: "q_1_4_1", text: "What is the main difference between a Checking and Savings account?", options: ["Checking is for daily spending, Savings is for long-term", "Checking pays more interest", "Savings has a debit card for daily use", "There is no difference"], correctIndex: 0 },
    { id: "q_1_4_2", text: "What does FDIC insurance protect?", options: ["Your stock market losses", "Your bank deposits up to $250k", "Your car from accidents", "Your credit score"], correctIndex: 1 },
    { id: "q_1_4_3", text: "An 'Overdraft Fee' happens when:", options: ["You deposit too much", "You spend more than is in your account", "You close your account", "You use an ATM"], correctIndex: 1 },
    { id: "q_1_4_4", text: "What is a 'Direct Deposit'?", options: ["Giving cash to a teller", "Electronic transfer of pay into your account", "Mailing a check", "Withdrawing money"], correctIndex: 1 },
    { id: "q_1_4_5", text: "A Debit Card takes money directly from:", options: ["A loan", "Your checking account", "Your credit limit", "A gift card"], correctIndex: 1 }
  ],
  "l_1_5": [
    { id: "q_1_5_1", text: "What is 'Good Debt' usually used for?", options: ["Vacations", "Assets that grow in value (like education or a home)", "Designer clothes", "Eating out"], correctIndex: 1 },
    { id: "q_1_5_2", text: "What is APR?", options: ["Annual Percentage Rate (cost of borrowing)", "Average Price Ratio", "Annual Profit Return", "Applied Payment Rate"], correctIndex: 0 },
    { id: "q_1_5_3", text: "Which of these usually has the highest interest rate?", options: ["Mortgage", "Student Loan", "Credit Card Debt", "Auto Loan"], correctIndex: 2 },
    { id: "q_1_5_4", text: "What happens if you only pay the 'Minimum Balance' on a credit card?", options: ["You pay no interest", "You pay off the debt quickly", "You pay a lot of interest and stay in debt longer", "The bank gives you a bonus"], correctIndex: 2 },
    { id: "q_1_5_5", text: "A Credit Score measures your:", options: ["Wealth", "Income", "Creditworthiness (likelihood to repay debt)", "Bank balance"], correctIndex: 2 }
  ],
  "l_1_6": [
    { id: "q_1_6_1", text: "How much is typically recommended for an Emergency Fund?", options: ["$100", "1 month of fun money", "3-6 months of essential expenses", "1 year of gross income"], correctIndex: 2 },
    { id: "q_1_6_2", text: "Which of these is a valid use for an Emergency Fund?", options: ["New video game release", "Unexpected car repair", "A flash sale on shoes", "A weekend trip with friends"], correctIndex: 1 },
    { id: "q_1_6_3", text: "An Emergency Fund should be kept in an account that is:", options: ["Locked for 5 years", "Liquid (easy to access)", "Invested in risky stocks", "Hidden in cash"], correctIndex: 1 },
    { id: "q_1_6_4", text: "Having an Emergency Fund prevents you from:", options: ["Earning interest", "Going into high-interest debt when surprises happen", "Spending any money", "Getting a job"], correctIndex: 1 },
    { id: "q_1_6_5", text: "When should you start building an Emergency Fund?", options: ["After you buy a house", "When you retire", "As soon as you have income", "Only if you lose your job"], correctIndex: 2 }
  ],
  "exam_1": [
    { id: "q_e1_1", text: "Which is a 'Need'?", options: ["New sneakers", "Rent", "Netflix", "Dining out"], correctIndex: 1 },
    { id: "q_e1_2", text: "Net pay is:", options: ["Before tax", "After tax", "Total sales", "Bonus only"], correctIndex: 1 },
    { id: "q_e1_3", text: "Compound interest helps your savings:", options: ["Shrink", "Stay flat", "Grow exponentially", "Disappear"], correctIndex: 2 },
    { id: "q_e1_4", text: "Credit cards are:", options: ["Free money", "Debit cards", "Loans with interest", "Savings accounts"], correctIndex: 2 },
    { id: "q_e1_5", text: "Emergency funds should cover:", options: ["1 week", "3-6 months", "10 years", "Nothing"], correctIndex: 1 }
  ]
};

const getQuestionsForLesson = (lessonId: string): Question[] => {
  return CURRICULUM_DATA[lessonId] || [
    {
      id: `q_default_${lessonId}`,
      text: "What is the most important rule of personal finance?",
      options: ["Spend more than you earn", "Spend exactly what you earn", "Spend less than you earn", "Don't track anything"],
      correctIndex: 2
    }
  ];
};

export const ACADEMY_SECTIONS: Section[] = [
  {
    id: "sec_1",
    title: "Unit 1: Financial Basics",
    color: "#10b981", // Emerald
    lessons: [
      { id: "l_1_1", title: "Needs vs Wants", isLocked: false, isExam: false, xpReward: 10, questions: getQuestionsForLesson("l_1_1") },
      { id: "l_1_2", title: "What is Income?", isLocked: true, isExam: false, xpReward: 10, questions: getQuestionsForLesson("l_1_2") },
      { id: "l_1_3", title: "Savings 101", isLocked: true, isExam: false, xpReward: 15, questions: getQuestionsForLesson("l_1_3") },
      { id: "l_1_4", title: "Banking Basics", isLocked: true, isExam: false, xpReward: 15, questions: getQuestionsForLesson("l_1_4") },
      { id: "l_1_5", title: "Debt Danger", isLocked: true, isExam: false, xpReward: 20, questions: getQuestionsForLesson("l_1_5") },
      { id: "l_1_6", title: "Emergency Funds", isLocked: true, isExam: false, xpReward: 20, questions: getQuestionsForLesson("l_1_6") },
      { id: "exam_1", title: "Unit 1 Final", isLocked: true, isExam: true, requiredAccuracy: 0.9, xpReward: 100, questions: getQuestionsForLesson("exam_1") },
    ]
  },
  {
    id: "sec_2",
    title: "Unit 2: Budgeting Boss",
    color: "#3b82f6", // Blue
    lessons: [
      { id: "l_2_1", title: "50/30/20 Rule", isLocked: true, isExam: false, xpReward: 15, questions: getQuestionsForLesson("l_2_1") },
      { id: "l_2_2", title: "Tracking Expenses", isLocked: true, isExam: false, xpReward: 15, questions: getQuestionsForLesson("l_2_2") },
      { id: "l_2_3", title: "Cutting Costs", isLocked: true, isExam: false, xpReward: 15, questions: getQuestionsForLesson("l_2_3") },
      { id: "l_2_4", title: "Goal Setting", isLocked: true, isExam: false, xpReward: 20, questions: getQuestionsForLesson("l_2_4") },
      { id: "l_2_5", title: "Budget Apps", isLocked: true, isExam: false, xpReward: 20, questions: getQuestionsForLesson("l_2_5") },
      { id: "l_2_6", title: "Reviewing", isLocked: true, isExam: false, xpReward: 20, questions: getQuestionsForLesson("l_2_6") },
      { id: "exam_2", title: "Unit 2 Final", isLocked: true, isExam: true, requiredAccuracy: 0.9, xpReward: 100, questions: getQuestionsForLesson("exam_2") },
    ]
  },
];
