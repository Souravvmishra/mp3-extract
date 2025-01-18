"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pen, LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { marked } from "marked";
import { CopyButton } from "@/components/copy-button";

const BlogGenerator = () => {
    const [formData, setFormData] = useState({
        keyword: "",
        secondaryKeywords: "",
        targetAudience: "",
        tone: "professional",
        searchIntent: "informational",
        language: 'English'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [generatedContent, setGeneratedContent] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/create-blog", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to generate blog content");
            }

            let data = (await response.json()).content;

            console.log(data);
            
            if (typeof data === 'string' && data.startsWith('```') && data.endsWith('```')) {
                data = data.replace(/^```[\w]+\s?|```$/g, ''); // Removes the first three backticks, a word, and the last three backticks
            }
            console.log(data);

            setGeneratedContent(data);
        } catch (err) {
            console.log(err);
            setError("Failed to generate blog content. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto h-screen flex-col max-w-2xl font-sans p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="keyword">Study Topic</Label>
                                    <Input
                                        id="keyword"
                                        value={formData.keyword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, keyword: e.target.value })
                                        }
                                        placeholder="Enter the main study topic (e.g., Photosynthesis)"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="secondaryKeywords">Related Concepts</Label>
                                    <Textarea
                                        id="secondaryKeywords"
                                        value={formData.secondaryKeywords}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                secondaryKeywords: e.target.value,
                                            })
                                        }
                                        placeholder="Enter related concepts (comma separated)"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="targetAudience">Academic Level</Label>
                                    <Input
                                        id="targetAudience"
                                        value={formData.targetAudience}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                targetAudience: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., High School, Undergraduate, Graduate"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="tone">Writing Style</Label>
                                    <Select
                                        value={formData.tone}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, tone: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select style" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="professional">Academic</SelectItem>
                                            <SelectItem value="casual">Simplified</SelectItem>
                                            <SelectItem value="friendly">Student-Friendly</SelectItem>
                                            <SelectItem value="authoritative">Technical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="searchIntent">Study Purpose</Label>
                                    <Select
                                        value={formData.searchIntent}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, searchIntent: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select purpose" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="informational">
                                                Concept Explanation
                                            </SelectItem>
                                            <SelectItem value="commercial">Practice Problems</SelectItem>
                                            <SelectItem value="transactional">
                                                Quick Review
                                            </SelectItem>
                                            <SelectItem value="navigational">Study Guide</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="language" className="text-sm font-medium text-slate-700">
                                        Language
                                    </Label>
                                    <Select
                                        value={formData.language}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, language: value })
                                        }
                                    >
                                        <SelectTrigger className="mt-1 bg-transparent border-2 border-slate-200 focus:border-blue-500 transition-colors">
                                            <SelectValue placeholder="Select secondary language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="العربية (Arabic)">العربية (Arabic)</SelectItem>
                                            <SelectItem value="English">English</SelectItem>
                                            <SelectItem value="Français (French)">Français (French)</SelectItem>
                                            <SelectItem value="Español (Spanish)">Español (Spanish)</SelectItem>
                                            <SelectItem value="हिंदी (Hindi)">हिंदी (Hindi)</SelectItem>
                                            <SelectItem value="hindi (Hindi Latin)">hindi (Hindi Latin)</SelectItem>
                                            <SelectItem value="اردو (Urdu)">اردو (Urdu)</SelectItem>
                                            <SelectItem value="فارسی (Persian)">فارسی (Persian)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? (
                                    <span className="flex items-center space-x-2">
                                        <LoaderCircle className="animate-spin" />
                                        <span>Generating Study Content...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center space-x-2">
                                        <Pen className="w-4 h-4" />
                                        <span>Generate Study Material</span>
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {generatedContent && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden whitespace-break-spaces"
                        >
                            <Card>
                                <CardContent className="p-6">
                                    <div
                                        className="prose prose-slate max-w-none"
                                        dangerouslySetInnerHTML={{
                                            __html: marked(generatedContent),
                                        }}
                                    />
                                    <div className="mt-4">
                                        <CopyButton text={generatedContent} />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default BlogGenerator;
