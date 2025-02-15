import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Copy, Check, RefreshCw } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface GenerateFeedbackButtonProps {
    data: string;
    buttonText?: string;
    dialogTitle?: string;
}

const GenerateFeedbackButton: React.FC<GenerateFeedbackButtonProps> = ({
    data,
    buttonText = "Generate Feedback",
    dialogTitle = "AI Generated Feedback"
}) => {
    const [open, setOpen] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerateFeedback = async () => {
        setLoading(true);
        setFeedback(null);
        setError(null);
        setCopied(false);

        try {
            const res = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ testData: data })
            });

            if (!res.ok) {
                throw new Error('Failed to generate feedback');
            }

            const json = await res.json();
            setFeedback(json.feedback);
            setOpen(true);
        } catch (err: unknown) {
            console.log(err);
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyToClipboard = async () => {
        if (feedback) {
            await navigator.clipboard.writeText(feedback);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRetry = () => {
        handleGenerateFeedback();
    };

    return (
        <div className="my-4">
            <Button
                onClick={handleGenerateFeedback}
                disabled={loading}
                className="transition transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                size="sm"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        {buttonText}
                    </>
                )}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">{dialogTitle}</DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="flex-1 h-full px-4">
                        {feedback && (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ children }) => <h1 className="text-2xl font-bold my-4">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-xl font-semibold my-3">{children}</h2>,
                                        p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                                        ul: ({ children }) => <ul className="my-2 list-disc pl-4">{children}</ul>,
                                        ol: ({ children }) => <ol className="my-2 list-decimal pl-4">{children}</ol>,
                                        code: ({ children }) => (
                                            <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5">{children}</code>
                                        )
                                    }}
                                >
                                    {feedback}
                                </ReactMarkdown>
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive" className="my-4">
                                <AlertTitle>Generation Failed</AlertTitle>
                                <AlertDescription className="mt-2">
                                    {error}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRetry}
                                        className="mt-2"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Try Again
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}
                    </ScrollArea>

                    {feedback && (
                        <DialogFooter className="mt-4 flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyToClipboard}
                                className="flex items-center"
                            >
                                {copied ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy to Clipboard
                                    </>
                                )}
                            </Button>

                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GenerateFeedbackButton;
