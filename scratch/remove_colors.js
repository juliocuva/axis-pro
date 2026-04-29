const fs = require('fs');
const path = require('path');

const directoryToSearch = path.join(__dirname, '../src');

function replaceColors(content) {
    let newContent = content;
    // Replace text-blue-*, text-orange-*, text-purple-*
    newContent = newContent.replace(/text-(blue|orange|purple|indigo|violet|cyan|teal|fuchsia|pink|rose|yellow|amber)-(\d+)/g, (match, color, weight) => {
        if (weight === '500' || weight === '600') return 'text-brand-green';
        if (weight === '400') return 'text-brand-green-bright';
        return `text-gray-${weight}`;
    });

    // Replace bg-blue-*, bg-orange-*, bg-purple-*
    newContent = newContent.replace(/bg-(blue|orange|purple|indigo|violet|cyan|teal|fuchsia|pink|rose|yellow|amber)-(\d+)/g, (match, color, weight) => {
        if (weight === '500' || weight === '600') return 'bg-brand-green';
        if (weight === '400') return 'bg-brand-green/80';
        return `bg-gray-${weight}`;
    });

    // Replace border-blue-*, border-orange-*, border-purple-*
    newContent = newContent.replace(/border-(blue|orange|purple|indigo|violet|cyan|teal|fuchsia|pink|rose|yellow|amber)-(\d+)/g, (match, color, weight) => {
        if (weight === '500' || weight === '600') return 'border-brand-green';
        if (weight === '400') return 'border-brand-green-soft';
        return `border-gray-${weight}`;
    });
    
    // Replace shadow-blue-*, shadow-orange-*, shadow-purple-*
    newContent = newContent.replace(/shadow-(blue|orange|purple|indigo|violet|cyan|teal|fuchsia|pink|rose|yellow|amber)-(\d+)/g, (match, color, weight) => {
        return `shadow-brand-green`;
    });

    // Replace from-blue-*, from-orange-*, etc.
    newContent = newContent.replace(/from-(blue|orange|purple|indigo|violet|cyan|teal|fuchsia|pink|rose|yellow|amber)-(\d+)/g, (match, color, weight) => {
        return `from-brand-green`;
    });

    // Replace to-blue-*, to-orange-*, etc.
    newContent = newContent.replace(/to-(blue|orange|purple|indigo|violet|cyan|teal|fuchsia|pink|rose|yellow|amber)-(\d+)/g, (match, color, weight) => {
        return `to-brand-green-dark`;
    });

    // Hover text
    newContent = newContent.replace(/hover:text-(blue|orange|purple|indigo|violet|cyan|teal|fuchsia|pink|rose|yellow|amber)-(\d+)/g, (match, color, weight) => {
        return `hover:text-brand-green`;
    });

    // Hover bg
    newContent = newContent.replace(/hover:bg-(blue|orange|purple|indigo|violet|cyan|teal|fuchsia|pink|rose|yellow|amber)-(\d+)/g, (match, color, weight) => {
        return `hover:bg-brand-green`;
    });

    return newContent;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const newContent = replaceColors(content);
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory(directoryToSearch);
console.log('Done replacing colors.');
