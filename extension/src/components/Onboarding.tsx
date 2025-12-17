import { useState } from "react";
import { saveUserProfile, type UserProfile } from "../services/authService";
import { User } from "firebase/auth";

interface OnboardingProps {
    user: User;
    onComplete: (profile: UserProfile) => void;
}

const Onboarding = ({ user, onComplete }: OnboardingProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UserProfile>({
        full_name: user.displayName || "",
        contact_details: {
            email: user.email || "",
            phone: "",
            linkedin: ""
        },
        skills: [],
        experience: "",
        preferences: {
            location: "",
            job_type: "any",
            notice_period: ""
        }
    });

    const [skillsInput, setSkillsInput] = useState("");

    const handleChange = (field: keyof UserProfile, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleContactChange = (field: keyof UserProfile["contact_details"], value: any) => {
        setFormData({
            ...formData,
            contact_details: { ...formData.contact_details, [field]: value }
        });
    };

    const handlePrefChange = (field: keyof UserProfile["preferences"], value: any) => {
        setFormData({
            ...formData,
            preferences: { ...formData.preferences, [field]: value }
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Process skills
            const finalSkills = skillsInput.length > 0
                ? skillsInput.split(",").map(s => s.trim()).filter(s => s)
                : formData.skills;

            const finalData = { ...formData, skills: finalSkills };

            await saveUserProfile(user.uid, finalData);
            onComplete(finalData);
        } catch (error) {
            console.error("Failed to save profile", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white flex flex-col h-full overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome! Setup your profile</h2>
            <p className="text-sm text-gray-600 mb-6">Let's get your details to generate perfect resumes.</p>

            <div className="space-y-4">
                {/* Personal Details */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                    <input
                        className="w-full p-2 border rounded text-sm"
                        value={formData.full_name}
                        onChange={(e) => handleChange("full_name", e.target.value)}
                        placeholder="John Doe"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                        <input
                            className="w-full p-2 border rounded text-sm bg-gray-50"
                            value={formData.contact_details.email}
                            onChange={(e) => handleContactChange("email", e.target.value)}
                            placeholder="Email"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone (Optional)</label>
                        <input
                            className="w-full p-2 border rounded text-sm"
                            value={formData.contact_details.phone}
                            onChange={(e) => handleContactChange("phone", e.target.value)}
                            placeholder="+1 234 567 890"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">LinkedIn Profile (Optional)</label>
                    <input
                        className="w-full p-2 border rounded text-sm"
                        value={formData.contact_details.linkedin}
                        onChange={(e) => handleContactChange("linkedin", e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                    />
                </div>

                {/* Professional Details */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Skills (Comma separated)</label>
                    <textarea
                        className="w-full p-2 border rounded text-sm"
                        rows={2}
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        placeholder="React, TypeScript, Node.js, Python..."
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Experience Summary</label>
                    <textarea
                        className="w-full p-2 border rounded text-sm"
                        rows={3}
                        value={formData.experience}
                        onChange={(e) => handleChange("experience", e.target.value)}
                        placeholder="5 years of experience in full stack development..."
                    />
                </div>

                {/* Preferences */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Job Preferences</h3>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notice Period</label>
                            <input
                                className="w-full p-2 border rounded text-sm"
                                value={formData.preferences.notice_period}
                                onChange={(e) => handlePrefChange("notice_period", e.target.value)}
                                placeholder="e.g. Immediate, 30 Days"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job Type</label>
                            <select
                                className="w-full p-2 border rounded text-sm bg-white"
                                value={formData.preferences.job_type}
                                onChange={(e) => handlePrefChange("job_type", e.target.value)}
                            >
                                <option value="any">Any</option>
                                <option value="remote">Remote</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="onsite">On-site</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preferred Location</label>
                        <input
                            className="w-full p-2 border rounded text-sm"
                            value={formData.preferences.location}
                            onChange={(e) => handlePrefChange("location", e.target.value)}
                            placeholder="e.g. New York, London, Remote"
                        />
                    </div>
                </div>

                <div className="pt-4 mt-2">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        {loading ? "Saving Profile..." : "Save & Continue"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
