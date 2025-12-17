import { GoogleAuthProvider, signInWithCredential, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export interface UserProfile {
    uid?: string;
    email?: string;
    full_name: string;
    contact_details: {
        email: string; // fallback/primary email
        phone: string;
        linkedin: string;
    };
    skills: string[];
    experience: string;
    preferences: {
        location: string;
        job_type: "remote" | "hybrid" | "onsite" | "any";
        notice_period: string; // e.g. "Immediate", "15 days", "30 days"
    };
    created_at?: string;
    updated_at?: string;
}

export const signInWithGoogle = async (): Promise<User> => {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            if (chrome.runtime.lastError || !token) {
                reject(chrome.runtime.lastError?.message || "Failed to get auth token");
                return;
            }

            try {
                const credential = GoogleAuthProvider.credential(null, token);
                const result = await signInWithCredential(auth, credential);
                resolve(result.user);
            } catch (error) {
                reject(error);
            }
        });
    });
};

export const logout = async () => {
    await signOut(auth);
    await chrome.storage.local.remove(["userProfile", "authState"]);
    // Optional: revoke chrome identity token if needed
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            // Sync to local storage for content script access
            await chrome.storage.local.set({
                userProfile: profile,
                authState: "AUTHENTICATED"
            });
            return profile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

export const saveUserProfile = async (uid: string, data: UserProfile) => {
    try {
        const docRef = doc(db, "users", uid);
        const timestamp = new Date().toISOString();
        const finalData = {
            ...data,
            uid,
            updated_at: timestamp,
            created_at: data.created_at || timestamp // Keep original created_at if exists
        };

        await setDoc(docRef, finalData, { merge: true });

        // Sync to local storage
        await chrome.storage.local.set({
            userProfile: finalData,
            authState: "AUTHENTICATED"
        });

    } catch (error) {
        console.error("Error saving user profile:", error);
        throw error;
    }
};
