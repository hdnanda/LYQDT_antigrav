
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

export interface LeaderboardEntry {
  uid: string;
  username: string;
  xp: number;
}

export const fetchLeaderboard = async (count: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("xp", "desc"), limit(count));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      username: doc.data().username || "Anonymous",
      xp: doc.data().xp || 0
    }));
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: Badge[] = [
  {
    id: "first_lesson",
    name: "First Step",
    description: "Completed your first financial lesson.",
    icon: "🌱"
  },
  {
    id: "streak_3",
    name: "Consistent",
    description: "Maintained a 3-day learning streak.",
    icon: "🔥"
  },
  {
    id: "lesson_10",
    name: "Financial Scholar",
    description: "Completed 10 lessons in the Academy.",
    icon: "🎓"
  },
  {
    id: "wealth_1000",
    name: "Wealth Builder",
    description: "Reached 1,000 XP.",
    icon: "💰"
  },
  {
    id: "ranked_win",
    name: "Market Master",
    description: "Won a high-stakes ranked battle.",
    icon: "🏆"
  }
];

export const awardBadge = async (userId: string, badgeId: string, currentBadges: string[]) => {
  if (currentBadges.includes(badgeId)) return;

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      badges: arrayUnion(badgeId)
    });
    console.log(`Badge awarded: ${badgeId}`);
  } catch (error) {
    console.error("Error awarding badge:", error);
  }
};
