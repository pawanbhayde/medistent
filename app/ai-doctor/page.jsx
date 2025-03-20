"use client";
import { Stethoscope, Upload, Clipboard, Loader2, AlertCircle } from "lucide-react";
import Navbar from "../_components/navbar";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { chatSession } from "@/lib/GeminiAIModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const AiDoctor = () => {
    const [symptoms, setSymptoms] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [duration, setDuration] = useState("");
    const [loading, setLoading] = useState(false);
    const [voiceInputLoading, setVoiceInputLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [language, setLanguage] = useState("English");
    const audioInputRef = useRef(null);

    // Handle form submission for text input
    const handleSymptomSubmit = async (e) => {
        e.preventDefault();
        if (!symptoms.trim()) return;

        await processSymptoms();
    };

    // Handle audio input for symptoms (placeholder function)
    const handleAudioInput = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setVoiceInputLoading(true);

        // In a real implementation, this would send the audio to a speech-to-text API
        // For now, we'll simulate a delay and set some example symptoms
        setTimeout(() => {
            setSymptoms("I've been having a headache for the past 3 days, along with fever and body aches. I feel tired all the time and have lost my appetite.");
            setVoiceInputLoading(false);
        }, 2000);
    };

    // Main function to process symptoms and get AI analysis
    const processSymptoms = async () => {
        setLoading(true);

        try {
            const patientInfo = age && gender ? `The patient is a ${age}-year-old ${gender}.` : "";
            const symptomDuration = duration ? `Symptoms have been present for ${duration}.` : "";

            const inputPrompt = `
            You are an AI medical assistant. Analyze the following symptoms and provide a comprehensive analysis in JSON format:
            
            "Patient symptoms: ${symptoms}"
            ${patientInfo}
            ${symptomDuration}
            
            Return the response in the following JSON structure:
            
            {
              "English": {
                "possible_conditions": ["List of possible conditions based on symptoms with brief descriptions"],
                "recommended_medications": ["General medications that might help, with dosage guidelines"],
                "home_remedies": ["Simple home remedies that may help alleviate symptoms"],
                "when_to_see_doctor": "Advice on when the patient should consult a healthcare professional",
                "urgency_level": "Assessment of how quickly medical attention is needed (Non-urgent/Soon/Urgent)",
                "preventive_measures": ["Ways to prevent worsening of the condition"],
                "lifestyle_recommendations": ["Lifestyle changes that may help with the symptoms"],
                "medical_terms_explained": {"term": "explanation"}
              },
              "Hindi": {
                // Same structure as above but in Hindi
              }
            }
            
            IMPORTANT: Make sure all items in arrays are simple strings, not objects.
            If any section cannot be adequately analyzed due to insufficient information, indicate this clearly.
            IMPORTANT: Always include a strong disclaimer that this is not medical advice and patients should consult healthcare professionals.
            Format the response strictly as valid JSON without any additional text.
            `;

            // Send input to Gemini AI
            const res = await chatSession.sendMessage(inputPrompt);

            // Process Gemini API response
            const jsonResponse = res.response
                .text()
                .replace("```json", "")
                .replace("```", "");

            if (jsonResponse) {
                try {
                    const parsedResults = JSON.parse(jsonResponse);

                    // Validate and sanitize the results structure
                    const sanitizedResults = {
                        English: {
                            possible_conditions: ensureStringArray(parsedResults.English?.possible_conditions),
                            recommended_medications: ensureStringArray(parsedResults.English?.recommended_medications),
                            home_remedies: ensureStringArray(parsedResults.English?.home_remedies),
                            when_to_see_doctor: parsedResults.English?.when_to_see_doctor || "Please consult a doctor for proper evaluation.",
                            urgency_level: parsedResults.English?.urgency_level || "Not specified",
                            preventive_measures: ensureStringArray(parsedResults.English?.preventive_measures),
                            lifestyle_recommendations: ensureStringArray(parsedResults.English?.lifestyle_recommendations),
                            medical_terms_explained: ensureObjectOfStrings(parsedResults.English?.medical_terms_explained)
                        },
                        Hindi: {
                            possible_conditions: ensureStringArray(parsedResults.Hindi?.possible_conditions),
                            recommended_medications: ensureStringArray(parsedResults.Hindi?.recommended_medications),
                            home_remedies: ensureStringArray(parsedResults.Hindi?.home_remedies),
                            when_to_see_doctor: parsedResults.Hindi?.when_to_see_doctor || "कृपया उचित मूल्यांकन के लिए डॉक्टर से परामर्श करें।",
                            urgency_level: parsedResults.Hindi?.urgency_level || "निर्दिष्ट नहीं",
                            preventive_measures: ensureStringArray(parsedResults.Hindi?.preventive_measures),
                            lifestyle_recommendations: ensureStringArray(parsedResults.Hindi?.lifestyle_recommendations),
                            medical_terms_explained: ensureObjectOfStrings(parsedResults.Hindi?.medical_terms_explained)
                        }
                    };

                    setResults(sanitizedResults);
                    console.log("Sanitized Results:", sanitizedResults);
                } catch (parseError) {
                    console.error("Error parsing JSON:", parseError);
                }
            } else {
                console.error("Error:", res);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to ensure array of strings
    const ensureStringArray = (arr) => {
        if (!arr) return [];
        if (!Array.isArray(arr)) return [];

        return arr.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object') return JSON.stringify(item);
            return String(item);
        });
    };

    // Helper function to ensure object with string values
    const ensureObjectOfStrings = (obj) => {
        if (!obj || typeof obj !== 'object') return {};

        const result = {};
        Object.keys(obj).forEach(key => {
            result[key] = typeof obj[key] === 'string' ? obj[key] : String(obj[key]);
        });

        return result;
    };

    // Trigger audio recording
    const triggerAudioInput = () => {
        audioInputRef.current.click();
    };

    return (
        <div>
            <Navbar />
            <div className="lg:px-16 flex flex-col lg:flex-row border-b min-h-[90vh]">
                <div className="lg:w-1/3 border-r p-4">
                    <div className="flex gap-4 mb-6">
                        <div className="bg-white h-fit p-4 rounded-lg flex items-center justify-center">
                            <Stethoscope className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">AI Symptom Analyzer</h3>
                            <p className="text-muted-foreground">
                                Describe your symptoms to get possible conditions and recommendations.
                            </p>
                        </div>
                    </div>

                    <Tabs defaultValue="text">
                        <TabsList className="grid w-full grid-cols-2 mb-4 h-12">
                            <TabsTrigger value="text">Text Input</TabsTrigger>
                            <TabsTrigger value="voice">Voice Input</TabsTrigger>
                        </TabsList>

                        <TabsContent value="text">
                            <form onSubmit={handleSymptomSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="symptoms" className="block mb-1">Describe Your Symptoms</label>
                                        <Textarea
                                            id="symptoms"
                                            placeholder="Example: I've been having a headache and fever for 3 days..."
                                            value={symptoms}
                                            onChange={(e) => setSymptoms(e.target.value)}
                                            className="min-h-32"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="age" className="block mb-1">Age</label>
                                            <Input
                                                id="age"
                                                type="number"
                                                placeholder="Age"
                                                value={age}
                                                onChange={(e) => setAge(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="gender" className="block mb-1">Gender</label>
                                            <Select value={gender} onValueChange={setGender}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="duration" className="block mb-1">Duration of Symptoms</label>
                                        <Input
                                            id="duration"
                                            placeholder="Example: 3 days, 1 week, etc."
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button className="w-full mt-4" disabled={loading || !symptoms.trim()}>
                                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : "Analyze Symptoms"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="voice">
                            <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    ref={audioInputRef}
                                    onChange={handleAudioInput}
                                    className="hidden"
                                    accept="audio/*"
                                />

                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p className="mb-2 text-sm text-gray-600">Click to start voice recording</p>
                                <p className="text-xs text-gray-500">Describe your symptoms clearly</p>

                                <Button
                                    onClick={triggerAudioInput}
                                    className="mt-4 w-full"
                                    disabled={voiceInputLoading}
                                >
                                    {voiceInputLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                    ) : (
                                        "Start Recording"
                                    )}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="lg:w-2/3 p-6 bg-white shadow-md">
                    {loading || voiceInputLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-lg flex gap-2 items-center">
                                <Loader2 className="animate-spin" />
                                {voiceInputLoading ? "Processing audio..." : "Analyzing symptoms..."}
                            </p>
                        </div>
                    ) : results ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Symptom Analysis</h2>
                                <Button
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => setLanguage(prev => prev === "Hindi" ? "English" : "Hindi")}
                                >
                                    {language === "Hindi" ? "English" : "Hindi"}
                                </Button>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">Health Assessment</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                        <p>
                                            <strong>Medical Disclaimer:</strong> This is an AI-generated analysis and not professional medical advice.
                                            Always consult with qualified healthcare professionals for proper diagnosis and treatment.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Possible Conditions</h3>
                                        {results[language]?.possible_conditions?.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-2">
                                                {results[language].possible_conditions.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No conditions identified based on provided symptoms</p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold mb-2">Urgency Level</h3>
                                            <Badge className={`
                                                px-3 py-1 text-sm
                                                ${results[language]?.urgency_level?.includes("Non") ? "bg-green-100 text-green-800" :
                                                    results[language]?.urgency_level?.includes("Soon") ? "bg-yellow-100 text-yellow-800" :
                                                        "bg-red-100 text-red-800"}
                                            `}>
                                                {results[language]?.urgency_level}
                                            </Badge>
                                        </div>
                                        <p className="text-sm">{results[language]?.when_to_see_doctor}</p>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Recommended Medications</h3>
                                        {results[language]?.recommended_medications?.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {results[language].recommended_medications.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No specific medications recommended without professional consultation</p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Home Remedies</h3>
                                        {results[language]?.home_remedies?.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {results[language].home_remedies.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No home remedies identified for these symptoms</p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Preventive Measures</h3>
                                        {results[language]?.preventive_measures?.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {results[language].preventive_measures.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No specific preventive measures identified</p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Lifestyle Recommendations</h3>
                                        {results[language]?.lifestyle_recommendations?.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {results[language].lifestyle_recommendations.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No specific lifestyle recommendations available</p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Medical Terms Explained</h3>
                                        {Object.keys(results[language]?.medical_terms_explained || {}).length > 0 ? (
                                            <dl className="space-y-2">
                                                {Object.entries(results[language].medical_terms_explained).map(([term, explanation], index) => (
                                                    <div key={index} className="border-b pb-2">
                                                        <dt className="font-medium">{term}</dt>
                                                        <dd className="text-gray-600">{explanation}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        ) : (
                                            <p>No medical terms to explain</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                            <Stethoscope className="h-16 w-16 mb-4 opacity-50" />
                            <h3 className="text-xl font-medium mb-2">No Symptoms Analyzed Yet</h3>
                            <p className="max-w-md">
                                Describe your symptoms in detail to receive a preliminary analysis and recommendations. Remember, this is not a substitute for professional medical advice.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiDoctor;