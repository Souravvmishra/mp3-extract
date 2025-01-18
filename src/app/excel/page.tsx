"use client"

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, Loader2, Download } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import { marked } from 'marked';

interface ExcelRow {
    [key: string]: string | number;
}

export default function ExcelViewer() {
    const [sheets, setSheets] = useState<string[]>([]);
    const [currentSheet, setCurrentSheet] = useState<string>("");
    const [data, setData] = useState<ExcelRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [binaryData, setBinaryData] = useState<string | ArrayBuffer | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState("");
    const [generatingRow, setGeneratingRow] = useState<number | null>(null);
    const [generatedContent, setGeneratedContent] = useState<Record<number, string>>({});
    const [columnMappings, setColumnMappings] = useState({
        keyword: '',
        secondaryKeywords: '',
        targetAudience: '',
        tone: '',
        searchIntent: '',
        language: ''
    });

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setFileName(file.name);

            // Reset states when new file is uploaded
            setData([]);
            setHeaders([]);
            setGeneratedContent({});
            setColumnMappings({
                keyword: '',
                secondaryKeywords: '',
                targetAudience: '',
                tone: '',
                searchIntent: '',
                language: ''
            });

            const reader = new FileReader();
            reader.onload = (e) => {
                const binary = e.target?.result;
                if (binary) {
                    setBinaryData(binary);
                    const workbook = XLSX.read(binary, { type: "binary" });
                    setSheets(workbook.SheetNames);
                    if (workbook.SheetNames.length > 0) {
                        loadSheet(workbook, workbook.SheetNames[0]);
                    }
                }
                setIsLoading(false);
            };
            reader.onerror = (error) => {
                console.error('File reading error:', error);
                setIsLoading(false);
            };
            reader.readAsBinaryString(file);
        }
    };

    const loadSheet = (workbook: XLSX.WorkBook, sheetName: string) => {
        try {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];
            setCurrentSheet(sheetName);
            setData(jsonData);
            if (jsonData.length > 0) {
                setHeaders(Object.keys(jsonData[0]));
            } else {
                setHeaders([]);
            }
        } catch (error) {
            console.error('Error loading sheet:', error);
            setData([]);
            setHeaders([]);
        }
    };

    const handleSheetChange = (sheetName: string) => {
        if (binaryData) {
            setIsLoading(true);
            try {
                const workbook = XLSX.read(binaryData, { type: "binary" });
                loadSheet(workbook, sheetName);
            } catch (error) {
                console.error('Error changing sheet:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const generateContentForRow = async (row: ExcelRow, index: number) => {
        setGeneratingRow(index);
        const apiPayload = {
            keyword: row[columnMappings.keyword],
            secondaryKeywords: row[columnMappings.secondaryKeywords],
            targetAudience: row[columnMappings.targetAudience],
            tone: row[columnMappings.tone],
            searchIntent: row[columnMappings.searchIntent],
            language: row[columnMappings.language]
        };

        try {
            const response = await fetch('/api/create-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setGeneratedContent(prev => ({
                ...prev,
                [index]: result.content
            }));
        } catch (error) {
            console.error(`Error generating content for row ${index}:`, error);
            // Optionally show error to user via toast/alert
        } finally {
            setGeneratingRow(null);
        }
    };

    const downloadWord = (index: number) => {
        const content = generatedContent[index];
        const keyword = data[index][columnMappings.keyword];

        // Configure marked options for better HTML output
        marked.setOptions({
            breaks: true,
            gfm: true,
        });

        // Convert markdown to HTML
        const htmlContent = marked(content);

        const docContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            margin: 2em;
                            max-width: 800px;
                        }
                        h1 { font-size: 24px; color: #2d2d2d; margin-bottom: 1em; }
                        h2 { font-size: 20px; color: #333; margin-top: 1.5em; }
                        h3 { font-size: 16px; color: #444; }
                        p { margin-bottom: 1em; }
                        code {
                            background: #f4f4f4;
                            padding: 2px 4px;
                            border-radius: 3px;
                            font-family: Consolas, monospace;
                        }
                        pre {
                            background: #f4f4f4;
                            padding: 1em;
                            border-radius: 4px;
                            overflow-x: auto;
                        }
                        blockquote {
                            border-left: 4px solid #ddd;
                            margin-left: 0;
                            padding-left: 1em;
                            color: #666;
                        }
                        ul, ol {
                            margin-bottom: 1em;
                            padding-left: 2em;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                        }
                        table {
                            border-collapse: collapse;
                            width: 100%;
                            margin-bottom: 1em;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f4f4f4;
                        }
                    </style>
                </head>
                <body>
                    <h1>${keyword}</h1>
                    ${htmlContent}
                </body>
            </html>
        `;

        const blob = new Blob([docContent], {
            type: 'application/msword'
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${String(keyword).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_content.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const validateColumnMappings = () => {
        return Object.values(columnMappings).every(Boolean);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Excel Content Generator</CardTitle>
                    <CardDescription>
                        Upload Excel files and generate content for each row
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* File Upload Button */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                className="relative"
                                onClick={() => document.getElementById("file-upload")?.click()}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </Button>
                            {fileName && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    {fileName}
                                </motion.div>
                            )}
                        </div>

                        {/* Sheet Selector */}
                        <AnimatePresence>
                            {sheets.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <Select
                                        value={currentSheet}
                                        onValueChange={handleSheetChange}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select a sheet" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sheets.map((sheet) => (
                                                <SelectItem key={sheet} value={sheet}>
                                                    {sheet}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Column Mappings */}
                        {headers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-2 gap-4"
                            >
                                {Object.keys(columnMappings).map((field) => (
                                    <div key={field} className="space-y-2">
                                        <Label htmlFor={field}>
                                            {field.charAt(0).toUpperCase() + field.slice(1)}
                                        </Label>
                                        <Select
                                            value={columnMappings[field as keyof typeof columnMappings]}
                                            onValueChange={(value) => setColumnMappings(prev => ({
                                                ...prev,
                                                [field]: value
                                            }))}
                                        >
                                            <SelectTrigger id={field}>
                                                <SelectValue placeholder={`Select ${field} column`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {headers.map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* Data Table */}
                        <AnimatePresence>
                            {isLoading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center justify-center p-8"
                                >
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </motion.div>
                            ) : (
                                data.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="rounded-md border"
                                    >
                                        <div className="max-h-[600px] overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        {headers.map((header) => (
                                                            <TableHead key={header} className="bg-muted/50 sticky top-0">
                                                                {header}
                                                            </TableHead>
                                                        ))}
                                                        <TableHead className="bg-muted/50 sticky top-0 text-right">
                                                            Actions
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {data.map((row, index) => (
                                                        <TableRow key={index}>
                                                            {headers.map((header) => (
                                                                <TableCell key={header}>{row[header]}</TableCell>
                                                            ))}
                                                            <TableCell className="text-right">
                                                                {generatingRow === index ? (
                                                                    <Button disabled variant="ghost">
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    </Button>
                                                                ) : generatedContent[index] ? (
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => downloadWord(index)}
                                                                    >
                                                                        <Download className="w-4 h-4 mr-2" />
                                                                        Download
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        onClick={() => generateContentForRow(row, index)}
                                                                        variant="outline"
                                                                        disabled={!validateColumnMappings()}
                                                                    >
                                                                        Generate
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
