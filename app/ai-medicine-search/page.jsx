"use client";
import { Book, Eye, EyeOff, Loader, Loader2 } from "lucide-react";
import Navbar from "../_components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { chatSession } from "@/lib/GeminiAIModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Tesseract from "tesseract.js";

const AiSearch = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [extractedText, setExtractedText] = useState("");
    const [medName, setMedName] = useState("");
    const [loading, setLoading] = useState(false);
    const [Result, setResult] = useState([]);
    const [language, setLanguage] = useState("English");
    const [currentCamera, setCurrentCamera] = useState(null);

    const startCamera = async (deviceId) => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: deviceId ? { exact: deviceId } : undefined },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
        }
    };

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    const toggleCamera = () => {
        if (isCameraOn) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        } else {
            startCamera(currentCamera?.deviceId);
        }
        setIsCameraOn(!isCameraOn);
    };

    const switchCamera = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const nextCamera = videoDevices.find(device => device.deviceId !== currentCamera?.deviceId) || videoDevices[0];
        setCurrentCamera(nextCamera);
        startCamera(nextCamera.deviceId);
    };

    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext("2d");

        // Set canvas dimensions equal to video frame size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current video frame on canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the canvas image to base64
        const base64Image = canvas.toDataURL("image/png");

        // Extract text using Tesseract.js
        extractText(base64Image);
    };

    const extractText = async (imageBase64) => {
        try {
            const { data: { text } } = await Tesseract.recognize(imageBase64, "eng");
            setExtractedText(text);
        } catch (error) {
            console.error("Error extracting text:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {

            // Construct input prompt for Gemini API
            const inputPrompt = `
            "Provide detailed information about the medicine ${medName} in JSON format with the following structure:
          
          English:
          
          name (string): The brand name of the medicine.
          composition (string): The active ingredients and their concentration.
          purpose (string): The primary medical use of the medicine.
          mechanism_of_action (string): How the medicine works in the body.
          historical_context (string): Brief history and significance of the medicine.
          dosage (string): Recommended dosage for adults and children, including maximum daily limits.
          benefits (array of strings): A list of key benefits of using this medicine.
          current_public_health_guidelines (string): Any public health recommendations for its usage.
          cons (array of strings): Possible side effects or drawbacks.
          reliability (string): General safety and effectiveness of the medicine.
          manufacturer (string): Name of the pharmaceutical company producing it.
          generic_brand_options (array of strings): Alternative generic names or similar medicines.
          manufacturer_price_in_INR (number): Approximate cost in Indian Rupees.
          ayurvedic_alternative (string): Natural Ayurvedic alternatives with similar effects.
          homeopathic_alternative (string): Homeopathic substitutes (if applicable).
          natural_way_to_heal (string): Lifestyle or natural remedies for similar conditions.
          exercises (array of strings): Suitable exercises for recovery.
          food_and_fruits_to_take (array of strings): Recommended diet and food items that help in recovery.
          
          Hindi: Provide the same details in Hindi for better accessibility.
          
          Format the response strictly in JSON without any additional text."
          `;


            console.log("prompt : ", inputPrompt)
            // Send input to Gemini AI
            const res = await chatSession.sendMessage(inputPrompt);

            // Process Gemini API response
            const mockJsonRes = res.response
                .text()
                .replace("```json", "")
                .replace("```", "");

            if (mockJsonRes) {
                setResult(JSON.parse(mockJsonRes));
                console.log("Result:", JSON.parse(mockJsonRes));
            } else {
                console.error("Error:", res);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div>
            <Navbar />
            <div className="lg:px-16 flex flex-col lg:flex-row border-b">
                <div className="lg:w-1/3 border-r p-4">
                    <div className="flex gap-4">
                        <div className="bg-white p-4 rounded-lg flex items-center justify-center mb-6">
                            <Book className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">AI Medicine Search</h3>
                            <p className="text-muted-foreground">
                                Search for medical topics and get the best resources available.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="">Medicine Name</label>
                        <Input
                            placeholder="Eg. Dolo 650"
                            value={medName}
                            onChange={(e) => setMedName(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSubmit} className="w-full mt-4">
                        {loading ? "Loading..." : "Search"}
                    </Button>
                    <div className="flex items-center gap-4 my-4">
                        <div className="flex-1 border-b"></div>
                        <div>or</div>
                        <div className="flex-1 border-b"></div>
                    </div>
                    <div className="relative">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border-2" />
                        <canvas ref={canvasRef} style={{ display: "none" }} />

                        <div className="absolute top-2 left-2">
                            <Button className="rounded-full" size="sm" onClick={toggleCamera}>
                                {isCameraOn ? "OFF" : "ON"}
                            </Button>
                        </div>

                        <div className="absolute top-2 right-2">
                            <Button className="rounded-full" size="sm" onClick={switchCamera}>
                                Switch Camera
                            </Button>
                        </div>

                        {isCameraOn && (
                            <div className="absolute bottom-2 right-2">
                                <Button className="rounded-full" size="sm" onClick={captureImage}>
                                    Capture & Extract Text
                                </Button>
                            </div>
                        )}

                        {extractedText && (
                            <div className="mt-4 p-2 border rounded">
                                <h3>Extracted Text:</h3>
                                <p>{extractedText}</p>
                            </div>
                        )}
                    </div>
                    <Button className="w-full mt-4">Search</Button>
                </div>
                <div className="lg:w-2/3 p-6 bg-white shadow-md">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-lg flex gap-2 items-center"><Loader className="animate-spin" /> Loading...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-bold ">Result</h2>
                                <Button size="sm" className="rounded-full" onClick={() => setLanguage(prev => prev === "Hindi" ? "English" : "Hindi")}>
                                    {language === "Hindi" ? "English" : "Hindi"}
                                </Button>
                            </div>
                            <div className="space-y-4">
                                <Card   >
                                    <CardHeader>
                                        <CardTitle className="text-2xl font-bold">{Result[language]?.name ?? "N/A"}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p>
                                            <strong>Composition:</strong> {Result[language]?.composition ?? "N/A"}
                                        </p>
                                        <p>
                                            <strong>Purpose:</strong> {Result[language]?.purpose ?? "N/A"}
                                        </p>
                                        <p>
                                            <strong>Mechanism of Action:</strong> {Result[language]?.mechanism_of_action ?? "N/A"}
                                        </p>
                                        <p>
                                            <strong>Historical Context:</strong> {Result[language]?.historical_context ?? "N/A"}
                                        </p>

                                        <Separator />

                                        <h3 className="text-lg font-semibold">Dosage</h3>
                                        <p>
                                            <strong>Adults:</strong> {Result[language]?.dosage?.adult ?? "N/A"}
                                        </p>
                                        <p>
                                            <strong>Children:</strong> {Result[language]?.dosage?.children ?? "N/A"}
                                        </p>

                                        <Separator />

                                        <h3 className="text-lg font-semibold">Benefits</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {Result[language]?.benefits?.map((benefit, index) => (
                                                <Badge key={index} className="bg-green-500 text-white">
                                                    {benefit}
                                                </Badge>
                                            )) ?? "N/A"}
                                        </div>

                                        <h3 className="text-lg font-semibold mt-4">Cons</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {Result[language]?.cons?.map((con, index) => (
                                                <Badge key={index} className="bg-red-500 text-white">
                                                    {con}
                                                </Badge>
                                            )) ?? "N/A"}
                                        </div>

                                        <Separator />

                                        <p>
                                            <strong>Reliability:</strong> {Result[language]?.reliability ?? "N/A"}
                                        </p>
                                        <p>
                                            <strong>Manufacturer:</strong> {Result[language]?.manufacturer ?? "N/A"}
                                        </p>
                                        <p>
                                            <strong>Price:</strong> {Result[language]?.manufacturer_price_in_INR ?? "N/A"}
                                        </p>

                                        <Separator />

                                        <h3 className="text-lg font-semibold">Generic Brand Options</h3>
                                        <ul className="list-disc pl-4">
                                            {Result[language]?.generic_brand_options?.map((brand, index) => (
                                                <li key={index}>{brand}</li>
                                            )) ?? "N/A"}
                                        </ul>

                                        <Separator />

                                        <h3 className="text-lg font-semibold">Alternative Remedies</h3>
                                        <p>
                                            <strong>Ayurvedic:</strong> {Result[language]?.ayurvedic_alternative ?? "N/A"}
                                        </p>
                                        <p>
                                            <strong>Homeopathic:</strong> {Result[language]?.homeopathic_alternative ?? "N/A"}
                                        </p>
                                        <p>
                                            <strong>Natural Healing:</strong> {Result[language]?.natural_way_to_heal ?? "N/A"}
                                        </p>

                                        <Separator />

                                        <h3 className="text-lg font-semibold">Lifestyle Recommendations</h3>
                                        <p>
                                            <strong>Exercises:</strong> {Array.isArray(Result[language]?.exercises) ? Result[language]?.exercises.map((exercise, index) => <span key={index}>{exercise}{index < Result[language]?.exercises.length - 1 ? ', ' : ''}</span>) : "N/A"}
                                        </p>
                                        <p>
                                            <strong>Recommended Food:</strong> {Array.isArray(Result[language]?.food_and_fruits_to_take) ? Result[language]?.food_and_fruits_to_take.map((food, index) => <span key={index}>{food}{index < Result[language]?.food_and_fruits_to_take.length - 1 ? ', ' : ''}</span>) : "N/A"}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AiSearch;