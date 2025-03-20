"use client";
import { FileText, Upload, Clipboard, Loader2, Eye, EyeOff } from "lucide-react";
import Navbar from "../_components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { chatSession } from "@/lib/GeminiAIModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const AiLabReport = () => {
    const [reportText, setReportText] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [language, setLanguage] = useState("English");
    const fileInputRef = useRef(null);

    const handleTextSubmit = async (e) => {
        e.preventDefault();
        if (!reportText.trim()) return;

        await processLabReport(reportText);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadLoading(true);
        setReportText("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("https://file-to-text-nextcn.vercel.app/extract-text", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const text = await response.text();
            setReportText(text);
            await processLabReport(text);
        } catch (error) {
            console.error("Error extracting text:", error);
        } finally {
            setUploadLoading(false);
        }
    };

    const processLabReport = async (text) => {
        setLoading(true);

        try {
            const inputPrompt = `
            Analyze the following lab report data and provide a comprehensive explanation in JSON format:
            
            "${text}"
            
            Return the response in the following JSON structure:
            
            {
              "English": {
                "summary": "Brief overview of the lab report findings",
                "normal_values": ["List of values within normal range and their meanings"],
                "abnormal_values": ["List of values outside normal range, their meanings, and potential implications"],
                "overall_health_indicators": "General assessment of health based on the report",
                "recommendations": ["Suggested follow-up actions or lifestyle modifications"],
                "medical_terms_explained": {"term": "explanation"},
                "possible_causes": ["Potential reasons for any abnormalities, if present"],
                "urgency_level": "How quickly the person should consult a doctor (Not Urgent/Somewhat Urgent/Urgent)",
                "additional_tests_recommended": ["Any further tests that might be beneficial"]
              },
              "Hindi": {
                // Same structure as above but in Hindi
              }
            }
            
            IMPORTANT: Make sure all items in arrays are simple strings, not objects.
            If any section cannot be adequately analyzed due to missing information, indicate this clearly.
            IMPORTANT: Always include a disclaimer that this is not medical advice and patients should consult healthcare professionals.
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
                            summary: parsedResults.English?.summary || "No summary available",
                            normal_values: ensureStringArray(parsedResults.English?.normal_values),
                            abnormal_values: ensureStringArray(parsedResults.English?.abnormal_values),
                            overall_health_indicators: parsedResults.English?.overall_health_indicators || "No health indicators available",
                            recommendations: ensureStringArray(parsedResults.English?.recommendations),
                            medical_terms_explained: ensureObjectOfStrings(parsedResults.English?.medical_terms_explained),
                            possible_causes: ensureStringArray(parsedResults.English?.possible_causes),
                            urgency_level: parsedResults.English?.urgency_level || "Not specified",
                            additional_tests_recommended: ensureStringArray(parsedResults.English?.additional_tests_recommended)
                        },
                        Hindi: {
                            summary: parsedResults.Hindi?.summary || "No summary available",
                            normal_values: ensureStringArray(parsedResults.Hindi?.normal_values),
                            abnormal_values: ensureStringArray(parsedResults.Hindi?.abnormal_values),
                            overall_health_indicators: parsedResults.Hindi?.overall_health_indicators || "No health indicators available",
                            recommendations: ensureStringArray(parsedResults.Hindi?.recommendations),
                            medical_terms_explained: ensureObjectOfStrings(parsedResults.Hindi?.medical_terms_explained),
                            possible_causes: ensureStringArray(parsedResults.Hindi?.possible_causes),
                            urgency_level: parsedResults.Hindi?.urgency_level || "Not specified",
                            additional_tests_recommended: ensureStringArray(parsedResults.Hindi?.additional_tests_recommended)
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

    const triggerFileUpload = () => {
        fileInputRef.current.click();
    };

    return (
        <div>
            <Navbar />
            <div className="lg:px-16 flex flex-col lg:flex-row border-b min-h-[90vh]">
                <div className="lg:w-1/3 border-r p-4">
                    <div className="flex gap-4 mb-6">
                        <div className="bg-white h-fit p-4 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">AI Lab Report Explainer</h3>
                            <p className="text-muted-foreground">
                                Upload or paste your lab report to get a detailed explanation.
                            </p>
                        </div>
                    </div>

                    <Tabs defaultValue="upload">
                        <TabsList className="grid w-full grid-cols-2 mb-4 h-12">
                            <TabsTrigger value="upload">Upload File</TabsTrigger>
                            <TabsTrigger value="paste">Paste Text</TabsTrigger>
                        </TabsList>

                        <TabsContent value="paste">
                            <form onSubmit={handleTextSubmit}>
                                <div className="space-y-2">
                                    <label htmlFor="reportText">Paste Lab Report Text</label>
                                    <Textarea
                                        id="reportText"
                                        placeholder="Paste your lab report content here..."
                                        value={reportText}
                                        onChange={(e) => setReportText(e.target.value)}
                                        className="min-h-32"
                                    />
                                </div>
                                <Button className="w-full mt-4" disabled={loading || !reportText.trim()}>
                                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : "Analyze Report"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="upload">
                            <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                />

                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p className="mb-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-500">PDF, PPT, DOC, DOCX up to 10MB</p>

                                <Button
                                    onClick={triggerFileUpload}
                                    className="mt-4 w-full"
                                    disabled={uploadLoading}
                                >
                                    {uploadLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                    ) : (
                                        "Select File"
                                    )}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="lg:w-2/3 p-6 bg-white shadow-md">
                    {loading || uploadLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-lg flex gap-2 items-center">
                                <Loader2 className="animate-spin" />
                                {uploadLoading ? "Processing file..." : "Analyzing report..."}
                            </p>
                        </div>
                    ) : results ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Report Analysis</h2>
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
                                    <CardTitle className="text-2xl font-bold">Lab Report Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                                        Disclaimer: This is an AI-generated analysis and not medical advice. Please consult with healthcare professionals for proper medical guidance.
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Summary</h3>
                                        <p>{results[language]?.summary}</p>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Normal Values</h3>
                                        {results[language]?.normal_values?.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {results[language].normal_values.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No normal values identified</p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Abnormal Values</h3>
                                        {results[language]?.abnormal_values?.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {results[language].abnormal_values.map((item, index) => (
                                                    <Badge key={index} className="p-2 bg-red-100 text-red-800 hover:bg-red-200">
                                                        {item}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p>No abnormal values identified</p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Overall Health Indicators</h3>
                                        <p>{results[language]?.overall_health_indicators}</p>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                                        {results[language]?.recommendations?.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {results[language].recommendations.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No recommendations available</p>
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

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Possible Causes</h3>
                                        {results[language]?.possible_causes?.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {results[language].possible_causes.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No causes identified</p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Urgency Level</h3>
                                        <Badge className={`
                                            px-3 py-1 text-sm
                                            ${results[language]?.urgency_level?.includes("Not") ? "bg-green-100 text-green-800" :
                                                results[language]?.urgency_level?.includes("Somewhat") ? "bg-yellow-100 text-yellow-800" :
                                                    "bg-red-100 text-red-800"}
                                        `}>
                                            {results[language]?.urgency_level}
                                        </Badge>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Additional Tests Recommended</h3>
                                        {results[language]?.additional_tests_recommended?.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {results[language].additional_tests_recommended.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No additional tests recommended</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                            <FileText className="h-16 w-16 mb-4 opacity-50" />
                            <h3 className="text-xl font-medium mb-2">No Report Analyzed Yet</h3>
                            <p className="max-w-md">
                                Upload a file or paste the text content of your lab report to get a detailed explanation of your results.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiLabReport;