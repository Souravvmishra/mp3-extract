import React, { JSX } from "react";

const parseMarkdown = (markdown: string): JSX.Element => {
    const lines = markdown.split("\n");
    const elements: JSX.Element[] = [];
    let listItems: JSX.Element[] = [];

    lines.forEach((line, index) => {
        // Handle headings
        if (line.startsWith("# ")) {
            elements.push(
                <h1 key={index} className="text-xl font-bold">
                    {line.slice(2)}
                </h1>
            );
        } else if (line.startsWith("## ")) {
            elements.push(
                <h2 key={index} className="text-lg font-semibold">
                    {line.slice(3)}
                </h2>
            );
        }
        // Handle unordered list items
        else if (line.startsWith("* ")) {
            listItems.push(
                <li key={index} className="text-sm text-gray-700">
                    {line.slice(2)}
                </li>
            );
        } else if (line.trim() === "" && listItems.length > 0) {
            // Close the list when encountering an empty line
            elements.push(
                <ul key={`list-${index}`} className="list-disc ml-5">
                    {listItems}
                </ul>
            );
            listItems = [];
        }
        // Handle code blocks
        else if (line.startsWith("```")) {
            elements.push(
                <pre key={index} className="bg-gray-100 p-2 rounded">
                    {line.slice(3)}
                </pre>
            );
        }
        // Handle plain text or paragraphs
        else {
            // Push any pending list items before adding a new paragraph
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`list-${index}`} className="list-disc ml-5">
                        {listItems}
                    </ul>
                );
                listItems = [];
            }
            elements.push(
                <p key={index} className="text-sm text-gray-700">
                    {line}
                </p>
            );
        }
    });

    // Add any remaining list items at the end
    if (listItems.length > 0) {
        elements.push(
            <ul key="final-list" className="list-disc ml-5">
                {listItems}
            </ul>
        );
    }

    return <>{elements}</>;
};

export default parseMarkdown;
